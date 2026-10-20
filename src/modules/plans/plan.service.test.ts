import { test } from "node:test";
import assert from "node:assert/strict";
import { getPlan, assertWithinPlan, plans } from "./plan.service.js";

test("getPlan returns free plan by default and handles aliases", () => {
  const free = getPlan("free");
  assert.equal(free.code, "free");
  assert.equal(free.watermark, true);
  assert.equal(free.paperLimit, 2);

  const standardAlias = getPlan("standard");
  assert.equal(standardAlias.code, "small");

  const fallback = getPlan("unknown-plan-code");
  assert.equal(fallback.code, "free");
});

test("assertWithinPlan enforces question import permissions", () => {
  const freeResult = assertWithinPlan("free", { isImportAttempt: true });
  assert.equal(freeResult.allowed, false);
  assert.match(freeResult.reason, /Ultra package/i);

  const proResult = assertWithinPlan("pro", { isImportAttempt: true });
  assert.equal(proResult.allowed, false);

  const ultraResult = assertWithinPlan("ultra", { isImportAttempt: true });
  assert.equal(ultraResult.allowed, true);
});

test("assertWithinPlan enforces export format gating", () => {
  const freePdf = assertWithinPlan("free", { exportFormat: "pdf" });
  assert.equal(freePdf.allowed, true);

  const freeDocx = assertWithinPlan("free", { exportFormat: "docx" });
  assert.equal(freeDocx.allowed, false);
  assert.match(freeDocx.reason, /Ultra package/i);

  const ultraDocx = assertWithinPlan("ultra", { exportFormat: "docx" });
  assert.equal(ultraDocx.allowed, true);
});

test("assertWithinPlan enforces paper generation quotas", () => {
  const freeAtLimit = assertWithinPlan("free", { papersThisMonth: 2 });
  assert.equal(freeAtLimit.allowed, false);
  assert.match(freeAtLimit.reason, /limit reached/i);

  const freeUnderLimit = assertWithinPlan("free", { papersThisMonth: 1 });
  assert.equal(freeUnderLimit.allowed, true);
});

test("Diamond plan has unlimited papers, questions, docx export and import", () => {
  const diamond = getPlan("diamond");
  assert.equal(diamond.code, "diamond");
  assert.equal(diamond.price, 3500);

  const diamondResult = assertWithinPlan("diamond", {
    papersThisMonth: 1000000,
    questionsInPaper: 50000,
    totalQuestionsCreated: 99999999,
    exportFormat: "docx",
    isImportAttempt: true
  });
  assert.equal(diamondResult.allowed, true);
});

