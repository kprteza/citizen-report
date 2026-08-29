import { test } from "node:test";
import assert from "node:assert/strict";
import { collapseToUniqueIssues } from "./mapView.js";
import type { Report } from "./report.js";

let n = 0;
function report(overrides: Partial<Report> = {}): Report {
  n += 1;
  return {
    id: `r${n}`,
    deviceId: `d${n}`,
    issueType: "biker_gang",
    latitude: 35.68,
    longitude: 139.76,
    note: null,
    photoKey: null,
    observedAt: "2026-08-29T12:00:00Z",
    createdAt: "2026-08-29T12:00:00Z",
    country: "JP",
    isCorrelated: false,
    ...overrides,
  };
}

test("keeps originating (uncorrelated) reports of any type", () => {
  const origin = report({ id: "origin", isCorrelated: false });
  assert.equal(collapseToUniqueIssues([origin]).length, 1);
});

test("drops biker-gang follow-on sightings", () => {
  const origin = report({ id: "o", isCorrelated: false });
  const followOn = report({ id: "f", isCorrelated: true });
  assert.deepEqual(
    collapseToUniqueIssues([origin, followOn]).map((r) => r.id),
    ["o"],
  );
});

test("also drops correlated stationary types (garbage colocation)", () => {
  const a = report({ id: "g1", issueType: "illegal_garbage_dumping", isCorrelated: false });
  const b = report({ id: "g2", issueType: "illegal_garbage_dumping", isCorrelated: true });
  const c = report({ id: "g3", issueType: "illegal_garbage_dumping", isCorrelated: true });
  assert.deepEqual(
    collapseToUniqueIssues([a, b, c]).map((r) => r.id),
    ["g1"],
  );
});
