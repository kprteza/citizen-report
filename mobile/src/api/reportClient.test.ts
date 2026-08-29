import { test } from "node:test";
import assert from "node:assert/strict";
import { submitReport, type ReportClientConfig } from "./reportClient";

const config: ReportClientConfig = {
  baseUrl: "https://api.example.com",
  token: "secret",
  deviceId: "device-A",
};

function fakeFetch(status: number, body: unknown = {}) {
  const calls: { url: string; init: { headers: Record<string, string>; body: string } }[] = [];
  const fn = async (url: string, init: { method: string; headers: Record<string, string>; body: string }) => {
    calls.push({ url, init });
    return { status, json: async () => body };
  };
  return { fn, calls };
}

test("sends bearer auth and device id headers to the reports endpoint", async () => {
  const { fn, calls } = fakeFetch(201, { correlation: { correlated: false } });
  await submitReport(
    config,
    { issueType: "accident", latitude: 35.6, longitude: 139.7 },
    fn,
  );
  assert.equal(calls[0].url, "https://api.example.com/api/v1/reports");
  assert.equal(calls[0].init.headers.authorization, "Bearer secret");
  assert.equal(calls[0].init.headers["x-device-id"], "device-A");
  assert.match(calls[0].init.body, /"issueType":"accident"/);
});

test("maps 201 to accepted and surfaces correlation", async () => {
  const { fn } = fakeFetch(201, {
    correlation: { correlated: true, postUrl: "https://x.com/s/1" },
  });
  const result = await submitReport(
    config,
    { issueType: "biker_gang", latitude: 35.6, longitude: 139.7 },
    fn,
  );
  assert.equal(result.status, "accepted");
  assert.equal(result.correlation?.correlated, true);
  assert.equal(result.correlation?.postUrl, "https://x.com/s/1");
});

test("maps 202 to duplicate_discarded", async () => {
  const { fn } = fakeFetch(202, { status: "duplicate_discarded" });
  const result = await submitReport(
    config,
    { issueType: "accident", latitude: 35.6, longitude: 139.7 },
    fn,
  );
  assert.equal(result.status, "duplicate_discarded");
});

test("maps 401 to unauthorized and 400 to invalid", async () => {
  const unauth = await submitReport(
    config,
    { issueType: "accident", latitude: 35.6, longitude: 139.7 },
    fakeFetch(401).fn,
  );
  assert.equal(unauth.status, "unauthorized");
  const invalid = await submitReport(
    config,
    { issueType: "accident", latitude: 35.6, longitude: 139.7 },
    fakeFetch(400).fn,
  );
  assert.equal(invalid.status, "invalid");
});
