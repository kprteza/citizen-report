import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import {
  PostgresReportRepository,
  ensureSchema,
} from "./postgresReportRepository.js";
import type { Report } from "../../domain/report.js";

const RUN = process.env.RUN_DB_TESTS === "1";
const CONNECTION =
  process.env.DATABASE_URL ??
  "postgres://citizen:citizen@127.0.0.1:5432/citizen_report";

let pool: pg.Pool;
let repo: PostgresReportRepository;

function report(overrides: Partial<Report> = {}): Report {
  return {
    id: `it-${Math.random().toString(36).slice(2)}`,
    deviceId: "device-A",
    issueType: "biker_gang",
    latitude: 35.6812,
    longitude: 139.7671,
    note: null,
    photoKey: null,
    observedAt: "2026-08-29T12:00:00.000Z",
    createdAt: "2026-08-29T12:00:00.000Z",
    country: "JP",
    isCorrelated: false,
    ...overrides,
  };
}

before(async () => {
  if (!RUN) return;
  pool = new pg.Pool({ connectionString: CONNECTION });
  await ensureSchema(pool);
  await pool.query("TRUNCATE TABLE reports");
  repo = new PostgresReportRepository(pool);
});

after(async () => {
  if (pool) await pool.end();
});

test("saves and reads back a report", { skip: !RUN }, async () => {
  const r = report({ note: "near the crossing", photoKey: "img-1" });
  await repo.save(r);
  const fetched = await repo.getById(r.id);
  assert.ok(fetched);
  assert.equal(fetched!.id, r.id);
  assert.equal(fetched!.note, "near the crossing");
  assert.equal(fetched!.photoKey, "img-1");
  assert.equal(fetched!.createdAt, "2026-08-29T12:00:00.000Z");
});

test(
  "findCandidates filters by type, time window and bounding box",
  { skip: !RUN },
  async () => {
    const center = { latitude: 35.6812, longitude: 139.7671 };
    const near = report({
      id: "near",
      latitude: 35.7262, // ~5km north
      longitude: 139.7671,
      createdAt: "2026-08-29T11:30:00.000Z",
    });
    const far = report({
      id: "far",
      latitude: 35.0, // ~75km south
      longitude: 139.7671,
      createdAt: "2026-08-29T11:30:00.000Z",
    });
    const old = report({
      id: "old",
      createdAt: "2026-08-20T00:00:00.000Z",
    });
    const otherType = report({
      id: "other",
      issueType: "accident",
      createdAt: "2026-08-29T11:30:00.000Z",
    });
    await Promise.all([repo.save(near), repo.save(far), repo.save(old), repo.save(otherType)]);

    const found = await repo.findCandidates({
      issueType: "biker_gang",
      center,
      radiusKm: 20,
      since: new Date("2026-08-29T09:00:00.000Z"),
    });
    const ids = found.map((r) => r.id);
    assert.ok(ids.includes("near"), "near report should match");
    assert.ok(!ids.includes("far"), "far report is outside the bounding box");
    assert.ok(!ids.includes("old"), "old report is outside the time window");
    assert.ok(!ids.includes("other"), "other issue type must be excluded");
  },
);
