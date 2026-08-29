import { test } from "node:test";
import assert from "node:assert/strict";
import { composeColocationPost, composeMovementPost } from "./postContent.js";
import type { Report } from "./report.js";

function report(overrides: Partial<Report> = {}): Report {
  return {
    id: "r1",
    deviceId: "d1",
    issueType: "biker_gang",
    latitude: 35.6812,
    longitude: 139.7671,
    note: null,
    photoKey: null,
    observedAt: "2026-08-29T12:00:00Z",
    createdAt: "2026-08-29T12:00:00Z",
    country: "JP",
    isCorrelated: false,
    ...overrides,
  };
}

test("movement post includes distance, elapsed minutes and police tag", () => {
  const prior = report({ id: "p", createdAt: "2026-08-29T11:30:00Z" });
  const target = report({ id: "t", createdAt: "2026-08-29T12:00:00Z" });
  const text = composeMovementPost({
    target,
    prior,
    distanceKm: 5.2,
    elapsedHours: 0.5,
    policeHandle: "@KeishichoPR",
  });
  assert.match(text, /Loud biker gang/);
  assert.match(text, /5\.2 km/);
  assert.match(text, /30 min/);
  assert.match(text, /@KeishichoPR/);
});

test("movement post omits tag when no police handle", () => {
  const text = composeMovementPost({
    target: report(),
    prior: report({ id: "p" }),
    distanceKm: 1,
    elapsedHours: 1,
    policeHandle: null,
  });
  assert.doesNotMatch(text, /@/);
});

test("colocation post counts all reports including the target", () => {
  const target = report({ issueType: "illegal_garbage_dumping" });
  const others = [report({ id: "a" }), report({ id: "b" })];
  const text = composeColocationPost({
    target,
    others,
    policeHandle: "@OsakaPolice",
  });
  assert.match(text, /3 reports of Illegal garbage dumping/);
  assert.match(text, /@OsakaPolice/);
});
