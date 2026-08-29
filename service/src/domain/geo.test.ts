import { test } from "node:test";
import assert from "node:assert/strict";
import {
  haversineKm,
  haversineMeters,
  isTravelFeasible,
  isWithinMeters,
} from "./geo.js";

const TOKYO = { latitude: 35.6812, longitude: 139.7671 }; // Tokyo Station
const OSAKA = { latitude: 34.7025, longitude: 135.4959 }; // Osaka Station

test("haversineKm returns 0 for identical points", () => {
  assert.equal(haversineKm(TOKYO, TOKYO), 0);
});

test("haversineKm matches the known Tokyo-Osaka distance (~400km)", () => {
  const d = haversineKm(TOKYO, OSAKA);
  assert.ok(d > 390 && d < 410, `expected ~400km, got ${d}`);
});

test("haversineKm is symmetric", () => {
  assert.equal(haversineKm(TOKYO, OSAKA), haversineKm(OSAKA, TOKYO));
});

test("haversineMeters converts km to meters", () => {
  const nearby = { latitude: 35.6813, longitude: 139.7671 };
  const meters = haversineMeters(TOKYO, nearby);
  assert.ok(meters > 5 && meters < 20, `expected ~11m, got ${meters}`);
});

test("isWithinMeters detects close and far points", () => {
  const nearby = { latitude: 35.68125, longitude: 139.7671 };
  assert.equal(isWithinMeters(TOKYO, nearby, 25), true);
  assert.equal(isWithinMeters(TOKYO, OSAKA, 25), false);
});

test("isTravelFeasible: zero distance always feasible", () => {
  assert.equal(isTravelFeasible(0, 0, 60), true);
});

test("isTravelFeasible: negative elapsed time never feasible", () => {
  assert.equal(isTravelFeasible(1, -0.5, 60), false);
});

test("isTravelFeasible: reachable within time budget", () => {
  // 20km in 30 minutes at 60km/h -> reachable (max reach 30km)
  assert.equal(isTravelFeasible(20, 0.5, 60), true);
});

test("isTravelFeasible: too far for the elapsed time", () => {
  // 20km apart but only 5 minutes elapsed at 60km/h -> max reach 5km
  assert.equal(isTravelFeasible(20, 5 / 60, 60), false);
});

test("isTravelFeasible: zero speed with distance is impossible", () => {
  assert.equal(isTravelFeasible(1, 1, 0), false);
});
