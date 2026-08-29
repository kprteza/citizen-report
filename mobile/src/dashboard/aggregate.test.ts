import { test } from "node:test";
import assert from "node:assert/strict";
import { aggregate, type AggregatableEntry } from "./aggregate";

// Anchor "now" to Wednesday 2026-08-26T12:00 local time.
const now = new Date(2026, 7, 26, 12, 0, 0);

function entry(issueType: AggregatableEntry["issueType"], createdAt: string): AggregatableEntry {
  return { issueType, createdAt };
}

// Helper to build a local ISO-ish timestamp the Date constructor parses in local time.
function local(y: number, m: number, d: number, h = 12): string {
  return new Date(y, m - 1, d, h).toISOString();
}

test("all-time counts every entry by type", () => {
  const entries = [
    entry("biker_gang", local(2020, 1, 1)),
    entry("biker_gang", local(2026, 8, 26)),
    entry("bear_sighting", local(2026, 8, 26)),
  ];
  const data = aggregate(entries, now);
  assert.equal(data.allTime.total, 3);
  assert.equal(data.allTime.byType.biker_gang, 2);
  assert.equal(data.allTime.byType.bear_sighting, 1);
});

test("day bucket only includes today's entries", () => {
  const entries = [
    entry("accident", local(2026, 8, 26, 9)), // today
    entry("accident", local(2026, 8, 25, 23)), // yesterday
  ];
  const data = aggregate(entries, now);
  assert.equal(data.day.total, 1);
  assert.equal(data.day.byType.accident, 1);
});

test("week bucket starts Monday and excludes last week", () => {
  // Week of 2026-08-26 (Wed) starts Mon 2026-08-24.
  const entries = [
    entry("noise_nuisance", local(2026, 8, 24, 1)), // Monday this week
    entry("noise_nuisance", local(2026, 8, 23, 23)), // Sunday last week
  ];
  const data = aggregate(entries, now);
  assert.equal(data.week.total, 1);
});

test("month bucket includes only the current month", () => {
  const entries = [
    entry("illegal_barbecue", local(2026, 8, 1)), // this month
    entry("illegal_barbecue", local(2026, 7, 31)), // last month
  ];
  const data = aggregate(entries, now);
  assert.equal(data.month.total, 1);
});

test("empty history yields zeroed buckets", () => {
  const data = aggregate([], now);
  assert.equal(data.allTime.total, 0);
  assert.equal(data.day.byType.biker_gang, 0);
});

test("nested windows are consistent (day <= week <= month <= allTime)", () => {
  const entries = [
    entry("biker_gang", local(2026, 8, 26)), // today
    entry("biker_gang", local(2026, 8, 24)), // this week
    entry("biker_gang", local(2026, 8, 2)), // this month
    entry("biker_gang", local(2026, 1, 1)), // this year only
  ];
  const data = aggregate(entries, now);
  assert.equal(data.day.total, 1);
  assert.equal(data.week.total, 2);
  assert.equal(data.month.total, 3);
  assert.equal(data.allTime.total, 4);
});
