import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { InMemoryReportRepository } from "../infrastructure/repositories/inMemoryReportRepository.js";
import {
  FakeMapRenderer,
  FakeSocialPoster,
  FixedClock,
  InMemoryImageStore,
  SequentialIdGenerator,
  StaticPoliceDirectory,
} from "../infrastructure/fakes.js";
import { ProcessReportUseCase } from "./processReport.js";
import { SubmitReportUseCase, type SubmitReportInput } from "./submitReport.js";
import type { GeoPoint } from "../domain/geo.js";

const TOKYO: GeoPoint = { latitude: 35.6812, longitude: 139.7671 };

let repo: InMemoryReportRepository;
let poster: FakeSocialPoster;
let renderer: FakeMapRenderer;
let images: InMemoryImageStore;
let clock: FixedClock;

function buildSubmit() {
  const processor = new ProcessReportUseCase({
    repository: repo,
    mapRenderer: renderer,
    socialPoster: poster,
    policeDirectory: new StaticPoliceDirectory("@KeishichoPR"),
  });
  return new SubmitReportUseCase({
    repository: repo,
    imageStore: images,
    clock,
    idGenerator: new SequentialIdGenerator("rep"),
    processor,
    country: "JP",
  });
}

function input(overrides: Partial<SubmitReportInput> = {}): SubmitReportInput {
  return {
    deviceId: "device-A",
    issueType: "illegal_garbage_dumping",
    location: TOKYO,
    ...overrides,
  };
}

beforeEach(() => {
  repo = new InMemoryReportRepository();
  poster = new FakeSocialPoster();
  renderer = new FakeMapRenderer();
  images = new InMemoryImageStore();
  clock = new FixedClock(new Date("2026-08-29T12:00:00Z"));
});

test("accepts a new report and stores it", async () => {
  const submit = buildSubmit();
  const result = await submit.execute(input({ issueType: "accident" }));
  assert.equal(result.status, "accepted");
  assert.equal(repo.all().length, 1);
});

test("silently discards a duplicate from the same device at the same location", async () => {
  const submit = buildSubmit();
  const first = await submit.execute(input());
  assert.equal(first.status, "accepted");

  clock.set(new Date("2026-08-29T12:05:00Z"));
  const second = await submit.execute(input());
  assert.equal(second.status, "discarded_duplicate");
  assert.equal(repo.all().length, 1, "duplicate must not be persisted");
});

test("a different device at the same location is not a duplicate", async () => {
  const submit = buildSubmit();
  await submit.execute(input());
  const other = await submit.execute(input({ deviceId: "device-B" }));
  assert.equal(other.status, "accepted");
  assert.equal(repo.all().length, 2);
});

test("stores an attached photo via the image store", async () => {
  const submit = buildSubmit();
  const result = await submit.execute(
    input({
      issueType: "accident",
      photo: { data: Buffer.from("jpeg-bytes"), contentType: "image/jpeg" },
    }),
  );
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  assert.ok(result.report.photoKey);
  assert.ok(images.get(result.report.photoKey!));
});

test("colocated garbage reports get correlated and posted to X", async () => {
  const submit = buildSubmit();
  // First report from device A.
  await submit.execute(input({ deviceId: "device-A" }));
  // Second report from a different device at (almost) the same spot.
  const second = await submit.execute(
    input({
      deviceId: "device-B",
      location: { latitude: 35.68125, longitude: 139.7671 },
    }),
  );

  assert.equal(second.status, "accepted");
  if (second.status !== "accepted") return;
  assert.equal(second.processing.kind, "correlated");
  assert.equal(poster.posts.length, 1);
  assert.match(poster.posts[0].text, /2 reports of Illegal garbage dumping/);
  assert.ok(poster.posts[0].image, "map image should be attached");
});

test("a single garbage report is not correlated", async () => {
  const submit = buildSubmit();
  const result = await submit.execute(input({ deviceId: "device-A" }));
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  assert.equal(result.processing.kind, "no_match");
  assert.equal(poster.posts.length, 0);
});

test("biker gang sightings within travel range are correlated and tag police", async () => {
  const submit = buildSubmit();
  // Sighting 1 at 11:30.
  clock.set(new Date("2026-08-29T11:30:00Z"));
  await submit.execute(
    input({ deviceId: "device-A", issueType: "biker_gang", location: TOKYO }),
  );
  // Sighting 2 at 12:00, ~5km north (reachable at 80km/h).
  clock.set(new Date("2026-08-29T12:00:00Z"));
  const second = await submit.execute(
    input({
      deviceId: "device-B",
      issueType: "biker_gang",
      location: { latitude: 35.7262, longitude: 139.7671 },
    }),
  );

  assert.equal(second.status, "accepted");
  if (second.status !== "accepted") return;
  assert.equal(second.processing.kind, "correlated");
  assert.equal(poster.posts.length, 1);
  assert.match(poster.posts[0].text, /Loud biker gang/);
  assert.match(poster.posts[0].text, /@KeishichoPR/);
  assert.equal(renderer.requests[0].drawPath, true);
});

test("biker gang sightings too far apart in time are not correlated", async () => {
  const submit = buildSubmit();
  clock.set(new Date("2026-08-29T11:59:00Z"));
  await submit.execute(
    input({ deviceId: "device-A", issueType: "biker_gang", location: TOKYO }),
  );
  // 1 minute later but ~5km away -> impossible for one gang.
  clock.set(new Date("2026-08-29T12:00:00Z"));
  const second = await submit.execute(
    input({
      deviceId: "device-B",
      issueType: "biker_gang",
      location: { latitude: 35.7262, longitude: 139.7671 },
    }),
  );
  assert.equal(second.status, "accepted");
  if (second.status !== "accepted") return;
  assert.equal(second.processing.kind, "no_match");
  assert.equal(poster.posts.length, 0);
});
