import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type ReportStatus = "open" | "in_progress" | "resolved";
export type ReportSeverity = "low" | "medium" | "high";
export type ReportCategory =
  | "pothole"
  | "streetlight"
  | "graffiti"
  | "trash"
  | "water"
  | "other";

export interface Report {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  severity: ReportSeverity;
  status: ReportStatus;
  address: string;
  latitude: number | null;
  longitude: number | null;
  reporter_name: string;
  created_at: string;
  updated_at: string;
}

/**
 * Opens (and lazily initializes) the SQLite database. Using a file-backed
 * database keeps submitted reports durable across dev-server restarts, while an
 * in-memory database (":memory:") is used by the automated tests.
 */
export function openDatabase(file: string): Database.Database {
  if (file !== ":memory:") {
    mkdirSync(dirname(file), { recursive: true });
  }
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id           TEXT PRIMARY KEY,
      title        TEXT NOT NULL,
      description  TEXT NOT NULL,
      category     TEXT NOT NULL,
      severity     TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'open',
      address      TEXT NOT NULL,
      latitude     REAL,
      longitude    REAL,
      reporter_name TEXT NOT NULL,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
  `);
}
