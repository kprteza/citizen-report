import { test } from "node:test";
import assert from "node:assert/strict";
import { findColocatedReports, findMovementMatches } from "./correlation.js";
import type { Report } from "./report.js";

let counter = 0;
function report(overrides: Partial<Report> = {}): Report {
  counter += 1;
  return {
    id: `r${counter}`,
    deviceId: `device-${counter}`,
    issueType: "biker_gang",
    latitude: 35.6812,
    longitude: 139.7671,
    note: null,
    photoKey: null,
    observedAt: "2026-08-29T12:00:00Z",
    createdAt: "2026-08-29T12:00:00Z",
    country: "JP",
    ...overrides,
  };
}

test("findMovementMatches correlates a reachable earlier sighting", () => {
  // ~5km north, 30 minutes earlier -> reachable at 60km/h
  const prior = report({
    latitude: 35.7262,
    longitude: 139.7671,
    observedAt: "2026-08-29T11:30:00Z",
  });
  const target = report({ observedAt: "2026-08-29T12:00:00Z" });
  const matches = findMovementMatches(target, [prior], {
    radiusKm: 20,
    maxSpeedKmh: 60,
  });
  assert.equal(matches.length, 1);
  assert.equal(matches[0].prior.id, prior.id);
  assert.ok(matches[0].distanceKm > 4 && matches[0].distanceKm < 6);
});

test("findMovementMatches rejects sightings too far for the elapsed time", () => {
  // ~5km apart but only 1 minute earlier -> impossible for one gang at 60km/h
  const prior = report({
    latitude: 35.7262,
    longitude: 139.7671,
    observedAt: "2026-08-29T11:59:00Z",
  });
  const target = report({ observedAt: "2026-08-29T12:00:00Z" });
  const matches = findMovementMatches(target, [prior], {
    radiusKm: 20,
    maxSpeedKmh: 60,
  });
  assert.equal(matches.length, 0);
});

test("findMovementMatches ignores reports outside the search radius", () => {
  // ~15km away but radius is 10km
  const prior = report({
    latitude: 35.8162,
    longitude: 139.7671,
    observedAt: "2026-08-29T11:00:00Z",
  });
  const target = report({ observedAt: "2026-08-29T12:00:00Z" });
  const matches = findMovementMatches(target, [prior], {
    radiusKm: 10,
    maxSpeedKmh: 60,
  });
  assert.equal(matches.length, 0);
});

test("findMovementMatches ignores different issue types", () => {
  const prior = report({
    issueType: "accident",
    observedAt: "2026-08-29T11:30:00Z",
  });
  const target = report({ issueType: "biker_gang" });
  assert.equal(
    findMovementMatches(target, [prior], { radiusKm: 20, maxSpeedKmh: 60 }).length,
    0,
  );
});

test("findMovementMatches ignores later (future) reports", () => {
  const later = report({ observedAt: "2026-08-29T13:00:00Z" });
  const target = report({ observedAt: "2026-08-29T12:00:00Z" });
  assert.equal(
    findMovementMatches(target, [later], { radiusKm: 20, maxSpeedKmh: 60 }).length,
    0,
  );
});

test("findColocatedReports finds same-location same-type reports", () => {
  const type = "illegal_garbage_dumping" as const;
  const prior = report({ issueType: type, latitude: 35.68125, longitude: 139.7671 });
  const target = report({ issueType: type });
  const found = findColocatedReports(target, [prior], 50);
  assert.equal(found.length, 1);
  assert.equal(found[0].id, prior.id);
});

test("findColocatedReports excludes far or mismatched reports", () => {
  const type = "illegal_garbage_dumping" as const;
  const far = report({ issueType: type, latitude: 35.7, longitude: 139.8 });
  const otherType = report({ issueType: "bear_sighting" });
  const target = report({ issueType: type });
  assert.equal(findColocatedReports(target, [far, otherType], 50).length, 0);
});
