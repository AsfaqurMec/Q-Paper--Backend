import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeRegex, sanitizeSvg, isPlaceholderSecret } from "./security.js";

test("escapeRegex escapes dangerous regex meta characters", () => {
  const input = "user.*+?^${}()|[]\\test";
  const escaped = escapeRegex(input);
  assert.equal(escaped, "user\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\test");
});

test("sanitizeSvg strips malicious JavaScript execution vectors", () => {
  const dirty = '<svg><g onload="alert(1)"><circle cx="10" cy="10" r="5"/><script>alert(2)</script></g></svg>';
  const clean = sanitizeSvg(dirty);
  assert.ok(!clean.includes("<script>"));
  assert.ok(!clean.includes("onload"));
  assert.ok(clean.includes("<circle"));
});

test("isPlaceholderSecret correctly identifies development fallback secrets", () => {
  assert.equal(isPlaceholderSecret("dev-access-secret-change-me"), true);
  assert.equal(isPlaceholderSecret("replace-with-a-long-random-secret"), true);
  assert.equal(isPlaceholderSecret("secret"), true);
  assert.equal(isPlaceholderSecret("f8a2bc45d6e7193028475a6c1e9b2d3f4a5b6c7d8e9f0123456789abcdef0123"), false);
});
