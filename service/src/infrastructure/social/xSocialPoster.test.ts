import { test } from "node:test";
import assert from "node:assert/strict";
import { XSocialPoster, type XClient } from "./xSocialPoster.js";

class FakeXClient implements XClient {
  username = "citizenreport";
  uploads: { contentType: string }[] = [];
  created: { text: string; mediaIds: string[] }[] = [];

  async uploadMedia(_data: Buffer, contentType: string): Promise<string> {
    this.uploads.push({ contentType });
    return `media-${this.uploads.length}`;
  }
  async createPost(input: { text: string; mediaIds: string[] }): Promise<{ id: string }> {
    this.created.push(input);
    return { id: "1234567890" };
  }
}

test("uploads the map image then creates a post referencing it", async () => {
  const client = new FakeXClient();
  const poster = new XSocialPoster(client);
  const result = await poster.post({
    text: "Correlated biker gang @KeishichoPR",
    image: { data: Buffer.from("png"), contentType: "image/png" },
  });

  assert.equal(client.uploads.length, 1);
  assert.deepEqual(client.created[0].mediaIds, ["media-1"]);
  assert.equal(client.created[0].text, "Correlated biker gang @KeishichoPR");
  assert.equal(result.url, "https://x.com/citizenreport/status/1234567890");
});

test("posts text without media when no image is provided", async () => {
  const client = new FakeXClient();
  const poster = new XSocialPoster(client);
  await poster.post({ text: "text only" });
  assert.equal(client.uploads.length, 0);
  assert.deepEqual(client.created[0].mediaIds, []);
});
