/**
 * Math Domain Question Generator
 * Generates 50 distinct mathematical MCQs for any math chapter
 */

import { ChapterDef, toBn, makeTriangleSvg, makeCircleSvg, makeVennSvg } from "./comprehensiveQuestionEngine.js";

export interface GeneratedMCQPayload {
  title: string;
  rawCorrect: string;
  rawDistractors: [string, string, string];
  explanation: string;
  imageUrl?: string;
}

export function generateMathMCQ(
  topic: string,
  chapter: ChapterDef,
  slot: number, // 1 to 50
  p1: number,
  p2: number,
  p3: number,
  p4: number,
  p5: number,
  subject: string = "Mathematics"
): GeneratedMCQPayload {
  const chTag = `[${subject} - Ch ${chapter.number}: ${chapter.title}]`;
  let title = "";
  let rawCorrect = "";
  let rawDistractors: [string, string, string] = ["0", "1", "2"];
  let explanation = "";
  let imageUrl: string | undefined = undefined;

  if (topic === "MATH_CIRCLES") {
    switch (slot) {
      case 1:
        title = `${chTag} একটি বৃত্তের ব্যাসার্ধ $r = ${p4}\\text{ cm}$ হলে, এর পরিধি কত?`;
        const circ = (2 * Math.PI * p4).toFixed(2);
        rawCorrect = `$${circ}\\text{ cm}$`;
        rawDistractors = [`$${(2 * p4 * 3.14).toFixed(0)}\\text{ cm}$`, `$${(Math.PI * p4 * p4).toFixed(2)}\\text{ cm}$`, `$${(p4 * 4).toFixed(2)}\\text{ cm}$`];
        explanation = `$C = 2\\pi r = 2\\pi (${p4}) \\approx ${circ}\\text{ cm}$।`;
        break;
      case 2:
        title = `${chTag} একটি বৃত্তের ব্যাসার্ধ $r = ${p4}\\text{ cm}$ হলে, এর ক্ষেত্রফল কত?`;
        const area = (Math.PI * p4 * p4).toFixed(2);
        rawCorrect = `$${area}\\text{ cm}^2$`;
        rawDistractors = [`$${(2 * Math.PI * p4).toFixed(2)}\\text{ cm}^2$`, `$${(Math.PI * (p4 + 2) * (p4 + 2)).toFixed(2)}\\text{ cm}^2$`, `$${(p4 * p4).toFixed(2)}\\text{ cm}^2$`];
        explanation = `$A = \\pi r^2 = \\pi (${p4})^2 \\approx ${area}\\text{ cm}^2$।`;
        break;
      case 3:
        title = `${chTag} $r = ${p4 + 3}\\text{ cm}$ ব্যাসার্ধের বৃত্তের কেন্দ্র থেকে $d = ${p4}\\text{ cm}$ দূরবর্তী জ্যা-এর দৈর্ঘ্য কত?`;
        const chordHalf = Math.sqrt(Math.pow(p4 + 3, 2) - Math.pow(p4, 2)).toFixed(2);
        const chordLen = (2 * Number(chordHalf)).toFixed(2);
        rawCorrect = `$${chordLen}\\text{ cm}$`;
        rawDistractors = [`$${chordHalf}\\text{ cm}$`, `$${(p4 + 3) * 2}\\text{ cm}$`, `$${(Number(chordLen) + 3).toFixed(2)}\\text{ cm}$`];
        explanation = `জ্যা-এর দৈর্ঘ্য $= 2\\sqrt{r^2 - d^2} = 2\\sqrt{${p4 + 3}^2 - ${p4}^2} = ${chordLen}\\text{ cm}$।`;
        imageUrl = makeCircleSvg(p4 + 3, Number(chordLen), 60);
        break;
      case 4:
        title = `${chTag} বৃত্তের একটি চাপের ওপর দণ্ডায়মান কেন্দ্রস্থ কোণ $${p1 * 6}^\\circ$ হলে, বৃত্তস্থ কোণ কত?`;
        rawCorrect = `$${p1 * 3}^\\circ$`;
        rawDistractors = [`$${p1 * 6}^\\circ$`, `$${p1 * 12}^\\circ$`, `$${p1 * 3 + 10}^\\circ$`];
        explanation = `বৃত্তস্থ কোণ কেন্দ্রস্থ কোণের অর্ধেক: $\\frac{${p1 * 6}}{2} = ${p1 * 3}^\\circ$।`;
        break;
      case 5:
        title = `${chTag} বৃত্তে অন্তর্লিখিত চতুর্ভুজের একটি কোণ $${70 + p4 * 5}^\\circ$ হলে বিপরীত কোণটির মান কত?`;
        const oppAngle = 180 - (70 + p4 * 5);
        rawCorrect = `$${oppAngle}^\\circ$`;
        rawDistractors = [`$${70 + p4 * 5}^\\circ$`, `$${oppAngle + 20}^\\circ$`, `$90^\\circ$`];
        explanation = `বৃত্তস্থ চতুর্ভুজের বিপরীত কোণদ্বয়ের সমষ্টি ১৮০ ডিগ্রি: $180^\\circ - ${70 + p4 * 5}^\\circ = ${oppAngle}^\\circ$।`;
        break;
      case 6:
        title = `${chTag} $r = ${p4 * 2}\\text{ cm}$ ব্যাসার্ধবিশিষ্ট বৃত্তে $\\theta = ${p1 * 5}^\\circ$ কোণের বৃত্তকলার ক্ষেত্রফল কত?`;
        const secArea = ((Math.PI * Math.pow(p4 * 2, 2) * (p1 * 5)) / 360).toFixed(2);
        rawCorrect = `$${secArea}\\text{ cm}^2$`;
        rawDistractors = [`$${(Number(secArea) * 2).toFixed(2)}\\text{ cm}^2$`, `$${(Number(secArea) / 2).toFixed(2)}\\text{ cm}^2$`, `$${(p4 * 2 * 3.14).toFixed(2)}\\text{ cm}^2$`];
        explanation = `$A = \\frac{\\theta}{360} \\times \\pi r^2 = \\frac{${p1 * 5}}{360} \\times \\pi (${p4 * 2})^2 \\approx ${secArea}\\text{ cm}^2$।`;
        break;
      case 7:
        title = `${chTag} দুটি বৃত্ত পরস্পরকে বহিঃস্পর্শ করলে এবং তাদের ব্যাসার্ধ যথাক্রমে $${p4}\\text{ cm}$ ও $${p5}\\text{ cm}$ হলে কেন্দ্রদ্বয়ের দূরত্ব কত?`;
        rawCorrect = `$${p4 + p5}\\text{ cm}$`;
        rawDistractors = [`$${Math.abs(p4 - p5)}\\text{ cm}$`, `$${p4 * p5}\\text{ cm}$`, `$${(p4 + p5) * 2}\\text{ cm}$`];
        explanation = `বহিঃস্পর্শ করলে কেন্দ্রদ্বয়ের দূরত্ব $= r_1 + r_2 = ${p4} + ${p5} = ${p4 + p5}\\text{ cm}$।`;
        break;
      case 8:
        title = `${chTag} দুটি বৃত্ত অন্তস্পর্শ করলে তাদের কেন্দ্রদ্বয়ের দূরত্ব কত যখন ব্যাসার্ধদ্বয় $${p4 + 4}\\text{ cm}$ ও $${p4}\\text{ cm}$?`;
        rawCorrect = `$4\\text{ cm}$`;
        rawDistractors = [`$${(p4 + 4) + p4}\\text{ cm}$`, `$${(p4 + 4) * p4}\\text{ cm}$`, `$2\\text{ cm}$`];
        explanation = `অন্তস্পর্শ করলে কেন্দ্রদ্বয়ের দূরত্ব $= |r_1 - r_2| = |${p4 + 4} - ${p4}| = 4\\text{ cm}$।`;
        break;
      case 9:
        title = `${chTag} $x^2 + y^2 = ${p4 * p4}$ বৃত্তের ব্যাসার্ধ কত?`;
        rawCorrect = `$${p4}$`;
        rawDistractors = [`$${p4 * p4}$`, `$${p4 * 2}$`, `$\\sqrt{${p4}}$`];
        explanation = `আদর্শ বৃত্তের সমীকরণ $x^2 + y^2 = r^2$ এর সাথে তুলনা করে $r = \\sqrt{${p4 * p4}} = ${p4}$।`;
        break;
      case 10:
        title = `${chTag} বৃত্তের বহিস্থ কোনো বিন্দু থেকে বৃত্তে সর্বোচ্চ কয়টি স্পর্শক আঁকা যায়?`;
        rawCorrect = `$2$ টি`;
        rawDistractors = [`$1$ টি`, `$3$ টি`, `অসংখ্য`];
        explanation = `বৃত্তের বহিস্থ যেকোনো নির্দিষ্ট বিন্দু থেকে বৃত্তের ওপর কেবল দুটি স্পর্শক টানা যায়।`;
        break;
      default:
        const k = slot - 10;
        title = `${chTag} [সমস্যা ${slot}]: $r = ${k + 2}\\text{ cm}$ ব্যাসার্ধের বৃত্তে $${(k % 6) + 2}\\text{ cm}$ দূরবর্তী জ্যা দ্বারা গঠিত সমকোণী ত্রিভুজের অতিভুজ কত?`;
        const vH = (k + 2);
        rawCorrect = `$${vH}\\text{ cm}$`;
        rawDistractors = [`$${vH * 2}\\text{ cm}$`, `$${vH + 3}\\text{ cm}$`, `$${Math.max(1, vH - 2)}\\text{ cm}$`];
        explanation = `বৃত্তের কেন্দ্র হতে পরিধির যেকোনো বিন্দুর সংযোজক রেখাই ব্যাসার্ধ ($r = ${vH}\\text{ cm}$)।`;
        break;
    }
  } else if (topic === "MATH_MATRICES") {
    switch (slot) {
      case 1:
        title = `${chTag} ম্যাট্রিক্স $A = \\begin{pmatrix} ${p4} & ${p5} \\\\ 2 & 3 \\end{pmatrix}$ হলে নির্ণায়ক $|A|$-এর মান কত?`;
        const det1 = p4 * 3 - p5 * 2;
        rawCorrect = `$${det1}$`;
        rawDistractors = [`$${det1 + 4}$`, `$${det1 - 5}$`, `$${p4 * 3 + p5 * 2}$`];
        explanation = `$|A| = (${p4})(3) - (${p5})(2) = ${p4 * 3} - ${p5 * 2} = ${det1}$।`;
        break;
      case 2:
        title = `${chTag} ম্যাট্রিক্স $A = \\begin{pmatrix} k & ${p4 * 2} \\\\ 2 & ${p4} \\end{pmatrix}$ ব্যতিক্রমী (Singular) হলে $k$-এর মান কত?`;
        rawCorrect = `$4$`;
        rawDistractors = [`$2$`, `$${p4}$`, `$0$`];
        explanation = `ব্যতিক্রমী ম্যাট্রিক্সের নির্ণায়ক শূন্য: $k(${p4}) - (${p4 * 2})(2) = 0 \\implies k(${p4}) = ${p4 * 4} \\implies k = 4$।`;
        break;
      case 3:
        title = `${chTag} ম্যাট্রিক্স $A = \\begin{pmatrix} ${p1} & 4 \\\\ 1 & ${p2} \\end{pmatrix}$ এর ট্রেস (Trace) কত?`;
        const trVal = p1 + p2;
        rawCorrect = `$${trVal}$`;
        rawDistractors = [`$${p1 * p2}$`, `$${trVal + 2}$`, `$${p1 - p2}$`];
        explanation = `ট্রেস হলো মুখ্য কর্ণের উপাদানসমূহের যোগফল: $${p1} + ${p2} = ${trVal}$।`;
        break;
      case 4:
        title = `${chTag} একটি $3 \\times 2$ ম্যাট্রিক্স $A$ এবং $2 \\times 4$ ম্যাট্রিক্স $B$ হলে $AB$ ম্যাট্রিক্সের মাত্রা কত?`;
        rawCorrect = `$3 \\times 4$`;
        rawDistractors = [`$2 \\times 2$`, `$3 \\times 2$`, `$4 \\times 3$`];
        explanation = `$(m \\times n) \\times (n \\times p) = m \\times p \\implies (3 \\times 2) \\times (2 \\times 4) = 3 \\times 4$।`;
        break;
      case 5:
        title = `${chTag} ম্যাট্রিক্স $A$-এর মাত্রা $2 \\times 2$ এবং $|A| = ${p4}$ হলে $|3A|$-এর মান কত?`;
        const det3A = Math.pow(3, 2) * p4;
        rawCorrect = `$${det3A}$`;
        rawDistractors = [`$${3 * p4}$`, `$${det3A + 9}$`, `$${p4}$`];
        explanation = `$n \\times n$ ম্যাট্রিক্সের জন্য $|kA| = k^n |A|$। সুতরাং $|3A| = 3^2 |A| = 9 \\times ${p4} = ${det3A}$।`;
        break;
      case 6:
        title = `${chTag} ম্যাট্রিক্স $A = \\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}$ কোন ধরনের ম্যাট্রিক্স?`;
        rawCorrect = `অভেদক ম্যাট্রিক্স (Identity Matrix)`;
        rawDistractors = [`শূন্য ম্যাট্রিক্স`, `প্রতিসম ম্যাট্রিক্স`, `ব্যতিক্রমী ম্যাট্রিক্স`];
        explanation = `মুখ্য কর্ণের মান ১ এবং বাকি ভুক্তি শূন্য হলে তা অভেদক ম্যাট্রিক্স $I$।`;
        break;
      default:
        const mk = slot - 6;
        title = `${chTag} [সমস্যা ${slot}]: $A = \\begin{pmatrix} ${mk} & 1 \\\\ 0 & 2 \\end{pmatrix}$ হলে $A^2$-এর প্রথম সারির প্রথম উপাদান কত?`;
        const a11 = mk * mk;
        rawCorrect = `$${a11}$`;
        rawDistractors = [`$${mk * 2}$`, `$${a11 + 2}$`, `$${mk}$`];
        explanation = `গুণনের নিয়মানুসারে প্রথম ভুক্তি $= (${mk})(${mk}) + (1)(0) = ${a11}$।`;
        break;
    }
  } else if (topic === "MATH_STATISTICS") {
    switch (slot) {
      case 1:
        title = `${chTag} উপাত্ত $\\{${p1}, ${p1 + 2}, ${p1 + 4}, ${p1 + 6}, ${p1 + 8}\\}$ এর গাণিতিক গড় কত?`;
        const mMean = p1 + 4;
        rawCorrect = `$${mMean}$`;
        rawDistractors = [`$${mMean - 2}$`, `$${mMean + 2}$`, `$${p1}$`];
        explanation = `গড় $= \\frac{${p1} + ${p1 + 2} + ${p1 + 4} + ${p1 + 6} + ${p1 + 8}}{5} = ${mMean}$।`;
        break;
      case 2:
        title = `${chTag} উপাত্ত $\\{${p1 + 1}, ${p1 + 3}, ${p1 + 5}, ${p1 + 7}, ${p1 + 9}\\}$ এর মধ্যক (Median) কত?`;
        rawCorrect = `$${p1 + 5}$`;
        rawDistractors = [`$${p1 + 3}$`, `$${p1 + 7}$`, `$${p1 + 1}$`];
        explanation = `মানের ক্রমানুসারে সাজানো বিজোড় সংখ্যক উপাত্তের ঠিক মাঝামাঝি মানই মধ্যক ($${p1 + 5}$)।`;
        break;
      case 3:
        title = `${chTag} উপাত্ত $\\{${p4}, ${p4 + 1}, ${p4}, ${p4 + 2}, ${p4}, ${p4 + 3}\\}$ এর প্রচুরক (Mode) কোনটি?`;
        rawCorrect = `$${p4}$`;
        rawDistractors = [`$${p4 + 1}$`, `$${p4 + 2}$`, `$${p4 + 3}$`];
        explanation = `উপাত্তে সর্বাধিক বার (৩ বার) উপস্থিত সংখ্যা $${p4}$ হলো প্রচুরক।`;
        break;
      case 4:
        title = `${chTag} উপাত্তের সর্বনিম্ন মান $${p1}$ এবং পরিসর (Range) $${p2 * 5}$ হলে সর্বোচ্চ মান কত?`;
        const maxVal = p1 + p2 * 5 - 1;
        rawCorrect = `$${maxVal}$`;
        rawDistractors = [`$${maxVal + 1}$`, `$${maxVal - 5}$`, `$${p1 + p2 * 5}$`];
        explanation = `$\\text{পরিসর} = (\\text{সর্বোচ্চ মান} - \\text{সর্বনিম্ন মান}) + 1 \\implies \\text{সর্বোচ্চ মান} = ${p2 * 5} + ${p1} - 1 = ${maxVal}$।`;
        break;
      case 5:
        title = `${chTag} শ্রেণি ব্যাপ্তি $10$ এবং পরিসর $${p4 * 10}$ হলে শ্রেণি সংখ্যা কয়টি?`;
        rawCorrect = `$${p4}$ টি`;
        rawDistractors = [`$${p4 + 1}$ টি`, `$${p4 - 1}$ টি`, `$${p4 * 2}$ টি`];
        explanation = `শ্রেণি সংখ্যা $= \\frac{\\text{পরিসর}}{\\text{শ্রেণি ব্যাপ্তি}} = \\frac{${p4 * 10}}{10} = ${p4}$।`;
        break;
      default:
        const sk = slot - 5;
        title = `${chTag} [সমস্যা ${slot}]: $N = ${sk * 10}$ মোট গণসংখ্যা হলে ক্রমযোজিত গণসংখ্যার শেষ মান কত?`;
        rawCorrect = `$${sk * 10}$`;
        rawDistractors = [`$${sk * 10 - 1}$`, `$${sk * 5}$`, `$${sk * 20}$`];
        explanation = `ক্রমযোজিত গণসংখ্যার সর্বশেষ মান সর্বদা মোট গণসংখ্যা $N$-এর সমান হয়।`;
        break;
    }
  } else if (topic === "MATH_TRIGONOMETRY") {
    switch (slot) {
      case 1:
        title = `${chTag} সমকোণী ত্রিভুজে লম্ব $a = ${p4}\\text{ cm}$ এবং ভূমি $b = ${p5}\\text{ cm}$ হলে $\\tan\\theta$ কত?`;
        rawCorrect = `$\\frac{${p4}}{${p5}}$`;
        rawDistractors = [`$\\frac{${p5}}{${p4}}$`, `$\\frac{${p4}}{\\sqrt{${p4 * p4 + p5 * p5}}}$`, `$1$`];
        explanation = `$\\tan\\theta = \\frac{\\text{লম্ব}}{\\text{ভূমি}} = \\frac{${p4}}{${p5}}$।`;
        imageUrl = makeTriangleSvg(p5, p4, `\\sqrt{${p4 * p4 + p5 * p5}}`);
        break;
      case 2:
        title = `${chTag} যদি $\\sin\\theta = \\frac{${p4}}{${p4 + 2}}$ হয়, তবে $\\operatorname{cosec}\\theta$-এর মান কত?`;
        rawCorrect = `$\\frac{${p4 + 2}}{${p4}}$`;
        rawDistractors = [`$\\frac{${p4}}{${p4 + 2}}$`, `$\\frac{2}{${p4}}$`, `$1$`];
        explanation = `$\\operatorname{cosec}\\theta = \\frac{1}{\\sin\\theta} = \\frac{${p4 + 2}}{${p4}}$।`;
        break;
      case 3:
        title = `${chTag} $\\sin^2 ${p1 * 5}^\\circ + \\cos^2 ${p1 * 5}^\\circ$-এর মান কত?`;
        rawCorrect = `$1$`;
        rawDistractors = [`$0$`, `$2$`, `$\\frac{1}{2}$`];
        explanation = `যেকোনো কোণ $\\theta$-এর জন্য ত্রিকোণমিতিক মৌলিক অভেদ $\\sin^2\\theta + \\cos^2\\theta = 1$।`;
        break;
      case 4:
        title = `${chTag} ভূ-রেখা থেকে একটি মিনারের শীর্ষের উন্নতি কোণ $30^\\circ$ এবং পাদদেশ থেকে দূরত্ব $d = ${p4 * 10}\\sqrt{3}\\text{ m}$ হলে মিনারের উচ্চতা কত?`;
        rawCorrect = `$${p4 * 10}\\text{ m}$`;
        rawDistractors = [`$${p4 * 10 * 3}\\text{ m}$`, `$${p4 * 10}\\sqrt{3}\\text{ m}$`, `$${p4 * 5}\\text{ m}$`];
        explanation = `$h = d \\tan 30^\\circ = (${p4 * 10}\\sqrt{3}) \\times \\frac{1}{\\sqrt{3}} = ${p4 * 10}\\text{ m}$।`;
        break;
      case 5:
        title = `${chTag} $\\sec^2\\theta - \\tan^2\\theta$-এর মান কত?`;
        rawCorrect = `$1$`;
        rawDistractors = [`$0$`, `$-1$`, `$2$`];
        explanation = `ত্রিকোণমিতিক অভেদ অনুসারে $\\sec^2\\theta - \\tan^2\\theta = 1$।`;
        break;
      default:
        const tk = slot - 5;
        title = `${chTag} [সমস্যা ${slot}]: একটি কোণ $\\theta = ${tk * 15}^\\circ$ হলে এর রেডিয়ান মান কত?`;
        const radFrac = (tk * 15 / 180).toFixed(2);
        rawCorrect = `$${radFrac}\\pi\\text{ rad}$`;
        rawDistractors = [`$${(Number(radFrac) * 2).toFixed(2)}\\pi\\text{ rad}$`, `$${tk}\\pi\\text{ rad}$`, `$1\\text{ rad}$`];
        explanation = `ডিগ্রি হতে রেডিয়ান: $\\theta \\times \\frac{\\pi}{180} = ${tk * 15} \\times \\frac{\\pi}{180} \\approx ${radFrac}\\pi\\text{ rad}$।`;
        break;
    }
  } else if (topic === "MATH_SETS") {
    switch (slot) {
      case 1:
        title = `${chTag} একটি সেট $A = \\{x \\in \\mathbb{N} : x \\le ${p4}\\}$ হলে সেট $A$-এর উপাদান সংখ্যা কত?`;
        rawCorrect = `$${p4}$`;
        rawDistractors = [`$${p4 + 1}$`, `$${p4 - 1}$`, `$2^{${p4}}$`];
        explanation = `স্বাভাবিক সংখ্যার সেট $\\{1, 2, \\dots, ${p4}\\}$ এর উপাদান সংখ্যা $n = ${p4}$।`;
        break;
      case 2:
        title = `${chTag} সেট $S$-এর উপাদান সংখ্যা $n = ${p4}$ হলে এর শক্তি সেট $P(S)$-এর উপাদান সংখ্যা কত?`;
        const pCount = Math.pow(2, p4);
        rawCorrect = `$${pCount}$`;
        rawDistractors = [`$${pCount - 1}$`, `$${p4 * 2}$`, `$${pCount + 2}$`];
        explanation = `শক্তি সেটের উপাদান সংখ্যার সূত্র $2^n = 2^{${p4}} = ${pCount}$।`;
        break;
      case 3:
        title = `${chTag} সেট $A$-এর উপাদান সংখ্যা $n = ${p4}$ হলে এর প্রকৃত উপসেট সংখ্যা কত?`;
        const propCount = Math.pow(2, p4) - 1;
        rawCorrect = `$${propCount}$`;
        rawDistractors = [`$${propCount + 1}$`, `$${p4 * 2}$`, `$${propCount - 1}$`];
        explanation = `প্রকৃত উপসেটের সংখ্যা $= 2^n - 1 = 2^{${p4}} - 1 = ${propCount}$।`;
        break;
      case 4:
        title = `${chTag} যদি $n(A) = ${p1 + 5}$, $n(B) = ${p2 + 4}$ এবং $n(A \\cap B) = 3$ হয়, তবে $n(A \\cup B)$ কত?`;
        const uVal = (p1 + 5) + (p2 + 4) - 3;
        rawCorrect = `$${uVal}$`;
        rawDistractors = [`$${uVal + 3}$`, `$${uVal - 3}$`, `$${(p1 + 5) + (p2 + 4)}$`];
        explanation = `$n(A \\cup B) = n(A) + n(B) - n(A \\cap B) = ${p1 + 5} + ${p2 + 4} - 3 = ${uVal}$।`;
        imageUrl = makeVennSvg(p1 + 5, p2 + 4, 3);
        break;
      default:
        const setK = slot - 4;
        title = `${chTag} [সমস্যা ${slot}]: $A = \\{1, 2\\}$ এবং $B = \\{1, 2, \\dots, ${setK + 2}\\}$ হলে কার্তেসীয় গুণজ $A \\times B$-এর উপাদান সংখ্যা কত?`;
        const cartN = 2 * (setK + 2);
        rawCorrect = `$${cartN}$`;
        rawDistractors = [`$${cartN + 2}$`, `$${setK + 2}$`, `$4$`];
        explanation = `$n(A \\times B) = n(A) \\times n(B) = 2 \\times ${setK + 2} = ${cartN}$।`;
        break;
    }
  } else {
    // Default / General Mathematical Topics (Calculus, Algebra, Coordinates, Vectors, Mechanics)
    switch (slot) {
      case 1:
        title = `${chTag} বীজগণিতীয় সমীকরণ $x + \\frac{1}{x} = ${p4}$ হলে $x^2 + \\frac{1}{x^2}$-এর মান কত?`;
        const sqVal = p4 * p4 - 2;
        rawCorrect = `$${sqVal}$`;
        rawDistractors = [`$${p4 * p4}$`, `$${sqVal + 4}$`, `$${p4 * 2}$`];
        explanation = `$x^2 + \\frac{1}{x^2} = \\left(x + \\frac{1}{x}\\right)^2 - 2 = ${p4}^2 - 2 = ${sqVal}$।`;
        break;
      case 2:
        title = `${chTag} দ্বিঘাত সমীকরণ $x^2 - ${p1 + p2}x + ${p1 * p2} = 0$-এর মূলদ্বয়ের যোগফল কত?`;
        rawCorrect = `$${p1 + p2}$`;
        rawDistractors = [`$${p1 * p2}$`, `$-${p1 + p2}$`, `$${p1 - p2}$`];
        explanation = `মূলদ্বয়ের যোগফল $= -\\frac{b}{a} = -(-${p1 + p2}) = ${p1 + p2}$।`;
        break;
      case 3:
        title = `${chTag} সমান্তর ধারা $${p4}, ${p4 + p5}, ${p4 + 2 * p5}, \\dots$-এর ১০ম পদ কত?`;
        const ap10 = p4 + 9 * p5;
        rawCorrect = `$${ap10}$`;
        rawDistractors = [`$${ap10 + p5}$`, `$${ap10 - p5}$`, `$${p4 * 10}$`];
        explanation = `$a_{10} = a + (10 - 1)d = ${p4} + 9(${p5}) = ${ap10}$।`;
        break;
      case 4:
        title = `${chTag} বিন্দু $(0, 0)$ এবং $(${p4}, ${p5})$-এর মধ্যবর্তী দূরত্ব কত?`;
        const distP = Math.sqrt(p4 * p4 + p5 * p5).toFixed(2);
        rawCorrect = `$${distP}$`;
        rawDistractors = [`$${p4 + p5}$`, `$${(Number(distP) + 2).toFixed(2)}$`, `$${p4 * p5}$`];
        explanation = `$d = \\sqrt{(${p4}-0)^2 + (${p5}-0)^2} = \\sqrt{${p4 * p4 + p5 * p5}} \\approx ${distP}$।`;
        break;
      case 5:
        title = `${chTag} সমীকরণ $f(x) = ${p4}x^2 + ${p5}x - 1$ হলে $f'(x)$ কোনটি?`;
        rawCorrect = `$${2 * p4}x + ${p5}$`;
        rawDistractors = [`$${p4}x + ${p5}$`, `$${2 * p4}x$`, `$${2 * p4}x^2 + ${p5}$`];
        explanation = `$\\frac{d}{dx}(${p4}x^2 + ${p5}x - 1) = 2(${p4})x + ${p5} = ${2 * p4}x + ${p5}$।`;
        break;
      default:
        const gk = slot - 5;
        title = `${chTag} [সমস্যা ${slot}]: $P(x) = ${gk}x + ${p4}$ রাশিতে $x = 3$ বসালে ফলাফল কত হবে?`;
        const evalVal = gk * 3 + p4;
        rawCorrect = `$${evalVal}$`;
        rawDistractors = [`$${evalVal + 3}$`, `$${evalVal - 4}$`, `$${evalVal * 2}$`];
        explanation = `$P(3) = ${gk}(3) + ${p4} = ${gk * 3} + ${p4} = ${evalVal}$।`;
        break;
    }
  }

  return { title, rawCorrect, rawDistractors, explanation, imageUrl };
}
