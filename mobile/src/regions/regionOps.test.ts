import { test } from "node:test";
import assert from "node:assert/strict";
import { addRegion, canAddRegion, removeRegion } from "./regionOps";
import type { SavedRegion } from "./types";

function region(id: string, overrides: Partial<SavedRegion> = {}): SavedRegion {
  return {
    id,
    name: id,
    latitude: 35.6,
    longitude: 139.7,
    source: "manual",
    prefectureCode: id,
    ...overrides,
  };
}

test("adds regions up to the max of 3", () => {
  let list: SavedRegion[] = [];
  list = addRegion(list, region("tokyo"));
  list = addRegion(list, region("osaka"));
  list = addRegion(list, region("kyoto"));
  assert.equal(list.length, 3);
  assert.equal(canAddRegion(list), false);
});

test("does not add a 4th region", () => {
  const full = [region("a"), region("b"), region("c")];
  const after = addRegion(full, region("d"));
  assert.equal(after.length, 3);
  assert.ok(!after.some((r) => r.id === "d"));
});

test("dedupes by prefecture code", () => {
  const list = [region("tokyo")];
  const after = addRegion(list, region("tokyo2", { prefectureCode: "tokyo" }));
  assert.equal(after.length, 1);
});

test("dedupes gps regions by near coordinates", () => {
  const gps = region("g1", { source: "gps", prefectureCode: undefined });
  const near = region("g2", {
    source: "gps",
    prefectureCode: undefined,
    latitude: 35.6009,
    longitude: 139.7009,
  });
  const after = addRegion([gps], near);
  assert.equal(after.length, 1);
});

test("removeRegion removes by id", () => {
  const list = [region("a"), region("b")];
  assert.deepEqual(
    removeRegion(list, "a").map((r) => r.id),
    ["b"],
  );
});
