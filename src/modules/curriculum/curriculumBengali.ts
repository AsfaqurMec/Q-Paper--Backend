/**
 * Centralized Bengali translation mapping for National Curriculum
 * (Classes, Subjects, and Chapters) in the ExamCraft backend.
 */

export const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBengaliDigits(val: number | string | undefined | null): string {
  if (val === undefined || val === null) return "";
  return String(val).replace(/[0-9]/g, (d) => BENGALI_DIGITS[Number(d)] ?? d);
}

// ─────────────────────────────────────────────────────────────────────────────
// Academic Classes Mapping
// ─────────────────────────────────────────────────────────────────────────────

export const CLASS_BENGALI_MAP: Record<string, string> = {
  "SSC (Class 9-10)": "৯ম-১০ম শ্রেণি (এসএসসি)",
  "HSC (Class 11-12)": "১১শ-১২শ শ্রেণি (এইচএসসি)",
  "Class 9-10": "৯ম-১০ম শ্রেণি",
  "Class 11-12": "১১শ-১২শ শ্রেণি",
  "Class 10": "১০ম শ্রেণি",
  "Class 9": "৯ম শ্রেণি",
  "Class 8": "৮ম শ্রেণি",
  "Class 7": "৭ম শ্রেণি",
  "Class 6": "৬ষ্ঠ শ্রেণি",
  "SSC": "এসএসসি",
  "HSC": "এইচএসসি",
  "JSC": "জেএসসি"
};

export function getBengaliClass(className?: string | null): string {
  if (!className) return "";
  if (/[\u0980-\u09FF]/.test(className)) return className;
  const trimmed = className.trim();
  return CLASS_BENGALI_MAP[trimmed] || trimmed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Subjects Mapping
// ─────────────────────────────────────────────────────────────────────────────

export const SUBJECT_BENGALI_MAP: Record<string, string> = {
  // General & Science Subjects
  "General Mathematics": "সাধারণ গণিত",
  "Higher Mathematics": "উচ্চতর গণিত",
  "Higher Mathematics 1st Paper": "উচ্চতর গণিত ১ম পত্র",
  "Higher Mathematics 2nd Paper": "উচ্চতর গণিত ২য় পত্র",
  "Physics": "পদার্থবিজ্ঞান",
  "Physics 1st Paper": "পদার্থবিজ্ঞান ১ম পত্র",
  "Physics 2nd Paper": "পদার্থবিজ্ঞান ২য় পত্র",
  "Chemistry": "রসায়ন",
  "Chemistry 1st Paper": "রসায়ন ১ম পত্র",
  "Chemistry 2nd Paper": "রসায়ন ২য় পত্র",
  "Biology": "জীববিজ্ঞান",
  "Biology 1st Paper (Botany)": "জীববিজ্ঞান ১ম পত্র (উদ্ভিদবিজ্ঞান)",
  "Biology 2nd Paper (Zoology)": "জীববিজ্ঞান ২য় পত্র (প্রাণিবিজ্ঞান)",
  "Botany": "উদ্ভিদবিজ্ঞান",
  "Zoology": "প্রাণিবিজ্ঞান",
  "ICT": "তথ্য ও যোগাযোগ প্রযুক্তি",
  "Information & Communication Technology": "তথ্য ও যোগাযোগ প্রযুক্তি",
  "General Science": "সাধারণ বিজ্ঞান",
  "Science": "বিজ্ঞান",

  // Humanities & Business Studies
  "Social Science": "বাংলাদেশ ও বিশ্বপরিচয়",
  "Bangladesh and Global Studies": "বাংলাদেশ ও বিশ্বপরিচয়",
  "Bangla": "বাংলা",
  "Bangla 1st Paper": "বাংলা ১ম পত্র",
  "Bangla 2nd Paper": "বাংলা ২য় পত্র",
  "English": "ইংরেজি",
  "English 1st Paper": "ইংরেজি ১ম পত্র",
  "English 2nd Paper": "ইংরেজি ২য় পত্র",
  "Accounting": "হিসাববিজ্ঞান",
  "Finance & Banking": "ফিন্যান্স ও ব্যাংকিং",
  "Business Entrepreneurship": "ব্যবসায় উদ্যোগ",
  "Agriculture Studies": "কৃষি শিক্ষা",
  "Home Science": "গার্হস্থ্য বিজ্ঞান",
  "Islam and Moral Education": "ইসলাম ও নৈতিক শিক্ষা",
  "Islam & Moral Education": "ইসলাম ও নৈতিক শিক্ষা",
  "Hinduism and Moral Education": "হিন্দুধর্ম ও নৈতিক শিক্ষা",
  "Hinduism & Moral Education": "হিন্দুধর্ম ও নৈতিক শিক্ষা"
};

export function getBengaliSubject(subjectName?: string | null): string {
  if (!subjectName) return "";
  if (/[\u0980-\u09FF]/.test(subjectName)) return subjectName;
  const trimmed = subjectName.trim();
  return SUBJECT_BENGALI_MAP[trimmed] || trimmed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chapter Title Translations (standalone titles without "Chapter X:")
// ─────────────────────────────────────────────────────────────────────────────

export const CHAPTER_TITLE_MAP: Record<string, string> = {
  // SSC General Math
  "Real Numbers": "বাস্তব সংখ্যা",
  "Sets and Functions": "সেট ও ফাংশন",
  "Algebraic Expressions": "বীজগাণিতিক রাশি",
  "Exponents and Logarithms": "সূচক ও লগারিদম",
  "Equations in One Variable": "এক চলকবিশিষ্ট সমীকরণ",
  "Lines, Angles and Triangles": "রেখা, কোণ ও ত্রিভুজ",
  "Practical Geometry": "ব্যবহারিক জ্যামিতি",
  "Circle": "বৃত্ত",
  "Trigonometric Ratios": "ত্রিকোণমিতিক অনুপাত",
  "Distance and Elevation": "দূরত্ব ও উচ্চতা",
  "Algebraic Ratio and Proportion": "বীজগাণিতিক অনুপাত ও সমানুপাত",
  "Simultaneous Equations in Two Variables": "দুই চলকবিশিষ্ট সরল সহসমীকরণ",
  "Finite Series": "সসীম ধারা",
  "Ratio, Similarity and Symmetry": "অনুপাত, সদৃশতা ও প্রতিসমতা",
  "Area Related Theorems and Constructions": "ক্ষেত্রফল সম্পর্কিত উপপাদ্য ও সম্পাদ্য",
  "Mensuration": "পরিমিতি",
  "Statistics": "পরিসংখ্যান",

  // SSC Higher Math
  "Set and Function": "সেট ও ফাংশন",
  "Algebraic Expression": "বীজগাণিতিক রাশি",
  "Geometry": "জ্যামিতি",
  "Geometric Construction": "জ্যামিতিক অঙ্কন",
  "Equations": "সমীকরণ",
  "Inequalities": "অসমতা",
  "Infinite Series": "অসীম ধারা",
  "Trigonometry": "ত্রিকোণমিতি",
  "Exponential and Logarithmic Functions": "সূচকীয় ও লগারিদমীয় ফাংশন",
  "Binomial Expansion": "দ্বিপদী বিস্তৃতি",
  "Coordinate Geometry": "স্থানাঙ্ক জ্যামিতি",
  "Planar Vector": "সমতলে ভেক্টর",
  "Solid Geometry": "ঘন জ্যামিতি",
  "Probability": "সম্ভাবনা",

  // SSC Physics
  "Physical Quantities and Measurement": "ভৌত রাশি এবং পরিমাপ",
  "Motion": "গতি",
  "Force": "বল",
  "Work, Power and Energy": "কাজ, ক্ষমতা ও শক্তি",
  "State of Matter and Pressure": "পদার্থের অবস্থা ও চাপ",
  "Effect of Heat on Matter": "বস্তুর উপর তাপের প্রভাব",
  "Waves and Sound": "তরঙ্গ ও শব্দ",
  "Reflection of Light": "আলোর প্রতিফলন",
  "Refraction of Light": "আলোর প্রতিসরণ",
  "Static Electricity": "স্থির তড়িৎ",
  "Current Electricity": "চল তড়িৎ",
  "Magnetic Effect of Current": "বিদ্যুতের চৌম্বক ক্রিয়া",
  "Modern Physics and Electronics": "আধুনিক পদার্থবিজ্ঞান ও ইলেকট্রনিক্স",
  "Physics to Save Life": "জীবন বাঁচাতে পদার্থবিজ্ঞান",

  // SSC Chemistry
  "Concepts of Chemistry": "রসায়নের ধারণা",
  "States of Matter": "পদার্থের অবস্থা",
  "Structure of Matter": "পদার্থের গঠন",
  "Periodic Table": "পর্যায় সারণি",
  "Chemical Bonds": "রাসায়নিক বন্ধন",
  "Concept of Mole and Chemical Calculations": "মোলের ধারণা ও রাসায়নিক গণনা",
  "Chemical Reactions": "রাসায়নিক বিক্রিয়া",
  "Chemistry and Energy": "রসায়ন ও শক্তি",
  "Acid-Base Balance": "এসিড-ক্ষার সমতা",
  "Mineral Resources: Metal-Nonmetal": "খনিজ সম্পদ: ধাতু-অধাতু",
  "Mineral Resources: Fossils": "খনিজ সম্পদ: জীবাশ্ম",
  "Chemistry in Our Lives": "আমাদের জীবনে রসায়ন",

  // SSC Biology
  "Lessons of Life": "জীবন পাঠ",
  "Cell and Tissue": "জীবকোষ ও টিস্যু",
  "Cell Division": "কোষ বিভাজন",
  "Bioenergetics": "জীবনীশক্তি",
  "Food, Nutrition and Digestion": "খাদ্য, পুষ্টি ও পরিপাক",
  "Transport in Organisms": "জীবে পরিবহন",
  "Exchange of Gases": "গ্যাসীয় বিনিময়",
  "Excretory System": "রেচন প্রক্রিয়া",
  "Movement and Locomotion": "দৃঢ়তা প্রদান ও চলন",
  "Coordination in Organisms": "সমন্বয়",
  "Reproduction in Organisms": "জীবের প্রজনন",
  "Heredity in Organisms and Evolution": "জীবের বংশগতি ও জৈব বিবর্তন",
  "Environment of Life": "জীবের পরিবেশ",
  "Biotechnology": "জীবপ্রযুক্তি",

  // SSC ICT
  "ICT and Our Bangladesh": "তথ্য ও যোগাযোগ প্রযুক্তি এবং আমাদের বাংলাদেশ",
  "Computer and User Security": "কম্পিউটার ও কম্পিউটার ব্যবহারকারীর নিরাপত্তা",
  "My Education and the Internet": "আমার শিক্ষায় ইন্টারনেট",
  "Word Processing and Spreadsheets": "আমার লেখালেখি ও হিসাব",
  "Multimedia and Graphics": "মাল্টিমিডিয়া ও গ্রাফিক্স",
  "Database Software": "ডাটাবেজ-এর ব্যবহার",

  // HSC Higher Math 1st Paper
  "Matrices and Determinants": "ম্যাট্রিক্স ও নির্ণায়ক",
  "Vectors": "ভেক্টর",
  "Straight Lines": "সরলরেখা",
  "Circles": "বৃত্ত",
  "Permutations and Combinations": "বিন্যাস ও সমাবেশ",
  "Combined Trigonometric Ratios": "সংযুক্ত কোণের ত্রিকোণমিতিক অনুপাত",
  "Functions and Graphs of Functions": "ফাংশন ও ফাংশনের লেখচিত্র",
  "Differentiation": "অন্তরীকরণ",
  "Integration": "যোগজীকরণ",

  // HSC Higher Math 2nd Paper
  "Real Numbers and Inequalities": "বাস্তব সংখ্যা ও অসমতা",
  "Linear Programming": "যোগাশ্রয়ী প্রোগ্রাম",
  "Complex Numbers": "জটিল সংখ্যা",
  "Polynomials and Polynomial Equations": "বহুপদী ও বহুপদী সমীকরণ",
  "Conics": "কনিক",
  "Inverse Trigonometric Functions and Equations": "বিপরীত ত্রিকোণমিতিক ফাংশন ও ত্রিকোণমিতিক সমীকরণ",
  "Statics": "স্থিতিবিদ্যা",
  "Dynamics of a Particle": "সমতলে বস্তুকণার গতি",
  "Measures of Dispersion and Probability": "বিস্তার পরিমাপ ও সম্ভাবনা",

  // HSC Physics 1st Paper
  "Physical World and Measurement": "ভৌতজগত ও পরিমাপ",
  "Dynamics": "গতিবিদ্যা",
  "Newtonian Mechanics": "নিউটনিয়ান বলবিদ্যা",
  "Work, Energy and Power": "কাজ, শক্তি ও ক্ষমতা",
  "Gravitation and Gravity": "মহাকর্ষ ও অভিকর্ষ",
  "Structural Properties of Matter": "পদার্থের গাঠনিক ধর্ম",
  "Periodic Motion": "পর্যায়বৃত্ত গতি",
  "Waves": "তরঙ্গ",
  "Ideal Gas and Kinetic Theory": "আদর্শ গ্যাস ও গ্যাসের গতিতত্ত্ব",

  // HSC Physics 2nd Paper
  "Thermodynamics": "তাপগতিবিদ্যা",
  "Electrostatics": "স্থির তড়িৎ",
  "Magnetic Effects of Current": "তড়িৎ প্রবাহের চৌম্বক ক্রিয়া ও চুম্বকত্ব",
  "Electromagnetic Induction and AC": "তাড়িতচৌম্বকীয় আবেশ ও পরিবর্তী প্রবাহ",
  "Geometrical Optics": "জ্যামিতিক আলোকবিজ্ঞান",
  "Physical Optics": "ভৌত আলোকবিজ্ঞান",
  "Introduction to Modern Physics": "আধুনিক পদার্থবিজ্ঞানের সূচনা",
  "Atomic Model and Nuclear Physics": "পরমাণুর মডেল ও নিউক্লিয়ার পদার্থবিজ্ঞান",
  "Semiconductor and Electronics": "সেমিকন্ডাক্টর ও ইলেকট্রনিক্স",
  "Astronomy": "জ্যোতির্বিজ্ঞান",

  // HSC Chemistry 1st Paper
  "Safe Use of Laboratory": "ল্যাবরেটরির নিরাপদ ব্যবহার",
  "Qualitative Chemistry": "গুণগত রসায়ন",
  "Periodic Properties and Chemical Bonds": "মৌলের পর্যায়বৃত্ত ধর্ম ও রাসায়নিক বন্ধন",
  "Chemical Changes": "রাসায়নিক পরিবর্তন",
  "Working Chemistry": "কর্মমুখী রসায়ন",

  // HSC Chemistry 2nd Paper
  "Environmental Chemistry": "পরিবেশ রসায়ন",
  "Organic Chemistry": "জৈব রসায়ন",
  "Quantitative Chemistry": "পরিমাণগত রসায়ন",
  "Electrochemistry": "তড়িৎ রসায়ন",
  "Economic Chemistry": "অর্থনৈতিক রসায়ন",

  // HSC Botany (Biology 1st Paper)
  "Cell and its Structure": "কোষ ও এর গঠন",
  "Cell Chemistry": "কোষ রসায়ন",
  "Microorganisms": "অনুজীব",
  "Algae and Fungi": "শৈবাল ও ছত্রাক",
  "Bryophyta and Pteridophyta": "ব্রায়োফাইটা ও টেরিডোফাইটা",
  "Gymnosperms and Angiosperms": "নগ্নবীজী ও আবৃতবীজী উদ্ভিদ",
  "Tissue and Tissue System": "টিস্যু ও টিস্যুতন্ত্র",
  "Plant Physiology": "উদ্ভিদ শারীরতত্ত্ব",
  "Plant Reproduction": "উদ্ভিদ প্রজনন",
  "Environment, Adaptation and Conservation": "জীবের পরিবেশ, বিস্তার ও সংরক্ষণ",

  // HSC Zoology (Biology 2nd Paper)
  "Animal Diversity and Classification": "প্রাণীর বিভিন্নতা ও শ্রেণিবিন্যাস",
  "Introduction to Animal Types": "প্রাণীর পরিচিতি",
  "Human Physiology: Digestion and Absorption": "মানব শারীরতত্ত্ব: পরিপাক ও শোষণ",
  "Human Physiology: Circulation and Blood": "মানব শারীরতত্ত্ব: রক্ত ও সংবহন",
  "Human Physiology: Breathing and Gas Exchange": "মানব শারীরতত্ত্ব: শ্বাসক্রিয়া ও শ্বসন",
  "Human Physiology: Excretion and Elimination": "মানব শারীরতত্ত্ব: বর্জ্য ও নিষ্কাশন",
  "Human Physiology: Locomotion and Movement": "মানব শারীরতত্ত্ব: চলন ও অঙ্গচালনা",
  "Human Physiology: Coordination and Control": "মানব শারীরতত্ত্ব: সমন্বয় ও নিয়ন্ত্রণ",
  "Human Physiology: Continuity of Life": "মানব জীবনের ধারাবাহিকতা",
  "Human Defense and Immunity": "মানবদেহের প্রতিরক্ষা (অনাক্রম্যতা)",
  "Genetics and Evolution": "জিনতত্ত্ব ও বিবর্তন",
  "Animal Behavior": "প্রাণীর আচরণ",

  // HSC ICT
  "ICT: World and Bangladesh Perspective": "তথ্য ও যোগাযোগ প্রযুক্তি: বিশ্ব ও বাংলাদেশ প্রেক্ষিত",
  "Communication Systems and Networking": "কমিউনিকেশন সিস্টেমস ও নেটওয়ার্কিং",
  "Number Systems and Digital Logic": "সংখ্যা পদ্ধতি ও ডিজিটাল ডিভাইস",
  "Introduction to Web Design and HTML": "ওয়েব ডিজাইন পরিচিতি এবং HTML",
  "Programming Language (C Programming)": "প্রোগ্রামিং ভাষা (সি প্রোগ্রামিং)",
  "Database Management System": "ডাটাবেজ ম্যানেজমেন্ট সিস্টেম"
};

/**
 * Converts any chapter name (e.g. "Chapter 1: Real Numbers" or "Real Numbers")
 * into authentic Bengali format (e.g. "অধ্যায় ১: বাস্তব সংখ্যা").
 */
export function getBengaliChapter(chapterName?: string | null): string {
  if (!chapterName) return "";
  if (/[\u0980-\u09FF]/.test(chapterName)) {
    return chapterName.replace(/\b(\d+)\b/g, (match) => toBengaliDigits(match));
  }

  const trimmed = chapterName.trim();

  // Pattern 1: "Chapter 1: Real Numbers" or "Chapter 1 - Real Numbers"
  const match = trimmed.match(/^Chapter\s*(\d+)[\:\-–\s]+(.*)$/i);
  if (match) {
    const num = match[1];
    const rawTitle = match[2].trim();
    const bnNum = toBengaliDigits(num);
    const bnTitle = CHAPTER_TITLE_MAP[rawTitle] || rawTitle;
    return `অধ্যায় ${bnNum}: ${bnTitle}`;
  }

  // Pattern 2: "Chapter 1"
  const singleMatch = trimmed.match(/^Chapter\s*(\d+)$/i);
  if (singleMatch) {
    return `অধ্যায় ${toBengaliDigits(singleMatch[1])}`;
  }

  // Pattern 3: Just the title (e.g. "Real Numbers")
  if (CHAPTER_TITLE_MAP[trimmed]) {
    return CHAPTER_TITLE_MAP[trimmed];
  }

  return trimmed;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const EXAM_TYPE_BENGALI_MAP: Record<string, string> = {
  "Model Test": "মডেল টেস্ট",
  "Class Test": "শ্রেণি পরীক্ষা",
  "Half-Yearly Exam": "অর্ধ-বার্ষিক পরীক্ষা",
  "Half-Yearly Examination": "অর্ধ-বার্ষিক পরীক্ষা",
  "Half-Yearly": "অর্ধ-বার্ষিক",
  "Annual Exam": "বার্ষিক পরীক্ষা",
  "Annual Examination": "বার্ষিক পরীক্ষা",
  "Final Exam": "বার্ষিক পরীক্ষা",
  "Final Examination": "বার্ষিক পরীক্ষা",
  "Pre-Test Exam": "প্রাক-নির্বাচনী পরীক্ষা",
  "Pre-Test Examination": "প্রাক-নির্বাচনী পরীক্ষা",
  "Pre-Test": "প্রাক-নির্বাচনী",
  "Test Exam": "নির্বাচনী পরীক্ষা",
  "Test Examination": "নির্বাচনী পরীক্ষা",
  "Weekly Quiz": "সাপ্তাহিক কুইজ",
  "Admission Test": "ভর্তি পরীক্ষা"
};

export function getBengaliExamType(examType?: string | null): string {
  if (!examType) return "";
  if (/[\u0980-\u09FF]/.test(examType)) return examType;
  const trimmed = examType.trim();
  return EXAM_TYPE_BENGALI_MAP[trimmed] || trimmed;
}

export function formatBengaliDuration(duration?: string | null): string {
  if (!duration) return "২ ঘণ্টা";
  let str = duration.trim();
  str = str
    .replace(/(\d+)\s*(?:hours?|hrs?|hr|h)\b/gi, (_, n) => `${toBengaliDigits(n)} ঘণ্টা`)
    .replace(/(\d+)\s*(?:minutes?|mins?|min|m)\b/gi, (_, n) => `${toBengaliDigits(n)} মিনিট`)
    .replace(/মিনিটs\b/gi, "মিনিট")
    .replace(/\s*s\b/gi, "");
  return toBengaliDigits(str);
}

export function getBengaliPaperTitle(title?: string | null, className?: string | null, subject?: string | null): string {
  if (!title) {
    const cls = getBengaliClass(className);
    const subj = getBengaliSubject(subject);
    return [cls, subj, "মডেল টেস্ট"].filter(Boolean).join(" ") || "প্রশ্নপত্র";
  }

  let result = title.trim();

  // 1. Classes replacement (longest first to avoid substring collision)
  const sortedClasses = Object.entries(CLASS_BENGALI_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [enCls, bnCls] of sortedClasses) {
    const regex = new RegExp(escapeRegExp(enCls), "gi");
    result = result.replace(regex, bnCls);
  }

  // 2. Subjects replacement (longest first)
  const sortedSubjects = Object.entries(SUBJECT_BENGALI_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [enSubj, bnSubj] of sortedSubjects) {
    const regex = new RegExp(escapeRegExp(enSubj), "gi");
    result = result.replace(regex, bnSubj);
  }

  // 3. Chapters replacement
  for (const [enChap, bnChap] of Object.entries(CHAPTER_TITLE_MAP)) {
    const regex = new RegExp(escapeRegExp(enChap), "gi");
    result = result.replace(regex, bnChap);
  }

  // 4. Common exam and syllabus terms
  result = result
    .replace(/\bFull Subject Model Test\b/gi, "সম্পূর্ণ বিষয় মডেল টেস্ট")
    .replace(/\bFull Subject\b/gi, "সম্পূর্ণ পাঠ্যক্রম")
    .replace(/\bFull Syllabus\b/gi, "সম্পূর্ণ সিলেবাস")
    .replace(/\bComplete Syllabus\b/gi, "সম্পূর্ণ সিলেবাস")
    .replace(/\bModel Test\b/gi, "মডেল টেস্ট")
    .replace(/\bFinal Exam(?:ination)?\b/gi, "বার্ষিক পরীক্ষা")
    .replace(/\bAnnual Exam(?:ination)?\b/gi, "বার্ষিক পরীক্ষা")
    .replace(/\bPre-Test Exam(?:ination)?\b/gi, "প্রাক-নির্বাচনী পরীক্ষা")
    .replace(/\bPre-Test\b/gi, "প্রাক-নির্বাচনী")
    .replace(/\bTest Exam(?:ination)?\b/gi, "নির্বাচনী পরীক্ষা")
    .replace(/\bHalf-Yearly Exam(?:ination)?\b/gi, "অর্ধ-বার্ষিক পরীক্ষা")
    .replace(/\bHalf-Yearly\b/gi, "অর্ধ-বার্ষিক")
    .replace(/\bClass Test\b/gi, "শ্রেণি পরীক্ষা")
    .replace(/\bWeekly Quiz\b/gi, "সাপ্তাহিক কুইজ")
    .replace(/\bQuestion Paper\b/gi, "প্রশ্নপত্র")
    .replace(/\bExamination\b/gi, "পরীক্ষা")
    .replace(/\bExam\b/gi, "পরীক্ষা")
    .replace(/\bQuestion\b/gi, "প্রশ্ন")
    .replace(/\bChapter\b/gi, "অধ্যায়")
    .replace(/\bCh\.?\s*(\d+)/gi, (_, n) => `অধ্যায় ${toBengaliDigits(n)}`);

  // 5. Convert any English digits
  result = toBengaliDigits(result);

  // 6. Clean spaces and dashes
  result = result.replace(/\s+/g, " ").trim();

  return result;
}

export function sanitizeUnicodeFileName(value: string): string {
  return value
    .replace(/[/\\?%*:|"<>#]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "প্রশ্নপত্র";
}

export function getBengaliExportFileName(opts: {
  paperName?: string | null;
  className?: string | null;
  subject?: string | null;
  setName?: string | null;
  isAllSets?: boolean;
  withAnswer?: boolean;
  format: "pdf" | "docx";
}): string {
  const bnTitle = getBengaliPaperTitle(opts.paperName, opts.className, opts.subject);
  const safeTitle = sanitizeUnicodeFileName(bnTitle);

  let setSuffix = "";
  if (opts.isAllSets) {
    setSuffix = "-সকল-সেট";
  } else if (opts.setName && opts.setName.toLowerCase() !== "none" && opts.setName.toLowerCase() !== "original") {
    const banglaSetMap: Record<string, string> = { A: "ক", B: "খ", C: "গ", D: "ঘ", 1: "১", 2: "২", 3: "৩", 4: "৪" };
    const cleanSet = opts.setName.trim();
    const setLabel = banglaSetMap[cleanSet.toUpperCase()] || banglaSetMap[cleanSet] || cleanSet;
    setSuffix = `-সেট-${setLabel}`;
  }

  const answerSuffix = opts.withAnswer ? "-উত্তরসহ" : "-প্রশ্নপত্র";
  return `${safeTitle}${setSuffix}${answerSuffix}.${opts.format}`;
}
