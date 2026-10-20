import assert from "node:assert/strict";
import test from "node:test";
import { cleanupOcrText } from "./questionImport.chunker.js";
import { mergeQuestions, parseQuestionsFallback } from "./questionImport.parser.js";
import type { ParsedQuestion } from "./questionImport.schema.js";

test("fallback parser extracts simple MCQ options and explicit answer", () => {
  const questions = parseQuestionsFallback("1. What is H2O?\nA. Oxygen\nB. Water\nC. Hydrogen\nD. Salt\nAnswer: B");

  assert.equal(questions.length, 1);
  assert.equal(questions[0].number, "1");
  assert.equal(questions[0].type, "mcq");
  assert.deepEqual(questions[0].options, ["Oxygen", "Water", "Hydrogen", "Salt"]);
  assert.equal(questions[0].correct, 1);
});

test("fallback parser preserves mathematics text", () => {
  const questions = parseQuestionsFallback("2. Solve x^2 + \\frac{1}{2}x = 0 [5]");

  assert.equal(questions.length, 1);
  assert.match(questions[0].title, /x\^2/);
  assert.match(questions[0].title, /\\frac\{1\}\{2\}/);
  assert.equal(questions[0].marks, 5);
});

test("fallback parser keeps written questions without invented options", () => {
  const questions = parseQuestionsFallback("3. Explain Newton's second law. Marks: 4");

  assert.equal(questions.length, 1);
  assert.deepEqual(questions[0].options, []);
  assert.equal(questions[0].correct, null);
});

test("OCR cleanup removes repeated page noise but keeps question text", () => {
  const cleaned = cleanupOcrText(["Model Test", "Page 1", "1. Define force.", "Model Test", "Page 2", "2. Define work.", "Model Test"].join("\n"));

  assert.doesNotMatch(cleaned, /Page 1/);
  assert.match(cleaned, /1\. Define force/);
  assert.match(cleaned, /2\. Define work/);
});

test("mergeQuestions removes overlapping duplicates and keeps richer version", () => {
  const base: ParsedQuestion = {
    title: "What is acceleration?",
    subtitle: null,
    marks: null,
    options: ["Rate of change of velocity"],
    correct: null,
    warnings: ["short"],
    type: "mcq",
    number: "1",
    images: [],
    tables: []
  };
  const richer: ParsedQuestion = { ...base, options: ["Rate of change of velocity", "Rate of change of distance"], warnings: [] };

  const merged = mergeQuestions([base, richer]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].options.length, 2);
});

test("fallback parser extracts Bengali MCQ option labels without translating", () => {
  const questions = parseQuestionsFallback("১. নিচের কোনটি লব্ধ রাশি?\nক) বল\nখ) তাপমাত্রা\nগ) দৈর্ঘ্য\nঘ) সময়\nউত্তর: ক");

  assert.equal(questions.length, 1);
  assert.equal(questions[0].number, "১");
  assert.equal(questions[0].type, "mcq");
  assert.deepEqual(questions[0].options, ["বল", "তাপমাত্রা", "দৈর্ঘ্য", "সময়"]);
  assert.equal(questions[0].correct, 0);
});

test("fallback parser preserves mixed language and Unicode mathematics", () => {
  const questions = parseQuestionsFallback("৪. Find the value of √২৫ + x² = ১০ হলে x এর মান নির্ণয় কর। [3]");

  assert.equal(questions.length, 1);
  assert.match(questions[0].title, /√২৫ \+ x² = ১০/);
  assert.match(questions[0].title, /নির্ণয় কর/);
  assert.equal(questions[0].marks, 3);
});

test("fallback parser keeps diagram and table references in written questions", () => {
  const questions = parseQuestionsFallback("5. Observe the diagram and table below, then explain the graph. Marks: 4");

  assert.equal(questions.length, 1);
  assert.deepEqual(questions[0].options, []);
  assert.match(questions[0].title, /diagram and table/);
  assert.match(questions[0].title, /graph/);
});

test("fallback parser parses Bengali Creative Questions (CQ) with sub-questions and marks", () => {
  const text = [
    "১. একটি গাড়ি স্থির অবস্থান থেকে 2 m/s² সুষম ত্বরণে চলতে শুরু করল।",
    "ক) ত্বরণ কাকে বলে? [১]",
    "খ) বল ও ত্বরণের মধ্যে সম্পর্ক ব্যাখ্যা কর। [২]",
    "গ) ৫ সেকেন্ড পর গাড়িটির বেগ কত হবে? [৩]",
    "ঘ) গাড়িটির ১০ সেকেন্ডে অতিক্রান্ত দূরত্ব নির্ণয় কর। [৪]"
  ].join("\n");

  const questions = parseQuestionsFallback(text);

  assert.equal(questions.length, 1);
  assert.equal(questions[0].type, "cq");
  assert.match(questions[0].title, /একটি গাড়ি স্থির অবস্থান/);
  assert.ok(questions[0].subQuestions && questions[0].subQuestions.length === 4);
  assert.equal(questions[0].subQuestions[0].label, "ক");
  assert.equal(questions[0].subQuestions[0].marks, 1);
  assert.equal(questions[0].subQuestions[3].label, "ঘ");
  assert.equal(questions[0].subQuestions[3].marks, 4);
});

test("fallback parser extracts chemistry reaction and preserves chemical formulas", () => {
  const text = [
    "৬. নিচের কোন বিক্রিয়াটি সঠিক?",
    "ক) 2H2 + O2 -> 2H2O",
    "খ) H2 + O2 -> H2O",
    "গ) CaCO3 -> CaO + CO2",
    "ঘ) N2 + 3H2 -> 2NH3",
    "উত্তর: ক"
  ].join("\n");

  const questions = parseQuestionsFallback(text);

  assert.equal(questions.length, 1);
  assert.equal(questions[0].type, "mcq");
  assert.deepEqual(questions[0].options, [
    "2H2 + O2 -> 2H2O",
    "H2 + O2 -> H2O",
    "CaCO3 -> CaO + CO2",
    "N2 + 3H2 -> 2NH3"
  ]);
  assert.equal(questions[0].correct, 0);
});

test("fallback parser preserves physics formulas with velocity and units", () => {
  const text = "৭. If s = ut + 1/2at^2, where u = 0 m/s and a = 9.8 m/s^2, find s at t = 2s. [5]";
  const questions = parseQuestionsFallback(text);

  assert.equal(questions.length, 1);
  assert.match(questions[0].title, /s = ut \+ 1\/2at\^2/);
  assert.match(questions[0].title, /9\.8 m\/s\^2/);
  assert.equal(questions[0].marks, 5);
});

test("fallback parser extracts multi-question Bengali document without collapsing", () => {
  const text = [
    "১. বলের এসআই (SI) একক কোনটি?",
    "(ক) জুল",
    "(খ) নিউটন",
    "(গ) ওয়াট",
    "(ঘ) প্যাসকেল",
    "উত্তর: খ",
    "",
    "২. পানির রাসায়নিক সংকেত কোনটি?",
    "(ক) CO2   (খ) H2O   (গ) NaCl   (ঘ) HCl",
    "উত্তর: খ",
    "",
    "৩. নিচের উদ্দীপকটি পড়ে প্রশ্নগুলোর উত্তর দাও:",
    "একটি বস্তু স্থির অবস্থান থেকে 2 m/s^2 সুষম ত্বরণে চলতে শুরু করল।",
    "ক. ত্বরণ কাকে বলে? [১]",
    "খ. সুষম বেগ ব্যাখ্যা কর। [২]",
    "গ. ৫ সেকেন্ড পর বস্তুটির বেগ নির্ণয় কর। [৩]",
    "ঘ. উদ্দীপকের তথ্যের আলোকে ১০ সেকেন্ডে অতিক্রান্ত দূরত্ব গাণিতিকভাবে বিশ্লেষণ কর। [৪]"
  ].join("\n");

  const questions = parseQuestionsFallback(text);

  assert.equal(questions.length, 3);
  // Question 1: Bengali MCQ
  assert.equal(questions[0].number, "১");
  assert.equal(questions[0].type, "mcq");
  assert.deepEqual(questions[0].options, ["জুল", "নিউটন", "ওয়াট", "প্যাসকেল"]);
  assert.equal(questions[0].correct, 1);

  // Question 2: Bengali inline MCQ
  assert.equal(questions[1].number, "২");
  assert.equal(questions[1].type, "mcq");
  assert.deepEqual(questions[1].options, ["CO2", "H2O", "NaCl", "HCl"]);
  assert.equal(questions[1].correct, 1);

  // Question 3: Bengali CQ
  assert.equal(questions[2].number, "৩");
  assert.equal(questions[2].type, "cq");
  assert.equal(questions[2].marks, 10);
  assert.ok(questions[2].subQuestions && questions[2].subQuestions.length === 4);
  assert.equal(questions[2].subQuestions[0].label, "ক");
  assert.equal(questions[2].subQuestions[0].marks, 1);
  assert.equal(questions[2].subQuestions[3].label, "ঘ");
  assert.equal(questions[2].subQuestions[3].marks, 4);
});

test("fallback parser extracts multi-question STEM with Math & Chemistry", () => {
  const text = [
    "Question 1: What is the derivative of f(x) = x^2 + 3x?",
    "A) 2x + 3",
    "B) x + 3",
    "C) 2x",
    "D) 3x",
    "Answer: A",
    "",
    "Question 2: Consider the chemical reaction: 2H2 + O2 -> 2H2O",
    "a) What is the limiting reactant? [1]",
    "b) Explain exothermic reaction. [2]",
    "c) Calculate the moles of water produced from 4g of H2. [3]",
    "d) Justify whether the law of conservation of mass is obeyed. [4]"
  ].join("\n");

  const questions = parseQuestionsFallback(text);

  assert.equal(questions.length, 2);
  assert.equal(questions[0].type, "mcq");
  assert.equal(questions[0].correct, 0);
  assert.equal(questions[0].options.length, 4);

  assert.equal(questions[1].type, "cq");
  assert.equal(questions[1].marks, 10);
  assert.ok(questions[1].subQuestions && questions[1].subQuestions.length === 4);
});
