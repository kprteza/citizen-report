import { test } from "node:test";
import assert from "node:assert/strict";
import { parseHistory } from "./historyStore";

test("parseHistory returns empty for null", () => {
  assert.deepEqual(parseHistory(null), []);
});

test("parseHistory returns empty for corrupt JSON", () => {
  assert.deepEqual(parseHistory("{not json"), []);
});

test("parseHistory returns empty when payload is not an array", () => {
  assert.deepEqual(parseHistory(JSON.stringify({ a: 1 })), []);
});

test("parseHistory round-trips a valid array", () => {
  const entries = [
    {
      id: "1",
      issueType: "biker_gang",
      latitude: 35,
      longitude: 139,
      hasPhoto: false,
      createdAt: "2026-08-29T12:00:00Z",
      status: "accepted",
      correlated: true,
      postUrl: "https://x.com/s/1",
    },
  ];
  assert.deepEqual(parseHistory(JSON.stringify(entries)), entries);
});
