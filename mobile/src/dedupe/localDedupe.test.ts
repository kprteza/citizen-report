import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isLocalDuplicate,
  pruneRecent,
  recordSubmission,
  type RecentSubmission,
} from "./localDedupe";

const now = 1_000_000_000_000;
const TOKYO = { latitude: 35.6812, longitude: 139.7671 };

function recent(overrides: Partial<RecentSubmission> = {}): RecentSubmission {
  return {
    issueType: "illegal_garbage_dumping",
    latitude: TOKYO.latitude,
    longitude: TOKYO.longitude,
    at: now - 60_000,
    ...overrides,
  };
}

test("same type at same location within window is a local duplicate", () => {
  const dup = isLocalDuplicate(
    { issueType: "illegal_garbage_dumping", location: TOKYO },
    [recent()],
    now,
  );
  assert.equal(dup, true);
});

test("different issue type is not a duplicate", () => {
  const dup = isLocalDuplicate(
    { issueType: "bear_sighting", location: TOKYO },
    [recent()],
    now,
  );
  assert.equal(dup, false);
});

test("far location is not a duplicate", () => {
  const dup = isLocalDuplicate(
    { issueType: "illegal_garbage_dumping", location: { latitude: 35.7, longitude: 139.8 } },
    [recent()],
    now,
  );
  assert.equal(dup, false);
});

test("submission older than window is not a duplicate", () => {
  const old = recent({ at: now - 7 * 60 * 60 * 1000 });
  const dup = isLocalDuplicate(
    { issueType: "illegal_garbage_dumping", location: TOKYO },
    [old],
    now,
  );
  assert.equal(dup, false);
});

test("pruneRecent drops entries outside the window", () => {
  const list = [recent(), recent({ at: now - 7 * 60 * 60 * 1000 })];
  assert.equal(pruneRecent(list, now).length, 1);
});

test("recordSubmission appends and returns a duplicate-detectable list", () => {
  const updated = recordSubmission([], { issueType: "accident", location: TOKYO }, now);
  assert.equal(updated.length, 1);
  assert.equal(
    isLocalDuplicate({ issueType: "accident", location: TOKYO }, updated, now),
    true,
  );
});
