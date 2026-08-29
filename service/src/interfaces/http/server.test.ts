import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { ProcessReportUseCase } from "../../application/processReport.js";
import { SubmitReportUseCase } from "../../application/submitReport.js";
import { ListReportsUseCase } from "../../application/listReports.js";
import { ApiKeyAuthenticator } from "../../infrastructure/auth/apiKeyAuthenticator.js";
import {
  FakeMapRenderer,
  FakeSocialPoster,
  InMemoryImageStore,
  RandomIdGenerator,
  SystemClock,
} from "../../infrastructure/fakes.js";
import { JapanPoliceDirectory } from "../../infrastructure/police/japanPoliceDirectory.js";
import { InMemoryReportRepository } from "../../infrastructure/repositories/inMemoryReportRepository.js";
import { createHttpApp } from "./server.js";

const TOKEN = "test-token";
let server: Server;
let baseUrl: string;
let repo: InMemoryReportRepository;
let poster: FakeSocialPoster;

function buildApp() {
  repo = new InMemoryReportRepository();
  poster = new FakeSocialPoster();
  const processor = new ProcessReportUseCase({
    repository: repo,
    mapRenderer: new FakeMapRenderer(),
    socialPoster: poster,
    policeDirectory: new JapanPoliceDirectory(),
  });
  const submit = new SubmitReportUseCase({
    repository: repo,
    imageStore: new InMemoryImageStore(),
    clock: new SystemClock(),
    idGenerator: new RandomIdGenerator(),
    processor,
    country: "JP",
  });
  const listReports = new ListReportsUseCase(repo);
  const authenticator = new ApiKeyAuthenticator({ [TOKEN]: "mobile-app" });
  return createHttpApp({ submit, listReports, authenticator });
}

async function jsonBody<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

async function postReport(body: unknown, headers: Record<string, string> = {}) {
  return fetch(`${baseUrl}/api/v1/reports`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${TOKEN}`,
      "x-device-id": "device-A",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function garbageAt(lat: number, lng: number) {
  return {
    issueType: "illegal_garbage_dumping",
    latitude: lat,
    longitude: lng,
  };
}

before(() => {
  const app = buildApp();
  return new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      resolve();
    });
  });
});

after(() => server.close());

test("rejects unauthenticated requests", async () => {
  const res = await fetch(`${baseUrl}/api/v1/reports`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-device-id": "d" },
    body: JSON.stringify(garbageAt(35.6, 139.7)),
  });
  assert.equal(res.status, 401);
});

test("rejects requests without a device id", async () => {
  const res = await fetch(`${baseUrl}/api/v1/reports`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(garbageAt(35.6, 139.7)),
  });
  assert.equal(res.status, 400);
});

test("rejects invalid issue types", async () => {
  const res = await postReport({ issueType: "nope", latitude: 35.6, longitude: 139.7 });
  assert.equal(res.status, 400);
});

test("accepts a valid report", async () => {
  const res = await postReport(garbageAt(35.61, 139.71), { "x-device-id": "dev-accept" });
  assert.equal(res.status, 201);
  const body = await jsonBody<{ status: string; report: { id: string } }>(res);
  assert.equal(body.status, "accepted");
  assert.ok(body.report.id);
});

test("silently discards duplicates with a 202", async () => {
  const loc = garbageAt(35.62, 139.72);
  const first = await postReport(loc, { "x-device-id": "dev-dupe" });
  assert.equal(first.status, 201);
  const second = await postReport(loc, { "x-device-id": "dev-dupe" });
  assert.equal(second.status, 202);
  const body = await jsonBody<{ status: string }>(second);
  assert.equal(body.status, "duplicate_discarded");
});

test("correlates co-located reports from different devices and posts to X", async () => {
  const before = poster.posts.length;
  await postReport(garbageAt(35.63, 139.73), { "x-device-id": "dev-1" });
  const res = await postReport(garbageAt(35.63001, 139.73), { "x-device-id": "dev-2" });
  const body = await jsonBody<{
    correlation: { correlated: boolean; postUrl?: string };
  }>(res);
  assert.equal(res.status, 201);
  assert.equal(body.correlation.correlated, true);
  assert.ok(body.correlation.postUrl);
  assert.equal(poster.posts.length, before + 1);
});

test("GET /api/v1/reports requires auth", async () => {
  const res = await fetch(`${baseUrl}/api/v1/reports`);
  assert.equal(res.status, 401);
});

test("GET /api/v1/reports returns unique issues (collapses correlated)", async () => {
  // Two co-located garbage reports from different devices: the second correlates
  // and must be collapsed, so only one unique issue is returned for that spot.
  await postReport(garbageAt(34.5, 135.0), { "x-device-id": "uniq-1" });
  await postReport(garbageAt(34.50001, 135.0), { "x-device-id": "uniq-2" });

  const res = await fetch(
    `${baseUrl}/api/v1/reports?issueType=illegal_garbage_dumping&bbox=134.9,34.4,135.1,34.6`,
    { headers: { authorization: `Bearer ${TOKEN}` } },
  );
  assert.equal(res.status, 200);
  const list = await jsonBody<{ id: string }[]>(res);
  assert.equal(list.length, 1, "correlated colocated report should be collapsed");
});

test("lists issue types without authentication", async () => {
  const res = await fetch(`${baseUrl}/api/v1/issue-types`);
  assert.equal(res.status, 200);
  const types = await jsonBody<{ value: string }[]>(res);
  assert.equal(types.length, 6);
  assert.ok(types.some((t) => t.value === "biker_gang"));
});
