import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { env } from "./config/env.js";
import { QuestionBankItemModel, type QuestionBankItemRecord, type BankSubQuestion } from "./modules/question-bank/questionBank.models.js";
import { AcademicClassModel, SubjectModel, ChapterModel } from "./modules/curriculum/curriculum.models.js";
import { buildEngineMCQ, buildEngineCQ } from "./generators/comprehensiveQuestionEngine.js";
import { getBengaliClass, getBengaliSubject, getBengaliChapter } from "./modules/curriculum/curriculumBengali.js";

// ==========================================
// NCTB CURRICULUM DEFINITIONS (SSC & HSC)
// ==========================================

interface ChapterDef {
  number: number;
  title: string;
  domain: "math" | "physics" | "chemistry" | "ict" | "biology";
  keyConcepts: string[];
  formulas: Array<{ name: string; formula: string; unit: string }>;
  lawsAndDefs: Array<{ term: string; def: string }>;
}

interface SubjectDef {
  name: string;
  category: string;
  domain: "math" | "physics" | "chemistry" | "ict" | "biology";
  chapters: ChapterDef[];
}

interface ClassDef {
  className: string;
  subjects: SubjectDef[];
}

function formatChapterName(number: number, title: string): string {
  return `Chapter ${number}: ${title}`;
}

function toBnDigit(n: number | string): string {
  const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(n).replace(/[0-9]/g, (d) => bn[Number(d)] ?? d);
}

// ==========================================
// CURRICULUM CHAPTER DATA
// ==========================================

const sscGeneralMathChapters: ChapterDef[] = [
  { number: 1, title: "Real Numbers", domain: "math", keyConcepts: ["Rational & Irrational", "Recurring Decimals", "Absolute Value"], formulas: [{ name: "Rational", formula: "p/q", unit: "" }], lawsAndDefs: [{ term: "অমূলদ সংখ্যা", def: "যে সংখ্যাকে দুইটি পূর্ণসংখ্যার অনুপাত আকারে প্রকাশ করা যায় না।" }] },
  { number: 2, title: "Sets and Functions", domain: "math", keyConcepts: ["Power Set", "Venn Diagram", "Cartesian Product", "Function Range"], formulas: [{ name: "Power Set", formula: "2^n", unit: "" }], lawsAndDefs: [{ term: "শক্তি সেট", def: "কোনো সেটের সকল উপসেটের সেট।" }] },
  { number: 3, title: "Algebraic Expressions", domain: "math", keyConcepts: ["Square Identities", "Cube Identities", "Factorization"], formulas: [{ name: "Square", formula: "(a+b)^2", unit: "" }], lawsAndDefs: [{ term: "বীজগাণিতিক অভেদ", def: "চলকের যেকোনো বাস্তব মানের জন্য সিদ্ধ সমীকরণ।" }] },
  { number: 4, title: "Exponents and Logarithms", domain: "math", keyConcepts: ["Laws of Indices", "Common Log", "Natural Log"], formulas: [{ name: "Product Rule", formula: "\\log(ab) = \\log a + \\log b", unit: "" }], lawsAndDefs: [{ term: "লগারিদম", def: "নির্দিষ্ট ভিত্তিতে নির্দিষ্ট মান পেতে ভিত্তির প্রয়োজনীয় ঘাত।" }] },
  { number: 5, title: "Equations in One Variable", domain: "math", keyConcepts: ["Linear Equations", "Quadratic Equations", "Discriminant"], formulas: [{ name: "Discriminant", formula: "b^2 - 4ac", unit: "" }], lawsAndDefs: [{ term: "নিশ্চায়ক", def: "দ্বিঘাত সমীকরণের মূলের প্রকৃতি নির্ধারক রাশি $b^2 - 4ac$।" }] },
  { number: 6, title: "Lines, Angles and Triangles", domain: "math", keyConcepts: ["Parallel Lines", "Angle Sum 180", "Congruence"], formulas: [{ name: "Angle Sum", formula: "\\angle A + \\angle B + \\angle C = 180^\\circ", unit: "" }], lawsAndDefs: [{ term: "সর্বসমতা", def: "দুটি চিত্রের আকার ও আকৃতি হুবহু এক হওয়া।" }] },
  { number: 7, title: "Practical Geometry", domain: "math", keyConcepts: ["Triangle Constructions", "Quadrilateral Constructions"], formulas: [{ name: "Rhombus Area", formula: "1/2 d_1 d_2", unit: "" }], lawsAndDefs: [{ term: "রম্বস", def: "যে সামান্তরিকের সকল বাহু সমান কিন্তু কোণগুলো সমকোণ নয়।" }] },
  { number: 8, title: "Circle", domain: "math", keyConcepts: ["Center Angle", "Inscribed Angle", "Chord Theorem", "Tangent"], formulas: [{ name: "Central Angle", formula: "\\angle c = 2\\angle i", unit: "" }], lawsAndDefs: [{ term: "স্পর্শক", def: "বৃত্তের সাথে কেবল একটি সাধারণ বিন্দু থাকা সরলরেখা।" }] },
  { number: 9, title: "Trigonometric Ratios", domain: "math", keyConcepts: ["Sin, Cos, Tan Ratios", "Trig Identities", "Standard Angles"], formulas: [{ name: "Pythagorean Trig", formula: "\\sin^2\\theta + \\cos^2\\theta = 1", unit: "" }], lawsAndDefs: [{ term: "ত্রিকোণমিতিক অনুপাত", def: "সমকোণী ত্রিভুজের সূক্ষ্মকোণের সাপেক্ষে বাহুদ্বয়ের অনুপাত।" }] },
  { number: 10, title: "Distance and Elevation", domain: "math", keyConcepts: ["Angle of Elevation", "Angle of Depression", "Tower Height"], formulas: [{ name: "Height", formula: "h = d\\tan\\theta", unit: "m" }], lawsAndDefs: [{ term: "উন্নতি কোণ", def: "ভূ-রেখার সাপেক্ষে ঊর্ধ্বের কোনো বিন্দুর দৃষ্টি কোণ।" }] },
  { number: 11, title: "Algebraic Ratio and Proportion", domain: "math", keyConcepts: ["Continued Proportion", "Componendo and Dividendo"], formulas: [{ name: "Continued Proportion", formula: "b^2 = ac", unit: "" }], lawsAndDefs: [{ term: "যোজন-বিয়োজন", def: "সমানুপাতিক অনুপাতের উভয়পাশে লব ও হরের যোগ ও বিয়োগ।" }] },
  { number: 12, title: "Simultaneous Equations in Two Variables", domain: "math", keyConcepts: ["Substitution", "Elimination", "Cross Multiplication"], formulas: [{ name: "Cross Mult", formula: "a_1 b_2 - a_2 b_1", unit: "" }], lawsAndDefs: [{ term: "সঙ্গতিপূর্ণ জোট", def: "যে সহসমীকরণ জোটের অন্তত একটি সাধারণ সমাধান থাকে।" }] },
  { number: 13, title: "Finite Series", domain: "math", keyConcepts: ["Arithmetic Progression", "Geometric Progression", "Sum of Series"], formulas: [{ name: "AP Sum", formula: "n/2[2a+(n-1)d]", unit: "" }], lawsAndDefs: [{ term: "সমান্তর ধারা", def: "যে ধারার যেকোনো পদ ও পূর্ববর্তী পদের অন্তর সর্বদা সমান।" }] },
  { number: 14, title: "Ratio, Similarity and Symmetry", domain: "math", keyConcepts: ["Similar Triangles", "Area Ratio Theorem"], formulas: [{ name: "Area Ratio", formula: "A_1/A_2 = (s_1/s_2)^2", unit: "" }], lawsAndDefs: [{ term: "সদৃশতা", def: "দুটি বহুভুজের অনুরূপ কোণ সমান ও অনুরূপ বাহুগুলো সমানুপাতিক।" }] },
  { number: 15, title: "Area Related Theorems and Constructions", domain: "math", keyConcepts: ["Pythagorean Theorem", "Parallelogram Area"], formulas: [{ name: "Pythagoras", formula: "c^2 = a^2 + b^2", unit: "" }], lawsAndDefs: [{ term: "পিথাগোরাসের উপপাদ্য", def: "অতিভুজের বর্গ অপর দুই বাহুর বর্গের সমষ্টির সমান।" }] },
  { number: 16, title: "Mensuration", domain: "math", keyConcepts: ["Cylinder Volume", "Sphere Area", "Cone Geometry"], formulas: [{ name: "Cylinder Volume", formula: "\\pi r^2 h", unit: "" }], lawsAndDefs: [{ term: "সিলিন্ডার", def: "আয়তক্ষেত্রের বাহুকে কেন্দ্র করে ঘূর্ণনে সৃষ্ট ঘনবস্তু।" }] },
  { number: 17, title: "Statistics", domain: "math", keyConcepts: ["Mean", "Median", "Mode", "Histogram", "Ogive"], formulas: [{ name: "Mean", formula: "\\sum fx / N", unit: "" }], lawsAndDefs: [{ term: "মধ্যক", def: "মানের ক্রমানুসারে সাজানো উপাত্তের ঠিক মধ্যম মান।" }] }
];

const sscHigherMathChapters: ChapterDef[] = [
  { number: 1, title: "Set and Function", domain: "math", keyConcepts: ["Bijection", "Inverse Function", "Domain and Range"], formulas: [{ name: "Inverse", formula: "f^{-1}(x)", unit: "" }], lawsAndDefs: [{ term: "সার্বিক ফাংশন", def: "কো-ডোমেনের প্রতিটি মানের প্রাক-প্রতিচ্ছবি ডোমেনে থাকলে।" }] },
  { number: 2, title: "Algebraic Expression", domain: "math", keyConcepts: ["Symmetric Polynomials", "Partial Fractions"], formulas: [{ name: "Factor Theorem", formula: "P(a)=0", unit: "" }], lawsAndDefs: [{ term: "চক্রক্রমিক রাশি", def: "চলকগুলোকে চক্রাকারে প্রতিস্থাপন করলে রাশির মান অপরিবর্তিত থাকে।" }] },
  { number: 3, title: "Geometry", domain: "math", keyConcepts: ["Appollonius Theorem", "Ptolemy Theorem", "Euler Line"], formulas: [{ name: "Appollonius", formula: "AB^2+AC^2=2(AD^2+BD^2)", unit: "" }], lawsAndDefs: [{ term: "অ্যাপোলোনিয়াসের উপপাদ্য", def: "যেকোনো দুই বাহুর বর্গের সমষ্টি মধ্যমা ও অর্ধেকের বর্গের দ্বিগুণ।" }] },
  { number: 4, title: "Geometric Construction", domain: "math", keyConcepts: ["Incircle", "Circumcircle", "Escribed Circle"], formulas: [], lawsAndDefs: [{ term: "অন্তর্বৃত্ত", def: "ত্রিভুজের তিনটি বাহুকে অন্তস্থভাবে স্পর্শকারী বৃত্ত।" }] },
  { number: 5, title: "Equations", domain: "math", keyConcepts: ["Exponential Equations", "Simultaneous Quadratics"], formulas: [{ name: "Exponential", formula: "a^x = b", unit: "" }], lawsAndDefs: [{ term: "সূচকীয় সমীকরণ", def: "যে সমীকরণে অজ্ঞাত চলক সূচকে অবস্থান করে।" }] },
  { number: 6, title: "Inequalities", domain: "math", keyConcepts: ["Linear Inequalities", "Feasible Region"], formulas: [{ name: "Absolute Inequality", formula: "|x| < a", unit: "" }], lawsAndDefs: [{ term: "অসমতার দিক পরিবর্তন", def: "ঋণাত্মক সংখ্যা দ্বারা গুণ বা ভাগ করলে অসমতার দিক উল্টে যায়।" }] },
  { number: 7, title: "Infinite Series", domain: "math", keyConcepts: ["Sum to Infinity", "Convergence |r| < 1"], formulas: [{ name: "Infinite Sum", formula: "a/(1-r)", unit: "" }], lawsAndDefs: [{ term: "অভিসারী ধারা", def: "যে অসীম ধারার যোগফল সসীম।" }] },
  { number: 8, title: "Trigonometry", domain: "math", keyConcepts: ["Radian Measure", "Arc Length s=rθ", "Sector Area"], formulas: [{ name: "Arc Length", formula: "s = r\\theta", unit: "" }], lawsAndDefs: [{ term: "রেডিয়ান", def: "ব্যাসার্ধের সমান বৃত্তচাপ কেন্দ্রে যে কোণ ধারণ করে।" }] },
  { number: 9, title: "Exponential and Logarithmic Functions", domain: "math", keyConcepts: ["Change of Base", "Logarithmic Graphs"], formulas: [{ name: "Base Change", formula: "\\log_a b = \\log_c b / \\log_c a", unit: "" }], lawsAndDefs: [{ term: "লগ অপেক্ষক", def: "সূচকীয় ফাংশনের বিপরীত ফাংশন।" }] },
  { number: 10, title: "Binomial Expansion", domain: "math", keyConcepts: ["Pascal Triangle", "General Term Tr+1"], formulas: [{ name: "General Term", formula: "\\binom{n}{r} a^{n-r} b^r", unit: "" }], lawsAndDefs: [{ term: "দ্বিপদী বিস্তৃতি", def: "$(a+b)^n$-কে পদসমূহের সমষ্টিতে সম্প্রসারণের নিয়ম।" }] },
  { number: 11, title: "Coordinate Geometry", domain: "math", keyConcepts: ["Distance Formula", "Slope m", "Area of Polygon"], formulas: [{ name: "Distance", formula: "\\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}", unit: "" }], lawsAndDefs: [{ term: "ঢাল (Slope)", def: "$x$-অক্ষের ধনাত্মক দিকের সাথে উৎপন্ন কোণের ট্যানজেন্ট মান।" }] },
  { number: 12, title: "Planar Vector", domain: "math", keyConcepts: ["Triangle Law", "Unit Vector", "Dot Product"], formulas: [{ name: "Dot Product", formula: "a_x b_x + a_y b_y", unit: "" }], lawsAndDefs: [{ term: "একক ভেক্টর", def: "যে ভেক্টরের পরমমান এক একক।" }] },
  { number: 13, title: "Solid Geometry", domain: "math", keyConcepts: ["Euler Polyhedral Formula", "Cone Volume"], formulas: [{ name: "Euler Polyhedron", formula: "V - E + F = 2", unit: "" }], lawsAndDefs: [{ term: "অয়লারের সূত্র", def: "উত্তল বহুতলকের শীর্ষ, ধার ও তলের সম্পর্ক: $V - E + F = 2$।" }] },
  { number: 14, title: "Probability", domain: "math", keyConcepts: ["Sample Space", "Classical Probability"], formulas: [{ name: "Classical Probability", formula: "n(A)/n(S)", unit: "" }], lawsAndDefs: [{ term: "নমুনা ক্ষেত্র", def: "কোনো দৈব পরীক্ষার সকল সম্ভাব্য ফলাফলের সেট।" }] }
];

const sscPhysicsChapters: ChapterDef[] = [
  { number: 1, title: "Physical Quantities and Measurement", domain: "physics", keyConcepts: ["Vernier Caliper", "Screw Gauge", "Density"], formulas: [{ name: "Vernier Constant", formula: "s/n", unit: "mm" }], lawsAndDefs: [{ term: "মৌলিক রাশি", def: "যে সকল রাশি অন্য কোনো রাশির ওপর নির্ভর করে না।" }] },
  { number: 2, title: "Motion", domain: "physics", keyConcepts: ["Speed and Velocity", "Equations of Motion", "Free Fall"], formulas: [{ name: "Velocity", formula: "v = u + at", unit: "m/s" }], lawsAndDefs: [{ term: "ত্বরণ", def: "সময়ের সাথে বেগের পরিবর্তনের হার।" }] },
  { number: 3, title: "Force", domain: "physics", keyConcepts: ["Newton 2nd Law", "Conservation of Momentum", "Friction"], formulas: [{ name: "Force", formula: "F = ma", unit: "N" }], lawsAndDefs: [{ term: "ভরবেগের নিত্যতা", def: "বাহ্যিক বল শূন্য হলে মোট ভরবেগ সংরক্ষিত থাকে।" }] },
  { number: 4, title: "Work, Power and Energy", domain: "physics", keyConcepts: ["Kinetic Energy", "Potential Energy", "Efficiency"], formulas: [{ name: "Work", formula: "W = Fs", unit: "J" }], lawsAndDefs: [{ term: "কাজ", def: "বল ও বলের অভিমুখে স্মরণের উপাংশের গুণফল।" }] },
  { number: 5, title: "State of Matter and Pressure", domain: "physics", keyConcepts: ["Liquid Pressure", "Archimedes Principle", "Pascal Law"], formulas: [{ name: "Liquid Pressure", formula: "P = h\\rho g", unit: "Pa" }], lawsAndDefs: [{ term: "আর্কিমিডিসের নীতি", def: "নিমজ্জিত বস্তুর ওপর প্লবতা অপসারিত তরলের ওজনের সমান।" }] },
  { number: 6, title: "Effect of Heat on Matter", domain: "physics", keyConcepts: ["Specific Heat", "Calorimetry", "Temperature Scales"], formulas: [{ name: "Heat", formula: "Q = mc\\Delta\\theta", unit: "J" }], lawsAndDefs: [{ term: "আপেক্ষিক তাপ", def: "১ কেজি বস্তুর তাপমাত্রা ১ কেলভিন বাড়াতে প্রয়োজনীয় তাপ।" }] },
  { number: 7, title: "Waves and Sound", domain: "physics", keyConcepts: ["Wave Speed", "Echo Distance", "Frequency"], formulas: [{ name: "Wave Equation", formula: "v = f\\lambda", unit: "m/s" }], lawsAndDefs: [{ term: "প্রতিধ্বনি", def: "দূরবর্তী প্রতিফলক হতে প্রতিফলিত হয়ে পুনরায় শোনা শব্দ।" }] },
  { number: 8, title: "Reflection of Light", domain: "physics", keyConcepts: ["Spherical Mirror", "Mirror Formula", "Magnification"], formulas: [{ name: "Mirror Formula", formula: "1/u + 1/v = 1/f", unit: "" }], lawsAndDefs: [{ term: "প্রতিফলন কোণ", def: "প্রতিফলিত রশ্মি ও অভিলম্বের মধ্যকার কোণ।" }] },
  { number: 9, title: "Refraction of Light", domain: "physics", keyConcepts: ["Snell Law", "Critical Angle", "Total Internal Reflection"], formulas: [{ name: "Snell Law", formula: "n_1 \\sin i = n_2 \\sin r", unit: "" }], lawsAndDefs: [{ term: "ক্রান্তি কোণ", def: "যে আপতন কোণের জন্য প্রতিসরণ কোণ ৯০ ডিগ্রি হয়।" }] },
  { number: 10, title: "Static Electricity", domain: "physics", keyConcepts: ["Coulomb Law", "Electric Field", "Potential"], formulas: [{ name: "Coulomb Law", formula: "F = k q_1 q_2 / r^2", unit: "N" }], lawsAndDefs: [{ term: "কুলম্বের সূত্র", def: "বিন্দু আধানের আকর্ষণ বল দূরত্বের বর্গের ব্যস্তানুপাতিক।" }] },
  { number: 11, title: "Current Electricity", domain: "physics", keyConcepts: ["Ohm Law", "Series Parallel Resistors", "Electric Power"], formulas: [{ name: "Ohm Law", formula: "V = IR", unit: "V" }], lawsAndDefs: [{ term: "ওহমের সূত্র", def: "তড়িৎ প্রবাহ দুই প্রান্তের বিভব পার্থক্যের সমানুপাতিক।" }] },
  { number: 12, title: "Magnetic Effect of Current", domain: "physics", keyConcepts: ["Transformer Equation", "Electromagnet"], formulas: [{ name: "Transformer", formula: "V_s / V_p = N_s / N_p", unit: "" }], lawsAndDefs: [{ term: "লেঞ্জের সূত্র", def: "আবিষ্ট প্রবাহ সর্বদা তার উৎপত্তির কারণকে বাধা দেয়।" }] },
  { number: 13, title: "Modern Physics and Electronics", domain: "physics", keyConcepts: ["Radioactive Half-Life", "Semiconductors"], formulas: [{ name: "Mass Energy", formula: "E = mc^2", unit: "J" }], lawsAndDefs: [{ term: "অর্ধায়ু", def: "যে সময়ে তেজস্ক্রিয় পদার্থের পরমাণু সংখ্যা অর্ধেক হয়।" }] },
  { number: 14, title: "Physics to Save Life", domain: "physics", keyConcepts: ["X-Ray", "CT Scan", "MRI", "Ultrasonography"], formulas: [], lawsAndDefs: [{ term: "এমআরআই", def: "চৌম্বক ক্ষেত্র ও রেডিও তরঙ্গে অভ্যন্তরীণ নরম কলার ছবি।" }] }
];

const sscChemistryChapters: ChapterDef[] = [
  { number: 1, title: "Concepts of Chemistry", domain: "chemistry", keyConcepts: ["Hazard Symbols", "Green Chemistry"], formulas: [], lawsAndDefs: [{ term: "গ্রিন কেমিস্ট্রি", def: "পরিবেশবান্ধব ও কম ঝুঁকিপূর্ণ রাসায়নিক পদ্ধতি।" }] },
  { number: 2, title: "States of Matter", domain: "chemistry", keyConcepts: ["Diffusion", "Effusion", "Kinetic Theory"], formulas: [{ name: "Diffusion", formula: "r \\propto 1/\\sqrt{M}", unit: "" }], lawsAndDefs: [{ term: "ব্যাপন", def: "উচ্চ ঘনমাত্রার স্থান থেকে অণুর স্বতঃস্ফূর্ত ছড়িয়ে পড়া।" }] },
  { number: 3, title: "Structure of Matter", domain: "chemistry", keyConcepts: ["Bohr Model", "Isotopes", "Electronic Configuration"], formulas: [], lawsAndDefs: [{ term: "আইসোটোপ", def: "একই পারমাণবিক সংখ্যা বিশিষ্ট কিন্তু ভিন্ন ভরসংখ্যার পরমাণু।" }] },
  { number: 4, title: "Periodic Table", domain: "chemistry", keyConcepts: ["Modern Periodic Law", "Ionization Energy"], formulas: [], lawsAndDefs: [{ term: "আয়নীকরণ শক্তি", def: "গ্যাসীয় পরমাণু হতে ১ মোল ইলেকট্রন অপসারণে প্রয়োজনীয় শক্তি।" }] },
  { number: 5, title: "Chemical Bonds", domain: "chemistry", keyConcepts: ["Ionic Bond", "Covalent Bond", "Octet Rule"], formulas: [], lawsAndDefs: [{ term: "আয়নিক বন্ধন", def: "ইলেকট্রন আদান-প্রদানে সৃষ্ট স্থির বৈদ্যুতিক বন্ধন।" }] },
  { number: 6, title: "Concept of Mole and Chemical Calculations", domain: "chemistry", keyConcepts: ["Mole Calculation", "Molarity", "STP Volume"], formulas: [{ name: "Mole", formula: "n = w/M", unit: "mol" }], lawsAndDefs: [{ term: "মোলার দ্রবণ", def: "১ লিটার দ্রবণে ১ মোল দ্রব দ্রবীভূত থাকলে মোলার দ্রবণ বলে।" }] },
  { number: 7, title: "Chemical Reactions", domain: "chemistry", keyConcepts: ["Redox", "Exothermic Endothermic", "Reaction Rate"], formulas: [{ name: "Delta H", formula: "\\Delta H = H_p - H_r", unit: "kJ" }], lawsAndDefs: [{ term: "রেডক্স বিক্রিয়া", def: "জারণ ও বিজারণ যুগপৎ সংঘটিত হওয়ার বিক্রিয়া।" }] },
  { number: 8, title: "Chemistry and Energy", domain: "chemistry", keyConcepts: ["Bond Energy", "Electrochemical Cell"], formulas: [{ name: "Bond Energy", formula: "\\sum BE_{react} - \\sum BE_{prod}", unit: "kJ" }], lawsAndDefs: [{ term: "তড়িৎ বিশ্লেষণ", def: "গলিত তড়িৎ বিশ্লেষ্যে বিদ্যুৎ প্রবাহে রাসায়নিক বিয়োজন।" }] },
  { number: 9, title: "Acid-Base Balance", domain: "chemistry", keyConcepts: ["pH Scale", "Neutralization", "Titration"], formulas: [{ name: "pH", formula: "\\text{pH} = -\\log[H^+]", unit: "" }], lawsAndDefs: [{ term: "প্রশমন", def: "এসিড ও ক্ষারের বিক্রিয়ায় লবণ ও পানি তৈরির প্রক্রিয়া।" }] },
  { number: 10, title: "Mineral Resources: Metal-Nonmetal", domain: "chemistry", keyConcepts: ["Metallurgy", "Alloys", "Corrosion"], formulas: [], lawsAndDefs: [{ term: "ধাতু নিষ্কাশন", def: "আকরিক হতে ধাতু আলাদা করার বাণিজ্যিক প্রক্রিয়া।" }] },
  { number: 11, title: "Mineral Resources: Fossils", domain: "chemistry", keyConcepts: ["Alkanes", "Alkenes", "Polymerization"], formulas: [{ name: "Alkane", formula: "C_n H_{2n+2}", unit: "" }], lawsAndDefs: [{ term: "পলিমারকরণ", def: "মনোমার যুক্ত হয়ে বৃহৎ পলিমার গঠনের প্রক্রিয়া।" }] },
  { number: 12, title: "Chemistry in Our Lives", domain: "chemistry", keyConcepts: ["Soap Making", "Bleaching", "Vinegar"], formulas: [], lawsAndDefs: [{ term: "সাবানায়ন", def: "তেল বা চর্বির ক্ষারীয় আর্দ্রবিশ্লেষণ।" }] }
];

const sscBiologyChapters: ChapterDef[] = [
  { number: 1, title: "Lessons of Life", domain: "biology", keyConcepts: ["Binomial Nomenclature", "Five Kingdoms"], formulas: [], lawsAndDefs: [{ term: "দ্বিপদ নামকরণ", def: "গণ ও প্রজাতি পদ সহযোগে জীবের বৈজ্ঞানিক নামকরণ।" }] },
  { number: 2, title: "Cell and Tissue", domain: "biology", keyConcepts: ["Mitochondria", "Chloroplast", "Tissues"], formulas: [], lawsAndDefs: [{ term: "কোষ", def: "জীবদেহের গঠন ও কাজের মৌলিক একক।" }] },
  { number: 3, title: "Cell Division", domain: "biology", keyConcepts: ["Mitosis", "Meiosis Stages", "Chromosomes"], formulas: [], lawsAndDefs: [{ term: "মায়োসিস", def: "হ্রাসমূলক কোষ বিভাজন যেখানে ক্রোমোজোম অর্ধেক হয়।" }] },
  { number: 4, title: "Bioenergetics", domain: "biology", keyConcepts: ["Photosynthesis", "Aerobic Respiration", "ATP"], formulas: [{ name: "Respiration ATP", formula: "38 \\text{ ATP}", unit: "" }], lawsAndDefs: [{ term: "এটিপি", def: "কোষীয় শক্তি সঞ্চয়কারী প্রধান জৈব মুদ্রা।" }] },
  { number: 5, title: "Food, Nutrition and Digestion", domain: "biology", keyConcepts: ["Balanced Diet", "BMI Formula", "Enzymes"], formulas: [{ name: "BMI", formula: "W / H^2", unit: "\\text{kg/m}^2" }], lawsAndDefs: [{ term: "বিএমআই", def: "দেহের ওজন ও উচ্চতার বর্গের অনুপাত।" }] },
  { number: 6, title: "Transport in Organisms", domain: "biology", keyConcepts: ["Blood Circulation", "Transpiration", "Heart"], formulas: [{ name: "Blood Pressure", formula: "120/80\\text{ mmHg}", unit: "" }], lawsAndDefs: [{ term: "প্রস্বেদন", def: "উদ্ভিদ হতে বাষ্পাকারে পানি নির্গমনের শারীরবৃত্তীয় ক্রিয়া।" }] },
  { number: 7, title: "Exchange of Gases", domain: "biology", keyConcepts: ["Alveoli", "Oxygen Transport", "Vital Capacity"], formulas: [], lawsAndDefs: [{ term: "অ্যালভিওলাস", def: "ফুসফুসে গ্যাসীয় বিনিময়ের কার্যকরী একক।" }] },
  { number: 8, title: "Excretory System", domain: "biology", keyConcepts: ["Nephron Structure", "Dialysis", "Urine"], formulas: [{ name: "GFR", formula: "125\\text{ mL/min}", unit: "" }], lawsAndDefs: [{ term: "নেফ্রন", def: "বৃক্কের রক্ত পরিশোধনকারী গঠন ও কাজের একক।" }] },
  { number: 9, title: "Movement and Locomotion", domain: "biology", keyConcepts: ["Skeletal Joints", "Tendon & Ligament"], formulas: [], lawsAndDefs: [{ term: "টেন্ডন", def: "পেশিকে অস্থির সাথে যুক্তকারী দৃঢ় যোজক কলা।" }] },
  { number: 10, title: "Coordination in Organisms", domain: "biology", keyConcepts: ["Neuron Synapse", "Hormones", "Reflex Arc"], formulas: [], lawsAndDefs: [{ term: "প্রতিবর্ত ক্রিয়া", def: "মস্তিষ্কের নির্দেশনা ছাড়া সুষুম্নাকাণ্ডের তাৎক্ষণিক অনৈচ্ছিক সাড়া।" }] },
  { number: 11, title: "Reproduction in Organisms", domain: "biology", keyConcepts: ["Flower Parts", "Double Fertilization"], formulas: [], lawsAndDefs: [{ term: "দ্বিনিষেক", def: "সপুষ্পক উদ্ভিদে ডিম্বাণু ও গৌণ নিউক্লিয়াসের যুগপৎ নিষেক।" }] },
  { number: 12, title: "Heredity in Organisms and Evolution", domain: "biology", keyConcepts: ["Mendel Laws", "Monohybrid 3:1", "DNA"], formulas: [{ name: "Monohybrid Ratio", formula: "3 : 1", unit: "" }], lawsAndDefs: [{ term: "পৃথকীকরণ সূত্র", def: "জননকোষ সৃষ্টির সময় অ্যালিলদ্বয় পৃথক হয়ে যায়।" }] },
  { number: 13, title: "Environment of Life", domain: "biology", keyConcepts: ["Ecosystem", "Ten Percent Law", "Food Web"], formulas: [{ name: "10% Energy", formula: "0.10 \\times E", unit: "" }], lawsAndDefs: [{ term: "বাস্তুতন্ত্র", def: "জীব ও জড় উপাদানের পারস্পরিক মিথস্ক্রিয়ার ব্যবস্থা।" }] },
  { number: 14, title: "Biotechnology", domain: "biology", keyConcepts: ["Tissue Culture", "Recombinant DNA", "Plasmids"], formulas: [], lawsAndDefs: [{ term: "রিকম্বিন্যান্ট ডিএনএ", def: "ভিন্ন প্রজাতির ডিএনএ খণ্ড জোড়া লাগিয়ে গঠিত সংকর ডিএনএ।" }] }
];

const sscIctChapters: ChapterDef[] = [
  { number: 1, title: "ICT and Our Bangladesh", domain: "ict", keyConcepts: ["Smart Bangladesh", "E-Governance"], formulas: [], lawsAndDefs: [{ term: "ই-গভর্ন্যান্স", def: "সরকারি কর্মকাণ্ড ও নাগরিক সেবায় তথ্যপ্রযুক্তির প্রয়োগ।" }] },
  { number: 2, title: "Computer and User Security", domain: "ict", keyConcepts: ["Malware", "Strong Password", "Antivirus"], formulas: [], lawsAndDefs: [{ term: "কম্পিউটার ভাইরাস", def: "ক্ষতিকারক আত্মপ্রজননশীল কম্পিউটার প্রোগ্রাম।" }] },
  { number: 3, title: "My Education and the Internet", domain: "ict", keyConcepts: ["E-Books", "Online Education"], formulas: [], lawsAndDefs: [{ term: "ই-বুক", def: "মুদ্রিত বইয়ের ইলেকট্রনিক ডিজিটাল রূপান্তর।" }] },
  { number: 4, title: "Word Processing and Spreadsheets", domain: "ict", keyConcepts: ["Excel SUM Average", "Cell Referencing"], formulas: [{ name: "Excel SUM", formula: "=SUM(A1:A10)", unit: "" }], lawsAndDefs: [{ term: "স্প্রেডশিট", def: "সারি ও কলামে বিভক্ত গাণিতিক হিসাবের সফটওয়্যার।" }] },
  { number: 5, title: "Multimedia and Graphics", domain: "ict", keyConcepts: ["PowerPoint Slides", "Vector vs Raster"], formulas: [], lawsAndDefs: [{ term: "মাল্টিমিডিয়া", def: "টেক্সট, অডিও, ভিডিও ও গ্রাফিক্সের সমন্বিত মাধ্যম।" }] },
  { number: 6, title: "Database Software", domain: "ict", keyConcepts: ["Primary Key", "Query SQL", "Records"], formulas: [], lawsAndDefs: [{ term: "প্রাইমারি কি", def: "টেবিলের প্রতিটি রেকর্ডকে অনন্যভাবে শনাক্তকারী ফিল্ড।" }] }
];

const hscHigherMath1Chapters: ChapterDef[] = [
  { number: 1, title: "Matrices and Determinants", domain: "math", keyConcepts: ["Multiplication", "Determinant", "Cramer Rule"], formulas: [{ name: "Det 2x2", formula: "ad - bc", unit: "" }], lawsAndDefs: [{ term: "ব্যতিক্রমী ম্যাট্রিক্স", def: "যে ম্যাট্রিক্সের নির্ণায়কের মান শূন্য।" }] },
  { number: 2, title: "Vectors", domain: "math", keyConcepts: ["Dot Product", "Cross Product", "Unit Vector"], formulas: [{ name: "Dot Product", formula: "a_x b_x + a_y b_y + a_z b_z", unit: "" }], lawsAndDefs: [{ term: "লম্ব ভেক্টর", def: "যে দুটি ভেক্টরের ডট গুণন শূন্য।" }] },
  { number: 3, title: "Straight Lines", domain: "math", keyConcepts: ["Slope", "Distance to Line", "Perpendicular"], formulas: [{ name: "Point Distance", formula: "|Ax+By+C|/\\sqrt{A^2+B^2}", unit: "" }], lawsAndDefs: [{ term: "লম্ব রেখা শর্ত", def: "ঢালদ্বয়ের গুণফল $-1$ হলে রেখাদুটি লম্ব হয়।" }] },
  { number: 4, title: "Circles", domain: "math", keyConcepts: ["Circle Standard Equation", "Radius Formula"], formulas: [{ name: "Radius", formula: "\\sqrt{g^2+f^2-c}", unit: "" }], lawsAndDefs: [{ term: "স্পর্শকের শর্ত", def: "কেন্দ্র হতে লম্ব দূরত্ব ব্যাসার্ধের সমান হওয়া।" }] },
  { number: 5, title: "Permutations and Combinations", domain: "math", keyConcepts: ["nPr", "nCr", "Circular Permutation"], formulas: [{ name: "Permutation", formula: "n! / (n-r)!", unit: "" }], lawsAndDefs: [{ term: "বিন্যাস", def: "নির্দিষ্ট সংখ্যক বস্তু নিয়ে তৈরি ক্রমভিত্তিক বিন্যাস।" }] },
  { number: 6, title: "Trigonometric Ratios", domain: "math", keyConcepts: ["Compound Angles", "Signs in Quadrants"], formulas: [{ name: "Sin(A+B)", formula: "\\sin A\\cos B + \\cos A\\sin B", unit: "" }], lawsAndDefs: [{ term: "কোয়াড্রান্ট নিয়ম", def: "চারটি চতুর্ভাগে অনুপাতসমূহের চিহ্নের নিয়ম।" }] },
  { number: 7, title: "Combined Trigonometric Ratios", domain: "math", keyConcepts: ["Sine Rule", "Cosine Rule", "Submultiple Angles"], formulas: [{ name: "Sine Rule", formula: "a/\\sin A = b/\\sin B = 2R", unit: "" }], lawsAndDefs: [{ term: "সাইন সূত্র", def: "বাহু ও বিপরীত কোণের সাইনের অনুপাত ব্যাসের সমান।" }] },
  { number: 8, title: "Functions and Graphs of Functions", domain: "math", keyConcepts: ["Periodic Function", "Trig Period"], formulas: [{ name: "Period", formula: "2\\pi / b", unit: "" }], lawsAndDefs: [{ term: "পর্যায়বৃত্ত অপেক্ষক", def: "নির্দিষ্ট ব্যবধানে যে ফাংশনের মান পুনরাবৃত্ত হয়।" }] },
  { number: 9, title: "Differentiation", domain: "math", keyConcepts: ["Product Rule", "Chain Rule", "Critical Points"], formulas: [{ name: "Power Rule", formula: "n x^{n-1}", unit: "" }], lawsAndDefs: [{ term: "অন্তরজ", def: "স্বাধীন চলকের সাপেক্ষে পরিবর্তনের তাৎক্ষণিক হার।" }] },
  { number: 10, title: "Integration", domain: "math", keyConcepts: ["Integration by Parts", "Area Under Curve"], formulas: [{ name: "Power Integral", formula: "x^{n+1}/(n+1)", unit: "" }], lawsAndDefs: [{ term: "নির্দিষ্ট যোগজ", def: "বক্ররেখা দ্বারা আবদ্ধ ক্ষেত্রের সসীম ক্ষেত্রফল।" }] }
];

const hscHigherMath2Chapters: ChapterDef[] = [
  { number: 1, title: "Real Numbers and Inequalities", domain: "math", keyConcepts: ["Supremum", "Infimum", "Triangle Inequality"], formulas: [{ name: "Triangle Inequality", formula: "|a+b| \\le |a| + |b|", unit: "" }], lawsAndDefs: [{ term: "সুপ্রিমাম", def: "কোনো সেটের ঊর্ধ্বসীমসমূহের মধ্যে ক্ষুদ্রতম মান।" }] },
  { number: 2, title: "Linear Programming", domain: "math", keyConcepts: ["Objective Function Z", "Corner Point Method"], formulas: [{ name: "Objective Function", formula: "Z = ax + by", unit: "" }], lawsAndDefs: [{ term: "কার্যকর এলাকা", def: "সকল সীমাবদ্ধতা শর্তকে একসাথে সিদ্ধকারী অঞ্চল।" }] },
  { number: 3, title: "Complex Numbers", domain: "math", keyConcepts: ["Argand Diagram", "Modulus & Argument", "De Moivre"], formulas: [{ name: "Cube Roots Unity", formula: "1 + \\omega + \\omega^2 = 0", unit: "" }], lawsAndDefs: [{ term: "ডি ময়েভরের উপপাদ্য", def: "$(\\cos\\theta+i\\sin\\theta)^n = \\cos n\\theta+i\\sin n\\theta$।" }] },
  { number: 4, title: "Polynomials and Polynomial Equations", domain: "math", keyConcepts: ["Vieta Roots", "Quadratic & Cubic Relations"], formulas: [{ name: "Vieta Sum", formula: "-b/a", unit: "" }], lawsAndDefs: [{ term: "ভিয়েতার সম্পর্ক", def: "মূলসমূহ ও সহগসমূহের মধ্যকার সম্পর্ক।" }] },
  { number: 5, title: "Binomial Expansion", domain: "math", keyConcepts: ["Fractional Indices", "Convergence |x| < 1"], formulas: [{ name: "Infinite Binomial", formula: "1 + nx + \\dots", unit: "" }], lawsAndDefs: [{ term: "অভিসারিতা", def: "ভগ্নাংশ ঘাতের বিস্তৃতি কেবল $|x|<1$ এর জন্য বৈধ।" }] },
  { number: 6, title: "Conics", domain: "math", keyConcepts: ["Parabola y^2=4ax", "Ellipse e<1", "Hyperbola e>1"], formulas: [{ name: "Parabola", formula: "y^2 = 4ax", unit: "" }], lawsAndDefs: [{ term: "উৎকেন্দ্রিকতা", def: "উপকেন্দ্র ও দিকাক্ষ হতে দূরত্বের অনুপাত।" }] },
  { number: 7, title: "Inverse Trigonometric Functions and Equations", domain: "math", keyConcepts: ["Principal Value", "General Solution"], formulas: [{ name: "Tan Inverse", formula: "\\tan^{-1}x + \\tan^{-1}y", unit: "" }], lawsAndDefs: [{ term: "প্রধান মান", def: "বিপরীত ফাংশনের প্রধান সীমার ভেতরের মান।" }] },
  { number: 8, title: "Statics", domain: "math", keyConcepts: ["Resultant Forces", "Lami Theorem"], formulas: [{ name: "Lami", formula: "P/\\sin\\alpha = Q/\\sin\\beta", unit: "" }], lawsAndDefs: [{ term: "লামির উপপাদ্য", def: "সাম্যাবস্থায় প্রতিটি বল অপর দুই বলের কোণের সাইনের সমানুপাতিক।" }] },
  { number: 9, title: "Dynamics of a Particle", domain: "math", keyConcepts: ["Rectilinear Motion", "Restitution Coefficient e"], formulas: [{ name: "Restitution", formula: "e = (v_2-v_1)/(u_1-u_2)", unit: "" }], lawsAndDefs: [{ term: "স্থিতিস্থাপকতা গুণাঙ্ক", def: "আপেক্ষিক অপসরণ বেগ ও আগমন বেগের অনুপাত।" }] },
  { number: 10, title: "Measures of Dispersion and Probability", domain: "math", keyConcepts: ["Standard Deviation", "Coefficient of Variation"], formulas: [{ name: "CV", formula: "(\\sigma / \\bar{x}) \\times 100\\%", unit: "" }], lawsAndDefs: [{ term: "পরিমিত ব্যবধান", def: "গড় হতে বিচ্যুতির বর্গের গড়ের বর্গমূল।" }] }
];

const hscPhysics1Chapters: ChapterDef[] = [
  { number: 1, title: "Physical World and Measurement", domain: "physics", keyConcepts: ["Dimensional Analysis", "Percentage Error"], formulas: [{ name: "Error", formula: "\\Delta x / x \\times 100\\%", unit: "" }], lawsAndDefs: [{ term: "মাত্রিক সমজাতীয়তা", def: "সমীকরণের প্রতিটি পদের মাত্রা এক হওয়া।" }] },
  { number: 2, title: "Vectors", domain: "physics", keyConcepts: ["Dot Product", "Cross Product", "River Crossing"], formulas: [{ name: "Cross Product", formula: "AB\\sin\\theta", unit: "" }], lawsAndDefs: [{ term: "সোলেনয়ডাল ভেক্টর", def: "যে ভেক্টরের ডাইভারজেন্স শূন্য।" }] },
  { number: 3, title: "Dynamics", domain: "physics", keyConcepts: ["Projectile Motion", "Banking Angle"], formulas: [{ name: "Banking", formula: "\\tan\\theta = v^2/(rg)", unit: "" }], lawsAndDefs: [{ term: "প্রাস", def: "অনুভূমিকের সাথে তির্যকভাবে নিক্ষিপ্ত বস্তু।" }] },
  { number: 4, title: "Newtonian Mechanics", domain: "physics", keyConcepts: ["Torque", "Moment of Inertia", "Angular Momentum"], formulas: [{ name: "Torque", formula: "I\\alpha", unit: "" }], lawsAndDefs: [{ term: "কৌণিক ভরবেগ সংরক্ষণ", def: "বাহ্যিক টর্ক না থাকলে মোট কৌণিক ভরবেগ ধ্রুব থাকে।" }] },
  { number: 5, title: "Work, Energy and Power", domain: "physics", keyConcepts: ["Spring Potential Energy", "Work-Energy Theorem"], formulas: [{ name: "Spring", formula: "1/2 k x^2", unit: "" }], lawsAndDefs: [{ term: "কাজ-শক্তি উপপাদ্য", def: "কৃতকাজ গতিশক্তির পরিবর্তনের সমান।" }] },
  { number: 6, title: "Gravitation and Gravity", domain: "physics", keyConcepts: ["Escape Velocity", "Kepler 3rd Law"], formulas: [{ name: "Escape", formula: "\\sqrt{2gR}", unit: "m/s" }], lawsAndDefs: [{ term: "মুক্তিবেগ", def: "যে বেগে নিক্ষেপ করলে বস্তু মহাকর্ষ কাটিয়ে যায়।" }] },
  { number: 7, title: "Structural Properties of Matter", domain: "physics", keyConcepts: ["Young Modulus", "Surface Tension", "Stokes Law"], formulas: [{ name: "Young", formula: "FL / (A\\Delta L)", unit: "" }], lawsAndDefs: [{ term: "পৃষ্ঠটান", def: "তরলের মুক্তপৃষ্ঠের একক দৈর্ঘ্যে প্রযুক্ত বল।" }] },
  { number: 8, title: "Periodic Motion", domain: "physics", keyConcepts: ["Simple Pendulum", "SHM Energy"], formulas: [{ name: "Pendulum", formula: "2\\pi\\sqrt{L/g}", unit: "s" }], lawsAndDefs: [{ term: "সরল ছন্দিত স্পন্দন", def: "যে গতিতে ত্বরণ সরণের সমানুপাতিক ও বিপরীত।" }] },
  { number: 9, title: "Waves", domain: "physics", keyConcepts: ["Progressive Wave", "Doppler Effect", "Beats"], formulas: [{ name: "Beats", formula: "|f_1 - f_2|", unit: "Hz" }], lawsAndDefs: [{ term: "ডপলার ক্রিয়া", def: "আপেক্ষিক গতির জন্য আপাত কম্পাঙ্কের পরিবর্তন।" }] },
  { number: 10, title: "Ideal Gas and Kinetic Theory", domain: "physics", keyConcepts: ["Ideal Gas Law", "RMS Speed", "Boyle Law"], formulas: [{ name: "RMS", formula: "\\sqrt{3RT/M}", unit: "m/s" }], lawsAndDefs: [{ term: "বয়েলের সূত্র", def: "স্থির তাপমাত্রায় আয়তন চাপের ব্যস্তানুপাতিক।" }] }
];

const hscPhysics2Chapters: ChapterDef[] = [
  { number: 1, title: "Thermodynamics", domain: "physics", keyConcepts: ["First Law", "Carnot Engine", "Entropy"], formulas: [{ name: "Carnot", formula: "1 - T_2/T_1", unit: "" }], lawsAndDefs: [{ term: "এন্ট্রপি", def: "ব্যবস্থার তাপীয় বিশৃঙ্খলার পরিমাপ।" }] },
  { number: 2, title: "Electrostatics", domain: "physics", keyConcepts: ["Gauss Law", "Capacitor Energy"], formulas: [{ name: "Capacitor Energy", formula: "1/2 C V^2", unit: "J" }], lawsAndDefs: [{ term: "গাউসের সূত্র", def: "আবদ্ধ তলের মোট ফ্লাক্স চার্জের $1/\\varepsilon_0$ গুণ।" }] },
  { number: 3, title: "Current Electricity", domain: "physics", keyConcepts: ["Kirchhoff Laws", "Wheatstone Bridge"], formulas: [{ name: "Wheatstone", formula: "P/Q = R/S", unit: "" }], lawsAndDefs: [{ term: "কার্শফের সূত্র", def: "সংযোগ বিন্দুতে সকল প্রবাহের বীজগাণিতিক যোগ শূন্য।" }] },
  { number: 4, title: "Magnetic Effects of Current", domain: "physics", keyConcepts: ["Lorentz Force", "Shunt Resistance"], formulas: [{ name: "Shunt", formula: "I_g R_g / (I - I_g)", unit: "" }], lawsAndDefs: [{ term: "বায়োট-স্যাভার্ট", def: "তড়িৎ পরিবাহীর অংশে উৎপন্ন চৌম্বক ক্ষেত্র।" }] },
  { number: 5, title: "Electromagnetic Induction and AC", domain: "physics", keyConcepts: ["RMS Voltage", "Resonant Frequency"], formulas: [{ name: "Resonance", formula: "1/(2\\pi\\sqrt{LC})", unit: "Hz" }], lawsAndDefs: [{ term: "লেঞ্জের সূত্র", def: "আবিষ্ট প্রবাহ সৃষ্টির কারণকে বাধা দেয়।" }] },
  { number: 6, title: "Geometrical Optics", domain: "physics", keyConcepts: ["Lens Maker Formula", "Compound Microscope"], formulas: [{ name: "Lens Maker", formula: "(n-1)(1/R_1 - 1/R_2)", unit: "" }], lawsAndDefs: [{ term: "লেন্স মেকার সূত্র", def: "বক্রতার ব্যাসার্ধ ও প্রতিসরাঙ্কে ফোকাস দূরত্বের সূত্র।" }] },
  { number: 7, title: "Physical Optics", domain: "physics", keyConcepts: ["Double Slit Fringe", "Diffraction Grating"], formulas: [{ name: "Fringe Width", formula: "\\lambda D / d", unit: "m" }], lawsAndDefs: [{ term: "ব্যতিচার", def: "সুসংগত তরঙ্গের উপরিপাতনে তীব্রতার পুনর্বণ্টন।" }] },
  { number: 8, title: "Introduction to Modern Physics", domain: "physics", keyConcepts: ["Time Dilation", "Photoelectric Effect"], formulas: [{ name: "Photoelectric", formula: "hf = W_0 + E_k", unit: "J" }], lawsAndDefs: [{ term: "আলোক-তড়িৎ ক্রিয়া", def: "উপযুক্ত আলোতে ধাতু হতে ইলেকট্রন নির্গমন।" }] },
  { number: 9, title: "Atomic Model and Nuclear Physics", domain: "physics", keyConcepts: ["Binding Energy", "Rydberg Formula"], formulas: [{ name: "Binding Energy", formula: "\\Delta m \\times 931.5", unit: "MeV" }], lawsAndDefs: [{ term: "ভর ত্রুটি", def: "নিউক্লিয়াসের কণিকাসমূহের মোট ভর ও প্রকৃত ভরের বিয়োগফল।" }] },
  { number: 10, title: "Semiconductor and Electronics", domain: "physics", keyConcepts: ["Transistor Amplification", "Current Gain Beta"], formulas: [{ name: "Beta", formula: "I_C / I_B", unit: "" }], lawsAndDefs: [{ term: "ট্রানজিস্টর প্রবাহ লাভ", def: "সংগ্রাহক প্রবাহ ও পিঠ প্রবাহের অনুপাত।" }] },
  { number: 11, title: "Astronomy", domain: "physics", keyConcepts: ["Hubble Law", "Schwarzschild Radius"], formulas: [{ name: "Hubble", formula: "v = H_0 d", unit: "km/s" }], lawsAndDefs: [{ term: "হাবলের সূত্র", def: "ছায়াপথের অপসারণ বেগ আমাদের হতে দূরত্বের সমানুপাতিক।" }] }
];

const hscChemistry1Chapters: ChapterDef[] = [
  { number: 1, title: "Safe Use of Laboratory", domain: "chemistry", keyConcepts: ["Hazard Symbols", "Green Chemistry"], formulas: [], lawsAndDefs: [{ term: "গ্রিন কেমিস্ট্রি", def: "পরিবেশবান্ধব ও কম ঝুঁকিপূর্ণ রাসায়নিক পদ্ধতি।" }] },
  { number: 2, title: "Qualitative Chemistry", domain: "chemistry", keyConcepts: ["Quantum Numbers", "Solubility Product Ksp"], formulas: [{ name: "Ksp", formula: "[A]^m [B]^n", unit: "" }], lawsAndDefs: [{ term: "দ্রাব্যতা গুণফল", def: "স্বল্প দ্রাব্য লবণের সম্পৃক্ত দ্রবণে আয়নসমূহের গুণফল।" }] },
  { number: 3, title: "Periodic Properties and Chemical Bonds", domain: "chemistry", keyConcepts: ["Hybridization", "VSEPR Geometry"], formulas: [], lawsAndDefs: [{ term: "সংকরায়ন", def: "পারমাণবিক অরবিটালের মিশ্রণে সমশক্তির নতুন অরবিটাল সৃষ্টি।" }] },
  { number: 4, title: "Chemical Changes", domain: "chemistry", keyConcepts: ["Equilibrium Kp Kc", "Henderson Equation"], formulas: [{ name: "Henderson", formula: "\\text{p}K_a + \\log([\\text{Salt}]/[\\text{Acid}])", unit: "" }], lawsAndDefs: [{ term: "লা শাতেলিয়ের নীতি", def: "সাম্যাবস্থায় নিয়ামক পরিবর্তনে সাম্যের সরণ।" }] },
  { number: 5, title: "Working Chemistry", domain: "chemistry", keyConcepts: ["Food Preservation", "Vinegar"], formulas: [], lawsAndDefs: [{ term: "ভিনেগার", def: "অ্যাসিটিক এসিডের ৪% হতে ১০% জলীয় দ্রবণ।" }] }
];

const hscChemistry2Chapters: ChapterDef[] = [
  { number: 1, title: "Environmental Chemistry", domain: "chemistry", keyConcepts: ["Gas Laws", "Dalton Partial Pressure", "BOD COD"], formulas: [{ name: "Dalton", formula: "X_i P_{\\text{total}}", unit: "atm" }], lawsAndDefs: [{ term: "ডাল্টনের সূত্র", def: "গ্যাস মিশ্রণের মোট চাপ উপাদান গ্যাসের আংশিক চাপের সমষ্টি।" }] },
  { number: 2, title: "Organic Chemistry", domain: "chemistry", keyConcepts: ["Electrophiles", "Isomerism", "Polymers"], formulas: [], lawsAndDefs: [{ term: "সমানুতা", def: "একই আণবিক সংকেত বিশিষ্ট কিন্তু ভিন্ন গঠনের যৌগ।" }] },
  { number: 3, title: "Quantitative Chemistry", domain: "chemistry", keyConcepts: ["Titration", "Beer-Lambert Law"], formulas: [{ name: "Beer-Lambert", formula: "A = \\varepsilon c l", unit: "" }], lawsAndDefs: [{ term: "বিয়ার-ল্যাম্বার্ট সূত্র", def: "দ্রবণের আলোক শোষণ ঘনমাত্রা ও দৈর্ঘ্যের সমানুপাতিক।" }] },
  { number: 4, title: "Electrochemistry", domain: "chemistry", keyConcepts: ["Faraday 1st Law", "Nernst Equation"], formulas: [{ name: "Faraday", formula: "W = ZIt", unit: "g" }], lawsAndDefs: [{ term: "ফ্যারাডের সূত্র", def: "তড়িৎদ্বারে সঞ্চিত ভর মোট চার্জের সমানুপাতিক।" }] },
  { number: 5, title: "Economic Chemistry", domain: "chemistry", keyConcepts: ["Urea Fertilizer", "Effluent Plant ETP"], formulas: [], lawsAndDefs: [{ term: "ইটিপি", def: "কারখানার ক্ষতিকর তরল বর্জ্য পরিশোধনে ব্যবহৃত ব্যবস্থা।" }] }
];

const hscBotanyChapters: ChapterDef[] = [
  { number: 1, title: "Cell and its Structure", domain: "biology", keyConcepts: ["Fluid Mosaic Model", "DNA RNA"], formulas: [], lawsAndDefs: [{ term: "ফ্লুইড মোজাইক", def: "কোষঝিল্লির দ্বিস্তরীয় লিপিড মডেল।" }] },
  { number: 2, title: "Cell Division", domain: "biology", keyConcepts: ["Crossing Over", "Meiosis Stages"], formulas: [], lawsAndDefs: [{ term: "ক্রসিং ওভার", def: "নন-সিস্টার ক্রোমাটিডের মধ্যকার অংশের বিনিময়।" }] },
  { number: 3, title: "Cell Chemistry", domain: "biology", keyConcepts: ["Enzyme Kinetics", "Proteins"], formulas: [], lawsAndDefs: [{ term: "এনজাইম", def: "প্রোটিনধর্মী জৈব অনুঘটক।" }] },
  { number: 4, title: "Microorganisms", domain: "biology", keyConcepts: ["Bacteriophage", "Bacteria"], formulas: [], lawsAndDefs: [{ term: "ব্যাকটেরিওফাজ", def: "ব্যাকটেরিয়া ধ্বংসকারী ভাইরাস।" }] },
  { number: 5, title: "Algae and Fungi", domain: "biology", keyConcepts: ["Ulothrix", "Lichen"], formulas: [], lawsAndDefs: [{ term: "লাইকেন", def: "শৈবাল ও ছত্রাকের মিথোজীবী সহাবস্থান।" }] },
  { number: 6, title: "Bryophyta and Pteridophyta", domain: "biology", keyConcepts: ["Alternation of Generations"], formulas: [], lawsAndDefs: [{ term: "জনুক্রম", def: "হ্যাপ্লয়েড ও ডিপ্লয়েড দশার পর্যায়ক্রমিক আবর্তন।" }] },
  { number: 7, title: "Gymnosperms and Angiosperms", domain: "biology", keyConcepts: ["Cycas", "Floral Formula"], formulas: [], lawsAndDefs: [{ term: "পুষ্পপ্রতীক", def: "পুষ্পের বিভিন্ন স্তবকের অবস্থান নির্দেশক চিত্র।" }] },
  { number: 8, title: "Tissue and Tissue System", domain: "biology", keyConcepts: ["Vascular Bundle", "Stomata"], formulas: [], lawsAndDefs: [{ term: "সংবহন বান্ডল", def: "জাইলেম ও ফ্লোয়েম সমন্বিত পরিবহন কলা।" }] },
  { number: 9, title: "Plant Physiology", domain: "biology", keyConcepts: ["C3 C4 Photosynthesis", "ATP Yield"], formulas: [{ name: "Aerobic ATP", formula: "38 \\text{ ATP}", unit: "" }], lawsAndDefs: [{ term: "কেলভিন চক্র", def: "আলোক নিরপেক্ষ পর্যায়ে কার্বন বিজারণ চক্র।" }] },
  { number: 10, title: "Plant Reproduction", domain: "biology", keyConcepts: ["Double Fertilization", "Apomixis"], formulas: [], lawsAndDefs: [{ term: "দ্বিনিষেক", def: "ডিম্বাণু ও গৌণ নিউক্লিয়াসের যুগপৎ মিলন।" }] },
  { number: 11, title: "Biotechnology", domain: "biology", keyConcepts: ["Tissue Culture", "Totipotency"], formulas: [], lawsAndDefs: [{ term: "টটিপোটেন্সি", def: "একটি জীবন্ত উদ্ভিদ কোষ হতে পূর্ণ উদ্ভিদ সৃষ্টির ক্ষমতা।" }] },
  { number: 12, title: "Environment, Adaptation and Conservation", domain: "biology", keyConcepts: ["Halophytes", "Biodiversity"], formulas: [], lawsAndDefs: [{ term: "ম্যানগ্রোভ", def: "লবণাক্ত অঞ্চলের শ্বাসমূলীয় উদ্ভিদ।" }] }
];

const hscZoologyChapters: ChapterDef[] = [
  { number: 1, title: "Animal Diversity and Classification", domain: "biology", keyConcepts: ["Coelom", "Symmetry"], formulas: [], lawsAndDefs: [{ term: "সিলোম", def: "পেরিটোনিয়াম আবৃত মেসোডার্মাল দেহগহ্বর।" }] },
  { number: 2, title: "Introduction to Animal Types", domain: "biology", keyConcepts: ["Hydra Nematocyst"], formulas: [], lawsAndDefs: [{ term: "নেমাটোসিস্ট", def: "হাইড্রার শিকার ধরার দংশক অঙ্গাণু।" }] },
  { number: 3, title: "Human Physiology: Digestion and Absorption", domain: "biology", keyConcepts: ["Digestive Enzymes", "Villi"], formulas: [], lawsAndDefs: [{ term: "পরিপাক", def: "জটিল খাদ্য ভেঙে শোষণযোগ্য করার প্রক্রিয়া।" }] },
  { number: 4, title: "Human Physiology: Circulation and Blood", domain: "biology", keyConcepts: ["Cardiac Cycle", "Blood Group"], formulas: [{ name: "Cardiac Output", formula: "SV \\times HR", unit: "" }], lawsAndDefs: [{ term: "কার্ডিয়াক চক্র", def: "হৃদপিণ্ডের নিলয় ও অলিন্দের সংকোচন-প্রসারণ চক্র।" }] },
  { number: 5, title: "Human Physiology: Breathing and Gas Exchange", domain: "biology", keyConcepts: ["Oxyhemoglobin", "Tidal Volume"], formulas: [], lawsAndDefs: [{ term: "অক্সিহিমোগ্লোবিন", def: "অক্সিজেন ও হিমোগ্লোবিনের অস্থায়ী যৌগ।" }] },
  { number: 6, title: "Human Physiology: Excretion and Elimination", domain: "biology", keyConcepts: ["Ultrafiltration", "Nephron"], formulas: [], lawsAndDefs: [{ term: "অতিপরিস্রাবণ", def: "গ্লোমেরুলাসে উচ্চ চাপে রক্তের পরিস্রাবণ।" }] },
  { number: 7, title: "Human Physiology: Locomotion and Movement", domain: "biology", keyConcepts: ["Sliding Filament Theory"], formulas: [], lawsAndDefs: [{ term: "পেশি সংকোচন", def: "অ্যাক্টিন ও মায়োসিন সূত্রের পিছলে যাওয়া।" }] },
  { number: 8, title: "Human Physiology: Coordination and Control", domain: "biology", keyConcepts: ["Synapse Transmission"], formulas: [], lawsAndDefs: [{ term: "সিন্যাপ্স", def: "দুটি নিউরনের মধ্যবর্তী স্নায়ু সংযোগস্থল।" }] },
  { number: 9, title: "Human Physiology: Continuity of Life", domain: "biology", keyConcepts: ["Implantation", "Cleavage"], formulas: [], lawsAndDefs: [{ term: "ইমপ্লান্টেশন", def: "জরায়ুর গায়ে ব্লাস্টোসিস্টের সংস্থাপন।" }] },
  { number: 10, title: "Human Defense and Immunity", domain: "biology", keyConcepts: ["Antibody Structure", "Vaccines"], formulas: [], lawsAndDefs: [{ term: "অ্যান্টিবডি", def: "অ্যান্টিজেনের বিরুদ্ধে তৈরি প্রতিরক্ষামূলক প্রোটিন।" }] },
  { number: 11, title: "Genetics and Evolution", domain: "biology", keyConcepts: ["Hardy-Weinberg Principle"], formulas: [{ name: "Hardy-Weinberg", formula: "p^2 + 2pq + q^2 = 1", unit: "" }], lawsAndDefs: [{ term: "হার্ডি-ওয়াইনবার্গ", def: "আদর্শ অবস্থায় পপুলেশনে জিন ফ্রিকোয়েন্সি অপরিবর্তিত থাকে।" }] },
  { number: 12, title: "Animal Behavior", domain: "biology", keyConcepts: ["Innate Behavior", "FAP"], formulas: [], lawsAndDefs: [{ term: "সহজাত আচরণ", def: "অভিজ্ঞতা ছাড়া জিন নিয়ন্ত্রিত প্রাকৃতিক আচরণ।" }] }
];

const hscIctChapters: ChapterDef[] = [
  { number: 1, title: "ICT: World and Bangladesh Perspective", domain: "ict", keyConcepts: ["Global Village", "VR AI"], formulas: [], lawsAndDefs: [{ term: "গ্লোবাল ভিলেজ", def: "ইলেকট্রনিক যোগাযোগে সমগ্র বিশ্ব একটি গ্রাম।" }] },
  { number: 2, title: "Communication Systems and Networking", domain: "ict", keyConcepts: ["Bandwidth BPS", "Topology"], formulas: [{ name: "Data Rate", formula: "\\text{Bits} / \\text{Seconds}", unit: "bps" }], lawsAndDefs: [{ term: "ব্যান্ডউইথ", def: "একক সময়ে স্থানান্তরিত ডেটার হার।" }] },
  { number: 3, title: "Number Systems and Digital Logic", domain: "ict", keyConcepts: ["Binary Octal Hex", "Two's Complement", "Universal Gates"], formulas: [{ name: "2s Complement", formula: "\\text{1s Comp} + 1", unit: "" }], lawsAndDefs: [{ term: "সার্বজনীন গেট", def: "NAND বা NOR গেট যা দিয়ে সব গেট তৈরি করা যায়।" }] },
  { number: 4, title: "Introduction to Web Design and HTML", domain: "ict", keyConcepts: ["HTML Hyperlinks", "CSS"], formulas: [], lawsAndDefs: [{ term: "এইচটিএমএল", def: "ওয়েবপেজের গঠন নির্ধারণের স্ট্যান্ডার্ড ভাষা।" }] },
  { number: 5, title: "Programming Language (C Programming)", domain: "ict", keyConcepts: ["C Loops", "Algorithm", "Conditionals"], formulas: [], lawsAndDefs: [{ term: "অ্যালগরিদম", def: "সমস্যা সমাধানের ধারাবাহিক লিখিত নিয়ম।" }] },
  { number: 6, title: "Database Management System", domain: "ict", keyConcepts: ["Primary Key", "RDBMS Queries"], formulas: [], lawsAndDefs: [{ term: "রিলেশনাল ডাটাবেজ", def: "পরস্পর সম্পর্কিত একাধিক টেবিলের তথ্যভাণ্ডার।" }] }
];

export const ALL_CLASSES: ClassDef[] = [
  {
    className: "SSC (Class 9-10)",
    subjects: [
      { name: "General Mathematics", category: "General Mathematics", domain: "math", chapters: sscGeneralMathChapters },
      { name: "Higher Mathematics", category: "Higher Mathematics", domain: "math", chapters: sscHigherMathChapters },
      { name: "Physics", category: "Physics", domain: "physics", chapters: sscPhysicsChapters },
      { name: "Chemistry", category: "Chemistry", domain: "chemistry", chapters: sscChemistryChapters },
      { name: "Biology", category: "Biology", domain: "biology", chapters: sscBiologyChapters },
      { name: "ICT", category: "ICT", domain: "ict", chapters: sscIctChapters }
    ]
  },
  {
    className: "HSC (Class 11-12)",
    subjects: [
      { name: "Higher Mathematics 1st Paper", category: "Higher Mathematics", domain: "math", chapters: hscHigherMath1Chapters },
      { name: "Higher Mathematics 2nd Paper", category: "Higher Mathematics", domain: "math", chapters: hscHigherMath2Chapters },
      { name: "Physics 1st Paper", category: "Physics", domain: "physics", chapters: hscPhysics1Chapters },
      { name: "Physics 2nd Paper", category: "Physics", domain: "physics", chapters: hscPhysics2Chapters },
      { name: "Chemistry 1st Paper", category: "Chemistry", domain: "chemistry", chapters: hscChemistry1Chapters },
      { name: "Chemistry 2nd Paper", category: "Chemistry", domain: "chemistry", chapters: hscChemistry2Chapters },
      { name: "Biology 1st Paper (Botany)", category: "Biology", domain: "biology", chapters: hscBotanyChapters },
      { name: "Biology 2nd Paper (Zoology)", category: "Biology", domain: "biology", chapters: hscZoologyChapters },
      { name: "ICT", category: "ICT", domain: "ict", chapters: hscIctChapters }
    ]
  }
];

// ==========================================
// DYNAMIC ZERO-DUPLICATE QUESTION BUILDERS
// ==========================================

export function buildUniqueMCQ(
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
  const chFormatted = formatChapterName(chapter.number, chapter.title);

  let title = "";
  let rawCorrect = "";
  let rawDistractors: string[] = [];
  let explanation = "";
  let imageUrl: string | undefined = undefined;

  // Derive unique deterministic parameters for this exact slot
  const p1 = slot * 2 + 1;
  const p2 = slot + 3;
  const p3 = slot * 3 + 2;
  const p4 = (slot % 7) + 2;
  const p5 = (slot % 5) + 3;

  if (chapter.domain === "math") {
    // 50 UNIQUE MATHEMATICAL MCQs
    switch (slot) {
      case 1:
        title = `"${chapter.title}" অধ্যায়ে নিচের কোন উক্তিটি সর্বদাই সত্য?`;
        rawCorrect = `বাস্তব ক্ষেত্রে প্রতিটি গাণিতিক সিদ্ধান্ত প্রমিত শতসিদ্ধ ও উপপাদ্য দ্বারা সুরক্ষিত।`;
        rawDistractors = [
          `চলকের সকল মানে সমীকরণের ফলাফল স্বয়ংক্রিয়ভাবে শূন্য হয়ে যায়।`,
          `শুধুমাত্র ঋণাত্মক পূর্ণসংখ্যার জন্য গাণিতিক সূত্রাবলী প্রযোজ্য।`,
          `কোনো সমীকরণেরই বাস্তব সমাধানের অস্তিত্ব থাকে না।`
        ];
        explanation = `${chapter.title} অধ্যায়ে গাণিতিক উপপাদ্যসমূহ যুক্তিনির্ভর এবং সার্বজনীন।`;
        break;
      case 2:
        title = `যদি $x + \\frac{1}{x} = ${p4}$ হয়, তবে $x^2 + \\frac{1}{x^2}$-এর মান কত?`;
        rawCorrect = `$${p4 * p4 - 2}$`;
        rawDistractors = [`$${p4 * p4}$`, `$${p4 * p4 + 2}$`, `$${p4 * 2}$`];
        explanation = `$x^2 + \\frac{1}{x^2} = \\left(x + \\frac{1}{x}\\right)^2 - 2 = ${p4}^2 - 2 = ${p4 * p4 - 2}$।`;
        break;
      case 3:
        title = `যদি $x + \\frac{1}{x} = ${p4}$ হয়, তবে $x^3 + \\frac{1}{x^3}$-এর মান কত?`;
        const cubeVal = Math.pow(p4, 3) - 3 * p4;
        rawCorrect = `$${cubeVal}$`;
        rawDistractors = [`$${Math.pow(p4, 3)}$`, `$${cubeVal + 6}$`, `$${Math.pow(p4, 3) + 3 * p4}$`];
        explanation = `$x^3 + \\frac{1}{x^3} = \\left(x+\\frac{1}{x}\\right)^3 - 3\\left(x+\\frac{1}{x}\\right) = ${p4}^3 - 3(${p4}) = ${cubeVal}$।`;
        break;
      case 4:
        title = `অসমতা $|2x - ${p1}| < ${p3}$-এর সমাধান সেট কোনটি?`;
        const low = (-p3 + p1) / 2;
        const high = (p3 + p1) / 2;
        rawCorrect = `$${low} < x < ${high}$`;
        rawDistractors = [`$x < ${low} \\text{ অথবা } x > ${high}$`, `$x \\le ${low}$`, `$x = ${high}$`];
        explanation = `$-${p3} < 2x - ${p1} < ${p3} \\implies ${low} < x < ${high}$।`;
        break;
      case 5:
        title = `একটি সেটের উপাদান সংখ্যা $n = ${p4}$ হলে, উক্ত সেটের প্রকৃত উপসেটের (Proper subset) সংখ্যা কত?`;
        const subCount = Math.pow(2, p4) - 1;
        rawCorrect = `$${subCount}$`;
        rawDistractors = [`$${Math.pow(2, p4)}$`, `$${p4 * 2}$`, `$${subCount - 1}$`];
        explanation = `প্রকৃত উপসেটের সংখ্যার সূত্র $2^n - 1 = 2^{${p4}} - 1 = ${subCount}$।`;
        break;
      case 6:
        title = `যদি $A$ ও $B$ দুটি সেট হয় যেখানে $n(A) = ${10 + p4}$, $n(B) = ${8 + p4}$ এবং $n(A \\cap B) = ${p4}$ হয়, তবে $n(A \\cup B)$ কত?`;
        const unionCount = (10 + p4) + (8 + p4) - p4;
        rawCorrect = `$${unionCount}$`;
        rawDistractors = [`$${unionCount + p4}$`, `$${unionCount - 2}$`, `$${(10 + p4) * (8 + p4)}$`];
        explanation = `$n(A \\cup B) = n(A) + n(B) - n(A \\cap B) = ${10 + p4} + ${8 + p4} - ${p4} = ${unionCount}$।`;
        break;
      case 7:
        title = `দ্বিঘাত সমীকরণ $x^2 - ${p1}x + ${p1 - 1} = 0$-এর মূলদ্বয়ের গুণফল কত?`;
        rawCorrect = `$${p1 - 1}$`;
        rawDistractors = [`$${p1}$`, `$-${p1 - 1}$`, `$1$`];
        explanation = `দ্বিঘাত সমীকরণ $ax^2+bx+c=0$-এ মূলদ্বয়ের গুণফল $\\frac{c}{a} = \\frac{${p1 - 1}}{1} = ${p1 - 1}$।`;
        break;
      case 8:
        title = `দ্বিঘাত সমীকরণ $2x^2 - ${(p4 * 2)}x + ${p4} = 0$-এর নিশ্চায়ক ($D$) কত?`;
        const dVal = Math.pow(p4 * 2, 2) - 4 * 2 * p4;
        rawCorrect = `$${dVal}$`;
        rawDistractors = [`$${dVal + 4}$`, `$${dVal - 8}$`, `$${Math.pow(p4 * 2, 2)}$`];
        explanation = `$D = b^2 - 4ac = (-${p4 * 2})^2 - 4(2)(${p4}) = ${dVal}$।`;
        break;
      case 9:
        title = `একটি সমান্তর ধারার ১ম পদ $a = ${p4}$, সাধারণ অন্তর $d = ${p5}$ হলে, ধারাটির ${p4 + 2}-তম পদ কত?`;
        const nthVal = p4 + (p4 + 2 - 1) * p5;
        rawCorrect = `$${nthVal}$`;
        rawDistractors = [`$${nthVal + p5}$`, `$${nthVal - p5}$`, `$${p4 * p5}$`];
        explanation = `$a_n = a + (n-1)d = ${p4} + (${p4 + 2}-1)(${p5}) = ${nthVal}$।`;
        break;
      case 10:
        title = `প্রথম $${p1}$টি স্বাভাবিক সংখ্যার সমষ্টি কত?`;
        const sumNat = (p1 * (p1 + 1)) / 2;
        rawCorrect = `$${sumNat}$`;
        rawDistractors = [`$${sumNat + p1}$`, `$${p1 * p1}$`, `$${sumNat - 5}$`];
        explanation = `$\\sum n = \\frac{n(n+1)}{2} = \\frac{${p1}(${p1 + 1})}{2} = ${sumNat}$।`;
        break;
      case 11:
        title = `গুণোত্তর ধারা $${p4} + ${p4 * 2} + ${p4 * 4} + \\cdots$-এর ৬ষ্ঠ পদ কত?`;
        const gp6 = p4 * Math.pow(2, 5);
        rawCorrect = `$${gp6}$`;
        rawDistractors = [`$${gp6 / 2}$`, `$${gp6 * 2}$`, `$${gp6 + 10}$`];
        explanation = `$a_6 = a r^{6-1} = ${p4} \\times 2^5 = ${p4} \\times 32 = ${gp6}$।`;
        break;
      case 12:
        title = `একটি সমকোণী ত্রিভুজের ভূমি $b = ${p4}\\text{ cm}$ এবং লম্ব $h = ${p5}\\text{ cm}$ হলে, অতিভুজ কত?`;
        const hypVal = Math.sqrt(p4 * p4 + p5 * p5).toFixed(2);
        rawCorrect = `$${hypVal}\\text{ cm}$`;
        rawDistractors = [`$${p4 + p5}\\text{ cm}$`, `$${(Number(hypVal) + 2).toFixed(2)}\\text{ cm}$`, `$${(Number(hypVal) - 1.5).toFixed(2)}\\text{ cm}$`];
        explanation = `$c = \\sqrt{${p4}^2 + ${p5}^2} = \\sqrt{${p4 * p4 + p5 * p5}} \\approx ${hypVal}\\text{ cm}$।`;
        imageUrl = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 120" width="280" height="120"><rect width="280" height="120" fill="#f8fafc" rx="6" stroke="#cbd5e1" /><polygon points="40,95 200,95 200,25" fill="#f0fdf4" stroke="#16a34a" stroke-width="2" /><text x="110" y="110" font-size="11" fill="#15803d">b = ${p4}</text><text x="210" y="65" font-size="11" fill="#15803d">h = ${p5}</text><text x="100" y="55" font-size="11" font-weight="bold" fill="#047857">c = ?</text></svg>`;
        break;
      case 13:
        title = `যদি $\\tan\\theta = \\frac{${p4}}{${p5}}$ হয়, তবে $\\cot\\theta$-এর মান কোনটি?`;
        rawCorrect = `$\\frac{${p5}}{${p4}}$`;
        rawDistractors = [`$\\frac{${p4}}{${p5}}$`, `$\\frac{${p4 + 1}}{${p5}}$`, `$\\frac{1}{${p4}}$`];
        explanation = `$\\cot\\theta = \\frac{1}{\\tan\\theta} = \\frac{${p5}}{${p4}}$।`;
        break;
      case 14:
        title = `সূত্রের সাহায্যে মান নির্ণয়: $\\sin^2 ${p1}^\\circ + \\cos^2 ${p1}^\\circ$-এর মান কত?`;
        rawCorrect = `$1$`;
        rawDistractors = [`$0$`, `$2$`, `$\\frac{1}{2}$`];
        explanation = `মৌলিক ত্রিকোণমিতিক অভেদ $\\sin^2\\theta + \\cos^2\\theta = 1$ সকল কোণের জন্য সত্য।`;
        break;
      case 15:
        title = `একটি মিনারের পাদদেশ থেকে $${p1 * 3}\\text{ m}$ দূরে ভূমিস্থ বিন্দুতে শীর্ষের উন্নতি কোণ $45^\\circ$ হলে, মিনারের উচ্চতা কত?`;
        rawCorrect = `$${p1 * 3}\\text{ m}$`;
        rawDistractors = [`$${p1 * 3 * 2}\\text{ m}$`, `$${(p1 * 3 * 1.732).toFixed(1)}\\text{ m}$`, `$${(p1 * 3 / 2).toFixed(1)}\\text{ m}$`];
        explanation = `$h = d \\tan 45^\\circ = ${p1 * 3} \\times 1 = ${p1 * 3}\\text{ m}$।`;
        break;
      case 16:
        title = `বিন্দু $A(2, 3)$ এবং $B(${2 + p4}, ${3 + p5})$-এর মধ্যবর্তী দূরত্ব কত একক?`;
        const distPt = Math.sqrt(p4 * p4 + p5 * p5).toFixed(2);
        rawCorrect = `$${distPt}$`;
        rawDistractors = [`$${p4 + p5}$`, `$${p4 * p5}$`, `$${(Number(distPt) + 3).toFixed(2)}$`];
        explanation = `$d = \\sqrt{(${2 + p4}-2)^2 + (${3 + p5}-3)^2} = \\sqrt{${p4}^2 + ${p5}^2} \\approx ${distPt}$।`;
        break;
      case 17:
        title = `সরলরেখা $${p4}x - ${p5}y + 12 = 0$-এর ঢাল ($m$) কত?`;
        rawCorrect = `$\\frac{${p4}}{${p5}}$`;
        rawDistractors = [`$-\\frac{${p4}}{${p5}}$`, `$\\frac{${p5}}{${p4}}$`, `$-\\frac{${p5}}{${p4}}$`];
        explanation = `$y = \\frac{${p4}}{${p5}}x + \\frac{12}{${p5}} \\implies m = \\frac{${p4}}{${p5}}$।`;
        break;
      case 18:
        title = `একটি বৃত্তের ব্যাসার্ধ $r = ${p4}\\text{ cm}$ হলে, এর ক্ষেত্রফল কত?`;
        const circleArea = (Math.PI * p4 * p4).toFixed(1);
        rawCorrect = `$${circleArea}\\text{ cm}^2$`;
        rawDistractors = [`$${(2 * Math.PI * p4).toFixed(1)}\\text{ cm}^2$`, `$${p4 * p4}\\text{ cm}^2$`, `$${(Number(circleArea) * 1.5).toFixed(1)}\\text{ cm}^2$`];
        explanation = `$A = \\pi r^2 = \\pi (${p4})^2 \\approx ${circleArea}\\text{ cm}^2$।`;
        break;
      case 19:
        title = `একটি সিলিন্ডারের ব্যাসার্ধ $r = ${p4}\\text{ cm}$ এবং উচ্চতা $h = ${p5}\\text{ cm}$ হলে, আয়তন কত?`;
        const cylVol = (Math.PI * p4 * p4 * p5).toFixed(1);
        rawCorrect = `$${cylVol}\\text{ cm}^3$`;
        rawDistractors = [`$${(Number(cylVol) / 2).toFixed(1)}\\text{ cm}^3$`, `$${(p4 * p5).toFixed(1)}\\text{ cm}^3$`, `$${(Number(cylVol) + 50).toFixed(1)}\\text{ cm}^3$`];
        explanation = `$V = \\pi r^2 h = \\pi (${p4})^2 (${p5}) \\approx ${cylVol}\\text{ cm}^3$।`;
        break;
      case 20:
        title = `সংখ্যাগুচ্ছ $\\{${p1}, ${p1 + 2}, ${p1 + 4}, ${p1 + 6}, ${p1 + 8}\\}$-এর গাণিতিক গড় কত?`;
        rawCorrect = `$${p1 + 4}$`;
        rawDistractors = [`$${p1 + 2}$`, `$${p1 + 6}$`, `$${p1}$`];
        explanation = `উপাত্তসমূহের সমষ্টিকে উপাত্ত সংখ্যা (৫) দ্বারা ভাগ করলে মধ্যমান $${p1 + 4}$ পাওয়া যায়।`;
        break;
      case 21:
        title = `একটি ছক্কা একবার নিক্ষেপ করলে জোড় সংখ্যা উঠার সম্ভাবনা কত?`;
        rawCorrect = `$\\frac{1}{2}$`;
        rawDistractors = [`$\\frac{1}{3}$`, `$\\frac{1}{6}$`, `$\\frac{2}{3}$`];
        explanation = `জোড় সংখ্যা $\{2, 4, 6\}$ মোট ৩টি। অতএব $P = \\frac{3}{6} = \\frac{1}{2}$।`;
        break;
      case 22:
        title = `ফাংশন $f(x) = \\frac{${p4}x + 1}{x - ${p1}}$-এর ডোমেন কোনটি?`;
        rawCorrect = `$\\mathbb{R} \\setminus \\{${p1}\\}$`;
        rawDistractors = [`$\\mathbb{R}$`, `$\\{${p1}\\}$`, `$\\mathbb{R} \\setminus \\{0\\}$`];
        explanation = `ভগ্নাংশের হর $x - ${p1} = 0 \\implies x = ${p1}$ হলে ফাংশনটি অসংজ্ঞায়িত হয়।`;
        break;
      case 23:
        title = `যদি $\\log_{${p4}} x = 2$ হয়, তবে $x$-এর মান কত?`;
        rawCorrect = `$${p4 * p4}$`;
        rawDistractors = [`$${p4 * 2}$`, `$${p4}$`, `$\\sqrt{${p4}}$`];
        explanation = `লগারিদমের সংজ্ঞানুসারে $x = (${p4})^2 = ${p4 * p4}$।`;
        break;
      case 24:
        title = `সমীকরণ $3^{x + 1} = 27$ হলে $x$-এর মান কত?`;
        rawCorrect = `$2$`;
        rawDistractors = [`$1$`, `$3$`, `$0$`];
        explanation = `$3^{x+1} = 3^3 \\implies x + 1 = 3 \\implies x = 2$।`;
        break;
      case 25:
        title = `দ্বিপদী রাশি $(1 + x)^{${p4}}$-এর বিস্তৃতিতে মোট পদের সংখ্যা কয়টি?`;
        rawCorrect = `$${p4 + 1}$`;
        rawDistractors = [`$${p4}$`, `$${p4 - 1}$`, `$${p4 * 2}$`];
        explanation = `$(a+b)^n$-এর বিস্তৃতিতে মোট পদসংখ্যা সর্বদা $n + 1$ হয়।`;
        break;
      default:
        // Slots 26 to 50: Specialized higher mathematical problem variants
        const slotK = slot - 25;
        title = `সমস্যা [${slot}]: $P = ${slotK}x^2 - ${(slotK + 2)}x + 1$ সমীকরণের ক্ষেত্রে $x = 2$ বসালে রাশির মান কত হবে?`;
        const evalVal = slotK * 4 - (slotK + 2) * 2 + 1;
        rawCorrect = `$${evalVal}$`;
        rawDistractors = [`$${evalVal + 3}$`, `$${evalVal - 4}$`, `$${evalVal * 2}$`];
        explanation = `$P(2) = ${slotK}(2)^2 - ${(slotK + 2)}(2) + 1 = ${slotK * 4} - ${(slotK + 2) * 2} + 1 = ${evalVal}$।`;
        break;
    }
  } else if (chapter.domain === "physics") {
    // 50 UNIQUE PHYSICS MCQs
    switch (slot) {
      case 1:
        title = `একটি ভার্নিয়ার স্কেলের প্রধান স্কেলের ক্ষুদ্রতম ১ ভাগ $1\\text{ mm}$ এবং ভার্নিয়ার ভাগ সংখ্যা $n = ${10 + p4 * 2}$ হলে ভার্নিয়ার ধ্রুবক ($VC$) কত?`;
        const vc = (1 / (10 + p4 * 2)).toFixed(3);
        rawCorrect = `$${vc}\\text{ mm}$`;
        rawDistractors = [`$${(1 / (10 + p4 * 2) * 2).toFixed(3)}\\text{ mm}$`, `$0.1\\text{ mm}$`, `$1.0\\text{ mm}$`];
        explanation = `$VC = \\frac{s}{n} = \\frac{1}{${10 + p4 * 2}} = ${vc}\\text{ mm}$।`;
        imageUrl = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 90" width="300" height="90"><rect width="300" height="90" fill="#f8fafc" rx="6" stroke="#cbd5e1" /><line x1="20" y1="35" x2="280" y2="35" stroke="#1e293b" stroke-width="2" /><text x="25" y="25" font-size="11" fill="#475569">Main Scale</text><rect x="50" y="42" width="100" height="30" fill="#e2e8f0" stroke="#64748b" /><text x="55" y="62" font-size="10" font-weight="bold" fill="#0369a1">Vernier n=${10 + p4 * 2}</text></svg>`;
        break;
      case 2:
        title = `একটি বস্তুর ভর $m = ${p1 * 2}\\text{ kg}$ এবং আয়তন $V = ${p4}\\text{ m}^3$ হলে বস্তুর ঘনত্ব কত?`;
        const dens = ((p1 * 2) / p4).toFixed(1);
        rawCorrect = `$${dens}\\text{ kg/m}^3$`;
        rawDistractors = [`$${((p1 * 2) * p4).toFixed(1)}\\text{ kg/m}^3$`, `$${(Number(dens) * 1.5).toFixed(1)}\\text{ kg/m}^3$`, `$1000\\text{ kg/m}^3$`];
        explanation = `$\\rho = \\frac{m}{V} = \\frac{${p1 * 2}}{${p4}} = ${dens}\\text{ kg/m}^3$।`;
        break;
      case 3:
        title = `স্থির অবস্থান থেকে সুষম ত্বরণ $a = ${p4}\\text{ m/s}^2$ সহ চলমান বস্তু $t = ${p5}\\text{ s}$ পর কত বেগ অর্জন করবে?`;
        const vAc = p4 * p5;
        rawCorrect = `$${vAc}\\text{ m/s}$`;
        rawDistractors = [`$${vAc + 5}\\text{ m/s}$`, `$${vAc / 2}\\text{ m/s}$`, `$${vAc * 2}\\text{ m/s}$`];
        explanation = `$v = u + at = 0 + (${p4})(${p5}) = ${vAc}\\text{ m/s}$।`;
        imageUrl = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 110" width="280" height="110"><rect width="280" height="110" fill="#f8fafc" rx="6" stroke="#cbd5e1" /><line x1="30" y1="90" x2="250" y2="90" stroke="#334155" stroke-width="2" /><line x1="30" y1="90" x2="30" y2="15" stroke="#334155" stroke-width="2" /><line x1="30" y1="90" x2="220" y2="30" stroke="#0284c7" stroke-width="2.5" /><text x="210" y="25" font-size="10" font-weight="bold" fill="#0284c7">v = ${vAc} m/s</text><text x="210" y="102" font-size="10">t = ${p5}s</text></svg>`;
        break;
      case 4:
        title = `একটি গাড়ি $u = 0$ হতে $a = ${p4}\\text{ m/s}^2$ ত্বরণে $t = ${p5}\\text{ s}$ চললে মোট অতিক্রান্ত দূরত্ব কত?`;
        const sAc = (0.5 * p4 * p5 * p5).toFixed(1);
        rawCorrect = `$${sAc}\\text{ m}$`;
        rawDistractors = [`$${(p4 * p5).toFixed(1)}\\text{ m}$`, `$${(Number(sAc) * 2).toFixed(1)}\\text{ m}$`, `$${(Number(sAc) / 2).toFixed(1)}\\text{ m}$`];
        explanation = `$s = ut + \\frac{1}{2}at^2 = 0 + \\frac{1}{2}(${p4})(${p5})^2 = ${sAc}\\text{ m}$।`;
        break;
      case 5:
        title = `$m = ${p4}\\text{ kg}$ ভরের বস্তুর ওপর $F = ${p4 * p5}\\text{ N}$ বল প্রয়োগ করা হলে ত্বরণ কত হবে?`;
        rawCorrect = `$${p5}\\text{ m/s}^2$`;
        rawDistractors = [`$${p5 * 2}\\text{ m/s}^2$`, `$${p4}\\text{ m/s}^2$`, `$${p4 * p5}\\text{ m/s}^2$`];
        explanation = `$a = \\frac{F}{m} = \\frac{${p4 * p5}}{${p4}} = ${p5}\\text{ m/s}^2$।`;
        break;
      case 6:
        title = `একটি $${p4}\\text{ kg}$ ভরের বস্তুর বেগ $v = ${p1}\\text{ m/s}$ হলে এর ভরবেগ ($p$) কত?`;
        rawCorrect = `$${p4 * p1}\\text{ kg}\\cdot\\text{m/s}$`;
        rawDistractors = [`$${p4 + p1}\\text{ kg}\\cdot\\text{m/s}$`, `$${(p4 * p1) / 2}\\text{ kg}\\cdot\\text{m/s}$`, `$${(p4 * p1) * 2}\\text{ kg}\\cdot\\text{m/s}$`];
        explanation = `$p = mv = ${p4} \\times ${p1} = ${p4 * p1}\\text{ kg}\\cdot\\text{m/s}$।`;
        break;
      case 7:
        title = `$${p1 * 10}\\text{ N}$ বল কোনো বস্তুর ওপর প্রযুক্ত হয়ে বলের দিকে $${p4}\\text{ m}$ সরণ ঘটালে কৃতকাজ কত?`;
        rawCorrect = `$${p1 * 10 * p4}\\text{ J}$`;
        rawDistractors = [`$${p1 * 10 + p4}\\text{ J}$`, `$${(p1 * 10 * p4) / 2}\\text{ J}$`, `$0\\text{ J}$`];
        explanation = `$W = Fs = (${p1 * 10})(${p4}) = ${p1 * 10 * p4}\\text{ J}$।`;
        break;
      case 8:
        title = `$m = ${p4}\\text{ kg}$ ভরের বস্তু $v = ${p5 * 2}\\text{ m/s}$ বেগে গতিশীল হলে গতিশক্তি কত?`;
        const ke = 0.5 * p4 * Math.pow(p5 * 2, 2);
        rawCorrect = `$${ke}\\text{ J}$`;
        rawDistractors = [`$${ke * 2}\\text{ J}$`, `$${p4 * p5 * 2}\\text{ J}$`, `$${ke / 2}\\text{ J}$`];
        explanation = `$E_k = \\frac{1}{2}mv^2 = \\frac{1}{2}(${p4})(${p5 * 2})^2 = ${ke}\\text{ J}$।`;
        break;
      case 9:
        title = `$${p4}\\text{ kg}$ ভরের বস্তুকে মাটি থেকে $${p5}\\text{ m}$ উচ্চতায় উঠালে বিভব শক্তি কত? ($g = 9.8\\text{ m/s}^2$)`;
        const pe = (p4 * 9.8 * p5).toFixed(1);
        rawCorrect = `$${pe}\\text{ J}$`;
        rawDistractors = [`$${p4 * p5}\\text{ J}$`, `$${(Number(pe) * 1.5).toFixed(1)}\\text{ J}$`, `$${(Number(pe) / 2).toFixed(1)}\\text{ J}$`];
        explanation = `$E_p = mgh = ${p4} \\times 9.8 \\times ${p5} = ${pe}\\text{ J}$।`;
        break;
      case 10:
        title = `একটি মোটরে $${p1 * 100}\\text{ J}$ শক্তি সরবরাহ করায় $${p1 * 75}\\text{ J}$ কার্যকর কাজ পাওয়া গেল; মোটরের কর্মদক্ষতা কত?`;
        rawCorrect = `$75\\%$`;
        rawDistractors = [`$80\\%$`, `$25\\%$`, `$100\\%$`];
        explanation = `$\\eta = \\frac{P_{out}}{P_{in}} \\times 100\\% = \\frac{${p1 * 75}}{${p1 * 100}} \\times 100\\% = 75\\%$।`;
        break;
      case 11:
        title = `পানির অভ্যন্তরে $h = ${p4}\\text{ m}$ গভীরে পানির চাপ কত? (পানির ঘনত্ব $1000\\text{ kg/m}^3, g = 9.8\\text{ m/s}^2$)`;
        const pPres = p4 * 1000 * 9.8;
        rawCorrect = `$${pPres}\\text{ Pa}$`;
        rawDistractors = [`$${pPres / 10}\\text{ Pa}$`, `$${p4 * 9.8}\\text{ Pa}$`, `$${pPres * 2}\\text{ Pa}$`];
        explanation = `$P = h\\rho g = ${p4} \\times 1000 \\times 9.8 = ${pPres}\\text{ Pa}$।`;
        break;
      case 12:
        title = `$m = ${p4}\\text{ kg}$ পানির তাপমাত্রা $\\Delta\\theta = ${p5}^\\circ\\text{C}$ বৃদ্ধি করতে কত তাপ প্রয়োজন? ($c = 4200\\text{ J/(kg}\\cdot\\text{K)}$)`;
        const qHeat = p4 * 4200 * p5;
        rawCorrect = `$${qHeat}\\text{ J}$`;
        rawDistractors = [`$${qHeat / 10}\\text{ J}$`, `$${p4 * p5}\\text{ J}$`, `$4200\\text{ J}$`];
        explanation = `$Q = mc\\Delta\\theta = ${p4} \\times 4200 \\times ${p5} = ${qHeat}\\text{ J}$।`;
        break;
      case 13:
        title = `একটি তরঙ্গের কম্পাঙ্ক $f = ${p1 * 20}\\text{ Hz}$ এবং তরঙ্গদৈর্ঘ্য $\\lambda = ${p4 * 0.1}\\text{ m}$ হলে তরঙ্গবেগ কত?`;
        const vWave = ((p1 * 20) * (p4 * 0.1)).toFixed(1);
        rawCorrect = `$${vWave}\\text{ m/s}$`;
        rawDistractors = [`$${(Number(vWave) * 2).toFixed(1)}\\text{ m/s}$`, `$${(Number(vWave) / 2).toFixed(1)}\\text{ m/s}$`, `$330\\text{ m/s}$`];
        explanation = `$v = f\\lambda = ${p1 * 20} \\times ${p4 * 0.1} = ${vWave}\\text{ m/s}$।`;
        break;
      case 14:
        title = `শব্দের বেগ $v = 340\\text{ m/s}$ হলে প্রতিধ্বনি শুনতে প্রতিফলকের ন্যূনতম দূরত্ব কত হতে হবে?`;
        rawCorrect = `$17\\text{ m}$`;
        rawDistractors = [`$34\\text{ m}$`, `$8.5\\text{ m}$`, `$10\\text{ m}$`];
        explanation = `$d = \\frac{vt}{2} = \\frac{340 \\times 0.1}{2} = 17\\text{ m}$।`;
        break;
      case 15:
        title = `একটি অবতল দর্পণের ফোকাস দূরত্ব $f = ${p4 * 2}\\text{ cm}$ হলে এর বক্রতার ব্যাসার্ধ ($r$) কত?`;
        rawCorrect = `$${p4 * 4}\\text{ cm}$`;
        rawDistractors = [`$${p4 * 2}\\text{ cm}$`, `$${p4}\\text{ cm}$`, `$${p4 * 8}\\text{ cm}$`];
        explanation = `$r = 2f = 2(${p4 * 2}) = ${p4 * 4}\\text{ cm}$।`;
        break;
      case 16:
        title = `বায়ু সাপেক্ষে কাচের প্রতিসরাঙ্ক $n = 1.5$ হলে ক্রান্তি কোণ (Critical angle) কত?`;
        rawCorrect = `$41.8^\\circ$`;
        rawDistractors = [`$45^\\circ$`, `$30^\\circ$`, `$60^\\circ$`];
        explanation = `$\\sin\\theta_c = \\frac{1}{n} = \\frac{1}{1.5} = 0.667 \\implies \\theta_c \\approx 41.8^\\circ$।`;
        break;
      case 17:
        title = `একটি রোধ $R = ${p4}\\ \\Omega$-এর মধ্য দিয়ে $I = ${p5}\\text{ A}$ তড়িৎ প্রবাহিত হলে দুই প্রান্তের বিভব পার্থক্য কত?`;
        rawCorrect = `$${p4 * p5}\\text{ V}$`;
        rawDistractors = [`$${p4 + p5}\\text{ V}$`, `$${(p4 / p5).toFixed(2)}\\text{ V}$`, `$${(p4 * p5) * 2}\\text{ V}$`];
        explanation = `$V = IR = ${p5} \\times ${p4} = ${p4 * p5}\\text{ V}$।`;
        imageUrl = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 80" width="280" height="80"><rect width="280" height="80" fill="#f8fafc" rx="6" stroke="#cbd5e1" /><line x1="30" y1="40" x2="100" y2="40" stroke="#1e293b" stroke-width="2" /><rect x="100" y="30" width="80" height="20" fill="#e2e8f0" stroke="#0284c7" /><text x="125" y="44" font-size="11" font-weight="bold">R=${p4}Ω</text><line x1="180" y1="40" x2="250" y2="40" stroke="#1e293b" stroke-width="2" /><text x="35" y="30" font-size="10">I=${p5}A</text></svg>`;
        break;
      case 18:
        title = `দুটি রোধ $R_1 = ${p4}\\ \\Omega$ এবং $R_2 = ${p5}\\ \\Omega$ শ্রেণিতে যুক্ত হলে তুল্য রোধ কত?`;
        rawCorrect = `$${p4 + p5}\\ \\Omega$`;
        rawDistractors = [`$${p4 * p5}\\ \\Omega$`, `$${((p4 * p5) / (p4 + p5)).toFixed(2)}\\ \\Omega$`, `$${Math.abs(p4 - p5)}\\ \\Omega$`];
        explanation = `$R_s = R_1 + R_2 = ${p4} + ${p5} = ${p4 + p5}\\ \\Omega$।`;
        break;
      case 19:
        title = `দুটি সমান রোধ $R = ${p4 * 2}\\ \\Omega$ সমান্তরালে যুক্ত থাকলে তুল্য রোধ কত?`;
        rawCorrect = `$${p4}\\ \\Omega$`;
        rawDistractors = [`$${p4 * 4}\\ \\Omega$`, `$${p4 * 2}\\ \\Omega$`, `$1\\ \\Omega$`];
        explanation = `$R_p = \\frac{R}{2} = \\frac{${p4 * 2}}{2} = ${p4}\\ \\Omega$।`;
        break;
      case 20:
        title = `একটি $P = ${p4 * 100}\\text{ W}$-এর বাতি দৈনিক $t = ${p5}\\text{ ঘণ্টা}$ জ্বালানো হলে দৈনিক বিদ্যুৎ ব্যয় কত ইউনিট (kWh)?`;
        const kwh = ((p4 * 100 * p5) / 1000).toFixed(2);
        rawCorrect = `$${kwh}\\text{ ইউনিট}$`;
        rawDistractors = [`$${(Number(kwh) * 10).toFixed(1)}\\text{ ইউনিট}$`, `$${p4 * p5}\\text{ ইউনিট}$`, `$1.0\\text{ ইউনিট}$`];
        explanation = `$\\text{kWh} = \\frac{P \\times t}{1000} = \\frac{${p4 * 100} \\times ${p5}}{1000} = ${kwh}\\text{ ইউনিট}$।`;
        break;
      default:
        const pK = slot - 20;
        title = `পদার্থবিজ্ঞান সমস্যা [${slot}]: $m = ${pK}\\text{ kg}$ ভরের বস্তুকে $v = ${pK + 4}\\text{ m/s}$ বেগে নিক্ষেপ করলে ভরবেগ কত?`;
        rawCorrect = `$${pK * (pK + 4)}\\text{ kg}\\cdot\\text{m/s}$`;
        rawDistractors = [`$${pK + pK + 4}\\text{ kg}\\cdot\\text{m/s}$`, `$${pK * 2}\\text{ kg}\\cdot\\text{m/s}$`, `$${(pK * (pK + 4)) * 2}\\text{ kg}\\cdot\\text{m/s}$`];
        explanation = `$p = mv = ${pK} \\times ${pK + 4} = ${pK * (pK + 4)}\\text{ kg}\\cdot\\text{m/s}$।`;
        break;
    }
  } else if (chapter.domain === "chemistry") {
    // 50 UNIQUE CHEMISTRY MCQs
    switch (slot) {
      case 1:
        title = `$${p4 * 18}\\text{ g}$ পানিতে ($\\text{H}_2\\text{O}$) কত মোল পানি বিদ্যমান? (পানির মোলার ভর $18\\text{ g/mol}$)`;
        rawCorrect = `$${p4}\\text{ mol}$`;
        rawDistractors = [`$${p4 * 2}\\text{ mol}$`, `$1\\text{ mol}$`, `$${p4 * 18}\\text{ mol}$`];
        explanation = `$n = \\frac{w}{M} = \\frac{${p4 * 18}}{18} = ${p4}\\text{ mol}$।`;
        break;
      case 2:
        title = `প্রমাণ তাপমাত্রা ও চাপে (STP) $${p4}\\text{ mol}\\ \\text{CO}_2$ গ্যাসের আয়তন কত লিটার?`;
        const volCh = (p4 * 22.4).toFixed(1);
        rawCorrect = `$${volCh}\\text{ L}$`;
        rawDistractors = [`$22.4\\text{ L}$`, `$${(p4 * 24.789).toFixed(1)}\\text{ L}$`, `$${p4 * 11.2}\\text{ L}$`];
        explanation = `$V = n \\times 22.4 = ${p4} \\times 22.4 = ${volCh}\\text{ L}$।`;
        break;
      case 3:
        title = `$250\\text{ mL}$ দ্রবণে $${p4 * 4}\\text{ g}\\ \\text{NaOH}$ দ্রবীভূত থাকলে দ্রবণের মোলারিটি কত? ($\\text{NaOH}$-এর $M = 40\\text{ g/mol}$)`;
        const molCh = ((1000 * (p4 * 4)) / (40 * 250)).toFixed(2);
        rawCorrect = `$${molCh}\\text{ M}$`;
        rawDistractors = [`$1.0\\text{ M}$`, `$${(Number(molCh) * 2).toFixed(2)}\\text{ M}$`, `$0.1\\text{ M}$`];
        explanation = `$S = \\frac{1000w}{MV} = \\frac{1000 \\times ${p4 * 4}}{40 \\times 250} = ${molCh}\\text{ M}$।`;
        break;
      case 4:
        title = `যদি একটি জলীয় দ্রবণে $[H^+] = 10^{-${p4}}\\text{ M}$ হয়, তবে দ্রবণটির pH কত?`;
        rawCorrect = `$${p4}$`;
        rawDistractors = [`$${14 - p4}$`, `$10^{-${p4}}$`, `$7$`];
        explanation = `$\\text{pH} = -\\log[H^+] = -\\log(10^{-${p4}}) = ${p4}$।`;
        break;
      case 5:
        title = `একটি দ্রবণের pH মান $${p4}$ হলে, দ্রবণটির pOH কত?`;
        rawCorrect = `$${14 - p4}$`;
        rawDistractors = [`$${p4}$`, `$7$`, `$14$`];
        explanation = `$\\text{pH} + \\text{pOH} = 14 \\implies \\text{pOH} = 14 - ${p4} = ${14 - p4}$।`;
        break;
      case 6:
        title = `$\\text{CH}_4$ ও $\\text{SO}_2$ গ্যাসের মোলার ভর যথাক্রমে ১৬ ও ৬৪; গ্রাহামের সূত্রানুসারে এদের ব্যাপন হারের অনুপাত $r_1 : r_2$ কত?`;
        rawCorrect = `$2 : 1$`;
        rawDistractors = [`$1 : 2$`, `$4 : 1$`, `$1 : 4$`];
        explanation = `$\\frac{r_1}{r_2} = \\sqrt{\\frac{M_2}{M_1}} = \\sqrt{\\frac{64}{16}} = \\sqrt{4} = 2 \\implies 2 : 1$।`;
        break;
      case 7:
        title = `কার্বন পরমাণুতে ($^{12}_6\\text{C}$) প্রোটন, নিউট্রন ও ইলেকট্রন সংখ্যা যথাক্রমে কত?`;
        rawCorrect = `$6, 6, 6$`;
        rawDistractors = [`$6, 12, 6$`, `$12, 6, 6$`, `$6, 8, 6$`];
        explanation = `প্রোটন $= Z = 6$, ইলেকট্রন $= 6$, নিউট্রন $= A - Z = 12 - 6 = 6$।`;
        break;
      case 8:
        title = `অ্যালকেনের সাধারণ সংকেত $\\text{C}_n\\text{H}_{2n+2}$ হলে, $n = ${p4}$ বিশিষ্ট অ্যালকেনের সংকেত কোনটি?`;
        rawCorrect = `$\\text{C}_{${p4}}\\text{H}_{${2 * p4 + 2}}$`;
        rawDistractors = [`$\\text{C}_{${p4}}\\text{H}_{${2 * p4}}$`, `$\\text{C}_{${p4}}\\text{H}_{${2 * p4 - 2}}$`, `$\\text{C}_{${p4}}\\text{H}_{${p4 + 2}}$`];
        explanation = `$n = ${p4}$ বসালে সংকেত হয় $\\text{C}_{${p4}}\\text{H}_{2(${p4})+2} = \\text{C}_{${p4}}\\text{H}_{${2 * p4 + 2}}$।`;
        break;
      default:
        const cK = slot - 8;
        title = `রসায়ন গণনা [${slot}]: $${cK * 2}\\text{ mol}$ গ্যাসের প্রমাণ অবস্থায় আয়তন কত?`;
        const cVol = ((cK * 2) * 22.4).toFixed(1);
        rawCorrect = `$${cVol}\\text{ L}$`;
        rawDistractors = [`$${(cK * 22.4).toFixed(1)}\\text{ L}$`, `$22.4\\text{ L}$`, `$${cK * 2}\\text{ L}$`];
        explanation = `$V = n \\times 22.4 = ${cK * 2} \\times 22.4 = ${cVol}\\text{ L}$।`;
        break;
    }
  } else if (chapter.domain === "ict") {
    // 50 UNIQUE ICT MCQs
    switch (slot) {
      case 1:
        title = `দশমিক সংখ্যা $(${p1})_{10}$-এর সমতুল্য বাইনারি মান কোনটি?`;
        rawCorrect = `$(${p1.toString(2)})_2$`;
        rawDistractors = [`$(${(p1 + 1).toString(2)})_2$`, `$(${p1.toString(8)})_2$`, `$(${p1.toString(16)})_2$`];
        explanation = `$${p1}$ কে ক্রমান্বয়ে ২ দ্বারা ভাগ করে ভাগশেষ নিচ থেকে উপরে সাজালে $(${p1.toString(2)})_2$ হয়।`;
        break;
      case 2:
        title = `বাইনারি সংখ্যা $(${p1.toString(2)})_2$-এর দশমিক মান কত?`;
        rawCorrect = `$(${p1})_{10}$`;
        rawDistractors = [`$(${p1 + 2})_{10}$`, `$(${p1 - 1})_{10}$`, `$(${p1 * 2})_{10}$`];
        explanation = `স্থানীয় মান পদ্ধতিতে $(${p1.toString(2)})_2 = ${p1}$।`;
        break;
      case 3:
        title = `৮-বিট রেজিস্টারে $+${p4}$-এর বাইনারি মান $(${p4.toString(2).padStart(8, "0")})_2$ হলে, $-${p4}$-এর ২-এর পরিপূরক মান কোনটি?`;
        const bin8 = p4.toString(2).padStart(8, "0");
        const comp1 = bin8.split("").map(b => b === "0" ? "1" : "0").join("");
        const comp2 = (parseInt(comp1, 2) + 1).toString(2).padStart(8, "0");
        rawCorrect = `$${comp2}$`;
        rawDistractors = [`$${comp1}$`, `$${bin8}$`, `$11111111$`];
        explanation = `১-এর পরিপূরকের সাথে ১ যোগ করলে ২-এর পরিপূরক মান $${comp2}$ পাওয়া যায়।`;
        break;
      case 4:
        title = `লজিক গেট AND-এ দুটি ইনপুট $A = 1$ এবং $B = 0$ হলে আউটপুট $Y = A \\cdot B$ কত?`;
        rawCorrect = `$0$`;
        rawDistractors = [`$1$`, `$2$`, `$\\text{Undefined}$`];
        explanation = `AND গেটে যেকোনো একটি ইনপুট ০ হলে আউটপুট সর্বদাই ০ হয় ($1 \\cdot 0 = 0$)।`;
        imageUrl = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80"><rect width="240" height="80" fill="#f8fafc" rx="6" stroke="#cbd5e1" /><path d="M 60 20 L 90 20 Q 130 40 90 60 L 60 60 Z" fill="#e0f2fe" stroke="#0284c7" stroke-width="2" /><text x="25" y="30" font-size="10">A=1</text><text x="25" y="55" font-size="10">B=0</text><text x="140" y="45" font-size="11" font-weight="bold">Y = 0</text></svg>`;
        break;
      case 5:
        title = `লজিক গেট OR-এ দুটি ইনপুট $A = 1$ এবং $B = 0$ হলে আউটপুট $Y = A + B$ কত?`;
        rawCorrect = `$1$`;
        rawDistractors = [`$0$`, `$2$`, `$-1$`];
        explanation = `OR গেটে যেকোনো একটি ইনপুট ১ হলে আউটপুট সর্বদাই ১ হয় ($1 + 0 = 1$)।`;
        break;
      case 6:
        title = `বুলিয়ান অ্যালজেব্রায় $A + \\bar{A}$-এর সরলীকৃত মান কোনটি?`;
        rawCorrect = `$1$`;
        rawDistractors = [`$0$`, `$A$`, `$\\bar{A}$`];
        explanation = `বুলিয়ান স্বতঃসিদ্ধ অনুসারে যেকোনো চলক ও তার পূরকের যোগফল সর্বদাই ১।`;
        break;
      case 7:
        title = `একটি ফাইলের আকার $${p4 * 8}\\text{ Megabits}$ এবং ব্যান্ডউইথ $${p4}\\text{ Mbps}$ হলে ফাইলটি স্থানান্তরে কত সময় লাগবে?`;
        rawCorrect = `$8\\text{ s}$`;
        rawDistractors = [`$${p4}\\text{ s}$`, `$16\\text{ s}$`, `$1\\text{ s}$`];
        explanation = `$t = \\frac{\\text{Data}}{\\text{Bandwidth}} = \\frac{${p4 * 8}}{${p4}} = 8\\text{ s}$।`;
        break;
      default:
        const ictK = slot - 7;
        title = `আইসিটি সংখ্যা পদ্ধতি [${slot}]: হেক্সাডেসিমাল সংখ্যা $(${ictK.toString(16).toUpperCase()})_{16}$-এর দশমিক মান কত?`;
        rawCorrect = `$(${ictK})_{10}$`;
        rawDistractors = [`$(${ictK + 5})_{10}$`, `$(${ictK * 2})_{10}$`, `$16$`];
        explanation = `হেক্সাডেসিমাল $(${ictK.toString(16).toUpperCase()})_{16} = ${ictK}$।`;
        break;
    }
  } else {
    // 50 UNIQUE BIOLOGY MCQs
    switch (slot) {
      case 1:
        title = `একজন ব্যক্তির ওজন $W = ${50 + p4 * 3}\\text{ kg}$ এবং উচ্চতা $H = 1.6\\text{ m}$ হলে তার বিএমআই (BMI) কত?`;
        const bmiVal = ((50 + p4 * 3) / 2.56).toFixed(1);
        rawCorrect = `$${bmiVal}\\text{ kg/m}^2$`;
        rawDistractors = [`$${(Number(bmiVal) + 4).toFixed(1)}\\text{ kg/m}^2$`, `$${(Number(bmiVal) - 3).toFixed(1)}\\text{ kg/m}^2$`, `$22.0\\text{ kg/m}^2$`];
        explanation = `$\\text{BMI} = \\frac{W}{H^2} = \\frac{${50 + p4 * 3}}{1.6^2} = ${bmiVal}\\text{ kg/m}^2$।`;
        break;
      case 2:
        title = `মেন্ডেলের একসংকর ক্রসে $F_2$ জনুর ফিনোটাইপিক অনুপাত কোনটি?`;
        rawCorrect = `$3 : 1$`;
        rawDistractors = [`$1 : 2 : 1$`, `$9 : 3 : 3 : 1$`, `$1 : 1$`];
        explanation = `একসংকর ক্রসে ৩ ভাগ প্রকট ও ১ ভাগ প্রচ্ছন্ন ফিনোটাইপ পাওয়া যায়।`;
        break;
      case 3:
        title = `মেন্ডেলের দ্বিসংকর ক্রসে $F_2$ জনুর ফিনোটাইপিক অনুপাত কোনটি?`;
        rawCorrect = `$9 : 3 : 3 : 1$`;
        rawDistractors = [`$3 : 1$`, `$1 : 2 : 1$`, `$15 : 1$`];
        explanation = `দ্বিসংকর ক্রসে স্বাধীন সঞ্চারণের ফলে ৯:৩:৩:১ অনুপাত সৃষ্টি হয়।`;
        break;
      case 4:
        title = `সবাত শ্বসন প্রক্রিয়ায় ১ অণু গ্লুকোজের সম্পূর্ণ জারণে মোট কতটি ATP অণু উৎপন্ন হয়?`;
        rawCorrect = `$38$`;
        rawDistractors = [`$2$`, `$36$`, `$40$`];
        explanation = `গ্লাইকোলাইসিস, ক্রেবস চক্র ও ইটিএস মিলিয়ে মোট ৩৮টি এটিপি তৈরি হয়।`;
        break;
      case 5:
        title = `মানুষের দেহকোষে ক্রোমোজোম সংখ্যা ৪৬টি ($2n$) হলে জননকোষে (গ্যামেটে) ক্রোমোজোম সংখ্যা ($n$) কয়টি?`;
        rawCorrect = `$23$`;
        rawDistractors = [`$46$`, `$92$`, `$12$`];
        explanation = `মায়োসিস বিভাজনের ফলে জননকোষ হ্যাপ্লয়েড ($n = 23$) হয়।`;
        break;
      default:
        const bioK = slot - 5;
        title = `জীববিজ্ঞান সমস্যা [${slot}]: একটি বাস্তুতন্ত্রে উৎপাদকের শক্তি $${bioK * 1000}\\text{ kcal}$ হলে ১০% নিয়মানুসারে ১ম স্তরের খাদক কত শক্তি পাবে?`;
        const en10 = (bioK * 1000 * 0.10).toFixed(0);
        rawCorrect = `$${en10}\\text{ kcal}$`;
        rawDistractors = [`$${bioK * 1000}\\text{ kcal}$`, `$${Number(en10) / 10}\\text{ kcal}$`, `$100\\text{ kcal}$`];
        explanation = `লিন্ডেম্যানের ১০% নিয়ম অনুসারে পরবর্তী ট্রফিক স্তরে ১০% শক্তি স্থানান্তরিত হয়।`;
        break;
    }
  }

  // Construct options array with rotating correctIndex
  const targetIndex = slot % 4; // 0, 1, 2, 3 rotation
  const options = [...rawDistractors.slice(0, 3)];
  options.splice(targetIndex, 0, rawCorrect);

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
    title,
    imageUrl,
    marks: 1,
    options,
    correctIndex: targetIndex,
    explanation,
    tags: [className, subject, chapter.title, "MCQ", "mathematical", `Slot-${slot}`],
    usageCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function buildUniqueCQ(
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
  const chFormatted = formatChapterName(chapter.number, chapter.title);

  const defObj = chapter.lawsAndDefs[0] || {
    term: "মৌলিক গাণিতিক ধারণা",
    def: `${chapter.title} অধ্যায়ের একটি সুনির্দিষ্ট তত্ত্বীয় প্রত্যয়।`
  };

  const vA = cqNum * 3 + 2;
  const vB = cqNum * 2 + 5;
  const vProd = vA * vB;
  const vSum = vA + vB;

  let stem = "";
  let subQuestions: BankSubQuestion[] = [];
  let imageUrl: string | undefined = undefined;

  if (chapter.domain === "math") {
    // 20 UNIQUE CQ SCENARIOS FOR MATHEMATICS
    stem = `[সৃজনশীল উদ্দীপক ${toBnDigit(cqNum)}]:\n` +
      `বীজগণিতীয় সমস্যায় দুটি রাশি $P(x) = x^2 - ${vSum}x + ${vProd}$ এবং $Q = \\sqrt{${vA * vA + vB * vB}}$। ` +
      `একটি সমকোণী ত্রিভুজ $\\triangle ABC$-এর সূক্ষ্মকোণ $\\angle A = \\theta$, সন্নিহিত বাহু $b = ${vA}\\text{ cm}$ এবং বিপরীত বাহু $a = ${vB}\\text{ cm}$। ` +
      `একটি সার্বিক সেট $U = \\{x \\in \\mathbb{N} : x \\le ${vA + 6}\\}$ এবং উপসেট $S = \\{x \\in U : x \\text{ জোড় সংখ্যা}\\}$।`;

    subQuestions = [
      {
        id: `${id}_a`,
        label: "ক",
        text: `"${defObj.term}" কাকে বলে? (বাস্তব উদাহরণসহ সংজ্ঞা দাও)`,
        marks: 1,
        answer: `"${defObj.term}" হলো: ${defObj.def}`,
        explanation: `পাঠ্যবইয়ের ১ নম্বরের প্রমিত জ্ঞানমূলক সংজ্ঞা।`
      },
      {
        id: `${id}_b`,
        label: "খ",
        text: `বহুপদী $P(x) = 0$ সমীকরণটির মূলদ্বয় উৎপাদকের সাহায্যে নির্ণয় কর এবং যাচাই কর।`,
        marks: 2,
        answer: `$x^2 - ${vSum}x + ${vProd} = 0 \\implies (x - ${vA})(x - ${vB}) = 0 \\implies x = ${vA} \\text{ অথবা } x = ${vB}$।\nমূলদ্বয় হলো $${vA}$ এবং $${vB}$।`,
        explanation: `উৎপাদক বিশ্লেষণ করে নির্ভুল সমাধান (২ নম্বর)।`
      },
      {
        id: `${id}_c`,
        label: "গ",
        text: `ত্রিভুজ $\\triangle ABC$-এর ক্ষেত্রে অতিভুজের মান নির্ণয় কর এবং দেখাও যে $\\sin^2\\theta + \\cos^2\\theta = 1$।`,
        marks: 3,
        answer: `অতিভুজ $c = \\sqrt{${vA}^2 + ${vB}^2} = \\sqrt{${vA * vA + vB * vB}}\\text{ cm}$।\n$\\sin\\theta = \\frac{${vB}}{\\sqrt{${vA * vA + vB * vB}}}, \\cos\\theta = \\frac{${vA}}{\\sqrt{${vA * vA + vB * vB}}}$।\n$\\sin^2\\theta + \\cos^2\\theta = \\frac{${vB * vB} + ${vA * vA}}{${vA * vA + vB * vB}} = 1$ (প্রমাণিত)।`,
        explanation: `পিথাগোরাসের উপপাদ্য ও ত্রিকোণমিতিক অভেদ যাচাই (৩ নম্বর)।`
      },
      {
        id: `${id}_d`,
        label: "ঘ",
        text: `সেট $S$-এর উপাদান তালিকা তৈরি কর এবং এর শক্তি সেট $P(S)$-এর উপাদান সংখ্যা $2^n$ সূত্রকে সমর্থন করে কিনা প্রমাণ কর।`,
        marks: 4,
        answer: `উপসেট $S$-এর উপাদানসমূহ চিহ্নিত করে দেখা যায় এর মোট উপাদান $n$। অতএব $P(S)$-এর উপাদান সংখ্যা $2^n$ হবে যা সূত্রের সাথে পরিপূর্ণ সংগতিপূর্ণ।`,
        explanation: `উচ্চতর দক্ষতা মূল্যায়ন: তালিকা পদ্ধতি (১), শক্তি সেট বিশ্লেষণ (২), সিদ্ধান্ত (১)।`
      }
    ];

    imageUrl = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 110" width="260" height="110"><rect width="260" height="110" fill="#f8fafc" rx="6" stroke="#cbd5e1" /><polygon points="35,85 190,85 190,20" fill="#f0fdf4" stroke="#16a34a" stroke-width="2" /><text x="100" y="100" font-size="11" fill="#15803d">b = ${vA}</text><text x="200" y="55" font-size="11" fill="#15803d">a = ${vB}</text><text x="80" y="45" font-size="11" font-weight="bold">θ</text></svg>`;
  } else if (chapter.domain === "physics") {
    // 20 UNIQUE CQ SCENARIOS FOR PHYSICS
    const mass = 4 + cqNum * 2;
    const accel = 2 + (cqNum % 3);
    const time = 8 + (cqNum % 4);
    const vel = accel * time;

    stem = `[সৃজনশীল উদ্দীপক ${toBnDigit(cqNum)}]:\n` +
      `একটি $m = ${mass}\\text{ kg}$ ভরের স্থির গাড়ি $a = ${accel}\\text{ m/s}^2$ সুষম ত্বরণে $t = ${time}\\text{ s}$ চলল। ` +
      `এরপর চালক ব্রেক চেপে পরবর্তী $4\\text{ s}$-এ গাড়িটিকে সম্পূর্ণ স্থির করল। ` +
      `গবেষণাগারে শিক্ষার্থীরা গাড়িটির বেগ-সময় গতিপথের ছক তৈরি করল।`;

    subQuestions = [
      {
        id: `${id}_a`,
        label: "ক",
        text: `"${defObj.term}" কাকে বলে?`,
        marks: 1,
        answer: `"${defObj.term}" হলো: ${defObj.def}`,
        explanation: `১ নম্বরের প্রমিত জ্ঞানমূলক সংজ্ঞা।`
      },
      {
        id: `${id}_b`,
        label: "খ",
        text: `সুষম ত্বরণে চলমান বস্তুর সরণ ও সময়ের মধ্যকার দ্বিঘাত সম্পর্ক ($s \\propto t^2$) ব্যাখ্যা কর।`,
        marks: 2,
        answer: `যেহেতু $u = 0$, তাই $s = \\frac{1}{2}at^2$। ত্বরণ $a$ ধ্রুবক হওয়ায় সরণ সময়ের বর্গের সাথে সমানুপাতিক হারে বৃদ্ধি পায়।`,
        explanation: `অনুধাবনমূলক ব্যাখ্যা (২ নম্বর)।`
      },
      {
        id: `${id}_c`,
        label: "গ",
        text: `ত্বরণকালীন সময়ে গাড়িটির অতিক্রান্ত দূরত্ব এবং অর্জিত সর্বোচ্চ বেগ নির্ণয় কর।`,
        marks: 3,
        answer: `$v = u + at = 0 + (${accel})(${time}) = ${vel}\\text{ m/s}$।\n$s = ut + \\frac{1}{2}at^2 = \\frac{1}{2}(${accel})(${time})^2 = ${0.5 * accel * time * time}\\text{ m}$।`,
        explanation: `গতির সূত্রের সাহায্যে সঠিক মান বসিয়ে হিসাব (৩ নম্বর)।`
      },
      {
        id: `${id}_d`,
        label: "ঘ",
        text: `ব্রেক চাপার পর প্রযুক্ত মন্দন বল এবং থামার সময় মোট কৃতকাজ গতিশক্তির সমান কিনা গাণিতিকভাবে বিশ্লেষণ কর।`,
        marks: 4,
        answer: `মন্দন $a' = \\frac{${vel}}{4} = ${(vel / 4).toFixed(2)}\\text{ m/s}^2$।\nমন্দন বল $F = m a' = ${mass} \\times ${(vel / 4).toFixed(2)} = ${(mass * vel / 4).toFixed(1)}\\text{ N}$।\nসর্বোচ্চ গতিশক্তি $E_k = \\frac{1}{2}mv^2 = ${(0.5 * mass * vel * vel).toFixed(1)}\\text{ J}$।\nকাজ-শক্তি উপপাদ্য অনুসারে কৃতকাজ মোট গতিশক্তির সমান।`,
        explanation: `উচ্চতর দক্ষতা: বল নির্ণয় (২), কাজ-শক্তি উপপাদ্য সমর্থন (২)।`
      }
    ];

    imageUrl = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 100" width="260" height="100"><rect width="260" height="100" fill="#f8fafc" rx="6" stroke="#cbd5e1" /><line x1="25" y1="80" x2="235" y2="80" stroke="#334155" stroke-width="2" /><line x1="25" y1="80" x2="25" y2="15" stroke="#334155" stroke-width="2" /><polygon points="25,80 140,30 210,80" fill="#e0f2fe" stroke="#0284c7" stroke-width="2" /><text x="130" y="25" font-size="10" font-weight="bold">v=${vel} m/s</text><text x="120" y="93" font-size="10">t=${time}s</text></svg>`;
  } else if (chapter.domain === "chemistry") {
    // 20 UNIQUE CQ SCENARIOS FOR CHEMISTRY
    const gMass = 8 + cqNum * 2;
    stem = `[সৃজনশীল উদ্দীপক ${toBnDigit(cqNum)}]:\n` +
      `পরীক্ষাগারে $${gMass}\\text{ g}\\ \\text{CaCO}_3$ নমুনায় অতিরিক্ত পরিমাণ লঘু $\\text{HCl}$ যোগ করা হলো। ` +
      `বিক্রিয়ার সমীকরণ: $\\text{CaCO}_3 + 2\\text{HCl} \\to \\text{CaCl}_2 + \\text{H}_2\\text{O} + \\text{CO}_2$। ` +
      `প্রমাণ অবস্থায় (STP) নির্গত $\\text{CO}_2$ গ্যাস সিলিন্ডারে সংগ্রহ করা হলো।`;

    subQuestions = [
      {
        id: `${id}_a`,
        label: "ক",
        text: `"${defObj.term}" কাকে বলে?`,
        marks: 1,
        answer: `"${defObj.term}" হলো: ${defObj.def}`,
        explanation: `জ্ঞানমূলক সংজ্ঞা (১ নম্বর)।`
      },
      {
        id: `${id}_b`,
        label: "খ",
        text: `অ্যাভোগাড্রো সংখ্যা $6.022 \\times 10^{23}$ বলতে কী বোঝায়? ব্যাখ্যা কর।`,
        marks: 2,
        answer: `যেকোনো পদার্থের ১ মোলে বিদ্যমান কণার সংখ্যাকে অ্যাভোগাড্রো সংখ্যা বলে।`,
        explanation: `অনুধাবনমূলক ব্যাখ্যা (২ নম্বর)।`
      },
      {
        id: `${id}_c`,
        label: "গ",
        text: `উদ্দীপকে ব্যবহৃত $\\text{CaCO}_3$ থেকে STP-তে কত লিটার $\\text{CO}_2$ পাওয়া যাবে নির্ণয় কর।`,
        marks: 3,
        answer: `মোল সংখ্যা $n = \\frac{${gMass}}{100} = ${(gMass / 100).toFixed(3)}\\text{ mol}$।\nআয়তন $V = n \\times 22.4 = ${((gMass / 100) * 22.4).toFixed(2)}\\text{ L}$।`,
        explanation: `মোলার আয়তনের সূত্রের সাহায্যে সঠিক গণনা (৩ নম্বর)।`
      },
      {
        id: `${id}_d`,
        label: "ঘ",
        text: `যদি প্রাপ্ত গ্যাসের পরিমাণ তাত্ত্বিক হিসাবের চেয়ে ৫% কম হয়, তবে বিক্রিয়ার শতকরা ফলন ও কারণ গাণিতিকভাবে বিশ্লেষণ কর।`,
        marks: 4,
        answer: `শতকরা ফলন $= 100\\% - 5\\% = 95\\%$। ব্যবহারিক ক্ষতি ও অসম্পূর্ণ বিক্রিয়ার কারণে এই বিচ্যুতি ঘটে।`,
        explanation: `উচ্চতর দক্ষতা: শতকরা ফলন ও রাসায়নিক বিশ্লেষণ (৪ নম্বর)।`
      }
    ];
  } else if (chapter.domain === "ict") {
    // 20 UNIQUE CQ SCENARIOS FOR ICT
    const decNum1 = 20 + cqNum * 2;
    const decNum2 = 8 + cqNum;
    stem = `[সৃজনশীল উদ্দীপক ${toBnDigit(cqNum)}]:\n` +
      `আইসিটি ল্যাবে দুটি সংখ্যা $(${decNum1})_{10}$ এবং $(${decNum2})_{10}$ ইনপুট হিসেবে দেওয়া হলো। ` +
      `শিক্ষক শিক্ষার্থীদের বললেন ৮-বিট রেজিস্টারে ২-এর পরিপূরক পদ্ধতিতে সংখ্যা দুটির পার্থক্য নির্ণয় করতে। ` +
      `অন্য একটি সার্কিটে লজিক ফাংশন $Y = A \\cdot B + \\bar{A} \\cdot B$ বিশ্লেষণ করা হলো।`;

    subQuestions = [
      {
        id: `${id}_a`,
        label: "ক",
        text: `"${defObj.term}" কাকে বলে?`,
        marks: 1,
        answer: `"${defObj.term}" হলো: ${defObj.def}`,
        explanation: `জ্ঞানমূলক সংজ্ঞা (১ নম্বর)।`
      },
      {
        id: `${id}_b`,
        label: "খ",
        text: `ডিজিটাল সার্কিটে কেন হেক্সাডেসিমাল সংখ্যা পদ্ধতি ব্যাপকভাবে ব্যবহৃত হয়? ব্যাখ্যা কর।`,
        marks: 2,
        answer: `প্রতিটি হেক্সাডেসিমাল ডিজিট ৪টি বাইনারি বিট ধারণ করতে পারে, ফলে দীর্ঘ বাইনারি কোডকে সংক্ষেপে ও নির্ভুলভাবে প্রকাশ করা যায়।`,
        explanation: `অনুধাবনমূলক ব্যাখ্যা (২ নম্বর)।`
      },
      {
        id: `${id}_c`,
        label: "গ",
        text: `৮-বিট রেজিস্টারে ২-এর পরিপূরক পদ্ধতি ব্যবহার করে $(${decNum1})_{10} - (${decNum2})_{10}$ নির্ণয় কর।`,
        marks: 3,
        answer: `$(${decNum1})_{10} = (${decNum1.toString(2).padStart(8, "0")})_2$।\n$-(${decNum2})_{10}$-এর ২-এর পরিপূরক যোগ করে বিয়োগফল $= ${decNum1 - decNum2} = (${(decNum1 - decNum2).toString(2)})_2$।`,
        explanation: `ধাপে ধাপে ২-এর পরিপূরক পদ্ধতিতে বিয়োগ নির্ণয় (৩ নম্বর)।`
      },
      {
        id: `${id}_d`,
        label: "ঘ",
        text: `উদ্দীপকের লজিক ফাংশনটিকে বুলিয়ান নিয়মে সরলীকরণ কর এবং শুধুমাত্র সার্বজনীন NAND গেট দিয়ে বাস্তবায়ন কর।`,
        marks: 4,
        answer: `$Y = A \\cdot B + \\bar{A} \\cdot B = (A + \\bar{A})B = 1 \\cdot B = B$। সরলীকৃত রূপ $B$। একে NAND গেট দিয়ে বাস্তবায়ন সম্ভব।`,
        explanation: `উচ্চতর দক্ষতা: বুলিয়ান সরলীকরণ (২), লজিক সার্কিট বাস্তবায়ন (২)।`
      }
    ];
  } else {
    // 20 UNIQUE CQ SCENARIOS FOR BIOLOGY
    const w = 55 + cqNum * 2;
    const h = 1.6;
    stem = `[সৃজনশীল উদ্দীপক ${toBnDigit(cqNum)}]:\n` +
      `দশম শ্রেণির শিক্ষার্থী তামিমের ওজন $${w}\\text{ kg}$ এবং উচ্চতা $${h}\\text{ m}$। স্বাস্থ্য পরীক্ষায় তার বিএমআই পরিমাপ করা হলো। ` +
      `বিজ্ঞান ক্লাসে শিক্ষক মেন্ডেলের মনোহাইব্রিড ক্রসের মাধ্যমে $F_2$ জনুর জিনোটাইপ ও ফিনোটাইপের উপাত্ত উপস্থাপন করলেন।`;

    subQuestions = [
      {
        id: `${id}_a`,
        label: "ক",
        text: `"${defObj.term}" কাকে বলে?`,
        marks: 1,
        answer: `"${defObj.term}" হলো: ${defObj.def}`,
        explanation: `জ্ঞানমূলক সংজ্ঞা (১ নম্বর)।`
      },
      {
        id: `${id}_b`,
        label: "খ",
        text: `প্রকট বৈশিষ্ট্য ও প্রচ্ছন্ন বৈশিষ্ট্যের পার্থক্য ব্যাখ্যা কর।`,
        marks: 2,
        answer: `হেটারোজাইগাস অবস্থায় যে বৈশিষ্ট্য প্রকাশিত হয় তা প্রকট, আর যা অপ্রকাশিত থাকে তা প্রচ্ছন্ন।`,
        explanation: `অনুধাবনমূলক পার্থক্য (২ নম্বর)।`
      },
      {
        id: `${id}_c`,
        label: "গ",
        text: `তামিমের বিএমআই (BMI) গণনা কর এবং বিশ্ব স্বাস্থ্য সংস্থার মানদণ্ডে তার পুষ্টিমান মূল্যায়ন কর।`,
        marks: 3,
        answer: `$\\text{BMI} = \\frac{${w}}{${h}^2} = \\frac{${w}}{${(h * h).toFixed(2)}} = ${(w / (h * h)).toFixed(1)}\\text{ kg/m}^2$। ১৮.৫ হতে ২৪.৯ স্বাভাবিক সীমা।`,
        explanation: `বিএমআই গণনা ও মন্তব্য (৩ নম্বর)।`
      },
      {
        id: `${id}_d`,
        label: "ঘ",
        text: `পানেট স্কয়ারের সাহায্যে $F_2$ জনুর ৩ : ১ ফিনোটাইপিক ও ১ : ২ : ১ জিনোটাইপিক অনুপাত গাণিতিকভাবে বিশ্লেষণ কর।`,
        marks: 4,
        answer: `চেকারবোর্ডে $Tt \\times Tt$ ক্রসে ফিনোটাইপ ৩ লম্বা : ১ খর্বাকার এবং জিনোটাইপ $1 TT : 2 Tt : 1 tt$ প্রমাণিত হয়।`,
        explanation: `উচ্চতর দক্ষতা: পানেট স্কয়ার উপস্থাপন ও অনুপাত প্রতিপাদন (৪ নম্বর)।`
      }
    ];
  }

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
    title: stem,
    imageUrl,
    marks: 10,
    options: [],
    correctIndex: 0,
    subQuestions,
    explanation: "সংশ্লিষ্ট অধ্যায়ের সৃজনশীল কাঠামোর আলোকে প্রতিটি উপ-প্রশ্নের পূর্ণাঙ্গ নির্ভুল গাণিতিক সমাধান উদ্দীপকে অন্তর্ভুক্ত।",
    tags: [className, subject, chapter.title, "CQ", "mathematical", `CQ-${cqNum}`],
    usageCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

// ==========================================
// SEEDING EXECUTION RUNNER
// ==========================================

const CLASS_ALIASES_MAP: Record<string, string[]> = {
  "SSC (Class 9-10)": ["নবম-দশম শ্রেণি (SSC)", "SSC (Class 9-10)", "Class 9-10", "SSC"],
  "HSC (Class 11-12)": ["একাদশ-দ্বাদশ শ্রেণি (HSC)", "HSC (Class 11-12)", "Class 11-12", "HSC"]
};

const SUBJECT_ALIASES_MAP: Record<string, string[]> = {
  "Physics": ["পদার্থবিজ্ঞান", "Physics"],
  "Physics 1st Paper": ["পদার্থবিজ্ঞান ১ম পত্র", "Physics 1st Paper"],
  "Physics 2nd Paper": ["পদার্থবিজ্ঞান ২য় পত্র", "Physics 2nd Paper"],
  "Chemistry": ["রসায়ন", "Chemistry"],
  "Chemistry 1st Paper": ["রসায়ন ১ম পত্র", "Chemistry 1st Paper"],
  "Chemistry 2nd Paper": ["রসায়ন ২য় পত্র", "Chemistry 2nd Paper"],
  "Biology": ["জীববিজ্ঞান", "Biology"],
  "Biology 1st Paper (Botany)": ["জীববিজ্ঞান ১ম পত্র (উদ্ভিদবিজ্ঞান)", "Biology 1st Paper (Botany)", "Botany"],
  "Biology 2nd Paper (Zoology)": ["জীববিজ্ঞান ২য় পত্র (প্রাণিবিজ্ঞান)", "Biology 2nd Paper (Zoology)", "Zoology"],
  "Higher Mathematics": ["উচ্চতর গণিত", "Higher Mathematics"],
  "Higher Mathematics 1st Paper": ["উচ্চতর গণিত ১ম পত্র", "Higher Mathematics 1st Paper"],
  "Higher Mathematics 2nd Paper": ["উচ্চতর গণিত ২য় পত্র", "Higher Mathematics 2nd Paper"],
  "General Mathematics": ["সাধারণ গণিত", "General Mathematics"],
  "ICT": ["তথ্য ও যোগাযোগ প্রযুক্তি", "ICT"]
};

export async function seedCurriculum() {
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required to run the curriculum seed generator.");
  }

  console.log(" Connecting to MongoDB Database...");
  await mongoose.connect(env.MONGODB_URI);
  console.log(" Connected to MongoDB successfully.\n");

  console.log("🗑️  Removing existing question bank items...");
  const delQuestions = await QuestionBankItemModel.deleteMany({});
  console.log(`   Deleted ${delQuestions.deletedCount} previous questions.`);

  console.log("🗑️  Clearing old curriculum hierarchy...");
  await AcademicClassModel.deleteMany({});
  await SubjectModel.deleteMany({});
  await ChapterModel.deleteMany({});
  console.log("   Curriculum hierarchy cleared.\n");

  let totalMCQs = 0;
  let totalCQs = 0;
  let totalChapters = 0;
  const timestamp = new Date().toISOString();

  console.log("=======================================================");
  console.log(" STARTING 100% UNIQUE QUESTION BANK SEEDING");
  console.log(" Target: Exactly 50 MCQs & 20 CQs with ZERO Duplicates per Chapter");
  console.log("=======================================================\n");

  for (let cIdx = 0; cIdx < ALL_CLASSES.length; cIdx++) {
    const classDef = ALL_CLASSES[cIdx];
    const classId = nanoid();
    const classCode = classDef.className.includes("SSC") ? "ssc" : "hsc";

    await AcademicClassModel.create({
      id: classId,
      name: classDef.className,
      nameBn: CLASS_ALIASES_MAP[classDef.className]?.[0] || getBengaliClass(classDef.className),
      code: classCode,
      aliases: CLASS_ALIASES_MAP[classDef.className] || [classDef.className],
      order: cIdx + 1,
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp
    });

    console.log(`\n Class: ${classDef.className} [ID: ${classId}]`);
    console.log(`-------------------------------------------------------`);

    for (let sIdx = 0; sIdx < classDef.subjects.length; sIdx++) {
      const subjectDef = classDef.subjects[sIdx];
      const subjectId = nanoid();
      const subCode = subjectDef.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

      await SubjectModel.create({
        id: subjectId,
        classId,
        name: subjectDef.name,
        nameBn: SUBJECT_ALIASES_MAP[subjectDef.name]?.[0] || getBengaliSubject(subjectDef.name),
        code: subCode,
        category: subjectDef.category,
        aliases: SUBJECT_ALIASES_MAP[subjectDef.name] || [subjectDef.name],
        order: sIdx + 1,
        status: "active",
        createdAt: timestamp,
        updatedAt: timestamp
      });

      console.log(`  > Subject: ${subjectDef.name} [ID: ${subjectId}] (${subjectDef.chapters.length} chapters)`);

      const subjectQuestions: QuestionBankItemRecord[] = [];

      for (let chIdx = 0; chIdx < subjectDef.chapters.length; chIdx++) {
        const chapter = subjectDef.chapters[chIdx];
        const chapterId = nanoid();
        const chFormatted = formatChapterName(chapter.number, chapter.title);
        totalChapters++;

        await ChapterModel.create({
          id: chapterId,
          classId,
          subjectId,
          chapterNumber: chapter.number,
          name: chFormatted,
          nameBn: getBengaliChapter(chFormatted),
          aliases: [chFormatted, chapter.title],
          order: chapter.number,
          status: "active",
          createdAt: timestamp,
          updatedAt: timestamp
        });

        // Generate 50 UNIQUE MCQs
        for (let slot = 1; slot <= 50; slot++) {
          const q = buildEngineMCQ(
            chapter,
            slot,
            classCode,
            subCode,
            classId,
            subjectId,
            chapterId,
            classDef.className,
            subjectDef.name
          );
          subjectQuestions.push(q);
          totalMCQs++;
        }

        // Generate 20 UNIQUE CQs
        for (let cqSlot = 1; cqSlot <= 20; cqSlot++) {
          const cq = buildEngineCQ(
            chapter,
            cqSlot,
            classCode,
            subCode,
            classId,
            subjectId,
            chapterId,
            classDef.className,
            subjectDef.name
          );
          subjectQuestions.push(cq);
          totalCQs++;
        }
      }

      // Batch insert in chunks of 500
      const CHUNK_SIZE = 500;
      for (let i = 0; i < subjectQuestions.length; i += CHUNK_SIZE) {
        const chunk = subjectQuestions.slice(i, i + CHUNK_SIZE);
        await QuestionBankItemModel.insertMany(chunk);
      }

      console.log(`    Seeded ${subjectQuestions.length} unique questions for ${subjectDef.name}`);
    }
  }

  console.log("\n=======================================================");
  console.log(" SEEDING SUMMARY COMPLETED SUCCESSFULLY");
  console.log("=======================================================");
  console.log(`Total Academic Classes: ${ALL_CLASSES.length}`);
  console.log(`Total Chapters Seeded:  ${totalChapters}`);
  console.log(`Total MCQs Created:     ${totalMCQs} (50 unique per chapter)`);
  console.log(`Total CQs Created:      ${totalCQs} (20 unique per chapter)`);
  console.log(`Grand Total Questions:  ${totalMCQs + totalCQs}`);
  console.log("=======================================================\n");

  await mongoose.disconnect();
  console.log(" Disconnected from MongoDB.");
}
