import { nanoid } from "nanoid";
import { ChapterMeta, QuestionBankItemPayload, buildCompositeQuestion, shuffleOptions, toBn } from "./common.js";

export function generateGeneralQuestionsForChapter(
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

  const isIct = subjName.includes("তথ্য ও যোগাযোগ প্রযুক্তি");
  const isBio = subjName.includes("জীববিজ্ঞান");
  const isBangla = subjName.includes("বাংলা");
  const isBgs = subjName.includes("বাংলাদেশ ও বিশ্বপরিচয়");

  function addQuestion(payload: Omit<QuestionBankItemPayload, "id" | "ownerId" | "className" | "subject" | "chapter" | "category" | "createdAt" | "updatedAt">) {
    const key = payload.title.trim().toLowerCase();
    if (seenTitles.has(key)) return;
    seenTitles.add(key);

    list.push({
      id: `bn_gn_${nanoid(10)}`,
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
  // 1. জ্ঞানমূলক প্রশ্ন (Knowledge-based MCQs) - 6 Distinct Questions
  // =================================================================

  // K1: Standard Definition / Nature
  const k1Opt = shuffleOptions(`${t[0]} হলো সংশ্লিষ্ট বিষয়ের সুনির্দিষ্ট মৌলিক প্রত্যয়`, [
    `${t[0]} কোনো নিয়মের অধীনে কাজ করে না`,
    `${t[0]} একটি অপ্রাসঙ্গিক ধারণা`,
    `${t[0]} কেবলমাত্র প্রাচীন যুগে প্রচলিত ছিল`
  ]);
  addQuestion({
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: `${chapter.name} অনুসারে ‘${t[0]}’-এর মৌলিক তাত্ত্বিক সংজ্ঞা বা তাৎপর্য কোনটি?`,
    marks: 1,
    options: k1Opt.options,
    correctIndex: k1Opt.correctIndex,
    explanation: `${t[0]} পাঠ্যক্রমের সংজ্ঞাগত নিয়ম অনুসারে সঠিক উত্তর।`,
    tags: [clsName, subjName, chapter.name, "MCQ", "জ্ঞানমূলক", "সংজ্ঞা"],
    usageCount: Math.floor(Math.random() * 4)
  });

  // K2: Unit / Measure / Value
  const k2Opt = shuffleOptions(u[0] || "এককহীন", [u[1] || "বিট", u[2] || "বাইট", u[3] || "শতাংশ"]);
  addQuestion({
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: `আলোচ্য অধ্যায়ে ‘${t[1]}’ প্রকাশের প্রমিত একক বা পরিমাপ কোনটি?`,
    marks: 1,
    options: k2Opt.options,
    correctIndex: k2Opt.correctIndex,
    explanation: `${t[1]}-এর প্রমিত একক বা পরিমাপক হলো ${u[0] || "এককহীন"}।`,
    tags: [clsName, subjName, chapter.name, "MCQ", "জ্ঞানমূলক", "একক"],
    usageCount: Math.floor(Math.random() * 4)
  });

  // K3: Fundamental Law / Principle / Discovery
  const k3Opt = shuffleOptions("সংশ্লিষ্ট নিয়ামকগুলোর সুনির্দিষ্ট সম্পর্ক ও নিয়ম নির্ধারণ করে", [
    "প্রাকৃতিক নিয়মকে সম্পূর্ণ উপেক্ষা করে",
    "কেবল তাত্ত্বিক অনুমানের ওপর নির্ভরশীল",
    "বাস্তব প্রয়োগে কোনো প্রভাব ফেলে না"
  ]);
  addQuestion({
    type: "mcq",
    nature: "theory",
    difficulty: "medium",
    title: `‘${l[0]}’-এর মূল বক্তব্য বা প্রতিপাদ্য কোনটি?`,
    marks: 1,
    options: k3Opt.options,
    correctIndex: k3Opt.correctIndex,
    explanation: `${l[0]} দ্বারা বিষয়ের মৌলিক ভিত্তি ও সার্বজনীন নিয়ম প্রতিষ্ঠিত হয়।`,
    tags: [clsName, subjName, chapter.name, "MCQ", "জ্ঞানমূলক", "নীতি"],
    usageCount: Math.floor(Math.random() * 4)
  });

  // K4: Structural Feature / Classification
  const k4Opt = shuffleOptions(q[0] || "বৈশিষ্ট্যপূর্ণ ও কাঠামোগত", [q[1] || "অস্থায়ী", q[2] || "অনিয়মিত", q[3] || "অপ্রয়োজনীয়"]);
  addQuestion({
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: `কাঠামোগত বিচারে ‘${t[2]}’ মূলত কী ধরনের বৈশিষ্ট্য নির্দেশ করে?`,
    marks: 1,
    options: k4Opt.options,
    correctIndex: k4Opt.correctIndex,
    explanation: `${t[2]} প্রধানত ${q[0] || "বৈশিষ্ট্যপূর্ণ ও কাঠামোগত"} রূপ প্রকাশ করে।`,
    tags: [clsName, subjName, chapter.name, "MCQ", "জ্ঞানমূলক", "শ্রেণিবিভাগ"],
    usageCount: Math.floor(Math.random() * 4)
  });

  // K5: Formula / Standard Expression
  const formStr = f[0] ? `$${f[0]}$` : "সংজ্ঞাগত সুনির্দিষ্ট মডেল";
  const k5Opt = shuffleOptions(formStr, [
    f[1] ? `$${f[1]}$` : "বিকল্প কাঠামো-১",
    f[2] ? `$${f[2]}$` : "বিকল্প কাঠামো-২",
    f[3] ? `$${f[3]}$` : "বিকল্প কাঠামো-৩"
  ]);
  addQuestion({
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: `${chapter.name} সম্পর্কিত প্রমিত সমীকরণ, সংকেত বা নিয়ম কোনটি?`,
    marks: 1,
    options: k5Opt.options,
    correctIndex: k5Opt.correctIndex,
    explanation: `অধ্যায়ের পাঠ্যবই অনুসারে সঠিক রূপ হলো ${formStr}।`,
    tags: [clsName, subjName, chapter.name, "MCQ", "জ্ঞানমূলক", "নিয়ম"],
    usageCount: Math.floor(Math.random() * 4)
  });

  // K6: Chapter Term Specific
  const k6Opt = shuffleOptions("সুনির্দিষ্ট প্রাকৃতিক ও যৌক্তিক নীতির মাধ্যমে পরিচালিত হয়", [
    "সম্পূর্ণ বিশৃঙ্খলভাবে ঘটে",
    "কোনো নির্দিষ্ট নীতি অনুসরণ করে না",
    "কেবলমাত্র বিশেষ গবেষণাগারে সম্ভব"
  ]);
  addQuestion({
    type: "mcq",
    nature: "theory",
    difficulty: "medium",
    title: `‘${t[3]}’-এর কার্যপদ্ধতির মূল বৈশিষ্ট্য কোনটি?`,
    marks: 1,
    options: k6Opt.options,
    correctIndex: k6Opt.correctIndex,
    explanation: `${t[3]} তার নিজস্ব বৈজ্ঞানিক বা তাত্ত্বিক নীতি অনুসারে পরিচালিত হয়।`,
    tags: [clsName, subjName, chapter.name, "MCQ", "জ্ঞানমূলক"],
    usageCount: Math.floor(Math.random() * 4)
  });

  // =================================================================
  // 2. অনুধাবনমূলক প্রশ্ন (Conceptual MCQs) - 6 Distinct Questions
  // =================================================================

  // C1: Cause & Effect
  const c1Opt = shuffleOptions("উভয় উপাদানের গঠনগত ও কার্যগত ভূমিকার ভিন্নতা রয়েছে", [
    "উভয় উপাদান সম্পূর্ণ অভিন্ন ও সমার্থক",
    "একটি অপরটির ওপর কোনো প্রভাব ফেলে না",
    "উভয়েই নিষ্ক্রিয় ভূমিকা পালন করে"
  ]);
  addQuestion({
    type: "mcq",
    nature: "theory",
    difficulty: "medium",
    title: `‘${q[0]}’ ও ‘${q[1]}’-এর মধ্যে পারস্পরিক পার্থক্যের মূল কারণ কোনটি?`,
    marks: 1,
    options: c1Opt.options,
    correctIndex: c1Opt.correctIndex,
    explanation: `উভয় প্রত্যয়ের মৌলিক বৈশিষ্ট্য ও কার্যকারিতা স্বতন্ত্র হওয়ায় তাদের মধ্যে সুস্পষ্ট পার্থক্য বিদ্যমান।`,
    tags: [clsName, subjName, chapter.name, "MCQ", "অনুধাবনমূলক", "পার্থক্য"],
    usageCount: Math.floor(Math.random() * 4)
  });

  // C2: Mechanism / Functioning
  const c2Opt = shuffleOptions("একটি সুনিয়ন্ত্রিত চক্রাকার প্রক্রিয়ার মাধ্যমে সম্পন্ন হয়", [
    "কোনো বিরতি ছাড়াই হঠাৎ সম্পন্ন হয়",
    "কেবলমাত্র তাপমাত্রার পতনে বন্ধ হয়ে যায়",
    "কোনো শক্তি বা তথ্যের বিনিময় ঘটে না"
  ]);
  addQuestion({
    type: "mcq",
    nature: "theory",
    difficulty: "medium",
    title: `‘${t[4]}’-এর প্রক্রিয়াটি কীভাবে কার্যকর হয়?`,
    marks: 1,
    options: c2Opt.options,
    correctIndex: c2Opt.correctIndex,
    explanation: `${t[4]} সংশ্লিষ্ট প্রক্রিয়ায় অত্যন্ত সুশৃঙ্খল ও ধারাবাহিক নিয়ন্ত্রণের মাধ্যমে কার্যকর হয়।`,
    tags: [clsName, subjName, chapter.name, "MCQ", "অনুধাবনমূলক", "প্রক্রিয়া"],
    usageCount: Math.floor(Math.random() * 4)
  });

  // C3: Role in Environment / System
  const c3Opt = shuffleOptions("সামগ্রিক ব্যবস্থার ভারসাম্য ও স্থায়িত্ব বজায় রাখতে সহায়তা করে", [
    "সমগ্র ব্যবস্থার কার্যক্ষমতা নষ্ট করে",
    "অন্যান্য সকল উপাদানের বৃদ্ধি বন্ধ করে",
    "কেবল ক্ষতিকর প্রভাব ফেলে"
  ]);
  addQuestion({
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: `সমগ্র প্রক্রিয়ায় ‘${t[5]}’-এর ভূমিকা কেন অত্যন্ত গুরুত্বপূর্ণ?`,
    marks: 1,
    options: c3Opt.options,
    correctIndex: c3Opt.correctIndex,
    explanation: `${t[5]} পদ্ধতির অন্তর্নিহিত ভারসাম্য ও ধারাবাহিকতা রক্ষায় মূল ভূমিকা পালন করে।`,
    tags: [clsName, subjName, chapter.name, "MCQ", "অনুধাবনমূলক", "গুরুত্ব"],
    usageCount: Math.floor(Math.random() * 4)
  });

  // C4: Comparative Implication
  const c4Opt = shuffleOptions("পরবর্তী পর্যায়ের দক্ষতা ও উৎপাদনশীলতা উল্লেখযোগ্য হারে বৃদ্ধি পায়", [
    "সমগ্র ব্যবস্থাটি তাৎক্ষণিকভাবে অচল হয়ে যায়",
    "উৎপাদন ক্ষমতা অর্ধেকে নেমে আসে",
    "কোনো প্রকার গুণগত পরিবর্তন ঘটে না"
  ]);
  addQuestion({
    type: "mcq",
    nature: "theory",
    difficulty: "medium",
    title: `‘${t[6]}’-এর যথাযথ বাস্তবায়ন ঘটলে কী পরিবর্তন লক্ষ্য করা যায়?`,
    marks: 1,
    options: c4Opt.options,
    correctIndex: c4Opt.correctIndex,
    explanation: `সঠিক প্রয়োগের ফলে সামগ্রিক কর্মদক্ষতা বৃদ্ধি পায় এবং গুণগত মান নিশ্চিত হয়।`,
    tags: [clsName, subjName, chapter.name, "MCQ", "অনুধাবনমূলক"],
    usageCount: Math.floor(Math.random() * 4)
  });

  // C5: Limitation / Condition
  const c5Opt = shuffleOptions("অনুকূল পরিবেশ ও প্রয়োজনীয় উপাদানের উপস্থিতি আবশ্যক", [
    "যেকোনো চরম বৈরী অবস্থাতেও অপরিবর্তিত থাকে",
    "কোনো কাঁচামাল বা সংযোগের প্রয়োজন পড়ে না",
    "সর্বদা সম্পূর্ণ বিনামূল্যে কার্যকর হয়"
  ]);
  addQuestion({
    type: "mcq",
    nature: "theory",
    difficulty: "medium",
    title: `‘${t[7]}’-এর সফল কার্যকারিতার প্রধান শর্ত কোনটি?`,
    marks: 1,
    options: c5Opt.options,
    correctIndex: c5Opt.correctIndex,
    explanation: `নির্দিষ্ট নিয়ামক ও সহায়ক পরিবেশ ছাড়া এ ধরনের প্রক্রিয়ার স্বাভাবিক কার্যকারিতা বিঘ্নিত হয়।`,
    tags: [clsName, subjName, chapter.name, "MCQ", "অনুধাবনমূলক", "শর্ত"],
    usageCount: Math.floor(Math.random() * 4)
  });

  // C6: General Significance
  const c6Opt = shuffleOptions("এটি মানবকল্যাণ ও আধুনিক সভ্যতার বিকাশে প্রত্যক্ষ ভূমিকা রাখে", [
    "এটি সামাজিক অগ্রগতিতে বাধা সৃষ্টি করে",
    "এর কোনো বাস্তব উপযোগিতা নেই",
    "কেবলমাত্র তাত্ত্বিক আলোচনার মধ্যেই সীমাবদ্ধ"
  ]);
  addQuestion({
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: `‘${chapter.name}’-এর মূল শিক্ষা বা তাৎপর্য কোনটি?`,
    marks: 1,
    options: c6Opt.options,
    correctIndex: c6Opt.correctIndex,
    explanation: `অধ্যায়ের সার্বিক বিষয়বস্তু আধুনিক জ্ঞান ও সমাজ বিনির্মাণে ইতিবাচক ভূমিকা রাখে।`,
    tags: [clsName, subjName, chapter.name, "MCQ", "অনুধাবনমূলক", "তাৎপর্য"],
    usageCount: Math.floor(Math.random() * 4)
  });

  // =================================================================
  // 3. প্রয়োগমূলক ও বিষয়ভিত্তিক প্রশ্ন (Applied/Analytical MCQs) - 8 Questions
  // =================================================================

  if (isIct) {
    // ICT 1: Binary to Decimal
    const binOpt = shuffleOptions("১৩", ["১১", "১৫", "৯"]);
    addQuestion({
      type: "mcq", nature: "mathematical", difficulty: "easy",
      title: "বাইনারি সংখ্যা $(১১০১)_২$-এর সমতুল্য দশমিক মান কত?",
      marks: 1, options: binOpt.options, correctIndex: binOpt.correctIndex,
      explanation: "$(1101)_2 = 1 \\times 2^3 + 1 \\times 2^2 + 0 \\times 2^1 + 1 \\times 2^0 = 8 + 4 + 0 + 1 = 13$",
      tags: [clsName, subjName, chapter.name, "MCQ", "গাণিতিক", "আইসিটি", "বাইনারি"], usageCount: 2
    });

    // ICT 2: Decimal to Binary
    const decOpt = shuffleOptions("(১০১০০)₂", ["(১১০১০)₂", "(১০০১১)₂", "(১১১১১)₂"]);
    addQuestion({
      type: "mcq", nature: "mathematical", difficulty: "easy",
      title: "দশমিক সংখ্যা ২০-কে বাইনারিতে রূপান্তর করলে কোনটি পাওয়া যাবে?",
      marks: 1, options: decOpt.options, correctIndex: decOpt.correctIndex,
      explanation: "$20$ কে ক্রমাগত ২ দ্বারা ভাগ করলে ভাগশেষগুলো নিচ থেকে উপরে সাজালে $(10100)_2$ পাওয়া যায়।",
      tags: [clsName, subjName, chapter.name, "MCQ", "গাণিতিক", "আইসিটি", "সংখ্যা পদ্ধতি"], usageCount: 2
    });

    // ICT 3: Hexadecimal to Binary
    const hexOpt = shuffleOptions("(১০১০১১)₂", ["(১১০০০১)₂", "(১০১১০০)₂", "(১১১১১১)₂"]);
    addQuestion({
      type: "mcq", nature: "mathematical", difficulty: "medium",
      title: "হেক্সাডেসিমেল সংখ্যা $(২B)_{১৬}$-এর সমতুল্য বাইনারি মান কোনটি?",
      marks: 1, options: hexOpt.options, correctIndex: hexOpt.correctIndex,
      explanation: "$2 = 0010$ এবং $B (11) = 1011$, সুতরাং পূর্ণ বাইনারি মান $(00101011)_2$ বা $(101011)_2$।",
      tags: [clsName, subjName, chapter.name, "MCQ", "গাণিতিক", "আইসিটি", "হেক্সাডেসিমেল"], usageCount: 2
    });

    // ICT 4: Logic Gates XOR
    const xorOpt = shuffleOptions("যখন দুটি ইনপুট অসমান বা ভিন্ন হয়", ["যখন উভয় ইনপুট ১ হয়", "যখন উভয় ইনপুট ০ হয়", "সর্বদা আউটপুট ১ থাকে"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "medium",
      title: "XOR গেটের আউটপুট কখন ১ (High) হয়?",
      marks: 1, options: xorOpt.options, correctIndex: xorOpt.correctIndex,
      explanation: "XOR গেটে বিজোড় সংখ্যক ১ থাকলে অথবা দুটি ইনপুট পরস্পর অসমান $(0,1)$ বা $(1,0)$ হলে আউটপুট ১ হয়।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "আইসিটি", "লজিক গেট"], usageCount: 2
    });

    // ICT 5: HTML Tag for Hyperlink
    const htmlOpt = shuffleOptions("<a href=\"...\">", ["<link src=\"...\">", "<url href=\"...\">", "<href a=\"...\">"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: "HTML ওয়েবপেজে হাইপারলিংক তৈরি করার জন্য কোন ট্যাগটি ব্যবহৃত হয়?",
      marks: 1, options: htmlOpt.options, correctIndex: htmlOpt.correctIndex,
      explanation: "হাইপারলিংকের জন্য এঙ্কর ট্যাগ `<a>` এবং এর প্রধান অ্যাট্রিবিউট হলো `href`।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "আইসিটি", "HTML"], usageCount: 2
    });

    // ICT 6: IPv4 bit size
    const ipOpt = shuffleOptions("৩২ বিট", ["৬৪ বিট", "১২৮ বিট", "১৬ বিট"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: "IPv4 অ্যাড্রেসিং পদ্ধতিতে আইপি অ্যাড্রেস কত বিটের হয়?",
      marks: 1, options: ipOpt.options, correctIndex: ipOpt.correctIndex,
      explanation: "IPv4 অ্যাড্রেস ৩২ বিটের (৪টি অকটেট বা ৪ বাইট) হয়ে থাকে।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "আইসিটি", "নেটওয়ার্কিং"], usageCount: 2
    });

    // ICT 7: C Programming Loop
    const cOpt = shuffleOptions("৫ বার", ["৪ বার", "৬ বার", "অসীম বার"]);
    addQuestion({
      type: "mcq", nature: "mathematical", difficulty: "medium",
      title: "C প্রোগ্রামের কোড `for(int i = 0; i < 5; i++)` লুপটি মোট কতবার আবর্তিত হবে?",
      marks: 1, options: cOpt.options, correctIndex: cOpt.correctIndex,
      explanation: "$i$-এর মান $0, 1, 2, 3, 4$-এর জন্য লুপটি মোট ৫ বার নির্বাহ হবে।",
      tags: [clsName, subjName, chapter.name, "MCQ", "গাণিতিক", "আইসিটি", "সি প্রোগ্রামিং"], usageCount: 2
    });

    // ICT 8: Cloud Computing
    const cldOpt = shuffleOptions("SaaS (Software as a Service)", ["IaaS (Infrastructure)", "PaaS (Platform)", "DaaS (Data)"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: "Google Drive, Gmail ইত্যাদি ক্লাউড কম্পিউটিং-এর কোন সেবা মডেলের অন্তর্ভুক্ত?",
      marks: 1, options: cldOpt.options, correctIndex: cldOpt.correctIndex,
      explanation: "সরাসরি সফটওয়্যার ব্যবহারের সুবিধা প্রদান করায় এগুলো SaaS (Software as a Service) মডেল।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "আইসিটি", "ক্লাউড"], usageCount: 2
    });
  } else if (isBio) {
    // Bio 1: Powerhouse of cell
    const cellOpt = shuffleOptions("মাইটোকন্ড্রিয়া", ["রাইবোসোম", "গলগি বডি", "লাইসোজোম"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: "জীবকোষের শ্বসন ও শক্তি উৎপাদনের প্রধান কেন্দ্র বা ‘পাওয়ার হাউস’ কাকে বলা হয়?",
      marks: 1, options: cellOpt.options, correctIndex: cellOpt.correctIndex,
      explanation: "মাইটোকন্ড্রিয়ায় ক্রেবস চক্র ও শ্বসনের মাধ্যমে সর্বাধিক ATP উৎপন্ন হওয়ায় একে পাওয়ার হাউস বলে।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "জীববিজ্ঞান", "কোষ"], usageCount: 2
    });

    // Bio 2: Mendel's Monohybrid ratio
    const mendelOpt = shuffleOptions("৩ : ১", ["১ : ২ : ১", "৯ : ৩ : ৩ : ১", "২ : ১"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: "মেন্ডেলের প্রথম সূত্র (পৃথকীকরণ সূত্র) অনুযায়ী মনোসংকর ক্রসের $F_২$ জনুর ফিনোটাইপিক অনুপাত কত?",
      marks: 1, options: mendelOpt.options, correctIndex: mendelOpt.correctIndex,
      explanation: "মনোসংকর ক্রসে $F_2$ জনুতে ৩টি প্রকট এবং ১টি প্রচ্ছন্ন বৈশিষ্ট্য প্রকাশ পায় (৩:১)।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "জীববিজ্ঞান", "জিনতত্ত্ব"], usageCount: 2
    });

    // Bio 3: Photosynthesis Site
    const photoOpt = shuffleOptions("ক্লোরোপ্লাস্টের গ্রানা ও স্ট্রোমা", ["মাইটোকন্ড্রিয়ার ক্রিস্টি", "নিউক্লিওলাস", "কোষপ্রাচীর"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "medium",
      title: "উদ্ভিদে সালোকসংশ্লেষণের আলোক ও অন্ধকার পর্যায় যথাক্রমে কোথায় সম্পন্ন হয়?",
      marks: 1, options: photoOpt.options, correctIndex: photoOpt.correctIndex,
      explanation: "আলোক পর্যায় গ্রানার থাইলাকয়েড মেমব্রেনে এবং অন্ধকার পর্যায় স্ট্রোমায় সংঘটিত হয়।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "জীববিজ্ঞান", "সালোকসংশ্লেষণ"], usageCount: 2
    });

    // Bio 4: Blood Pressure Normal
    const bpOpt = shuffleOptions("১২০/৮০ mmHg", ["১৪০/৯০ mmHg", "১০০/৭০ mmHg", "১১০/৬০ mmHg"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: "সুস্থ প্রাপ্তবয়স্ক মানুষের স্বাভাবিক রক্তচাপের প্রমিত মান (সিস্টোলিক/ডায়াস্টোলিক) কত?",
      marks: 1, options: bpOpt.options, correctIndex: bpOpt.correctIndex,
      explanation: "আদর্শ স্বাভাবিক রক্তচাপ হলো ১২০/৮০ মিলিমিটার পারদ চাপ (mmHg)।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "জীববিজ্ঞান", "রক্তসংবহন"], usageCount: 2
    });

    // Bio 5: Human Chromosome count
    const chrOpt = shuffleOptions("২৩ জোড়া (৪৬টি)", ["২২ জোড়া (৪৪টি)", "২৪ জোড়া (৪৮টি)", "৪৬ জোড়া"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: "মানবদেহের প্রতিটি সাধারণ দেহকোষে মোট ক্রোমোজোম সংখ্যা কত?",
      marks: 1, options: chrOpt.options, correctIndex: chrOpt.correctIndex,
      explanation: "মানুষের কোষে ২৩ জোড়া (২২ জোড়া অটোসোম এবং ১ জোড়া সেক্স ক্রোমোজোম) অর্থাৎ মোট ৪৬টি ক্রোমোজোম থাকে।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "জীববিজ্ঞান", "ক্রোমোজোম"], usageCount: 2
    });

    // Bio 6: Universal Donor
    const bldOpt = shuffleOptions("O নেগেটিভ [O(-)]", ["AB পজিটিভ [AB(+)]", "A পজিটিভ", "B পজিটিভ"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: "কোন রক্তের গ্রুপকে ‘সার্বজনীন দাতা’ (Universal Donor) বলা হয়?",
      marks: 1, options: bldOpt.options, correctIndex: bldOpt.correctIndex,
      explanation: "O নেগেটিভ রক্তে লোহিত কণিকায় কোনো A, B বা Rh অ্যান্টিজেন না থাকায় এটি সার্বজনীন দাতা।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "জীববিজ্ঞান", "রক্তের গ্রুপ"], usageCount: 2
    });

    // Bio 7: Enzyme for Genetic Engineering
    const enzOpt = shuffleOptions("রেস্ট্রিকশন এনজাইম", ["ডিএনএ লাইগেজ", "অ্যামাইলেজ", "পেপসিন"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "medium",
      title: "জিন প্রকৌশলে ডিএনএ অণুকে নির্দিষ্ট স্থানে কাটার জন্য আণবিক কাঁচি (Molecular Scissor) হিসেবে কোনটি ব্যবহৃত হয়?",
      marks: 1, options: enzOpt.options, correctIndex: enzOpt.correctIndex,
      explanation: "রেস্ট্রিকশন এন্ডোনিউক্লিয়েজ এনজাইম নির্দিষ্ট ক্ষারক সজ্জা চিনে ডিএনএ কেটে দেয়।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "জীববিজ্ঞান", "বায়োটেকনোলজি"], usageCount: 2
    });

    // Bio 8: Mitosis Stage
    const anaphaseOpt = shuffleOptions("অ্যানাফেজ (গতিপর্যায়)", ["মেটাফেজ", "প্রোফেজ", "টেলোফেজ"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "medium",
      title: "মাইটোটিক কোষ বিভাজনের কোন পর্যায়ে সেন্ট্রোমিয়ার বিভক্ত হয়ে অপত্য ক্রোমোজোম বিপরীত মেরুর দিকে ধাবিত হয়?",
      marks: 1, options: anaphaseOpt.options, correctIndex: anaphaseOpt.correctIndex,
      explanation: "অ্যানাফেজ ধাপে ক্রোমোজোমগুলো মেরুমুখী চলন দেখায় (V, L, J, I আকৃতি ধারণ করে)।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "জীববিজ্ঞান", "কোষ বিভাজন"], usageCount: 2
    });
  } else if (isBangla) {
    // Bangla 1: Shondhi
    const shnOpt = shuffleOptions("বিদ্যা + আলয়", ["বিদ্য + আলয়", "বিদ্যা + লয়", "বিদ্ + আলয়"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: "‘বিদ্যালয়’ শব্দের সঠিক সন্ধি বিচ্ছেদ কোনটি?",
      marks: 1, options: shnOpt.options, correctIndex: shnOpt.correctIndex,
      explanation: "আ + আ = আ নিয়মানুসারে বিদ্যা + আলয় = বিদ্যালয়।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "বাংলা", "ব্যাকরণ"], usageCount: 2
    });

    // Bangla 2: Shomash
    const shmOpt = shuffleOptions("বহুব্রীহি সমাস", ["তৎপুরুষ সমাস", "দ্বন্দ্ব সমাস", "কর্মধারয় সমাস"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: "‘দশ আনন যার = দশানন’—এটি কোন সমাসের উদাহরণ?",
      marks: 1, options: shmOpt.options, correctIndex: shmOpt.correctIndex,
      explanation: "পূর্বপদ বা পরপদের অর্থ না বুঝিয়ে অন্য কোনো ব্যক্তিকে (রাবণ) বোঝানোয় এটি বহুব্রীহি সমাস।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "বাংলা", "সমাস"], usageCount: 2
    });

    // Bangla 3: Karok
    const krkOpt = shuffleOptions("অপাদান কারক", ["করণ কারক", "অধিকরণ কারক", "কর্ম কারক"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "medium",
      title: "‘গাছ থেকে পাতা পড়ে’—বাক্যে ‘গাছ থেকে’ কোন কারকে কোন বিভক্তি?",
      marks: 1, options: krkOpt.options, correctIndex: krkOpt.correctIndex,
      explanation: "যা থেকে কিছু বিচ্যুত বা পতিত হয় তা অপাদান কারক (হতে/থেকে = পঞ্চমী বিভক্তি)।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "বাংলা", "কারক"], usageCount: 2
    });

    // Bangla 4: Bagdhara
    const bgdOpt = shuffleOptions("ভীষণ শত্রুতা", ["ঘনিষ্ঠ বন্ধুত্ব", "ক্ষণস্থায়ী বস্তু", "অসম্ভব ব্যাপার"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: "‘আদায়-কাঁচকলায়’ বাগধারাটির সঠিক অর্থ কোনটি?",
      marks: 1, options: bgdOpt.options, correctIndex: bgdOpt.correctIndex,
      explanation: "আদায়-কাঁচকলায় বাগধারাটির প্রচলিত অর্থ হলো শত্রুভাবাপন্ন বা চরম শত্রুতা।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "বাংলা", "বাগধারা"], usageCount: 2
    });

    // Bangla 5: Shuddho Banan
    const bnnOpt = shuffleOptions("মুমূর্ষু", ["মুমুর্ষু", "মুমুর্ষূ", "মুমূর্ষূ"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "medium",
      title: "নিচের কোন বানানটি প্রমিত বাংলা বানানরীতি অনুসারে শুদ্ধ?",
      marks: 1, options: bnnOpt.options, correctIndex: bnnOpt.correctIndex,
      explanation: "প্রমিত নিয়ম অনুসারে সঠিক বানান হলো মুমূর্ষু (হ্রস্ব উ, দীর্ঘ ঊ, হ্রস্ব উ)।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "বাংলা", "বানান"], usageCount: 2
    });

    // Bangla 6: Sadhu Cholito
    const bshOpt = shuffleOptions("গুরুচণ্ডালী দোষ", ["উপমার ভুল প্রয়োগ", "বাহুল্য দোষ", "আকাঙ্ক্ষার ঘাটতি"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: "একই বাক্যে সাধু ও চলিত ভাষারীতির মিশ্রণ ঘটালে কোন ধরনের দোষের সৃষ্টি হয়?",
      marks: 1, options: bshOpt.options, correctIndex: bshOpt.correctIndex,
      explanation: "সাধু ও চলিত ক্রিয়াপদ ও সর্বনামের মিশ্রণকে গুরুচণ্ডালী দোষ বলে।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "বাংলা", "ভাষারীতি"], usageCount: 2
    });

    // Bangla 7: Biram Chinho
    const brmOpt = shuffleOptions("১ সেকেন্ড", ["এক বলতে যে সময় লাগে", "থামার প্রয়োজন নেই", "১ বলার দ্বিগুণ সময়"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: "বাংলা বাক্যে দাঁড়ি (।), প্রশ্নবোধক (?) ও বিস্ময়চিহ্নে (!) কতক্ষণ থামতে হয়?",
      marks: 1, options: brmOpt.options, correctIndex: brmOpt.correctIndex,
      explanation: "দাঁড়ি, প্রশ্নবোধক এবং বিস্ময়চিহ্নে বিরতিকাল হলো পূর্ণ ১ সেকেন্ড।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "বাংলা", "বিরামচিহ্ন"], usageCount: 2
    });

    // Bangla 8: Prottoy
    const prtOpt = shuffleOptions("কৃতপ্রত্যয়", ["তদ্ধিত প্রত্যয়", "বিভক্তি", "উপসর্গ"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "medium",
      title: "ধাতু বা ক্রিয়ামূলের শেষে যে প্রত্যয় যুক্ত হয়ে নতুন শব্দ গঠন করে তাকে কী বলে?",
      marks: 1, options: prtOpt.options, correctIndex: prtOpt.correctIndex,
      explanation: "ক্রিয়ামূলের শেষে যুক্ত প্রত্যয়কে কৃতপ্রত্যয় এবং নাম শব্দের শেষে যুক্ত হলে তদ্ধিত প্রত্যয় বলে।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "বাংলা", "প্রত্যয়"], usageCount: 2
    });
  } else {
    // BGS / General Social Studies
    // BGS 1: Historic 7th March
    const bgs1Opt = shuffleOptions("ঢাকার রেসকোর্স ময়দানে (বর্তমান সোহরাওয়ার্দী উদ্যান)", ["পল্টন ময়দানে", "ধানমন্ডি ৩২ নম্বরে", "ঢাকা বিশ্ববিদ্যালয়ে"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: "বঙ্গবন্ধু শেখ মুজিবুর রহমান ঐতিহাসিক ৭ই মার্চের অবিস্মরণীয় ভাষণ কোথায় প্রদান করেন?",
      marks: 1, options: bgs1Opt.options, correctIndex: bgs1Opt.correctIndex,
      explanation: "১৯৭১ সালের ৭ই মার্চ রেসকোর্স ময়দানে লাখো জনতার উপস্থিতিতে ঐতিহাসিক ভাষণটি দেওয়া হয়।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "বিজিএস", "ইতিহাস"], usageCount: 2
    });

    // BGS 2: Language Movement
    const bgs2Opt = shuffleOptions("১৯৫২ সালের ২১শে ফেব্রুয়ারি", ["১৯৪৭ সালের ১৪ই আগস্ট", "১৯৫৪ সালের ৮ই মার্চ", "১৯৬৬ সালের ২৩শে মার্চ"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: "বাংলাকে রাষ্ট্রভাষা করার দাবিতে ঢাকার রাজপথে সালাম, বরকত, রফিক ও জব্বার কোন তারিখে শহীদ হন?",
      marks: 1, options: bgs2Opt.options, correctIndex: bgs2Opt.correctIndex,
      explanation: "১৯৫২ সালের ২১শে ফেব্রুয়ারি রাষ্ট্রভাষা বাংলার দাবিতে ১৪৪ ধারা ভেঙে মিছিলে গুলি চালানো হয়।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "বিজিএস", "ভাষা আন্দোলন"], usageCount: 2
    });

    // BGS 3: Constitution Effect
    const bgs3Opt = shuffleOptions("১৯৭২ সালের ১৬ই ডিসেম্বর", ["১৯৭১ সালের ২৬শে মার্চ", "১৯৭২ সালের ৪ঠা নভেম্বর", "১৯৭৩ সালের ৭ই মার্চ"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: "গণপ্রজাতন্ত্রী বাংলাদেশের সংবিধান আনুষ্ঠানিকভাবে কোন তারিখে কার্যকর হয়?",
      marks: 1, options: bgs3Opt.options, correctIndex: bgs3Opt.correctIndex,
      explanation: "সংবিধান গণপরিষদে ৪ নভেম্বর গৃহীত হয় এবং প্রথম বিজয় দিবস ১৬ ডিসেম্বর ১৯৭২ থেকে কার্যকর হয়।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "বিজিএস", "সংবিধান"], usageCount: 2
    });

    // BGS 4: Organs of Government
    const bgs4Opt = shuffleOptions("৩টি (আইন বিভাগ, শাসন বিভাগ ও বিচার বিভাগ)", ["২টি (শাসন ও বিচার)", "৪টি বিভাগ", "৫টি বিভাগ"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: "গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের কাঠামো কয়টি প্রধান মৌলিক বিভাগের সমন্বয়ে গঠিত?",
      marks: 1, options: bgs4Opt.options, correctIndex: bgs4Opt.correctIndex,
      explanation: "গণতান্ত্রিক রাষ্ট্রব্যবস্থায় সরকারের তিনটি প্রধান অঙ্গ: আইন বিভাগ, শাসন বিভাগ ও বিচার বিভাগ।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "বিজিএস", "শাসনব্যবস্থা"], usageCount: 2
    });

    // BGS 5: Mujibnagar Government
    const bgs5Opt = shuffleOptions("১৯৭১ সালের ১৭ই এপ্রিল", ["১৯৭১ সালের ১০ই এপ্রিল", "১৯৭১ সালের ২৬শে মার্চ", "১৯৭১ সালের ১৬ই ডিসেম্বর"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: "মেহেরপুরের বৈদ্যনাথতলার ভবেরপাড়ায় ঐতিহাসিক মুজিবনগর সরকার আনুষ্ঠানিকভাবে কোন তারিখে শপথ গ্রহণ করে?",
      marks: 1, options: bgs5Opt.options, correctIndex: bgs5Opt.correctIndex,
      explanation: "১০ এপ্রিল গঠিত এবং ১৭ এপ্রিল মেহেরপুরের আম্রকাননে মুজিবনগর সরকার আনুষ্ঠানিকভাবে শপথ নেয়।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "বিজিএস", "মুক্তিযুদ্ধ"], usageCount: 2
    });

    // BGS 6: Longest Beach
    const bgs6Opt = shuffleOptions("কক্সবাজার সমুদ্র সৈকত (প্রায় ১২০ কিমি)", ["কুয়াকাটা সৈকত", "পতেঙ্গা সৈকত", "সেন্টমার্টিন সৈকত"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: "বিশ্বের দীর্ঘতম নিরবচ্ছিন্ন প্রাকৃতিক বালুকাময় সমুদ্র সৈকত কোনটি?",
      marks: 1, options: bgs6Opt.options, correctIndex: bgs6Opt.correctIndex,
      explanation: "কক্সবাজার সমুদ্র সৈকত ১২০ কিমি দৈর্ঘ্য নিয়ে বিশ্বের দীর্ঘতম অবিচ্ছিন্ন প্রাকৃতিক সৈকত।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "বিজিএস", "ভূগোল"], usageCount: 2
    });

    // BGS 7: Sustainable Development Goals (SDG)
    const bgs7Opt = shuffleOptions("১৭টি", ["৮টি", "১৫টি", "২০টি"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: "জাতিসংঘ ঘোষিত টেকসই উন্নয়ন অভীষ্ট (SDG)-তে মোট কয়টি লক্ষ্যমাত্রা নির্ধারণ করা হয়েছে?",
      marks: 1, options: bgs7Opt.options, correctIndex: bgs7Opt.correctIndex,
      explanation: "২০১৫ সালে জাতিসংঘ ২০৩০ এজেন্ডা হিসেবে ১৭টি টেকসই উন্নয়ন লক্ষ্য (SDG) ঘোষণা করে।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "বিজিএস", "এসডিজি"], usageCount: 2
    });

    // BGS 8: Primary Social Institution
    const bgs8Opt = shuffleOptions("পরিবার", ["বিদ্যালয়", "রাষ্ট্র", "ধর্মীয় প্রতিষ্ঠান"]);
    addQuestion({
      type: "mcq", nature: "theory", difficulty: "easy",
      title: "মানব সমাজের সবচেয়ে আদিম ও ক্ষুদ্রতম মৌলিক সামাজিক প্রতিষ্ঠান কোনটি?",
      marks: 1, options: bgs8Opt.options, correctIndex: bgs8Opt.correctIndex,
      explanation: "পরিবার হলো মানুষের আদিমতম সামাজিক সংগঠন এবং সামাজিকীকরণের প্রধান ভিত্তি।",
      tags: [clsName, subjName, chapter.name, "MCQ", "তত্ত্বীয়", "বিজিএস", "সমাজ"], usageCount: 2
    });
  }

  // =================================================================
  // 4. বহুপদী সমাপ্তিসূচক প্রশ্ন (Composite Multi-statement: i, ii, iii) - 4 Questions
  // =================================================================

  // Comp 1: Structural / Conceptual
  const comp1 = buildCompositeQuestion(
    `‘${chapter.name}’-এর নিয়ামক ও বৈশিষ্ট্যের ক্ষেত্রে—`,
    "প্রাকৃতিক ও যৌক্তিক নিয়মে এটি পরস্পর সম্পর্কযুক্ত",
    "নির্দিষ্ট শর্তে এর মান বা কার্যকারিতা পরিবর্তিত হয়",
    "এটি কোনো বাহ্যিক নিয়মের তোয়াক্কা করে না",
    "i ও ii"
  );
  addQuestion({
    type: "mcq", nature: "theory", difficulty: "medium",
    title: comp1.title, marks: 1, options: comp1.options, correctIndex: comp1.correctIndex,
    explanation: "প্রাকৃতিক ও বৈজ্ঞানিক কোনো ব্যবস্থাই বাহ্যিক প্রভাবহীন নয়, তাই বিবৃতি iii ভুল। সঠিক উত্তর i ও ii।",
    tags: [clsName, subjName, chapter.name, "MCQ", "বহুপদী সমাপ্তিসূচক"], usageCount: 2
  });

  // Comp 2: Functional Impact
  const comp2 = buildCompositeQuestion(
    `‘${t[0]}’ ও ‘${t[1]}’-এর সমন্বিত প্রয়োগের ফলে—`,
    "সমগ্র ব্যবস্থার গুণগত মান বৃদ্ধি পায়",
    "সময় ও সম্পদের সাশ্রয় ঘটে",
    "কার্যকারিতার ভারসাম্য বিনষ্ট হয়",
    "i ও ii"
  );
  addQuestion({
    type: "mcq", nature: "theory", difficulty: "easy",
    title: comp2.title, marks: 1, options: comp2.options, correctIndex: comp2.correctIndex,
    explanation: "সঠিক প্রয়োগের মাধ্যমে ভারসাম্য রক্ষা পায় ও কার্যকারিতা বৃদ্ধি পায়, তাই বিবৃতি i ও ii সঠিক।",
    tags: [clsName, subjName, chapter.name, "MCQ", "বহুপদী সমাপ্তিসূচক"], usageCount: 2
  });

  // Comp 3: Modern Applications
  const comp3 = buildCompositeQuestion(
    `আধুনিক বিজ্ঞান ও সমাজের প্রেক্ষিতে ‘${chapter.name}’-এর ভূমিকা হলো—`,
    "তথ্যপ্রযুক্তি ও গবেষণায় নতুন মাত্রা যোগ করা",
    "সমস্যা সমাধানে যৌক্তিক দৃষ্টিভঙ্গি তৈরি করা",
    "পরিবেশ ও অর্থনৈতিক উন্নয়নে সহায়তা করা",
    "i, ii ও iii"
  );
  addQuestion({
    type: "mcq", nature: "theory", difficulty: "medium",
    title: comp3.title, marks: 1, options: comp3.options, correctIndex: comp3.correctIndex,
    explanation: "আধুনিক জ্ঞানবিজ্ঞান ও টেকসই উন্নয়নের প্রেক্ষিতে তিনটি বিবৃতিই যথাযথ।",
    tags: [clsName, subjName, chapter.name, "MCQ", "বহুপদী সমাপ্তিসূচক"], usageCount: 2
  });

  // Comp 4: Chapter Core Evaluation
  const comp4 = buildCompositeQuestion(
    `‘${l[0]}’-এর আদর্শিক প্রেক্ষাপটে বিবেচনা করলে—`,
    "নীতিমালার সঠিক অনুসরণ সাফল্য নিশ্চিত করে",
    "অনিয়ন্ত্রিত প্রক্রিয়া দীর্ঘমেয়াদে বিপর্যয় ডেকে আনে",
    "উন্নয়নের কোনো বিকল্প বা শর্ত থাকে না",
    "i ও ii"
  );
  addQuestion({
    type: "mcq", nature: "theory", difficulty: "medium",
    title: comp4.title, marks: 1, options: comp4.options, correctIndex: comp4.correctIndex,
    explanation: "যেকোনো টেকসই উন্নয়নে নির্দিষ্ট নিয়ম ও শৃঙ্খলা থাকা আবশ্যক, তাই বিবৃতি i ও ii সঠিক।",
    tags: [clsName, subjName, chapter.name, "MCQ", "বহুপদী সমাপ্তিসূচক"], usageCount: 2
  });

  // =================================================================
  // 5. সৃজনশীল প্রশ্ন (Creative Questions: CQ) - 2 Questions
  // =================================================================

  // Use chapter.cqStems if available
  if (chapter.cqStems && chapter.cqStems.length > 0) {
    for (const cq of chapter.cqStems) {
      addQuestion({
        type: "cq", nature: "theory", difficulty: "hard",
        title: cq.stem, marks: 10, options: [], correctIndex: 0,
        subQuestions: [
          { label: "ক", text: cq.qA, marks: 1, answer: cq.aA },
          { label: "খ", text: cq.qB, marks: 2, answer: cq.aB },
          { label: "গ", text: cq.qC, marks: 3, answer: cq.aC },
          { label: "ঘ", text: cq.qD, marks: 4, answer: cq.aD }
        ],
        explanation: "সৃজনশীল উদ্দীপকভিত্তিক চার স্তরের প্রমিত বোর্ড স্ট্যান্ডার্ড মডেল সমাধান।",
        tags: [clsName, subjName, chapter.name, "CQ", "সৃজনশীল", "তত্ত্বীয়"], usageCount: 2
      });
    }
  }

  // Ensure at least 2 CQs per chapter
  if (list.filter(q => q.type === "cq").length < 2) {
    const termA = t[0] || "প্রধান প্রত্যয়";
    const termB = t[1] || "সহায়ক উপাদান";
    const law = l[0] || "প্রমিত নীতিমালা";

    addQuestion({
      type: "cq", nature: "theory", difficulty: "hard",
      title: `উদ্দীপক:
একটি জাতীয় গবেষণা সংস্থায় ‘${chapter.name}’-এর প্রয়োগিক গুরুত্ব পর্যালোচনার জন্য একটি বিশেষ জরিপ পরিচালিত হয়। জরিপে দেখা যায়, ${termA}-এর সঠিক নিয়ন্ত্রণের মাধ্যমে সামগ্রিক আউটপুট বহুগুণ বৃদ্ধি পেয়েছে। অপরদিকে, ${termB}-এর অবহেলা সমগ্র প্রক্রিয়ায় কিছু সীমাবদ্ধতা তৈরি করেছিল, যা পরবর্তীতে ${law}-এর মাধ্যমে সমাধান করা সম্ভব হয়।`,
      marks: 10, options: [], correctIndex: 0,
      subQuestions: [
        { label: "ক", text: `${termA} কাকে বলে?`, marks: 1, answer: `${termA}-এর সংজ্ঞাগত বিবরণ সঠিকভাবে প্রদান করা হলো।` },
        { label: "খ", text: `${termB} বলতে কী বোঝায়? ব্যাখ্যা করো।`, marks: 2, answer: `${termB}-এর মূল ভাব ও প্রেক্ষাপট সংক্ষেপে ব্যাখ্যা করা হলো।` },
        { label: "গ", text: `উদ্দীপকের আলোকে ${termA}-এর ইতিবাচক ভূমিকা বিশ্লেষণ করো।`, marks: 3, answer: `উদ্দীপকের তথ্যানুসারে কীভাবে প্রক্রিয়াটি পরিচালিত হয়েছে তার বিস্তারিত বিশ্লেষণ।` },
        { label: "ঘ", text: `“${law}-এর যথাযথ বাস্তবায়নই সমগ্র ব্যবস্থার দীর্ঘমেয়াদী সাফল্য নিশ্চিত করেছে”—যৌক্তিক মতামত দাও।`, marks: 4, answer: `উক্তিটির পক্ষে সুনির্দিষ্ট যুক্তি উপস্থাপন ও চূড়ান্ত সিদ্ধান্ত গ্রহণ।` }
      ],
      explanation: `${chapter.name} সৃজনশীল উদ্দীপকের ধারাবাহিক মডেল উত্তর।`,
      tags: [clsName, subjName, chapter.name, "CQ", "সৃজনশীল", "তত্ত্বীয়"], usageCount: 2
    });
  }

  return list;
}
