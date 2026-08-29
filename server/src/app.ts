import express, { type Request, type Response } from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type Database from "better-sqlite3";
import type { Report } from "./db.js";

const createReportSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(5).max(2000),
  category: z.enum(["pothole", "streetlight", "graffiti", "trash", "water", "other"]),
  severity: z.enum(["low", "medium", "high"]).default("medium"),
  address: z.string().trim().min(3).max(200),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  reporter_name: z.string().trim().min(1).max(80).default("Anonymous"),
});

const updateStatusSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved"]),
});

const listQuerySchema = z.object({
  status: z.enum(["open", "in_progress", "resolved"]).optional(),
  category: z
    .enum(["pothole", "streetlight", "graffiti", "trash", "water", "other"])
    .optional(),
});

export function createApp(db: Database.Database) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  app.get("/api/reports", (req: Request, res: Response) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { status, category } = parsed.data;
    const clauses: string[] = [];
    const params: Record<string, string> = {};
    if (status) {
      clauses.push("status = @status");
      params.status = status;
    }
    if (category) {
      clauses.push("category = @category");
      params.category = category;
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = db
      .prepare(`SELECT * FROM reports ${where} ORDER BY created_at DESC`)
      .all(params) as Report[];
    res.json(rows);
  });

  app.get("/api/reports/:id", (req: Request, res: Response) => {
    const row = db
      .prepare("SELECT * FROM reports WHERE id = ?")
      .get(req.params.id) as Report | undefined;
    if (!row) return res.status(404).json({ error: "Report not found" });
    res.json(row);
  });

  app.post("/api/reports", (req: Request, res: Response) => {
    const parsed = createReportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const now = new Date().toISOString();
    const report: Report = {
      id: randomUUID(),
      status: "open",
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      created_at: now,
      updated_at: now,
      ...parsed.data,
    };
    db.prepare(
      `INSERT INTO reports
        (id, title, description, category, severity, status, address, latitude, longitude, reporter_name, created_at, updated_at)
       VALUES
        (@id, @title, @description, @category, @severity, @status, @address, @latitude, @longitude, @reporter_name, @created_at, @updated_at)`,
    ).run(report);
    res.status(201).json(report);
  });

  app.patch("/api/reports/:id/status", (req: Request, res: Response) => {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const now = new Date().toISOString();
    const result = db
      .prepare("UPDATE reports SET status = ?, updated_at = ? WHERE id = ?")
      .run(parsed.data.status, now, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Report not found" });
    }
    const row = db
      .prepare("SELECT * FROM reports WHERE id = ?")
      .get(req.params.id) as Report;
    res.json(row);
  });

  app.get("/api/stats", (_req: Request, res: Response) => {
    const total = (db.prepare("SELECT COUNT(*) AS c FROM reports").get() as {
      c: number;
    }).c;
    const byStatus = db
      .prepare("SELECT status, COUNT(*) AS c FROM reports GROUP BY status")
      .all() as { status: string; c: number }[];
    const byCategory = db
      .prepare("SELECT category, COUNT(*) AS c FROM reports GROUP BY category")
      .all() as { category: string; c: number }[];
    res.json({
      total,
      byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r.c])),
      byCategory: Object.fromEntries(byCategory.map((r) => [r.category, r.c])),
    });
  });

  return app;
}
