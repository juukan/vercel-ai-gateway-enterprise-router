import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRequest } from "../src/routing/input.js";
import { publicDecision } from "../src/routing/public-decision.js";
import { routeRequest } from "../src/routing/router.js";
import { verifyApiToken, verifyOverrideToken } from "../src/security/override.js";

const env = { ROUTER_MAX_PROMPT_CHARS: "30000", ROUTER_DEFAULT_MAX_OUTPUT_TOKENS: "700" };

test("bearer tokens use exact constant-time-compatible comparison", () => {
  assert.equal(verifyApiToken("Bearer expected", "expected"), true);
  assert.equal(verifyApiToken("Bearer wrong", "expected"), false);
  assert.equal(verifyOverrideToken("Bearer expected-extra", "expected"), false);
  assert.equal(verifyOverrideToken(undefined, "expected"), false);
});

test("API authentication is optional only when no token is configured", () => {
  assert.equal(verifyApiToken(undefined, undefined), true);
  assert.equal(verifyApiToken(undefined, "required"), false);
});

test("remote image URLs and unsupported media types are rejected", () => {
  assert.throws(
    () => normalizeRequest({ prompt: "inspect", images: [{ dataUrl: "https://example.com/a.png" }] }, env),
    (error) => error.code === "invalid_image_input",
  );
  assert.throws(
    () => normalizeRequest({ prompt: "inspect", images: [{ dataUrl: "data:image/svg+xml;base64,PHN2Zz4=" }] }, env),
    (error) => error.code === "invalid_image_input",
  );
});

test("public decision never contains prompt or image bytes", async () => {
  const secret = "private-prompt-marker";
  const image = "data:image/png;base64,iVBORw0KGgo=";
  const decision = await routeRequest(
    { prompt: `Summarize ${secret}`, images: [{ dataUrl: image }] },
    { env },
  );
  const serialized = JSON.stringify(publicDecision(decision));
  assert.equal(serialized.includes(secret), false);
  assert.equal(serialized.includes("iVBOR"), false);
});

