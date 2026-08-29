import { test } from "node:test";
import assert from "node:assert/strict";
import {
  JapanPoliceDirectory,
  JAPAN_NATIONAL_HANDLE,
} from "./japanPoliceDirectory.js";

const directory = new JapanPoliceDirectory();

test("resolves Tokyo police for a Tokyo location", async () => {
  const handle = await directory.handleFor({ latitude: 35.6812, longitude: 139.7671 });
  assert.equal(handle, "@MPD_koho");
});

test("resolves Osaka police for an Osaka location", async () => {
  const handle = await directory.handleFor({ latitude: 34.7025, longitude: 135.4959 });
  assert.equal(handle, "@OsakaFukei_PR");
});

test("falls back to the national handle outside known prefectures", async () => {
  const handle = await directory.handleFor({ latitude: 43.06, longitude: 141.35 }); // Sapporo
  assert.equal(handle, JAPAN_NATIONAL_HANDLE);
});
