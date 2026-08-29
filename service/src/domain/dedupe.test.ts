import { test } from "node:test";
import assert from "node:assert/strict";
import { isDuplicate, DEFAULT_DEDUPE_POLICY } from "./dedupe.js";
import type { Report, ReportInput } from "./report.js";

const now = new Date("2026-08-29T12:00:00Z");

function priorReport(overrides: Partial<Report> = {}): Report {
  return {
    id: "r1",
    deviceId: "device-A",
    issueType: "illegal_garbage_dumping",
    latitude: 35.6812,
    longitude: 139.7671,
    note: null,
    photoKey: null,
    observedAt: "2026-08-29T11:30:00Z",
    createdAt: "2026-08-29T11:30:00Z",
    country: "JP",
    ...overrides,
  };
}

function candidate(overrides: Partial<ReportInput> = {}): ReportInput {
  return {
    deviceId: "device-A",
    issueType: "illegal_garbage_dumping",
    location: { latitude: 35.6812, longitude: 139.7671 },
    ...overrides,
  };
}

test("same device, same type, same location within window is a duplicate", () => {
  assert.equal(isDuplicate(candidate(), [priorReport()], now), true);
});

test("different device is not a duplicate", () => {
  assert.equal(
    isDuplicate(candidate({ deviceId: "device-B" }), [priorReport()], now),
    false,
  );
});

test("different issue type is not a duplicate", () => {
  assert.equal(
    isDuplicate(candidate({ issueType: "bear_sighting" }), [priorReport()], now),
    false,
  );
});

test("far away location is not a duplicate", () => {
  const far = candidate({ location: { latitude: 35.7, longitude: 139.8 } });
  assert.equal(isDuplicate(far, [priorReport()], now), false);
});

test("prior report older than the window is not a duplicate", () => {
  const old = priorReport({ createdAt: "2026-08-29T00:00:00Z" });
  assert.equal(isDuplicate(candidate(), [old], now), false);
});

test("empty history is never a duplicate", () => {
  assert.equal(isDuplicate(candidate(), [], now), false);
});

test("respects a custom radius", () => {
  // ~11m away
  const near = candidate({ location: { latitude: 35.6813, longitude: 139.7671 } });
  assert.equal(isDuplicate(near, [priorReport()], now), true);
  assert.equal(
    isDuplicate(near, [priorReport()], now, {
      ...DEFAULT_DEDUPE_POLICY,
      radiusMeters: 5,
    }),
    false,
  );
});
