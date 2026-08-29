import express, { type Request, type Response } from "express";
import cors from "cors";
import { z } from "zod";
import { ISSUE_LABEL, ISSUE_TYPES, type IssueType } from "../../domain/issueType.js";
import type { Authenticator, ListReportsQuery } from "../../application/ports.js";
import type { ProcessOutcome } from "../../application/processReport.js";
import type { SubmitReportUseCase } from "../../application/submitReport.js";
import type { ListReportsUseCase } from "../../application/listReports.js";
import { requireAuth, type AuthedRequest } from "./authMiddleware.js";

const submitSchema = z.object({
  issueType: z.enum([...ISSUE_TYPES] as [IssueType, ...IssueType[]]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  note: z.string().max(2000).optional(),
  observedAt: z.string().datetime().optional(),
  photoBase64: z.string().max(15_000_000).optional(),
  photoContentType: z.enum(["image/jpeg", "image/png", "image/webp"]).optional(),
});

const listQuerySchema = z.object({
  issueType: z.enum([...ISSUE_TYPES] as [IssueType, ...IssueType[]]).optional(),
  bbox: z.string().optional(),
  since: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(5000).optional(),
});

/** Parses "minLng,minLat,maxLng,maxLat" into a bounding box. */
function parseBbox(bbox: string | undefined): ListReportsQuery["box"] | undefined {
  if (!bbox) return undefined;
  const parts = bbox.split(",").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return undefined;
  const [minLng, minLat, maxLng, maxLat] = parts;
  return { minLat, maxLat, minLng, maxLng };
}

export interface HttpDeps {
  submit: SubmitReportUseCase;
  listReports: ListReportsUseCase;
  authenticator: Authenticator;
}

export function createHttpApp(deps: HttpDeps) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "20mb" }));

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  app.get("/api/v1/issue-types", (_req: Request, res: Response) => {
    res.json(
      ISSUE_TYPES.map((value) => ({ value, label: ISSUE_LABEL[value] })),
    );
  });

  app.post(
    "/api/v1/reports",
    requireAuth(deps.authenticator),
    async (req: AuthedRequest, res: Response) => {
      const deviceId = req.header("x-device-id");
      if (!deviceId) {
        return res.status(400).json({ error: "Missing X-Device-Id header" });
      }

      const parsed = submitSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }
      const body = parsed.data;

      const photo =
        body.photoBase64 && body.photoContentType
          ? {
              data: Buffer.from(body.photoBase64, "base64"),
              contentType: body.photoContentType,
            }
          : undefined;

      const result = await deps.submit.execute({
        deviceId,
        issueType: body.issueType,
        location: { latitude: body.latitude, longitude: body.longitude },
        note: body.note,
        observedAt: body.observedAt,
        photo,
      });

      if (result.status === "discarded_duplicate") {
        // Silently discarded: acknowledge success without creating a resource.
        return res.status(202).json({ status: "duplicate_discarded" });
      }

      return res.status(201).json({
        status: "accepted",
        report: {
          id: result.report.id,
          issueType: result.report.issueType,
          createdAt: result.report.createdAt,
        },
        correlation: summarizeProcessing(result.processing),
      });
    },
  );

  // Dashboard/map read. Returns UNIQUE ISSUES (correlated follow-ons removed).
  app.get(
    "/api/v1/reports",
    requireAuth(deps.authenticator),
    async (req: AuthedRequest, res: Response) => {
      const parsed = listQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }
      const { issueType, bbox, since, limit } = parsed.data;
      const reports = await deps.listReports.execute({
        issueType,
        box: parseBbox(bbox),
        since: since ? new Date(since) : undefined,
        limit,
      });
      res.json(
        reports.map((r) => ({
          id: r.id,
          issueType: r.issueType,
          latitude: r.latitude,
          longitude: r.longitude,
          note: r.note,
          observedAt: r.observedAt,
          createdAt: r.createdAt,
        })),
      );
    },
  );

  return app;
}

function summarizeProcessing(processing: ProcessOutcome) {
  if (processing.kind === "correlated") {
    return {
      correlated: true,
      strategy: processing.strategy,
      matchedReportIds: processing.matchedReportIds,
      postUrl: processing.post.url,
    };
  }
  return { correlated: false };
}
