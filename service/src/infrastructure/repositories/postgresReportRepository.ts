import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Pool, PoolClient } from "pg";
import type {
  CandidateQuery,
  ListReportsQuery,
  ReportRepository,
} from "../../application/ports.js";
import { boundingBox } from "../../domain/geoBounds.js";
import type { Report } from "../../domain/report.js";

interface ReportRow {
  id: string;
  device_id: string;
  issue_type: string;
  latitude: number;
  longitude: number;
  note: string | null;
  photo_key: string | null;
  observed_at: Date;
  created_at: Date;
  country: string;
  is_correlated: boolean;
}

function rowToReport(row: ReportRow): Report {
  return {
    id: row.id,
    deviceId: row.device_id,
    issueType: row.issue_type as Report["issueType"],
    latitude: row.latitude,
    longitude: row.longitude,
    note: row.note,
    photoKey: row.photo_key,
    observedAt: new Date(row.observed_at).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
    country: row.country,
    isCorrelated: row.is_correlated,
  };
}

/**
 * PostgreSQL (Amazon RDS) implementation of ReportRepository. Candidate lookup
 * uses an index-friendly bounding box; exact distance/time filtering happens in
 * the pure domain layer, so swapping to DynamoDB requires no use-case changes.
 */
export class PostgresReportRepository implements ReportRepository {
  constructor(private readonly pool: Pool) {}

  async save(report: Report): Promise<void> {
    await this.pool.query(
      `INSERT INTO reports
         (id, device_id, issue_type, latitude, longitude, note, photo_key, observed_at, created_at, country, is_correlated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING`,
      [
        report.id,
        report.deviceId,
        report.issueType,
        report.latitude,
        report.longitude,
        report.note,
        report.photoKey,
        report.observedAt,
        report.createdAt,
        report.country,
        report.isCorrelated,
      ],
    );
  }

  async getById(id: string): Promise<Report | null> {
    const { rows } = await this.pool.query<ReportRow>(
      "SELECT * FROM reports WHERE id = $1",
      [id],
    );
    return rows[0] ? rowToReport(rows[0]) : null;
  }

  async findCandidates(query: CandidateQuery): Promise<Report[]> {
    const box = boundingBox(query.center, query.radiusKm);
    const { rows } = await this.pool.query<ReportRow>(
      `SELECT * FROM reports
        WHERE issue_type = $1
          AND created_at >= $2
          AND latitude BETWEEN $3 AND $4
          AND longitude BETWEEN $5 AND $6
        ORDER BY created_at DESC`,
      [
        query.issueType,
        query.since.toISOString(),
        box.minLat,
        box.maxLat,
        box.minLng,
        box.maxLng,
      ],
    );
    return rows.map(rowToReport);
  }

  async markCorrelated(id: string): Promise<void> {
    await this.pool.query(
      "UPDATE reports SET is_correlated = TRUE WHERE id = $1",
      [id],
    );
  }

  async list(query: ListReportsQuery): Promise<Report[]> {
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (query.issueType) {
      params.push(query.issueType);
      clauses.push(`issue_type = $${params.length}`);
    }
    if (query.since) {
      params.push(query.since.toISOString());
      clauses.push(`created_at >= $${params.length}`);
    }
    if (query.box) {
      params.push(query.box.minLat, query.box.maxLat, query.box.minLng, query.box.maxLng);
      const n = params.length;
      clauses.push(
        `latitude BETWEEN $${n - 3} AND $${n - 2} AND longitude BETWEEN $${n - 1} AND $${n}`,
      );
    }
    params.push(query.limit ?? 1000);
    const limitIdx = params.length;
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const { rows } = await this.pool.query<ReportRow>(
      `SELECT * FROM reports ${where} ORDER BY created_at DESC LIMIT $${limitIdx}`,
      params,
    );
    return rows.map(rowToReport);
  }
}

/** Applies db/schema.sql. Safe to run repeatedly. */
export async function ensureSchema(client: Pool | PoolClient): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url));
  const schemaPath = join(here, "../../../db/schema.sql");
  const sql = readFileSync(schemaPath, "utf8");
  await client.query(sql);
}
