import { test } from "node:test";
import assert from "node:assert/strict";
import { ApiKeyAuthenticator } from "./apiKeyAuthenticator.js";

const auth = new ApiKeyAuthenticator({ "secret-token": "mobile-app" });

test("accepts a valid token and returns the client id", async () => {
  const principal = await auth.verify("secret-token");
  assert.deepEqual(principal, { clientId: "mobile-app" });
});

test("rejects an invalid token", async () => {
  assert.equal(await auth.verify("wrong"), null);
});

test("rejects a missing token", async () => {
  assert.equal(await auth.verify(undefined), null);
});
