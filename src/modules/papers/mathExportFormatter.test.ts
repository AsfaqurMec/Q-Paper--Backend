import { test } from "node:test";
import assert from "node:assert/strict";
import {
  toSuperscript,
  toSubscript,
  formatMathForExport,
  convertBracketMatricesToLatex
} from "./mathExportFormatter.js";

test("toSuperscript correctly converts numbers and letters", () => {
  assert.equal(toSuperscript("2"), "²");
  assert.equal(toSuperscript("10"), "¹⁰");
  assert.equal(toSuperscript("n"), "ⁿ");
  assert.equal(toSuperscript("-1"), "⁻¹");
});

test("toSubscript correctly converts numbers and letters", () => {
  assert.equal(toSubscript("2"), "₂");
  assert.equal(toSubscript("10"), "₁₀");
  assert.equal(toSubscript("x"), "ₓ");
});

test("convertBracketMatricesToLatex preserves standard matrix brackets", () => {
  const input = "matrix: [[1, 2], [3, 4]]";
  const output = convertBracketMatricesToLatex(input);
  assert.ok(output.includes("\\begin{bmatrix}") || output.includes("1 & 2"));
});

test("formatMathForExport cleans and formats standard LaTeX equations", () => {
  const result = formatMathForExport("Calculate x^2 + y^2 = r^2");
  assert.ok(result.includes("x²") || result.includes("²"));

  const greekResult = formatMathForExport("\\alpha + \\beta = \\theta");
  assert.ok(greekResult.includes("α") && greekResult.includes("β") && greekResult.includes("θ"));
});
