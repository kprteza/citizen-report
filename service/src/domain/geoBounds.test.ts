import { test } from "node:test";
import assert from "node:assert/strict";
import { boundingBox } from "./geoBounds.js";
import { haversineKm } from "./geo.js";

const TOKYO = { latitude: 35.6812, longitude: 139.7671 };

test("bounding box contains the requested radius", () => {
  const box = boundingBox(TOKYO, 20);
  // The box edges must be at least 20km away from the center.
  const north = haversineKm(TOKYO, { latitude: box.maxLat, longitude: TOKYO.longitude });
  const east = haversineKm(TOKYO, { latitude: TOKYO.latitude, longitude: box.maxLng });
  assert.ok(north >= 20, `north edge ${north}km should cover 20km`);
  assert.ok(east >= 20, `east edge ${east}km should cover 20km`);
});

test("bounding box is centered on the point", () => {
  const box = boundingBox(TOKYO, 10);
  assert.ok(box.minLat < TOKYO.latitude && box.maxLat > TOKYO.latitude);
  assert.ok(box.minLng < TOKYO.longitude && box.maxLng > TOKYO.longitude);
});

test("bounding box clamps to valid coordinate ranges near the pole", () => {
  const box = boundingBox({ latitude: 89.9, longitude: 100 }, 50);
  assert.ok(box.maxLat <= 90);
  assert.ok(box.minLng >= -180 && box.maxLng <= 180);
});
