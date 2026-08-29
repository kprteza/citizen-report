import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { Report } from "./db.js";

type SeedReport = Omit<Report, "id" | "created_at" | "updated_at">;

const SAMPLE_REPORTS: SeedReport[] = [
  {
    title: "Large pothole on Main Street",
    description:
      "A deep pothole near the crosswalk at Main St & 3rd Ave has damaged several tires.",
    category: "pothole",
    severity: "high",
    status: "open",
    address: "Main St & 3rd Ave",
    latitude: 40.7128,
    longitude: -74.006,
    reporter_name: "Dana R.",
  },
  {
    title: "Streetlight out near the park",
    description:
      "The streetlight at the north entrance of Riverside Park has been dark for a week.",
    category: "streetlight",
    severity: "medium",
    status: "in_progress",
    address: "Riverside Park, North Gate",
    latitude: 40.8009,
    longitude: -73.9707,
    reporter_name: "Sam P.",
  },
  {
    title: "Overflowing trash bins downtown",
    description:
      "Public bins along the market square have not been collected and are attracting pests.",
    category: "trash",
    severity: "medium",
    status: "open",
    address: "Market Square",
    latitude: 40.7411,
    longitude: -73.9897,
    reporter_name: "Anonymous",
  },
  {
    title: "Graffiti on library wall",
    description: "Large tag sprayed across the east wall of the public library.",
    category: "graffiti",
    severity: "low",
    status: "resolved",
    address: "Central Public Library",
    latitude: 40.7532,
    longitude: -73.9822,
    reporter_name: "Lee K.",
  },
];

/**
 * Populates the database with a few representative reports the first time it is
 * created so the dev environment has meaningful content to demonstrate.
 */
export function seedIfEmpty(db: Database.Database): void {
  const count = (db.prepare("SELECT COUNT(*) AS c FROM reports").get() as {
    c: number;
  }).c;
  if (count > 0) return;

  const now = Date.now();
  const insert = db.prepare(
    `INSERT INTO reports
      (id, title, description, category, severity, status, address, latitude, longitude, reporter_name, created_at, updated_at)
     VALUES
      (@id, @title, @description, @category, @severity, @status, @address, @latitude, @longitude, @reporter_name, @created_at, @updated_at)`,
  );
  const insertMany = db.transaction((reports: SeedReport[]) => {
    reports.forEach((r, i) => {
      const ts = new Date(now - i * 3_600_000).toISOString();
      insert.run({ ...r, id: randomUUID(), created_at: ts, updated_at: ts });
    });
  });
  insertMany(SAMPLE_REPORTS);
  console.log(`[citizen-report] Seeded ${SAMPLE_REPORTS.length} sample reports.`);
}
