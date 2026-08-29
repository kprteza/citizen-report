import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createApp } from "./app.js";
import { openDatabase } from "./db.js";

let server: Server;
let baseUrl: string;

before(async () => {
  const db = openDatabase(":memory:");
  const app = createApp(db);
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

after(() => {
  server.close();
});

test("health endpoint reports ok", async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, "ok");
});

test("create, list, fetch, and update a report end to end", async () => {
  const createRes = await fetch(`${baseUrl}/api/reports`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Broken water main",
      description: "Water is flooding the sidewalk on Elm Street.",
      category: "water",
      severity: "high",
      address: "Elm Street 120",
      reporter_name: "Test User",
    }),
  });
  assert.equal(createRes.status, 201);
  const created = await createRes.json();
  assert.ok(created.id);
  assert.equal(created.status, "open");

  const listRes = await fetch(`${baseUrl}/api/reports`);
  const list = await listRes.json();
  assert.ok(Array.isArray(list));
  assert.ok(list.some((r: { id: string }) => r.id === created.id));

  const patchRes = await fetch(
    `${baseUrl}/api/reports/${created.id}/status`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "in_progress" }),
    },
  );
  assert.equal(patchRes.status, 200);
  const patched = await patchRes.json();
  assert.equal(patched.status, "in_progress");
});

test("rejects invalid report payloads", async () => {
  const res = await fetch(`${baseUrl}/api/reports`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "x" }),
  });
  assert.equal(res.status, 400);
});

test("filters reports by status", async () => {
  const res = await fetch(`${baseUrl}/api/reports?status=resolved`);
  assert.equal(res.status, 200);
  const list = await res.json();
  assert.ok(list.every((r: { status: string }) => r.status === "resolved"));
});
