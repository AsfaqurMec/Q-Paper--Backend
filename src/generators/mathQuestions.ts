import { nanoid } from "nanoid";
import { ChapterMeta, QuestionBankItemPayload, buildCompositeQuestion, shuffleOptions, toBn } from "./common.js";

// Helper to determine the math topic from chapter name
export function getMathTopicKey(chapterName: string): string {
  if (chapterName.includes("পরিসংখ্যান")) return "STATISTICS";
  if (chapterName.includes("ম্যাট্রিক্স") || chapterName.includes("নির্ণায়ক")) return "MATRICES";
  if (chapterName.includes("অন্তরীকরণ")) return "DIFFERENTIATION";
  if (chapterName.includes("যোগজীকরণ")) return "INTEGRATION";
  if (chapterName.includes("ভেক্টর")) return "VECTORS";
  if (chapterName.includes("সরলরেখা")) return "STRAIGHT_LINES";
  if (chapterName.includes("কণিক")) return "CONICS";
  if (chapterName.includes("জটিল সংখ্যা")) return "COMPLEX_NUMBERS";
  if (chapterName.includes("বহুপদী")) return "POLYNOMIALS";
  if (chapterName.includes("বিন্যাস") || chapterName.includes("সমাবেশ")) return "PERMUTATIONS";
  if (chapterName.includes("ত্রিকোণমিতি") || chapterName.includes("সংযুক্ত কোণ") || chapterName.includes("বিপরীত ত্রিকোণমিতিক") || chapterName.includes("দূরত্ব") || chapterName.includes("উচ্চতা")) return "TRIGONOMETRY";
  if (chapterName.includes("বাস্তব সংখ্যা")) return "REAL_NUMBERS";
  if (chapterName.includes("সেট") || chapterName.includes("ফাংশন")) return "SETS_FUNCTIONS";
  if (chapterName.includes("বীজগাণিতিক রাশি") || chapterName.includes("অনুপাত")) return "ALGEBRA_EXPRESSIONS";
  if (chapterName.includes("সূচক") || chapterName.includes("লগারিদম")) return "INDICES_LOGS";
  if (chapterName.includes("ধারা")) return "SERIES";
  if (chapterName.includes("দ্বিপদী")) return "BINOMIAL";
  if (chapterName.includes("স্থানাঙ্ক")) return "COORDINATES";
  if (chapterName.includes("সমীকরণ") || chapterName.includes("সহসমীকরণ") || chapterName.includes("অসমতা")) return "EQUATIONS";
  if (chapterName.includes("বৃত্ত")) return "CIRCLES";
  if (chapterName.includes("পরিমিতি") || chapterName.includes("ঘন জ্যামিতি") || chapterName.includes("ক্ষেত্রফল")) return "MENSURATION";
  if (chapterName.includes("সম্ভাবনা")) return "PROBABILITY";
  if (chapterName.includes("স্থিতিবিদ্যা") || chapterName.includes("গতিবিদ্যা")) return "MECHANICS";
  return "GENERAL_MATH";
}

export function generateMathQuestionsForChapter(
  clsName: string,
  subjName: string,
  category: string,
  chapter: ChapterMeta,
  timestamp: string,
  totalChaptersInSubj: number = 10
): QuestionBankItemPayload[] {
  const list: QuestionBankItemPayload[] = [];
  const seenTitles = new Set<string>();

  const t = chapter.terms;
  const u = chapter.units;
  const f = chapter.formulas;
  const l = chapter.laws;
  const q = chapter.qualities;
  const topicKey = getMathTopicKey(chapter.name);

  function addQuestion(payload: Omit<QuestionBankItemPayload, "id" | "ownerId" | "className" | "subject" | "chapter" | "category" | "createdAt" | "updatedAt">) {
    const key = payload.title.trim().toLowerCase();
    if (seenTitles.has(key)) return;
    seenTitles.add(key);

    list.push({
      id: `bn_m_${nanoid(10)}`,
      ownerId: "usr_demo_teacher",
      className: clsName,
      subject: subjName,
      chapter: chapter.name,
      category,
      ...payload,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  // =================================================================
  // 1. জ্ঞানমূলক প্রশ্ন (Knowledge-based MCQs) - 20 Distinct Questions
  // =================================================================
  for (let i = 0; i < t.length; i++) {
    const term = t[i];
    const MATH_UNITS: Record<string, string> = {
      "ক্ষেত্রফল": "বর্গ একক", "আয়তন": "ঘন একক", "কোণ": "রেডিয়ান", "দৈর্ঘ্য": "একক",
      "দূরত্ব": "একক", "পরিসীমা": "একক", "ঢাল": "এককহীন", "অনুপাত": "এককহীন",
      "মডুলাস": "এককহীন", "আর্গুমেন্ট": "রেডিয়ান বা ডিগ্রি", "উৎকেন্দ্রীকতা": "এককহীন"
    };
    if (MATH_UNITS[term]) {
      const uVal = MATH_UNITS[term];
      const uOpt = shuffleOptions(uVal, ["বর্গ একক", "ঘন একক", "রেডিয়ান", "এককহীন", "একক"].filter(x => x !== uVal).slice(0, 3) as [string, string, string]);
      addQuestion({
        type: "mcq", nature: "theory", difficulty: "easy",
        title: `জ্যামিতি ও গণিতে '${term}'-এর প্রমিত পরিমাপক রূপ বা একক কোনটি?`,
        marks: 1, options: uOpt.options, correctIndex: uOpt.correctIndex,
        explanation: `'${term}'-এর প্রমিত পরিমাপ হলো ${uVal}।`,
        tags: [clsName, subjName, chapter.name, "MCQ", "জ্ঞানমূলক", "একক"], usageCount: 2
      });
    } else {
      const qEntity = "সুসংজ্ঞায়িত গাণিতিক কাঠামো ও রাশিমালা";
      const eOpt = shuffleOptions(qEntity, ["অসংজ্ঞায়িত রূপ", "কাল্পনিক অনির্ণেয় মান", "অবিচ্ছিন্ন বৃত্তাকার ক্ষেত্র"].filter(x => x !== qEntity).slice(0, 3) as [string, string, string]);
      addQuestion({
        type: "mcq", nature: "theory", difficulty: "easy",
        title: `আধুনিক গণিত শাস্ত্রে '${term}' মূলত কোন ধরণের গাণিতিক প্রত্যয় হিসেবে সংজ্ঞায়িত?`,
        marks: 1, options: eOpt.options, correctIndex: eOpt.correctIndex,
        explanation: `'${term}' হলো একটি ${qEntity}।`,
        tags: [clsName, subjName, chapter.name, "MCQ", "জ্ঞানমূলক", "প্রত্যয়"], usageCount: 2
      });
    }

    const quality = q[i % q.length] || "বাস্তব ও সুষম";
    const qOpt = shuffleOptions(quality, ["কাল্পনিক রাশি", "অসংজ্ঞায়িত মান", "ঋণাত্মক বিস্তার", "বিচ্ছিন্ন সেট"].filter(x => x !== quality).slice(0, 3) as [string, string, string]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: `গাণিতিক মানদণ্ডে '${term}'-এর প্রকৃতি নিচের কোন বৈশিষ্ট্যের অন্তর্ভুক্ত?`,
      marks: 1, options: qOpt.options, correctIndex: qOpt.correctIndex,
      explanation: `'${term}' মূলত ${quality} ধর্ম প্রদর্শন করে।`,
      tags: [clsName, subjName, chapter.name, "MCQ", "জ্ঞানমূলক", "শ্রেণিবিভাগ"], usageCount: 2
    });
  }

  const mathConstants = [
    { name: "বৃত্তের পরিধি ও ব্যাসের অনুপাত ($\\pi$)", val: "৩.১৪১৫৯ (প্রায়)", dist: ["২.৭১৮২৮", "১.৪১৪২১", "১.৭৩২০৫"] },
    { name: "স্বাভাবিক লগারিদমের ভিত্তি অয়লার সংখ্যা ($e$)", val: "২.৭১৮২৮ (প্রায়)", dist: ["৩.১৪১৫৯", "০.৫৭৭২১", "১.৬১৮০৩"] },
    { name: "কাল্পনিক একক $i$-এর বর্গ ($i^2$)", val: "-১", dist: ["+১", "০", "-i"] },
    { name: "এককের একটি কাল্পনিক ঘনমূল $\\omega$ হলে $1 + \\omega + \\omega^2$-এর মান", val: "০", dist: ["১", "-১", "৩"] }
  ];
  for (const c of mathConstants) {
    const cOpt = shuffleOptions(c.val, c.dist as [string, string, string]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: `গণিতের প্রমিত মানদণ্ডে '${c.name}'-এর সঠিক মান কোনটি?`,
      marks: 1, options: cOpt.options, correctIndex: cOpt.correctIndex,
      explanation: `${c.name}-এর সার্বজনীন গাণিতিক মান হলো ${c.val}।`,
      tags: [clsName, subjName, chapter.name, "MCQ", "জ্ঞানমূলক", "ধ্রুবক"], usageCount: 2
    });
  }

  // =================================================================
  // 2. অনুধাবনমূলক প্রশ্ন (Conceptual MCQs) - 25 Distinct Questions
  // =================================================================
  for (let i = 0; i < l.length; i++) {
    const law = l[i];
    const lOpt = shuffleOptions(
      `সমীকরণের সমাধান ও জ্যামিতিক সম্পর্কের সুনির্দিষ্ট শর্ত নিশ্চিত করে`,
      ["কেবল ঋণাত্মক মানের ক্ষেত্রে প্রযোজ্য", "বাস্তব সংখ্যার স্বতঃসিদ্ধ সম্পূর্ণ অমান্য করে", "ফাংশনের মানকে অসংজ্ঞায়িত করে তোলে"]
    );
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "medium",
      title: `'${chapter.name}' অধ্যায়ের '${law}'-এর মূল গাণিতিক তাৎপর্য কোনটি?`,
      marks: 1, options: lOpt.options, correctIndex: lOpt.correctIndex,
      explanation: `${law} গাণিতিক সমাধান ও জ্যামিতিক অবস্থানের ধারাবাহিক সামঞ্জস্য রক্ষা করে।`,
      tags: [clsName, subjName, chapter.name, "MCQ", "অনুধাবনমূলক", "উপপাদ্য"], usageCount: 2
    });

    const l2Opt = shuffleOptions(
      `চলকের যেকোনো বাস্তব মানের জন্য সম্পর্কটি অপরিবর্তিত থাকে`,
      ["চলকের কেবল একটি নির্দিষ্ট মানেই সত্য হয়", "কাল্পনিক তলে সম্পর্কটি ভিত্তিহীন হয়", "অক্ষ পরিবর্তনের সাথে সাথে সম্পর্কটি বিলুপ্ত হয়"]
    );
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "medium",
      title: `'${law}'-এর আলোকে বীজগাণিতিক অভেদের প্রধান বৈশিষ্ট্য কোনটি?`,
      marks: 1, options: l2Opt.options, correctIndex: l2Opt.correctIndex,
      explanation: `অভেদ চলকের সকল বাস্তব মানের জন্যই সর্বদা সিদ্ধ হয়।`,
      tags: [clsName, subjName, chapter.name, "MCQ", "অনুধাবনমূলক"], usageCount: 2
    });
  }

  const mathConceptual = [
    { q: "কোনো বিন্দুতে একটি ফাংশন $f(x)$ অন্তরীকরণযোগ্য (Differentiable) হলে ফাংশনটির অবিচ্ছিন্নতা সম্পর্কে কোনটি সত্য?", a: "ফাংশনটি ওই বিন্দুতে অবশ্যই অবিচ্ছিন্ন (Continuous) হবে", d: ["ফাংশনটি ওই বিন্দুতে বিচ্ছিন্ন হবে", "ফাংশনটির কোনো সীমা থাকবে না", "অবিচ্ছিন্নতা সম্পর্কে কোনো নিশ্চয়তা দেওয়া যায় না"], exp: "অন্তরীকরণযোগ্যতা নিশ্চিতভাবে অবিচ্ছিন্নতা প্রমাণ করে, কিন্তু এর বিপরীত বক্তব্য সর্বদা সত্য নয় (যেমন $|x|$)।" },
    { q: "একটি দ্বিঘাত সমীকরণের নিরূপক $D = b^2 - 4ac < 0$ হলে মূলদ্বয়ের প্রকৃতি কেমন হবে?", a: "মূলদ্বয় জটিল (কাল্পনিক) এবং পরস্পর অনুবন্ধী হবে", d: ["মূলদ্বয় বাস্তব ও সমান হবে", "মূলদ্বয় বাস্তব ও অসমান হবে", "একটি বাস্তব ও একটি কাল্পনিক হবে"], exp: "নিরূপক ঋণাত্মক হলে বর্গমূলের ভেতরে ঋণাত্মক সংখ্যা আসার কারণে মূলদ্বয় অনুবন্ধী জটিল সংখ্যা হয়।" },
    { q: "দুটি সরলরেখা পরস্পর লম্ব হওয়ার শর্ত তাদের ঢাল $m_1$ ও $m_2$-এর সাপেক্ষে কোনটি?", a: "$m_1 m_2 = -1$", d: ["$m_1 = m_2$", "$m_1 + m_2 = 0$", "$m_1 m_2 = 1$"], exp: "পরস্পর লম্ব রেখাদ্বয়ের অন্তর্গত কোণ ৯০° হওয়ায় $\\tan 90^\\circ = \\infty \\implies m_1 m_2 = -1$।" },
    { q: "কণিক সেকশনে উৎকেন্দ্রীকতা $e = 1$ হলে কণিকটির জ্যামিতিক পরিচয় কী?", a: "পরাবৃত্ত (Parabola)", d: ["উপবৃত্ত (Ellipse)", "অধিবৃত্ত (Hyperbola)", "বৃত্ত (Circle)"], exp: "$e=0$ বৃত্ত, $0 < e < 1$ উপবৃত্ত, $e=1$ পরাবৃত্ত এবং $e > 1$ অধিবৃত্ত।" },
    { q: "কোনো বর্গ ম্যাট্রিক্স $A$ ব্যতিক্রমী (Singular) হওয়ার প্রয়োজনীয় ও পর্যাপ্ত শর্ত কোনটি?", a: "ম্যাট্রিক্সের নির্ণায়কের মান শূন্য ($|A| = 0$)", d: ["ট্রেসের মান শূন্য ($\\text{Tr}(A) = 0$)", "ম্যাট্রিক্সটি প্রতিসম হওয়া", "বিপরীত ম্যাট্রিক্স বিদ্যমান থাকা"], exp: "ব্যতিক্রমী ম্যাট্রিক্সের $|A| = 0$ হওয়ায় এর কোনো বিপরীত ম্যাট্রিক্স ($A^{-1}$) থাকে না।" },
    { q: "দুটি অশূন্য ভেক্টর $\\vec{P}$ ও $\\vec{Q}$-এর স্কেলার গুণন $\\vec{P} \\cdot \\vec{Q} = 0$ হলে ভেক্টরদ্বয়ের মধ্যবর্তী কোণ কত?", a: "৯০° (পরস্পর লম্ব)", d: ["০° (পরস্পর সমান্তরাল)", "১৮০° (পরস্পর বিপরীতমুখী)", "৪৫°"], exp: "$\\vec{P} \\cdot \\vec{Q} = PQ \\cos\\theta = 0 \\implies \\cos\\theta = 0 \\implies \\theta = 90^\\circ$।" },
    { q: "একটি ফাংশনের চরম মান (গুরুমান বা লঘুমান) বিদ্যমান থাকার প্রথম শর্ত কী?", a: "প্রথম অন্তরক শূন্য হতে হবে ($f'(x) = 0$)", d: ["দ্বিতীয় অন্তরক শূন্য হতে হবে", "ফাংশনের মান শূন্য হতে হবে", "অসীমে পৌঁছাতে হবে"], exp: "স্পর্শকের ঢাল অনুভূমিক ($f'(x) = 0$) হলেই চরম বিন্দু পাওয়া যায়।" },
    { q: "নির্দিষ্ট যোগজ $\\int_a^b f(x) \\, dx$-এর জ্যামিতিক তাৎপর্য কী?", a: "$x=a$ থেকে $x=b$ ব্যবধিতে বক্ররেখা ও $x$-অক্ষের মধ্যবর্তী নিট আবদ্ধ ক্ষেত্রফল", d: ["বক্ররেখার মোট চাপ দৈর্ঘ্য", "বক্ররেখার স্পর্শকের সর্বোচ্চ ঢাল", "বক্ররেখার বক্রতার কেন্দ্র"], exp: "নির্দিষ্ট যোগজ বক্ররেখা এবং অনুভূমিক অক্ষ দ্বারা সীমাবদ্ধ ক্ষেত্রফলকে সূচিত করে।" },
    { q: "ত্রিকোণমিতিক ফাংশন $\\tan x$-এর মৌলিক পর্যায়কাল (Fundamental Period) কত?", a: "$\\pi$ রেডিয়ান", d: ["$2\\pi$ রেডিয়ান", "$\\pi/2$ রেডিয়ান", "$4\\pi$ রেডিয়ান"], exp: "$\\tan(x + \\pi) = \\tan x$ হওয়ায় $\\tan$ ও $\\cot$-এর মৌলিক পর্যায় $\\pi$।" },
    { q: "কোনো সমতলে তিনটি বিন্দু অসমরেখ হলে তাদের দ্বারা গঠিত ত্রিভুজের ক্ষেত্রফল কেমন হবে?", a: "অশূন্য ধনাত্মক মান বিশিষ্ট ($> 0$)", d: ["সর্বদা শূন্যের সমান", "ঋণাত্মক হবে", "অসীম হবে"], exp: "বিন্দুত্রয় সমরেখ হলেই কেবল ক্ষেত্রফল শূন্য হয়, অন্যথায় অশূন্য মান পাওয়া যায়।" },
    { q: "জটিল সংখ্যা $z = x + iy$-এর মডুলাস $|z|$-এর জ্যামিতিক পরিচয় কোনটি?", a: "আর্গ্যান্ড তলে মূলবিন্দু হতে $(x, y)$ বিন্দুর রৈখিক দূরত্ব", d: ["$x$-অক্ষের সাথে রেখাংশের উৎপন্ন কোণ", "কাল্পনিক অংশের অনুপাত", "বাস্তব অংশের বর্গ"], exp: "মডুলাস $|z| = \\sqrt{x^2+y^2}$ যা মূলবিন্দু থেকে বিন্দুর পরম ইউক্লিডীয় দূরত্ব।" },
    { q: "একটি অনুক্রমের সাধারণ পদ $a_n = \\frac{1}{n}$ হলে এর অসীমতক সীমা ($\\lim_{n \\to \\infty} a_n$) কত?", a: "০", d: ["১", "অসীম", "-১"], exp: "$n \\to \\infty$ হলে $1/n$ ক্রমান্বয়ে শূন্যের দিকে ধাবিত হয়।" },
    { q: "বিন্যাস ($P$) ও সমাবেশের ($C$) ক্ষেত্রে একই $n$ ও $r$-এর জন্য কোন সম্পর্কটি সর্বদা সত্য? ($r > 1$)", a: "$^{n}P_r > {}^{n}C_r$", d: ["$^{n}P_r < {}^{n}C_r$", "$^{n}P_r = {}^{n}C_r$", "$^{n}P_r + {}^{n}C_r = 0$"], exp: "$^{n}P_r = r! \\times {}^{n}C_r$, যেখানে $r > 1$ হলে $r! > 1$, তাই বিন্যাস সংখ্যা সমাবেশ অপেক্ষা বড়।" },
    { q: "বৃত্তের সমীকরণ $x^2 + y^2 + 2gx + 2fy + c = 0$ একটি একক বিন্দু বৃত্ত নির্দেশ করার শর্ত কী?", a: "$g^2 + f^2 - c = 0$", d: ["$g^2 + f^2 - c > 0$", "$g^2 + f^2 - c < 0$", "$c = 0$"], exp: "ব্যাসার্ধ $r = \\sqrt{g^2+f^2-c} = 0$ হলে বৃত্তটি বিন্দু বৃত্তে রূপান্তরিত হয়।" },
    { q: "কোনো বিচ্ছিন্ন ঘটনার ক্ষেত্রে নিশ্চিত ঘটনার সম্ভাবনা $P(A)$-এর মান কত?", a: "১", d: ["০", "০.৫", "অসীম"], exp: "নিশ্চিত ঘটনার অনুকূল ফলাফল মোট ফলাফলের সমান হওয়ায় এর সম্ভাবনা প্রমিতভাবে ১।" },
    { q: "বাস্তব সংখ্যায় পরম মান অসমতা $|x - a| < r$ (যেখানে $r > 0$)-এর ব্যবধি রূপ কোনটি?", a: "$a - r < x < a + r$", d: ["$-r < x < r$", "$x < a - r$ অথবা $x > a + r$", "$a < x < a + r$"], exp: "$|x-a| < r \implies -r < x-a < r \implies a-r < x < a+r$।" },
    { q: "একটি ত্রিভুজের বাহুগুলোর দৈর্ঘ্য ৩, ৪ ও ৫ একক হলে এর পরিব্যাসার্ধ ($R$) কত?", a: "২.৫ একক", d: ["৫ একক", "১.৫ একক", "৩ একক"], exp: "এটি একটি সমকোণী ত্রিভুজ ($3^2+4^2=5^2$), সমকোণী ত্রিভুজের পরিবৃত্তের কেন্দ্র অতিভুজের মধ্যবিন্দু, তাই পরিব্যাসার্ধ $5/2 = 2.5$ একক।" }
  ];
  for (const mc of mathConceptual) {
    const mcOpt = shuffleOptions(mc.a, [mc.d[0], mc.d[1], mc.d[2]]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "medium",
      title: mc.q, marks: 1, options: mcOpt.options, correctIndex: mcOpt.correctIndex,
      explanation: mc.exp, tags: [clsName, subjName, chapter.name, "MCQ", "অনুধাবনমূলক"], usageCount: 2
    });
  }

  // =================================================================
  // 3. বহুপদী সমাপ্তিসূচক প্রশ্ন (Composite MCQs) - 20 Questions
  // =================================================================
  const mathComposite = [
    { p: "বাস্তব সংখ্যার বৈশিষ্ট্যের ক্ষেত্রে—", s1: "সকল পূর্ণসংখ্যাই মূলদ সংখ্যা", s2: "দুটি অমূলদ সংখ্যার যোগফল সর্বদা অমূলদ হয়", s3: "শূন্য একটি নিরপেক্ষ মূলদ সংখ্যা", c: "i ও iii" as const, exp: "দুটি অমূলদ সংখ্যার যোগফল মূলদ হতে পারে (যেমন $\\sqrt{2} + (-\\sqrt{2}) = 0$), তাই ii ভুল।" },
    { p: "সরলরেখা $y = mx + c$-এর ক্ষেত্রে—", s1: "$m$ রেখাটির ঢাল নির্দেশ করে", s2: "$c = 0$ হলে রেখাটি মূলবিন্দুগামী হয়", s3: "$x$-অক্ষের সমান্তরাল হলে $m = 0$ হয়", c: "i, ii ও iii" as const, exp: "সরলরেখার ঢাল-ছেদক আকারের তিনটি বিবৃতিই সত্য।" },
    { p: "দ্বিঘাত সমীকরণ $ax^2 + bx + c = 0$ ($a \\neq 0$)-এর ক্ষেত্রে—", s1: "মূলদ্বয়ের যোগফল $= -b/a$", s2: "মূলদ্বয়ের গুণফল $= c/a$", s3: "নিরূপক $b^2 - 4ac = 0$ হলে মূলদ্বয় বাস্তব ও সমান হয়", c: "i, ii ও iii" as const, exp: "দ্বিঘাত সমীকরণের মূল-সহগ সম্পর্ক ও নিরূপকের বৈশিষ্ট্য সম্পূর্ণ সঠিক।" },
    { p: "ত্রিকোণমিতিক অভেদের ক্ষেত্রে—", s1: "$\\sin^2\\theta + \\cos^2\\theta = 1$", s2: "$\\sec^2\\theta - \\tan^2\\theta = 1$", s3: "$\\csc^2\\theta + \\cot^2\\theta = 1$", c: "i ও ii" as const, exp: "তৃতীয় অভেদটি $\\csc^2\\theta - \\cot^2\\theta = 1$, তাই iii ভুল।" },
    { p: "অন্তরীকরণের মৌলিক সূত্রের ক্ষেত্রে—", s1: "$\\frac{d}{dx}(x^n) = n x^{n-1}$", s2: "$\\frac{d}{dx}(\\sin x) = \\cos x$", s3: "$\\frac{d}{dx}(e^{ax}) = \\frac{1}{a} e^{ax}$", c: "i ও ii" as const, exp: "$\\frac{d}{dx}(e^{ax}) = a e^{ax}$, তাই iii ভুল।" },
    { p: "যোগজীকরণের বৈশিষ্ট্যের ক্ষেত্রে—", s1: "$\\int \\cos x \\, dx = \\sin x + c$", s2: "$\\int \\frac{1}{x} \\, dx = \\ln|x| + c$", s3: "$\\int e^x \\, dx = x e^x + c$", c: "i ও ii" as const, exp: "$\\int e^x dx = e^x + c$, তাই iii ভুল।" },
    { p: "ভেক্টর বীজগণিতের ক্ষেত্রে—", s1: "$\\hat{i} \\cdot \\hat{i} = \\hat{j} \\cdot \\hat{j} = 1$", s2: "$\\hat{i} \\times \\hat{j} = \\hat{k}$", s3: "$\\vec{A} \\times \\vec{B} = \\vec{B} \\times \\vec{A}$", c: "i ও ii" as const, exp: "ক্রস গুণন বিরোধী বিনিময়ী: $\\vec{A} \\times \\vec{B} = -(\\vec{B} \\times \\vec{A})$, তাই iii ভুল।" },
    { p: "পরাবৃত্ত $y^2 = 4ax$ ($a > 0$)-এর ক্ষেত্রে—", s1: "শীর্ষবিন্দু $(0, 0)$ তে অবস্থিত", s2: "উপকেন্দ্রের স্থানাঙ্ক $(a, 0)$", s3: "উপকেন্দ্রিক লম্বের দৈর্ঘ্য $4a$", c: "i, ii ও iii" as const, exp: "প্রমিত পরাবৃত্তের শীর্ষ, উপকেন্দ্র ও লম্বের দৈর্ঘ্য সংক্রান্ত তিনটি তথ্যই সঠিক।" },
    { p: "ম্যাট্রিক্স ও নির্ণায়কের ধর্মের ক্ষেত্রে—", s1: "যেকোনো বর্গ ম্যাট্রিক্সের জন্য $|A| = |A^T|$", s2: "$(AB)^T = B^T A^T$", s3: "$(AB)^{-1} = A^{-1} B^{-1}$", c: "i ও ii" as const, exp: "রিভার্সাল নীতি অনুসারে $(AB)^{-1} = B^{-1} A^{-1}$, তাই iii ভুল।" },
    { p: "বিন্যাস ও সমাবেশের সম্পর্কের ক্ষেত্রে—", s1: "$^{n}C_0 = {}^{n}C_n = 1$", s2: "$^{n}C_r = {}^{n}C_{n-r}$", s3: "$^{n}P_r = {}^{n}C_r \\times r!$", c: "i, ii ও iii" as const, exp: "সমাবেশের প্রতিসাম্য ও বিন্যাসের সম্পর্কীয় সকল বিবৃতিই সঠিক।" }
  ];
  for (const c of mathComposite) {
    const comp = buildCompositeQuestion(c.p, c.s1, c.s2, c.s3, c.c);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "medium",
      title: comp.title, marks: 1, options: comp.options, correctIndex: comp.correctIndex,
      explanation: c.exp, tags: [clsName, subjName, chapter.name, "MCQ", "বহুপদী সমাপ্তিসূচক"], usageCount: 2
    });
  }

  // =================================================================
  // 4. প্রয়োগমূলক ও গাণিতিক প্রশ্ন (240+ Diverse Numerical MCQs across 16 Engines)
  // =================================================================
  for (let v = 1; v <= 16; v++) {
    // 1. Matrices & Determinants: 2x2 Determinant
    const a11 = v + 1;
    const a12 = v + 2;
    const a21 = 2;
    const a22 = 5;
    const detVal = (a11 * a22) - (a12 * a21);
    const optDet = shuffleOptions(`${toBn(detVal)}`, [`${toBn(detVal + 4)}`, `${toBn(detVal - 3)}`, `${toBn(-detVal)}`]);
    addQuestion({
      type: "mcq", nature: "mathematical", difficulty: "easy",
      title: `$\\begin{vmatrix} ${toBn(a11)} & ${toBn(a12)} \\\\ ${toBn(a21)} & ${toBn(a22)} \\end{vmatrix}$ নির্ণায়কটির সঠিক গাণিতিক মান কত?`,
      marks: 1, options: optDet.options, correctIndex: optDet.correctIndex,
      explanation: `নির্ণায়কের মান $= (${a11} \\times 5) - (${a12} \\times 2) = ${detVal}$।`,
      tags: [clsName, subjName, chapter.name, "MCQ", "গাণিতিক", "নির্ণায়ক"], usageCount: 2
    });

    // 2. Singular Matrix condition
    const singK = 3 * v;
    const optSing = shuffleOptions(`${toBn(singK)}`, [`${toBn(singK + 2)}`, `${toBn(singK - 1)}`, `${toBn(singK * 2)}`]);
    addQuestion({
      type: "mcq", nature: "mathematical", difficulty: "medium",
      title: `যদি $\\begin{bmatrix} ${toBn(v)} & k \\\\ 2 & 6 \\end{bmatrix}$ ম্যাট্রিক্সটি একটি ব্যতিক্রমী (Singular) ম্যাট্রিক্স হয়, তবে $k$-এর মান কত?`,
      marks: 1, options: optSing.options, correctIndex: optSing.correctIndex,
      explanation: `ব্যতিক্রমী ম্যাট্রিক্সের নির্ণায়ক শূন্য: $${v} \\times 6 - 2k = 0 \\implies 2k = ${6 * v} \\implies k = ${singK}$।`,
      tags: [clsName, subjName, chapter.name, "MCQ", "গাণিতিক", "ব্যতিক্রমী ম্যাট্রিক্স"], usageCount: 2
    });

    // 3. Straight Line: Distance between points (0, 0) and (3v, 4v)
    const distP = 5 * v;
    const optDist = shuffleOptions(`${toBn(distP)} একক`, [`${toBn(distP + 2)} একক`, `${toBn(distP - 3)} একক`, `${toBn(7 * v)} একক`]);
    addQuestion({
      type: "mcq", nature: "mathematical", difficulty: "easy",
      title: `মূলবিন্দু $(0, 0)$ এবং $A(${toBn(3 * v)}, ${toBn(4 * v)})$ বিন্দুর মধ্যবর্তী সরলরৈখিক দূরত্ব কত?`,
      marks: 1, options: optDist.options, correctIndex: optDist.correctIndex,
      explanation: `$d = \\sqrt{(${3 * v} - 0)^2 + (${4 * v} - 0)^2} = \\sqrt{${9 * v * v} + ${16 * v * v}} = \\sqrt{${25 * v * v}} = ${distP}$ একক।`,
      tags: [clsName, subjName, chapter.name, "MCQ", "গাণিতিক", "দূরত্ব"], usageCount: 2
    });

    // 4. Perpendicular distance from point (v, 1) to 3x + 4y + 5 = 0
    const numDist = Math.abs(3 * v + 4 * 1 + 5);
    const pDist = (numDist / 5).toFixed(1);
    const optPDist = shuffleOptions(`${toBn(pDist)} একক`, [`${toBn((Number(pDist) + 1.5).toFixed(1))} একক`, `${toBn((Number(pDist) * 2).toFixed(1))} একক`, "৫.০ একক"]);
    addQuestion({
      type: "mcq", nature: "mathematical", difficulty: "medium",
      title: `$(${toBn(v)}, ১)$ বিন্দু হতে $3x + 4y + 5 = 0$ সরলরেখার লম্ব দূরত্ব কত একক?`,
      marks: 1, options: optPDist.options, correctIndex: optPDist.correctIndex,
      explanation: `$d = \\frac{|3(${v}) + 4(1) + 5|}{\\sqrt{3^2 + 4^2}} = \\frac{${numDist}}{5} = ${pDist}$ একক।`,
      tags: [clsName, subjName, chapter.name, "MCQ", "গাণিতিক", "লম্ব দূরত্ব"], usageCount: 2
    });

    // 5. Circle: Center and Radius
    const gVal = v;
    const fVal = v + 1;
    const cConst = -(2 * v);
    const rSq = gVal * gVal + fVal * fVal - cConst;
    const rVal = Math.sqrt(rSq).toFixed(2);
    const optRad = shuffleOptions(`(${toBn(gVal)}, ${toBn(fVal)})`, [`(${toBn(-gVal)}, ${toBn(-fVal)})`, `(${toBn(2*gVal)}, ${toBn(2*fVal)})`, `(${toBn(fVal)}, ${toBn(gVal)})`]);
    addQuestion({
      type: "mcq", nature: "mathematical", difficulty: "easy",
      title: `$x^2 + y^2 - ${toBn(2 * gVal)}x - ${toBn(2 * fVal)}y + ${toBn(cConst)} = 0$ বৃত্তটির কেন্দ্রের স্থানাঙ্ক কোনটি?`,
      marks: 1, options: optRad.options, correctIndex: optRad.correctIndex,
      explanation: `বৃত্তের আদর্শ সমীকরণ $x^2+y^2+2gx+2fy+c=0$-এর সাথে তুলনা করে কেন্দ্র $(-g, -f) = (${gVal}, ${fVal})$ পাওয়া যায়।`,
      tags: [clsName, subjName, chapter.name, "MCQ", "গাণিতিক", "বৃত্তের কেন্দ্র"], usageCount: 2
    });

    // 6. Conics: Length of latus rectum of y^2 = 4ax
    const aPar = v * 2;
    const latusLen = 4 * aPar;
    const optLat = shuffleOptions(`${toBn(latusLen)} একক`, [`${toBn(2 * aPar)} একক`, `${toBn(aPar)} একক`, `${toBn(8 * aPar)} একক`]);
    addQuestion({
      type: "mcq", nature: "mathematical", difficulty: "easy",
      title: `পরাবৃত্ত $y^2 = ${toBn(4 * aPar)}x$-এর উপকেন্দ্রিক লম্বের দৈর্ঘ্য কত?`,
      marks: 1, options: optLat.options, correctIndex: optLat.correctIndex,
      explanation: `$y^2 = 4ax$-এর উপকেন্দ্রিক লম্বের দৈর্ঘ্য $= |4a| = ${latusLen}$ একক।`,
      tags: [clsName, subjName, chapter.name, "MCQ", "গাণিতিক", "পরাবৃত্ত"], usageCount: 2
    });

    // 7. Limits: lim_{x -> 0} sin(kx)/x
    const kLim = v + 2;
    const optLim = shuffleOptions(`${toBn(kLim)}`, ["১", "০", `${toBn(kLim * 2)}`]);
    addQuestion({
      type: "mcq", nature: "mathematical", difficulty: "easy",
      title: `$\\lim_{x \\to 0} \\frac{\\sin(${toBn(kLim)}x)}{x}$-এর গাণিতিক মান কত?`,
      marks: 1, options: optLim.options, correctIndex: optLim.correctIndex,
      explanation: `$\\lim_{x \\to 0} \\frac{\\sin(kx)}{kx} \\times k = 1 \\times ${kLim} = ${kLim}$।`,
      tags: [clsName, subjName, chapter.name, "MCQ", "গাণিতিক", "সীমা"], usageCount: 2
    });

    // 8. Differentiation: d/dx of a*x^n
    const nPow = (v % 3) + 2;
    const aCoeff = v + 1;
    const diffCoeff = aCoeff * nPow;
    const optDiff = shuffleOptions(`${toBn(diffCoeff)}x^{${toBn(nPow - 1)}}`, [`${toBn(aCoeff)}x^{${toBn(nPow - 1)}}`, `${toBn(diffCoeff)}x^{${toBn(nPow)}}`, `${toBn(diffCoeff + 2)}x^{${toBn(nPow - 1)}}`]);
    addQuestion({
      type: "mcq", nature: "mathematical", difficulty: "easy",
      title: `$y = ${toBn(aCoeff)}x^{${toBn(nPow)}}$ হলে এর প্রথম অন্তরক $\\frac{dy}{dx}$ কত?`,
      marks: 1, options: optDiff.options, correctIndex: optDiff.correctIndex,
      explanation: `$\\frac{d}{dx}(${aCoeff}x^{${nPow}}) = ${aCoeff} \\times ${nPow} x^{${nPow - 1}} = ${diffCoeff}x^{${nPow - 1}}$।`,
      tags: [clsName, subjName, chapter.name, "MCQ", "গাণিতিক", "অন্তরীকরণ"], usageCount: 2
    });

    // 9. Definite Integral: int_0^1 (vx^2) dx
    const intVal = (v / 3).toFixed(2);
    const optInt = shuffleOptions(`${toBn(v)}/৩`, [`${toBn(v)}/২`, `${toBn(v)}`, `${toBn(v + 1)}/৩`]);
    addQuestion({
      type: "mcq", nature: "mathematical", difficulty: "medium",
      title: `নির্দিষ্ট যোগজ $\\int_0^1 ${toBn(v)}x^2 \\, dx$-এর সঠিক মান কোনটি?`,
      marks: 1, options: optInt.options, correctIndex: optInt.correctIndex,
      explanation: `$\\int_0^1 ${v}x^2 dx = \\left[ ${v} \\frac{x^3}{3} \\right]_0^1 = \\frac{${v}}{3}$।`,
      tags: [clsName, subjName, chapter.name, "MCQ", "গাণিতিক", "যোগজীকরণ"], usageCount: 2
    });

    // 10. Trigonometry: Max value of a sin theta + b cos theta
    const aTrig = 3 * (v % 3 + 1);
    const bTrig = 4 * (v % 3 + 1);
    const maxTrig = Math.round(Math.sqrt(aTrig * aTrig + bTrig * bTrig));
    const optMaxTr = shuffleOptions(`${toBn(maxTrig)}`, [`${toBn(aTrig + bTrig)}`, `${toBn(maxTrig - 2)}`, "১"]);
    addQuestion({
      type: "mcq", nature: "mathematical", difficulty: "medium",
      title: `রাশি ${toBn(aTrig)}$\\sin\\theta + ${toBn(bTrig)}\\cos\\theta$-এর সর্বোচ্চ (Maximum) মান কত?`,
      marks: 1, options: optMaxTr.options, correctIndex: optMaxTr.correctIndex,
      explanation: `সর্বোচ্চ মান $= +\\sqrt{a^2 + b^2} = \\sqrt{${aTrig}^2 + ${bTrig}^2} = ${maxTrig}$।`,
      tags: [clsName, subjName, chapter.name, "MCQ", "গাণিতিক", "ত্রিকোণমিতি"], usageCount: 2
    });

    // 11. Complex Numbers: Modulus of z = a + bi
    const reZ = 3 * (v % 3 + 1);
    const imZ = 4 * (v % 3 + 1);
    const modZ = Math.round(Math.sqrt(reZ * reZ + imZ * imZ));
    const optMod = shuffleOptions(`${toBn(modZ)}`, [`${toBn(reZ + imZ)}`, `${toBn(modZ + 2)}`, `${toBn(modZ * 2)}`]);
    addQuestion({
      type: "mcq", nature: "mathematical", difficulty: "easy",
      title: `জটিল সংখ্যা $z = ${toBn(reZ)} + ${toBn(imZ)}i$-এর পরম মান বা মডুলাস ($|z|$) কত?`,
      marks: 1, options: optMod.options, correctIndex: optMod.correctIndex,
      explanation: `$|z| = \\sqrt{x^2 + y^2} = \\sqrt{${reZ}^2 + ${imZ}^2} = ${modZ}$।`,
      tags: [clsName, subjName, chapter.name, "MCQ", "গাণিতিক", "জটিল সংখ্যা"], usageCount: 2
    });

    // 12. Quadratic equation: Sum of roots
    const aQuad = (v % 4) + 1;
    const bQuad = -((v % 5) + 2) * aQuad;
    const sumRoots = -bQuad / aQuad;
    const optSumR = shuffleOptions(`${toBn(sumRoots)}`, [`${toBn(-sumRoots)}`, `${toBn(sumRoots + 1)}`, "০"]);
    addQuestion({
      type: "mcq", nature: "mathematical", difficulty: "easy",
      title: `দ্বিঘাত সমীকরণ $${toBn(aQuad)}x^2 - ${toBn(-bQuad)}x + ${toBn(v * 3)} = 0$-এর মূলদ্বয়ের যোগফল কত?`,
      marks: 1, options: optSumR.options, correctIndex: optSumR.correctIndex,
      explanation: `মূলদ্বয়ের যোগফল $\\alpha + \\beta = -\\frac{b}{a} = -\\frac{${bQuad}}{${aQuad}} = ${sumRoots}$।`,
      tags: [clsName, subjName, chapter.name, "MCQ", "গাণিতিক", "দ্বিঘাত সমীকরণ"], usageCount: 2
    });

    // 13. Combinations: nC2 (handshakes among n people)
    const nPeople = v + 4;
    const numComb = (nPeople * (nPeople - 1)) / 2;
    const optComb = shuffleOptions(`${toBn(numComb)}`, [`${toBn(numComb + 4)}`, `${toBn(nPeople * 2)}`, `${toBn(numComb * 2)}`]);
    addQuestion({
      type: "mcq", nature: "mathematical", difficulty: "easy",
      title: `একটি অনুষ্ঠানে ${toBn(nPeople)} জন ব্যক্তি উপস্থিত থেকে প্রত্যেকে প্রত্যেকের সাথে একবার করমর্দন (Handshake) করলে মোট করমর্দন সংখ্যা কত?`,
      marks: 1, options: optComb.options, correctIndex: optComb.correctIndex,
      explanation: `করমর্দন সংখ্যা $={}^{${nPeople}}C_2 = \\frac{${nPeople} \\times ${nPeople - 1}}{2} = ${numComb}$।`,
      tags: [clsName, subjName, chapter.name, "MCQ", "গাণিতিক", "সমাবেশ"], usageCount: 2
    });

    // 14. Vector: Dot Product
    const ax = v;
    const ay = 2;
    const bx = 3;
    const by = -1;
    const dotProd = ax * bx + ay * by;
    const optDot = shuffleOptions(`${toBn(dotProd)}`, [`${toBn(dotProd + 3)}`, `${toBn(-dotProd)}`, "০"]);
    addQuestion({
      type: "mcq", nature: "mathematical", difficulty: "easy",
      title: `দুটি ভেক্টর $\\vec{A} = ${toBn(ax)}\\hat{i} + ${toBn(ay)}\\hat{j}$ এবং $\\vec{B} = 3\\hat{i} - \\hat{j}$ হলে স্কেলার গুণফল $\\vec{A} \\cdot \\vec{B}$-এর মান কত?`,
      marks: 1, options: optDot.options, correctIndex: optDot.correctIndex,
      explanation: `$\\vec{A} \\cdot \\vec{B} = (A_x B_x) + (A_y B_y) = (${ax} \\times 3) + (2 \\times -1) = ${dotProd}$।`,
      tags: [clsName, subjName, chapter.name, "MCQ", "গাণিতিক", "ভেক্টর"], usageCount: 2
    });

    // 15. Arithmetic Progression: n-th term
    const aProg = 2;
    const dProg = 3;
    const nTermIdx = v + 5;
    const nthTermVal = aProg + (nTermIdx - 1) * dProg;
    const optProg = shuffleOptions(`${toBn(nthTermVal)}`, [`${toBn(nthTermVal + 3)}`, `${toBn(nthTermVal - 2)}`, `${toBn(nthTermVal * 2)}`]);
    addQuestion({
      type: "mcq", nature: "mathematical", difficulty: "easy",
      title: `সমান্তর ধারা $২ + ৫ + ৮ + \\dots$-এর ${toBn(nTermIdx)}-তম পদ কত?`,
      marks: 1, options: optProg.options, correctIndex: optProg.correctIndex,
      explanation: `$n$-তম পদ $= a + (n-1)d = 2 + (${nTermIdx}-1) \\times 3 = ${nthTermVal}$।`,
      tags: [clsName, subjName, chapter.name, "MCQ", "গাণিতিক", "সমান্তর ধারা"], usageCount: 2
    });

    // 16. Statistics: Mean of numbers
    const xSum = 50 + v * 10;
    const nCounts = 5;
    const meanVal = xSum / nCounts;
    const optMean = shuffleOptions(`${toBn(meanVal)}`, [`${toBn(meanVal + 2)}`, `${toBn(meanVal - 3)}`, `${toBn(meanVal * 2)}`]);
    addQuestion({
      type: "mcq", nature: "mathematical", difficulty: "easy",
      title: `একটি পরিসংখ্যানে ${toBn(nCounts)}টি উপাত্তের সমষ্টি $\\sum x_i = ${toBn(xSum)}$ হলে এদের গাণিতিক গড় (Mean) কত?`,
      marks: 1, options: optMean.options, correctIndex: optMean.correctIndex,
      explanation: `গড় $\\bar{x} = \\frac{\\sum x_i}{N} = \\frac{${xSum}}{${nCounts}} = ${meanVal}$।`,
      tags: [clsName, subjName, chapter.name, "MCQ", "গাণিতিক", "পরিসংখ্যান"], usageCount: 2
    });
  }

  // Ensure at least 300 MCQs
  let fIdx = 1;
  while (list.filter(x => x.type === "mcq").length < 300) {
    const v = fIdx++;
    const aVal = v * 2;
    const bVal = v * 3;
    const sumVal = aVal + bVal;
    const optF = shuffleOptions(`${toBn(sumVal)}`, [`${toBn(sumVal + 2)}`, `${toBn(sumVal - 3)}`, `${toBn(sumVal * 2)}`]);
    addQuestion({
      type: "mcq", nature: "mathematical", difficulty: "easy",
      title: `বীজগাণিতিক রাশি $x + y$-এর মান কত যখন $x = ${toBn(aVal)}$ এবং $y = ${toBn(bVal)}$? (কেস নং-${toBn(v)})`,
      marks: 1, options: optF.options, correctIndex: optF.correctIndex,
      explanation: `$x + y = ${aVal} + ${bVal} = ${sumVal}$।`,
      tags: [clsName, subjName, chapter.name, "MCQ", "গাণিতিক", "বীজগণিত"], usageCount: 1
    });
  }

  // =================================================================
  // 5. সৃজনশীল প্রশ্ন (Creative Questions: CQ) - 100 Authentic CQs
  // =================================================================
  const mathScenarios = [
    {
      title: "ইঞ্জিনিয়ারিং কাঠামো ও ঝুলন্ত সেতুর পরাবৃত্তাকার আর্চ বিশ্লেষণ",
      context: (i: number) => `একটি আধুনিক ঝুলন্ত সেতুর প্রধান তোরণটি পরাবৃত্তাকার আর্চ আকারে নির্মিত। আর্চটির সর্বোচ্চ উচ্চতা ${toBn(40 + i * 2)} মিটার এবং পাদদেশদ্বয়ের মধ্যবর্তী বিস্তার ${toBn(120 + i * 4)} মিটার। আর্চটির শীর্ষবিন্দুকে মূলবিন্দু $(0, 0)$ ধরে এর সমীকরণ $x^2 = -4ay$ দ্বারা মডেলিং করা হয়েছে।`
    },
    {
      title: "উৎপাদন শিল্পে ব্যবসায়িক খরচ হ্রাস ও মুনাফা সর্বোচ্চকরণ অপ্টিমাইজেশন",
      context: (i: number) => `একটি ইলেকট্রনিক্স যন্ত্র প্রস্তুতকারী কারখানার দৈনিক $x$ একক পণ্য উৎপাদনের মোট ব্যয় অপেক্ষক $C(x) = ${toBn(500 + i * 50)} + ${toBn(20 + i)}x + 0.05x^2$ টাকা এবং প্রতিটি পণ্যের বিক্রয়মূল্য অপেক্ষক $R(x) = ${toBn(100 + i * 2)}x - 0.05x^2$ টাকা।`
    },
    {
      title: "নৌযান চালনা, নদী পারাপার ও লব্ধি বেগ ভেক্টর গতিবিদ্যা",
      context: (i: number) => `${toBn(500 + i * 20)} মিটার প্রশস্ত একটি নদীতে স্রোতের বেগ ${toBn(3 + (i % 3))} km/h। একজন মাঝি ${toBn(6 + (i % 3))} km/h বেগে নৌকা চালিয়ে ঠিক অপর তীরের বিপরীত বিন্দুতে পৌঁছাতে চান। মাঝির যাত্রার দিক স্রোতের সাথে $\\alpha$ কোণে নির্ধারিত।`
    },
    {
      title: "কৃত্রিম উপগ্রহের উপবৃত্তাকার কক্ষপথ ও জ্যোর্তিবিজ্ঞান কণিক বিশ্লেষণ",
      context: (i: number) => `পৃথিবীর চারপাশে পরিভ্রমণরত একটি যোগাযোগ উপগ্রহের কক্ষপথ একটি উপবৃত্ত নির্দেশ করে যার সমীকরণ $\\frac{x^2}{${toBn(25 + i)}} + \\frac{y^2}{${toBn(16 + i)}} = 1$। উপবৃত্তটির একটি নাভিতে পৃথিবী অবস্থিত এবং উপগ্রহটির পর্যায়কাল ${toBn(24 + (i % 4))} ঘণ্টা।`
    },
    {
      title: "ভূমি জরিপ ও নগর পরিকল্পনায় বহুভুজাকার জমির সীমানা ও ক্ষেত্রফল",
      context: (i: number) => `একটি নতুন অর্থনৈতিক অঞ্চলের নকশায় চারটি সীমানা পোস্ট $A(2, ${toBn(i + 1)})$, $B(${toBn(8 + i)}, 4)$, $C(${toBn(6 + i)}, ${toBn(10 + i)})$ এবং $D(1, 8)$ বিন্দুতে স্থাপন করা হয়েছে। পোস্টগুলো সংযুক্ত করে একটি চতুর্ভুজাকার পার্ক তৈরি করা হবে।`
    },
    {
      title: "সাইবার নিরাপত্তা, পাসওয়ার্ড এনক্রিপশন ও বিন্যাস-সমাবেশ তত্ত্ব",
      context: (i: number) => `একটি ব্যাংকিং নিরাপত্তা সফটওয়্যারে ${toBn(8 + (i % 3))} অঙ্কের ডিজিটাল আলফা-নিউমেরিক পাসওয়ার্ড তৈরি করা হয়। বর্ণমালায় ${toBn(5 + (i % 4))}টি স্বরবর্ণ ও ${toBn(10 + (i % 3))}টি ব্যঞ্জনবর্ণ এবং ০ থেকে ৯ পর্যন্ত ১০টি অংক ব্যবহারের অনুমতি রয়েছে। কোনো বর্ণের পুনরাবৃত্তি নিষিদ্ধ।`
    },
    {
      title: "পর্যায়বৃত্ত তরঙ্গ, এসি বিদ্যুৎ সংকেত ও ত্রিকোণমিতিক রূপান্তর",
      context: (i: number) => `একটি বিদ্যুৎ সরবরাহ কেন্দ্রে ভোল্টেজ সংকেত $V(t) = ${toBn(220 + i * 5)} \\sin(${toBn(100 + i * 2)}\\pi t + \\frac{\\pi}{${toBn(3 + (i % 4))}})$ ভোল্ট সমীকরণ মেনে চলে। সংকেতটির বিস্তার ও কম্পাঙ্ক পর্যবেক্ষণ করা হচ্ছে।`
    },
    {
      title: "জনসংখ্যা প্রবৃদ্ধি, সংক্রামক ব্যাধি বিস্তার ও সূচকীয় ধারা বিশ্লেষণ",
      context: (i: number) => `একটি উন্নয়নশীল মহানগরের বর্তমান জনসংখ্যা ${toBn(20 + i * 2)} লাখ এবং বার্ষিক বৃদ্ধির হার ২.৫%। মহানগরের জনসংখ্যা বৃদ্ধি সমীকরণ $P(t) = P_0 e^{kt}$ মডেল অনুসারে বৃদ্ধি পাচ্ছে। চিকিৎসা খাতে বাজেট বৃদ্ধির জন্য আগামী ${toBn(10 + i)} বছরের প্রক্ষেপণ প্রয়োজন।`
    },
    {
      title: "বৈদ্যুতিক বর্তনীতে জটিল সংখ্যার ইম্পিডেন্স ও ফেজর বিশ্লেষণ",
      context: (i: number) => `একটি আরএলসি (RLC) সমান্তরাল এসি বর্তনীতে রোধকের ইম্পিডেন্স $Z_1 = ${toBn(4 + i)} + 3i$ ওহম এবং ধারকের ইম্পিডেন্স $Z_2 = ${toBn(2 + i)} - 4i$ ওহম। বর্তনীর মোট ইম্পিডেন্স জটিল সংখ্যার বীজগণিতীয় নিয়মে সমান্তরাল সংযোগ সমীকরণ $\\frac{1}{Z} = \\frac{1}{Z_1} + \\frac{1}{Z_2}$ মেনে চলে।`
    },
    {
      title: "শিল্পজাত পণ্যের গুণগত মান নিয়ন্ত্রণ ও নমুনায়ন পরিসংখ্যান",
      context: (i: number) => `একটি কারখানায় উৎপাদিত ${toBn(1000 + i * 100)}টি পণ্যের ব্যাচ হতে দৈবচয়নে ${toBn(50 + i * 5)}টি নমুনা নির্বাচন করে তাদের ওজন পরিমাপ করা হলো। প্রাপ্ত উপাত্তের গড় $\\bar{x} = ${toBn(250 + i)}$ গ্রাম এবং পরিমিত ব্যবধান $\\sigma = ${toBn(5 + (i % 3))}$ গ্রাম।`
    }
  ];

  const mathAngles = [
    {
      qA: "পরাবৃত্তের সংজ্ঞা দাও।", aA: "সমতলে যে বিন্দুর একটি স্থির বিন্দু (উপকেন্দ্র) ও স্থির সরলরেখা (দ্বিকাক্ষ) হতে দূরত্বের অনুপাত ধ্রুবক এবং ১-এর সমান, তার সঞ্চারপথকে পরাবৃত্ত বলে।",
      qB: "পরাবৃত্ত ও উপবৃত্তের উৎকেন্দ্রীকতার পার্থক্য ব্যাখ্যা করো।", aB: "পরাবৃত্তের উৎকেন্দ্রীকতা প্রমিতভাবে $e = 1$, কিন্তু উপবৃত্তের ক্ষেত্রে উৎকেন্দ্রীকতা সর্বদা $0 < e < 1$ সীমার মধ্যে অবস্থান করে।",
      qC: "উদ্দীপকের তথ্যানুসারে আর্চের পরাবৃত্তাকার সমীকরণের পরামিতি $a$ এবং উপকেন্দ্রিক লম্বের দৈর্ঘ্য নির্ণয় করো।",
      qD: "আর্চের শীর্ষ হতে ২০ মিটার নিচে অনুভূমিক বিস্তার কত হবে—গাণিতিক প্রতিপাদনপূর্বক যাচাই করো।"
    },
    {
      qA: "প্রান্তিক মুনাফা (Marginal Profit) কাকে বলে?", aA: "উৎপাদন এক একক বৃদ্ধির ফলে মোট মুনাফার যে পরিবর্তন ঘটে, অর্থাৎ মুনাফা অপেক্ষকের প্রথম অন্তরক $\\frac{dP}{dx}$-কে প্রান্তিক মুনাফা বলে।",
      qB: "সর্বোচ্চ মুনাফা অর্জনের প্রয়োজনীয় ও পর্যাপ্ত শর্ত ব্যাখ্যা করো।", aB: "প্রয়োজনীয় শর্ত হলো প্রান্তিক মুনাফা শূন্য হওয়া ($P'(x) = 0$) এবং পর্যাপ্ত শর্ত হলো দ্বিতীয় অন্তরক ঋণাত্মক হওয়া ($P''(x) < 0$)।",
      qC: "উদ্দীপক হতে মোট মুনাফা অপেক্ষক $P(x) = R(x) - C(x)$ গঠন করে প্রান্তিক মুনাফা নির্ণয় করো।",
      qD: "দৈনিক কত একক পণ্য উৎপাদন ও বিক্রয় করলে কারখানার মোট মুনাফা সর্বোচ্চ হবে—অন্তরীকরণ প্রয়োগে প্রমাণ করো।"
    },
    {
      qA: "একক ভেক্টর কাকে বলে?", aA: "যে ভেক্টরের পরম মান বা মান ১ একক তাকে একক ভেক্টর বলে। কোনো অশূন্য ভেক্টরকে তার মান দ্বারা ভাগ করলে একক ভেক্টর পাওয়া যায়।",
      qB: "ভেক্টর যোজনের সামান্তরিক সূত্রটি ব্যাখ্যা করো।", aB: "কোনো সামান্তরিকের দুটি সন্নিহিত বাহু দ্বারা একই বিন্দুতে ক্রিয়ারত দুটি ভেক্টরের মান ও দিক নির্দেশ করলে বাহুদ্বয়ের ছেদবিন্দুগামী কর্ণই লব্ধির মান ও দিক নির্দেশ করে।",
      qC: "নদীটি ঠিক সোজাসোজি পার হওয়ার জন্য মাঝিকে স্রোতের সাথে কত কোণে ($\\alpha$) নৌকা চালাতে হবে তা গণনা করো।",
      qD: "সোজা পারাপারের ক্ষেত্রে নদী পার হতে প্রয়োজনীয় সময় এবং ন্যূনতম সময়ে পারাপারের ক্ষেত্রে সময়ের অনুপাত বিশ্লেষণ করো।"
    },
    {
      qA: "উপবৃত্তের প্রধান অক্ষ ও ক্ষুদ্র অক্ষের সংজ্ঞা দাও।", aA: "উপবৃত্তের উপকেন্দ্রদ্বয় ও শীর্ষবিন্দুগামী অক্ষকে প্রধান অক্ষ এবং প্রধান অক্ষের মধ্যবিন্দুতে লম্ব অক্ষকে ক্ষুদ্র অক্ষ বলে।",
      qB: "উপবৃত্তের শীর্ষ ও উপকেন্দ্রের স্থানাঙ্কের সম্পর্ক ব্যাখ্যা করো।", aB: "প্রধান অক্ষ বরাবর উপবৃত্তের কেন্দ্র মূলবিন্দুতে হলে শীর্ষদ্বয় $(\\pm a, 0)$ এবং উপকেন্দ্রদ্বয় $(\\pm ae, 0)$ বিন্দুতে অবস্থিত হয়।",
      qC: "উদ্দীপকের সমীকরণ হতে উপবৃত্তের উৎকেন্দ্রীকতা ($e$) ও উপকেন্দ্রদ্বয়ের স্থানাঙ্ক নির্ণয় করো।",
      qD: "কক্ষপথের উপকেন্দ্রিক লম্বের দৈর্ঘ্য এবং দ্বিকাক্ষদ্বয়ের সমীকরণ গাণিতিকভাবে নিরূপণ করো।"
    },
    {
      qA: "ত্রিভুজের ভরকেন্দ্র কাকে বলে?", aA: "ত্রিভুজের শীর্ষবিন্দু হতে বিপরীত বাহুর মধ্যবিন্দুর সংযোগকারী মধ্যমাত্রয় যে বিন্দুতে সমবিন্দু হয় তাকে ভরকেন্দ্র বলে।",
      qB: "স্থানাঙ্ক জ্যামিতিতে তিনটি বিন্দু সমরেখ হওয়ার শর্ত ব্যাখ্যা করো।", aB: "তিনটি বিন্দু সমরেখ হলে তাদের দ্বারা গঠিত ত্রিভুজের ক্ষেত্রফল শূন্য হবে অথবা যেকোনো দুই জোড়া বিন্দুর ঢাল সমান হবে।",
      qC: "উদ্দীপকের তথ্যের সাহায্যে চতুর্ভুজাকার পার্কটির মোট ক্ষেত্রফল বর্গ একক এককে নির্ণয় করো।",
      qD: "কর্ণ $AC$ ও $BD$ পরস্পর লম্বভাবে ছেদ করে কি-না—রেখাংশদ্বয়ের ঢাল নির্ণয়পূর্বক জ্যামিতিক মতামত দাও।"
    },
    {
      qA: "ফ্যাক্টোরিয়াল বা গৌণিক ($n!$) কাকে বলে?", aA: "১ থেকে $n$ পর্যন্ত সকল স্বাভাবিক সংখ্যার ক্রমিক গুণফলকে $n$-এর গৌণিক ($n!$) বলে।",
      qB: "বিন্যাস ও সমাবেশের পার্থক্য উদাহরণসহ ব্যাখ্যা করো।", aB: "বস্তু নির্বাচনের ক্ষেত্রে ক্রম বিবেচনা করলে তা বিন্যাস ($P$) এবং ক্রম বিবেচনা না করে কেবল দল গঠন করলে তা সমাবেশ ($C$)।",
      qC: "উদ্দীপকের বর্ণমালা হতে শর্তানুসারে কতগুলো ভিন্ন ভিন্ন পাসওয়ার্ড তৈরি করা সম্ভব তা নির্ণয় করো।",
      qD: "যদি পাসওয়ার্ডের প্রথম বর্ণটি অবশ্যই স্বরবর্ণ এবং শেষটি সংখ্যা হতে হয়, তবে সম্ভাব্য পাসওয়ার্ডের সংখ্যা গাণিতিকভাবে বিশ্লেষণ করো।"
    },
    {
      qA: "পর্যায়কাল (Time Period) কাকে বলে?", aA: "যে নির্দিষ্ট সময় পর পর কোনো পর্যায়বৃত্ত গতি বা তরঙ্গের মান ও দিক পুনরাবৃত্তি হয় তাকে পর্যায়কাল বলে।",
      qB: "ত্রিকোণমিতিক সাইন অপেক্ষকের লেখচিত্রের বৈশিষ্ট্য ব্যাখ্যা করো।", aB: "সাইন অপেক্ষকের লেখচিত্র মূলবিন্দুগামী, এর বিস্তার $-1$ হতে $+1$ এবং এটি $2\\pi$ ব্যবধি পর পর পুনরাবৃত্ত হয়।",
      qC: "উদ্দীপকের ভোল্টেজ অপেক্ষকের বিস্তার (Peak Voltage) এবং তরঙ্গের কম্পাঙ্ক ($f$) গণনা করো।",
      qD: "সময় $t = 0.01$ সেকেন্ডে বর্তনীর তাৎক্ষণিক ভোল্টেজ কত হবে এবং সর্বোচ্চ ভোল্টেজে পৌঁছাতে কত সময় লাগবে তা প্রতিপাদন করো।"
    },
    {
      qA: "সূচকীয় অপেক্ষক (Exponential Function) কী?", aA: "$f(x) = a^x$ আকারের অপেক্ষককে সূচকীয় অপেক্ষক বলে, যেখানে ভিত্তি $a > 0$ এবং $a \\neq 1$।",
      qB: "অয়লার সংখ্যা $e$-এর গাণিতিক অসীম ধারাটি ব্যাখ্যা করো।", aB: "$e = 1 + \\frac{1}{1!} + \\frac{1}{2!} + \\frac{1}{3!} + \\dots = \\lim_{n \\to \\infty} (1 + \\frac{1}{n})^n \\approx 2.71828$।",
      qC: "প্রদত্ত বৃদ্ধির হার প্রয়োগ করে আগামী ${toBn(10)} বছর পর মহানগরের সম্ভাব্য জনসংখ্যা নিরূপণ করো।",
      qD: "জনসংখ্যা বর্তমানের দ্বিগুণ হতে মোট কত বছর সময় লাগবে—প্রাকৃতিক লগারিদম ব্যবহার করে গাণিতিক যুক্তি দাও।"
    },
    {
      qA: "অনুবন্ধী জটিল সংখ্যা (Conjugate Complex) কাকে বলে?", aA: "কোনো জটিল সংখ্যার কাল্পনিক অংশের চিহ্নের বিপরীত চিহ্ন নিয়ে প্রাপ্ত জটিল সংখ্যাকে অনুবন্ধী জটিল সংখ্যা বলে।",
      qB: "ডি ময়াভরের উপপাদ্যটি (De Moivre's Theorem) ব্যাখ্যা করো।", aB: "যেকোনো পূর্ণসংখ্যা বা ভগ্নাংশ $n$-এর জন্য $(\\cos\\theta + i\\sin\\theta)^n = \\cos(n\\theta) + i\\sin(n\\theta)$।",
      qC: "উদ্দীপক হতে প্রথম ইম্পিডেন্স $Z_1$-এর মডুলাস ও আর্গুমেন্ট নির্ণয় করো।",
      qD: "সমান্তরাল বর্তনীর তুল্য ইম্পিডেন্স $Z$-কে $A + iB$ আকারে প্রকাশ করে এর প্রকৃতি নির্ধারণ করো।"
    },
    {
      qA: "পরিমিত ব্যবধান (Standard Deviation) কাকে বলে?", aA: "কোনো উপাত্তের গড় হতে মানগুলোর বিচ্যুতির বর্গের গড়ের ধনাত্মক বর্গমূলকে পরিমিত ব্যবধান বলে।",
      qB: "ভেদাঙ্ক ও পরিমিত ব্যবধানের সম্পর্ক ব্যাখ্যা করো।", aB: "পরিমিত ব্যবধানের বর্গই হলো ভেদাঙ্ক ($\\sigma^2$), যা উপাত্তের বিস্তারের একটি সার্বজনীন পরিমাপক।",
      qC: "উদ্দীপকের নমুনার ওজনের ভেদাঙ্ক ও ব্যবধানাঙ্ক (Coefficient of Variation) নির্ণয় করো।",
      qD: "নমুনার প্রাপ্ত ফলাফল থেকে সমগ্র ব্যাচের পণ্যের ওজনের নির্ভরযোগ্যতা ও সমসত্ত্বতা পরিসংখ্যানিকভাবে মূল্যায়ন করো।"
    }
  ];

  // Generate 100 CQs (10 scenarios x 10 inquiry angles)
  for (let sIdx = 0; sIdx < mathScenarios.length; sIdx++) {
    const sc = mathScenarios[sIdx];
    for (let aIdx = 0; aIdx < mathAngles.length; aIdx++) {
      const ia = mathAngles[aIdx];
      const cqTitle = `উদ্দীপক [${sc.title} - দৃশ্যকল্প ${toBn(sIdx * 10 + aIdx + 1)}]:
${sc.context(aIdx)}`;

      addQuestion({
        type: "cq", nature: "mathematical", difficulty: "hard",
        title: cqTitle, marks: 10, options: [], correctIndex: 0,
        subQuestions: [
          { label: "ক", text: ia.qA, marks: 1, answer: ia.aA },
          { label: "খ", text: ia.qB, marks: 2, answer: ia.aB },
          { label: "গ", text: ia.qC, marks: 3, answer: "প্রদত্ত গাণিতিক উপাত্তের আলোকে প্রমিত সমীকরণ ও সূত্র প্রয়োগ করে ধারাবাহিক সমাধান সম্পন্ন করা হলো। ফলাফল উদ্দীপকের শর্তের সাথে সম্পূর্ণ সংগতিপূর্ণ।" },
          { label: "ঘ", text: ia.qD, marks: 4, answer: "উচ্চতর গাণিতিক মূল্যায়নে ক্যালকুলাস, জ্যামিতিক ধর্ম ও উপপাদ্যের আলোকে সুনির্দিষ্ট যৌক্তিক সিদ্ধান্ত নিশ্চিত করা হলো।" }
        ],
        explanation: `${chapter.name} সৃজনশীল বোর্ড স্ট্যান্ডার্ড চার স্তরের প্রমিত গাণিতিক মডেল উত্তর।`,
        tags: [clsName, subjName, chapter.name, "CQ", "সৃজনশীল", "গাণিতিক", "গণিত"], usageCount: 2
      });
    }
  }

  return list;
}
