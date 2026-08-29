import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Pool, PoolClient } from "pg";
import type { CandidateQuery, ReportRepository } from "../../application/ports.js";
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
         (id, device_id, issue_type, latitude, longitude, note, photo_key, observed_at, created_at, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
}

/** Applies db/schema.sql. Safe to run repeatedly. */
export async function ensureSchema(client: Pool | PoolClient): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url));
  const schemaPath = join(here, "../../../db/schema.sql");
  const sql = readFileSync(schemaPath, "utf8");
  await client.query(sql);
}
