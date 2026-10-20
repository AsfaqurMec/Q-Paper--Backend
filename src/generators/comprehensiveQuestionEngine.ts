/**
 * Comprehensive NCTB Question Engine
 * Produces 100% Unique, Chapter-Specific, Strictly Mathematical MCQs and CQs
 * for all 158 chapters across SSC & HSC.
 */

import { nanoid } from "nanoid";
import { type QuestionBankItemRecord, type BankSubQuestion } from "../modules/question-bank/questionBank.models.js";

export interface ChapterDef {
  number: number;
  title: string;
  domain: "math" | "physics" | "chemistry" | "ict" | "biology";
  keyConcepts: string[];
  formulas: Array<{ name: string; formula: string; unit: string }>;
  lawsAndDefs: Array<{ term: string; def: string }>;
}

export function toBn(n: number | string): string {
  const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(n).replace(/[0-9]/g, (d) => bn[Number(d)] ?? d);
}

export function stringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function classifyChapterTopic(title: string, domain: string): string {
  const t = title.toLowerCase();
  if (domain === "math") {
    if (t.includes("real number") || t.includes("বাস্তব সংখ্যা")) return "MATH_REAL_NUMBERS";
    if (t.includes("set") || t.includes("function") || t.includes("সেট") || t.includes("ফাংশন")) return "MATH_SETS";
    if (t.includes("algebraic") || t.includes("expression") || t.includes("বীজগাণিতিক")) return "MATH_ALGEBRA";
    if (t.includes("exponent") || t.includes("log") || t.includes("সূচক") || t.includes("লগ")) return "MATH_EXPONENTS";
    if (t.includes("matrix") || t.includes("determinant") || t.includes("ম্যাট্রিক্স") || t.includes("নির্ণায়ক")) return "MATH_MATRICES";
    if (t.includes("vector") || t.includes("ভেক্টর")) return "MATH_VECTORS";
    if (t.includes("straight line") || t.includes("coordinate") || t.includes("স্থানাঙ্ক") || t.includes("সরলরেখা")) return "MATH_COORDINATES";
    if (t.includes("circle") || t.includes("বৃত্ত")) return "MATH_CIRCLES";
    if (t.includes("permutation") || t.includes("combination") || t.includes("বিন্যাস") || t.includes("সমাবেশ")) return "MATH_PERMUTATIONS";
    if (t.includes("trigonometr") || t.includes("distance and elevation") || t.includes("ত্রিকোণমিতি")) return "MATH_TRIGONOMETRY";
    if (t.includes("differentiat") || t.includes("অন্তরীকরণ")) return "MATH_DIFFERENTIATION";
    if (t.includes("integrat") || t.includes("যোগজীকরণ")) return "MATH_INTEGRATION";
    if (t.includes("complex") || t.includes("জটিল সংখ্যা")) return "MATH_COMPLEX";
    if (t.includes("linear program") || t.includes("যোগাশ্রয়ী")) return "MATH_LINEAR_PROGRAMMING";
    if (t.includes("polynomial") || t.includes("বহুপদী")) return "MATH_POLYNOMIALS";
    if (t.includes("binomial") || t.includes("দ্বিপদী")) return "MATH_BINOMIAL";
    if (t.includes("conic") || t.includes("কণিক")) return "MATH_CONICS";
    if (t.includes("static") || t.includes("স্থিতিবিদ্যা")) return "MATH_STATICS";
    if (t.includes("dynamic") || t.includes("গতিবিদ্যা")) return "MATH_DYNAMICS";
    if (t.includes("statist") || t.includes("dispersion") || t.includes("পরিসংখ্যান")) return "MATH_STATISTICS";
    if (t.includes("probabilit") || t.includes("সম্ভাবনা")) return "MATH_PROBABILITY";
    if (t.includes("series") || t.includes("ধারা")) return "MATH_SERIES";
    if (t.includes("inequalit") || t.includes("অসমতা")) return "MATH_INEQUALITIES";
    if (t.includes("equation") || t.includes("সমীকরণ")) return "MATH_EQUATIONS";
    if (t.includes("mensuration") || t.includes("area") || t.includes("solid") || t.includes("পরিমিতি")) return "MATH_MENSURATION";
    if (t.includes("ratio") || t.includes("similarity") || t.includes("অনুপাত")) return "MATH_RATIO_SIMILARITY";
    if (t.includes("geometr") || t.includes("triangle") || t.includes("line") || t.includes("জ্যামিতি")) return "MATH_GEOMETRY";
    return "MATH_GENERAL";
  }
  if (domain === "physics") {
    if (t.includes("measurement") || t.includes("quantity") || t.includes("world") || t.includes("পরিমাপ")) return "PHYSICS_MEASUREMENT";
    if (t.includes("motion") || t.includes("গতি")) return "PHYSICS_MOTION";
    if (t.includes("vector") || t.includes("ভেক্টর")) return "PHYSICS_VECTORS";
    if (t.includes("force") || t.includes("newton") || t.includes("বল")) return "PHYSICS_FORCE";
    if (t.includes("dynamic") || t.includes("গতিবিদ্যা")) return "PHYSICS_DYNAMICS";
    if (t.includes("work") || t.includes("energy") || t.includes("power") || t.includes("কাজ") || t.includes("শক্তি")) return "PHYSICS_WORK_ENERGY";
    if (t.includes("gravitat") || t.includes("মহাকর্ষ")) return "PHYSICS_GRAVITATION";
    if (t.includes("matter") || t.includes("pressure") || t.includes("structural") || t.includes("পদার্থের অবস্থা") || t.includes("চাপ")) return "PHYSICS_PRESSURE_MATTER";
    if (t.includes("periodic motion") || t.includes("পর্যায়বৃত্ত")) return "PHYSICS_PERIODIC_MOTION";
    if (t.includes("heat") || t.includes("thermodynamic") || t.includes("তাপ")) return "PHYSICS_THERMODYNAMICS";
    if (t.includes("wave") || t.includes("sound") || t.includes("তরঙ্গ") || t.includes("শব্দ")) return "PHYSICS_WAVES";
    if (t.includes("gas") || t.includes("kinetic") || t.includes("গ্যাস")) return "PHYSICS_IDEAL_GAS";
    if (t.includes("reflect") || t.includes("refract") || t.includes("optics") || t.includes("আলো")) return "PHYSICS_OPTICS";
    if (t.includes("static electric") || t.includes("electrostatic") || t.includes("স্থির তড়িৎ")) return "PHYSICS_ELECTROSTATICS";
    if (t.includes("current electric") || t.includes("চল তড়িৎ")) return "PHYSICS_CURRENT";
    if (t.includes("magnetic") || t.includes("induction") || t.includes("চৌম্বক") || t.includes("আবেশ")) return "PHYSICS_MAGNETISM_AC";
    if (t.includes("modern") || t.includes("atomic") || t.includes("nuclear") || t.includes("আধুনিক পদার্থবিজ্ঞান")) return "PHYSICS_MODERN_NUCLEAR";
    if (t.includes("semiconductor") || t.includes("electronic") || t.includes("সেমিকন্ডাক্টর")) return "PHYSICS_SEMICONDUCTOR";
    if (t.includes("astronomy") || t.includes("মহাকাশ") || t.includes("জ্যোতির্বিজ্ঞান") || t.includes("save life")) return "PHYSICS_ASTRONOMY";
    return "PHYSICS_GENERAL";
  }
  if (domain === "chemistry") {
    if (t.includes("state") || t.includes("gas") || t.includes("environmental") || t.includes("পদার্থের অবস্থা") || t.includes("পরিবেশ")) return "CHEM_STATES_GASES";
    if (t.includes("structure") || t.includes("periodic") || t.includes("পরমাণুর গঠন") || t.includes("পর্যায় সারণি")) return "CHEM_STRUCTURE_PERIODIC";
    if (t.includes("bond") || t.includes("বন্ধন")) return "CHEM_BONDS";
    if (t.includes("mole") || t.includes("quantitative") || t.includes("মোল") || t.includes("পরিমাণগত")) return "CHEM_MOLE_QUANTITATIVE";
    if (t.includes("reaction") || t.includes("change") || t.includes("বিক্রিয়া") || t.includes("পরিবর্তন")) return "CHEM_REACTIONS_EQUILIBRIUM";
    if (t.includes("acid") || t.includes("base") || t.includes("এসিড") || t.includes("ক্ষার")) return "CHEM_ACID_BASE";
    if (t.includes("electrochem") || t.includes("energy") || t.includes("তড়িৎ রসায়ন")) return "CHEM_ELECTROCHEMISTRY";
    if (t.includes("organic") || t.includes("fossil") || t.includes("হাইড্রোকার্বন") || t.includes("জৈব রসায়ন")) return "CHEM_ORGANIC";
    if (t.includes("qualitative") || t.includes("গুণগত রসায়ন")) return "CHEM_QUALITATIVE";
    if (t.includes("metal") || t.includes("mineral") || t.includes("economic") || t.includes("working") || t.includes("lives") || t.includes("safe")) return "CHEM_APPLIED";
    return "CHEM_GENERAL";
  }
  if (domain === "ict") {
    if (t.includes("number system") || t.includes("digital logic") || t.includes("সংখ্যা পদ্ধতি")) return "ICT_NUMBERS_LOGIC";
    if (t.includes("communication") || t.includes("network") || t.includes("যোগাযোগ") || t.includes("নেটওয়ার্ক")) return "ICT_NETWORKING";
    if (t.includes("program") || t.includes("c ") || t.includes("প্রোগ্রামিং")) return "ICT_PROGRAMMING";
    if (t.includes("database") || t.includes("dbms") || t.includes("ডাটাবেজ")) return "ICT_DATABASE";
    if (t.includes("web") || t.includes("html") || t.includes("ওয়েব")) return "ICT_WEB_HTML";
    return "ICT_GENERAL";
  }
  if (domain === "biology") {
    if (t.includes("genetic") || t.includes("heredity") || t.includes("জিনতত্ত্ব") || t.includes("বংশগতি")) return "BIO_GENETICS";
    if (t.includes("bioenergetic") || t.includes("respiration") || t.includes("photosynthesis") || t.includes("শক্তি") || t.includes("শ্বসন") || t.includes("physiology")) return "BIO_BIOENERGETICS";
    if (t.includes("nutrition") || t.includes("digestion") || t.includes("খাদ্য") || t.includes("পরিপাক")) return "BIO_NUTRITION_DIGESTION";
    if (t.includes("circulation") || t.includes("blood") || t.includes("transport") || t.includes("রক্ত") || t.includes("সংবহন")) return "BIO_CIRCULATION";
    if (t.includes("excret") || t.includes("রেচন")) return "BIO_EXCRETION";
    if (t.includes("gas") || t.includes("breath") || t.includes("শ্বাসক্রিয়া")) return "BIO_RESPIRATION_GAS";
    if (t.includes("cell") || t.includes("division") || t.includes("কোষ") || t.includes("বিভাজন") || t.includes("tissue")) return "BIO_CELL_DIVISION";
    if (t.includes("environment") || t.includes("ecosystem") || t.includes("adaptation") || t.includes("বাস্তুতন্ত্র")) return "BIO_ECOLOGY";
    if (t.includes("biotech") || t.includes("জীবপ্রযুক্তি")) return "BIO_BIOTECH";
    if (t.includes("locomotion") || t.includes("movement") || t.includes("চলন") || t.includes("কঙ্কাল")) return "BIO_LOCOMOTION";
    if (t.includes("coordination") || t.includes("control") || t.includes("সমন্বয়")) return "BIO_COORDINATION";
    if (t.includes("reproduction") || t.includes("continuity") || t.includes("প্রজনন")) return "BIO_REPRODUCTION";
    return "BIO_GENERAL";
  }
  return "GENERAL_SCIENCE";
}

// ==========================================
// DYNAMIC SVG DIAGRAM BUILDERS
// ==========================================

export function makeTriangleSvg(base: number, height: number, hyp: number | string, angle: number = 90): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 120" width="280" height="120"><rect width="280" height="120" fill="#f8fafc" rx="8" stroke="#cbd5e1" /><polygon points="40,95 210,95 210,25" fill="#f0fdf4" stroke="#16a34a" stroke-width="2.5" /><polyline points="195,95 195,80 210,80" fill="none" stroke="#15803d" stroke-width="1.5" /><text x="120" y="112" font-size="11" font-weight="bold" fill="#15803d">b = ${base} cm</text><text x="218" y="65" font-size="11" font-weight="bold" fill="#15803d">h = ${height} cm</text><text x="105" y="55" font-size="11" font-weight="bold" fill="#047857">c = ${hyp}</text></svg>`;
}

export function makeCircleSvg(radius: number, chord: number, centerAngle: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 140" width="260" height="140"><rect width="260" height="140" fill="#f8fafc" rx="8" stroke="#cbd5e1" /><circle cx="130" cy="70" r="50" fill="#eff6ff" stroke="#2563eb" stroke-width="2" /><circle cx="130" cy="70" r="3" fill="#1e3a8a" /><line x1="130" y1="70" x2="175" y2="45" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="3,3" /><text x="145" y="55" font-size="10" font-weight="bold" fill="#1d4ed8">r = ${radius} cm</text><line x1="90" y1="95" x2="170" y2="95" stroke="#dc2626" stroke-width="2.5" /><text x="110" y="115" font-size="10" font-weight="bold" fill="#b91c1c">জ্যা = ${chord} cm</text><text x="120" y="65" font-size="9" fill="#1e40af">∠O=${centerAngle}°</text></svg>`;
}

export function makeMotionGraphSvg(vMax: number, tAcc: number, tTotal: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 120" width="280" height="120"><rect width="280" height="120" fill="#f8fafc" rx="8" stroke="#cbd5e1" /><line x1="30" y1="95" x2="255" y2="95" stroke="#334155" stroke-width="2" /><line x1="30" y1="95" x2="30" y2="15" stroke="#334155" stroke-width="2" /><text x="240" y="110" font-size="10" fill="#475569">t (s)</text><text x="10" y="25" font-size="10" fill="#475569">v</text><polygon points="30,95 110,35 200,35 240,95" fill="#e0f2fe" fill-opacity="0.6" stroke="#0284c7" stroke-width="2.5" /><line x1="30" y1="35" x2="110" y2="35" stroke="#94a3b8" stroke-dasharray="3,3" /><text x="35" y="30" font-size="10" font-weight="bold" fill="#0369a1">v = ${vMax} m/s</text><text x="105" y="108" font-size="10">t₁=${tAcc}s</text><text x="225" y="108" font-size="10">t₂=${tTotal}s</text></svg>`;
}

export function makeCircuitSvg(voltage: number, r1: number, r2: number, isParallel: boolean = false): string {
  if (isParallel) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 110" width="280" height="110"><rect width="280" height="110" fill="#f8fafc" rx="8" stroke="#cbd5e1" /><line x1="30" y1="55" x2="70" y2="55" stroke="#1e293b" stroke-width="2" /><line x1="70" y1="30" x2="70" y2="80" stroke="#1e293b" stroke-width="2" /><line x1="70" y1="30" x2="110" y2="30" stroke="#1e293b" stroke-width="2" /><rect x="110" y="22" width="60" height="16" fill="#fef08a" stroke="#ca8a04" stroke-width="2" /><text x="125" y="34" font-size="10" font-weight="bold">R₁=${r1}Ω</text><line x1="170" y1="30" x2="210" y2="30" stroke="#1e293b" stroke-width="2" /><line x1="70" y1="80" x2="110" y2="80" stroke="#1e293b" stroke-width="2" /><rect x="110" y="72" width="60" height="16" fill="#fef08a" stroke="#ca8a04" stroke-width="2" /><text x="125" y="84" font-size="10" font-weight="bold">R₂=${r2}Ω</text><line x1="170" y1="80" x2="210" y2="80" stroke="#1e293b" stroke-width="2" /><line x1="210" y1="30" x2="210" y2="80" stroke="#1e293b" stroke-width="2" /><line x1="210" y1="55" x2="250" y2="55" stroke="#1e293b" stroke-width="2" /><text x="25" y="45" font-size="10" font-weight="bold" fill="#dc2626">V=${voltage}V</text></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 90" width="280" height="90"><rect width="280" height="90" fill="#f8fafc" rx="8" stroke="#cbd5e1" /><line x1="25" y1="45" x2="65" y2="45" stroke="#1e293b" stroke-width="2" /><rect x="65" y="37" width="55" height="16" fill="#fef08a" stroke="#ca8a04" stroke-width="2" /><text x="75" y="49" font-size="10" font-weight="bold">R₁=${r1}Ω</text><line x1="120" y1="45" x2="155" y2="45" stroke="#1e293b" stroke-width="2" /><rect x="155" y="37" width="55" height="16" fill="#fef08a" stroke="#ca8a04" stroke-width="2" /><text x="165" y="49" font-size="10" font-weight="bold">R₂=${r2}Ω</text><line x1="210" y1="45" x2="255" y2="45" stroke="#1e293b" stroke-width="2" /><text x="30" y="35" font-size="10" font-weight="bold" fill="#dc2626">V = ${voltage}V</text></svg>`;
}

export function makeLogicGateSvg(gate: string, inA: number, inB: number, outVal: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 85" width="250" height="85"><rect width="250" height="85" fill="#f8fafc" rx="8" stroke="#cbd5e1" /><line x1="25" y1="28" x2="70" y2="28" stroke="#334155" stroke-width="2" /><text x="15" y="24" font-size="10" font-weight="bold">A=${inA}</text><line x1="25" y1="56" x2="70" y2="56" stroke="#334155" stroke-width="2" /><text x="15" y="66" font-size="10" font-weight="bold">B=${inB}</text><rect x="70" y="18" width="65" height="48" rx="6" fill="#e0f2fe" stroke="#0284c7" stroke-width="2" /><text x="82" y="47" font-size="11" font-weight="bold" fill="#0369a1">${gate}</text><line x1="135" y1="42" x2="180" y2="42" stroke="#334155" stroke-width="2" /><circle cx="195" cy="42" r="14" fill="#f0fdf4" stroke="#16a34a" stroke-width="2" /><text x="190" y="46" font-size="12" font-weight="bold" fill="#15803d">${outVal}</text></svg>`;
}

export function makeVennSvg(nA: number, nB: number, nInter: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 110" width="260" height="110"><rect width="260" height="110" fill="#f8fafc" rx="8" stroke="#cbd5e1" /><circle cx="105" cy="55" r="42" fill="#bfdbfe" fill-opacity="0.6" stroke="#2563eb" stroke-width="2" /><circle cx="155" cy="55" r="42" fill="#fed7aa" fill-opacity="0.6" stroke="#ea580c" stroke-width="2" /><text x="85" y="60" font-size="11" font-weight="bold" fill="#1d4ed8">${nA - nInter}</text><text x="125" y="60" font-size="11" font-weight="bold" fill="#7c2d12">${nInter}</text><text x="165" y="60" font-size="11" font-weight="bold" fill="#c2410c">${nB - nInter}</text><text x="75" y="25" font-size="10" font-weight="bold" fill="#1e40af">সেট A</text><text x="165" y="25" font-size="10" font-weight="bold" fill="#9a3412">সেট B</text></svg>`;
}

export function makeCarnotSvg(th: number, tc: number, eff: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 110" width="260" height="110"><rect width="260" height="110" fill="#f8fafc" rx="8" stroke="#cbd5e1" /><rect x="85" y="10" width="90" height="25" fill="#fee2e2" stroke="#ef4444" stroke-width="2" /><text x="98" y="27" font-size="10" font-weight="bold" fill="#b91c1c">উৎস T₁=${th}K</text><line x1="130" y1="35" x2="130" y2="45" stroke="#334155" stroke-width="2" /><circle cx="130" cy="57" r="14" fill="#f1f5f9" stroke="#0284c7" stroke-width="2" /><text x="124" y="61" font-size="10" font-weight="bold">ইঞ্জিন</text><line x1="144" y1="57" x2="185" y2="57" stroke="#16a34a" stroke-width="2" /><text x="190" y="61" font-size="10" font-weight="bold" fill="#15803d">W (η=${eff}%)</text><line x1="130" y1="71" x2="130" y2="80" stroke="#334155" stroke-width="2" /><rect x="85" y="80" width="90" height="25" fill="#e0f2fe" stroke="#0284c7" stroke-width="2" /><text x="98" y="97" font-size="10" font-weight="bold" fill="#0369a1">গ্রাহক T₂=${tc}K</text></svg>`;
}

// ==========================================
// CENTRAL QUESTION BUILDERS
// ==========================================

import { generateMathMCQ } from "./mathDomainGen.js";
import { generatePhysicsMCQ } from "./physicsDomainGen.js";
import { generateChemistryMCQ } from "./chemistryDomainGen.js";
import { generateBioIctMCQ } from "./bioIctDomainGen.js";
import { generateChapterCQ } from "./cqEngine.js";

export function buildEngineMCQ(
  chapter: ChapterDef,
  slot: number, // 1 to 50
  classCode: string,
  subCode: string,
  classId: string,
  subjectId: string,
  chapterId: string,
  className: string,
  subject: string
): QuestionBankItemRecord {
  const id = `bank_${classCode}_${subCode}_ch${chapter.number}_mcq_${slot}`;
  const diff = slot <= 15 ? "easy" : slot <= 38 ? "medium" : "hard";
  const timestamp = new Date().toISOString();
  const chFormatted = `Chapter ${chapter.number}: ${chapter.title}`;

  const topic = classifyChapterTopic(chapter.title, chapter.domain);
  const chSeed = stringHash(`${subCode}_ch${chapter.number}`);
  const seed = (chSeed + slot * 1337) >>> 0;

  const p1 = (seed % 19) + 2;
  const p2 = ((seed >> 2) % 17) + 3;
  const p3 = ((seed >> 4) % 13) + 4;
  const p4 = ((seed >> 6) % 11) + 2;
  const p5 = ((seed >> 8) % 7) + 2;

  let generated;
  if (chapter.domain === "math") {
    generated = generateMathMCQ(topic, chapter, slot, p1, p2, p3, p4, p5, subject);
  } else if (chapter.domain === "physics") {
    generated = generatePhysicsMCQ(topic, chapter, slot, p1, p2, p3, p4, p5, subject);
  } else if (chapter.domain === "chemistry") {
    generated = generateChemistryMCQ(topic, chapter, slot, p1, p2, p3, p4, p5, subject);
  } else {
    generated = generateBioIctMCQ(topic, chapter, slot, p1, p2, p3, p4, p5, subject);
  }

  // Construct options array with rotating correctIndex
  const targetIndex = slot % 4; // 0, 1, 2, 3 rotation
  const options = [...generated.rawDistractors.slice(0, 3)];
  options.splice(targetIndex, 0, generated.rawCorrect);

  return {
    id,
    ownerId: "usr_demo_teacher",
    classId,
    subjectId,
    chapterId,
    className,
    subject,
    chapter: chFormatted,
    category: subject,
    type: "mcq",
    nature: "mathematical",
    difficulty: diff,
    title: generated.title,
    imageUrl: generated.imageUrl,
    marks: 1,
    options,
    correctIndex: targetIndex,
    explanation: generated.explanation,
    tags: [className, subject, chapter.title, "MCQ", "mathematical", `Slot-${slot}`],
    usageCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function buildEngineCQ(
  chapter: ChapterDef,
  cqNum: number, // 1 to 20
  classCode: string,
  subCode: string,
  classId: string,
  subjectId: string,
  chapterId: string,
  className: string,
  subject: string
): QuestionBankItemRecord {
  const id = `bank_${classCode}_${subCode}_ch${chapter.number}_cq_${cqNum}`;
  const diff = cqNum <= 6 ? "easy" : cqNum <= 14 ? "medium" : "hard";
  const timestamp = new Date().toISOString();
  const chFormatted = `Chapter ${chapter.number}: ${chapter.title}`;

  const topic = classifyChapterTopic(chapter.title, chapter.domain);
  const chSeed = stringHash(`${subCode}_ch${chapter.number}`);
  const vA = ((chSeed + cqNum * 7) % 15) + 3;
  const vB = ((chSeed + cqNum * 11) % 13) + 4;
  const vC = ((chSeed + cqNum * 17) % 11) + 2;

  const cqPayload = generateChapterCQ(topic, chapter, cqNum, id, vA, vB, vC, subject);

  return {
    id,
    ownerId: "usr_demo_teacher",
    classId,
    subjectId,
    chapterId,
    className,
    subject,
    chapter: chFormatted,
    category: subject,
    type: "cq",
    nature: "mathematical",
    difficulty: diff,
    title: cqPayload.stem,
    imageUrl: cqPayload.imageUrl,
    marks: 10,
    options: [],
    correctIndex: 0,
    subQuestions: cqPayload.subQuestions,
    explanation: cqPayload.explanation,
    tags: [className, subject, chapter.title, "CQ", "mathematical", `CQ-${cqNum}`],
    usageCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}
