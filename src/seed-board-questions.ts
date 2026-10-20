import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { env } from "./config/env.js";
import { QuestionBankItemModel, type QuestionBankItemRecord, type BankSubQuestion } from "./modules/question-bank/questionBank.models.js";

interface BoardQuestionInput {
  className: string;
  subject: string;
  chapter: string;
  type: "mcq" | "cq";
  nature: "theory" | "mathematical";
  difficulty: "easy" | "medium" | "hard";
  title: string;
  subtitle?: string;
  imageUrl?: string;
  options?: [string, string, string, string];
  correctIndex?: number;
  subQuestions?: BankSubQuestion[];
  explanation: string;
  boardName: string;
  boardNameEn: string;
  year: string;
  yearBn: string;
  exam: "SSC" | "HSC";
  extraTags?: string[];
}

const BOARD_QUESTIONS: BoardQuestionInput[] = [
  // =========================================================================
  // 1. SSC পদার্থবিজ্ঞান (Physics)
  // =========================================================================
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "পদার্থবিজ্ঞান",
    chapter: "অধ্যায় ১: ভৌত রাশি ও পরিমাপ",
    type: "mcq",
    nature: "mathematical",
    difficulty: "medium",
    title: "একটি স্লাইড ক্যালিপার্সের প্রধান স্কেলের ক্ষুদ্রতম ১ ভাগের মান ১ মিমি। প্রধান স্কেলের ১৯ ভাগ ভার্নিয়ার স্কেলের ২০ ভাগের সমান হলে ভার্নিয়ার ধ্রুবক (VC) কত?",
    options: ["০.০৫ মিমি", "০.১ মিমি", "০.০২ মিমি", "০.৫ মিমি"],
    correctIndex: 0,
    explanation: "ভার্নিয়ার ধ্রুবক $VC = \\frac{s}{n} = \\frac{১ \\text{ mm}}{২০} = ০.০৫ \\text{ mm}$।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "পদার্থবিজ্ঞান",
    chapter: "অধ্যায় ১: ভৌত রাশি ও পরিমাপ",
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: "আন্তর্জাতিক পদ্ধতিতে (SI) দীপন তীব্রতার একক কোনটি?",
    options: ["ক্যান্ডেলা (cd)", "লুমেন (lm)", "লাক্স (lx)", "ওয়াট (W)"],
    correctIndex: 0,
    explanation: "এসআই পদ্ধতিতে দীপন তীব্রতার মৌলিক একক ক্যান্ডেলা (Candela)।",
    boardName: "রাজশাহী বোর্ড",
    boardNameEn: "Rajshahi Board",
    year: "2023",
    yearBn: "২০২৩",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "পদার্থবিজ্ঞান",
    chapter: "অধ্যায় ১: ভৌত রাশি ও পরিমাপ",
    type: "cq",
    nature: "mathematical",
    difficulty: "medium",
    title: "একটি ঘনকের এক বাহুর পরিমাপে প্রধান স্কেল পাঠ ৫ সেমি, ভার্নিয়ার সমপাতন ৪ এবং ভার্নিয়ার ধ্রুবক ০.০১ সেমি। ঘনকটির ভর নিক্তি দিয়ে মেপে ২৫০ গ্রাম পাওয়া গেল।",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Vernier_caliper.svg/480px-Vernier_caliper.svg.png",
    subQuestions: [
      { label: "ক", text: "পিচ কাকে বলে?", marks: 1, answer: "স্ক্রু গজের বৃত্তাকার স্কেল একবার সম্পূর্ণ ঘোরালে এটি রৈখিক স্কেল বরাবর যে দূরত্ব অতিক্রম করে তাকে পিচ বলে।" },
      { label: "খ", text: "ঘনত্ব একটি লব্ধ রাশি—ব্যাখ্যা কর।", marks: 2, answer: "ঘনত্ব = ভর/আয়তন = ভর/(দৈর্ঘ্য)³। যেহেতু ঘনত্ব মৌলিক রাশি ভর ও দৈর্ঘ্যের ওপর নির্ভরশীল, তাই এটি একটি লব্ধ রাশি।" },
      { label: "গ", text: "উদ্দীপকের ঘনকটির এক বাহুর দৈর্ঘ্য নির্ণয় কর।", marks: 3, answer: "এক বাহুর দৈর্ঘ্য $L = M + (V \\times VC) = ৫ + (৪ \\times ০.০১) = ৫.০৪ \\text{ সেমি}$।" },
      { label: "ঘ", text: "ঘনকটির উপাদানের ঘনত্ব এসআই (SI) এককে কত হবে তা গাণিতিকভাবে বিশ্লেষণ কর।", marks: 4, answer: "আয়তন $V = L^3 = (৫.০৪)^৩ = ১২৮.০২৪ \\text{ cm}^3 = ১.২৮০২৪ \\times ১০^{-৪} \\text{ m}^3$। ভর $m = ২৫০ \\text{ g} = ০.২৫ \\text{ kg}$। ঘনত্ব $\\rho = m/V = ০.২৫ / (১.২৮০২৪ \\times ১০^{-৪}) \\approx ১৯৫২.৭৬ \\text{ kg/m}^3$।" }
    ],
    explanation: "ঘনকের বাহুর পরিমাপ এবং এসআই এককে ঘনত্বের গাণিতিক সূত্রাবলি ভিত্তিক বোর্ড প্রশ্ন।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2023",
    yearBn: "২০২৩",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "পদার্থবিজ্ঞান",
    chapter: "অধ্যায় ২: গতি",
    type: "mcq",
    nature: "mathematical",
    difficulty: "medium",
    title: "স্থির অবস্থান থেকে সুষম ত্বরণে চলন্ত একটি গাড়ি ৩ সেকেন্ডে ২৭ মিটার অতিক্রম করলে এর ত্বরণ কত?",
    options: ["৬ মি/সে²", "৯ মি/সে²", "৩ মি/সে²", "১৮ মি/সে²"],
    correctIndex: 0,
    explanation: "$s = ut + \\frac{1}{2}at^2 \\implies ২৭ = ০ + \\frac{1}{2} \\times a \\times ৩^২ \\implies ২৭ = ৪.৫ a \\implies a = ৬ \\text{ m/s}^2$।",
    boardName: "কুমিল্লা বোর্ড",
    boardNameEn: "Comilla Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "পদার্থবিজ্ঞান",
    chapter: "অধ্যায় ২: গতি",
    type: "cq",
    nature: "mathematical",
    difficulty: "hard",
    title: "একটি গাড়ি স্থির অবস্থা থেকে ২ মি/সে² সুষম ত্বরণে চলা শুরু করল। ঠিক একই সময়ে পেছনের ৫০ মিটার দূর থেকে অপর একটি বাস ১৫ মি/সে সমবেগে একই দিকে চলতে শুরু করল।",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Uniform_motion_and_uniform_acceleration.svg/480px-Uniform_motion_and_uniform_acceleration.svg.png",
    subQuestions: [
      { label: "ক", text: "সমবেগ কাকে বলে?", marks: 1, answer: "কোনো গতিশীল বস্তুর বেগের মান ও দিক যদি সর্বদাই অপরিবর্তিত থাকে, তবে তাকে সমবেগ বলে।" },
      { label: "খ", text: "অভিকর্ষের বিপরীতে নিক্ষিপ্ত বস্তুর ত্বরণ সর্বদা ঋণাত্মক হয় কেন?", marks: 2, answer: "নিক্ষিপ্ত বস্তু উপরের দিকে গতিশীল থাকে কিন্তু অভিকর্ষজ ত্বরণ সর্বদা পৃথিবীর কেন্দ্রের দিকে (নিচের দিকে) কাজ করে, তাই ত্বরণ ঋণাত্মক হয়।" },
      { label: "গ", text: "১০ সেকেন্ড পর গাড়িটির বেগ কত হবে?", marks: 3, answer: "$v = u + at = ০ + ২ \\times ১০ = ২০ \\text{ মি/সে}$।" },
      { label: "ঘ", text: "পথিমধ্যে বাসটি গাড়িটিকে কতবার অতিক্রম করবে? গাণিতিক যুক্তিসহ বিশ্লেষণ কর।", marks: 4, answer: "ধরি $t$ সময় পর দেখা হবে। বাসের দূরত্ব $s_১ = ১৫t$ এবং গাড়ির দূরত্ব $s_২ = \\frac{১}{২} \\times ২ \\times t^২ = t^২$। শর্তমতে, $১৫t = ৫০ + t^২ \\implies t^২ - ১৫t + ৫০ = ০ \\implies (t - ৫)(t - ১০) = ০$। সুতরাং বাসটি গাড়িটিকে ২ বার অতিক্রম করবে: প্রথমে ৫ সেকেন্ডে এবং পরে ১০ সেকেন্ডে।" }
    ],
    explanation: "গতির বিখ্যাত দুই যানের মিলিত হওয়ার গাণিতিক সমস্যা (SSC বোর্ড পরীক্ষা)।",
    boardName: "রাজশাহী বোর্ড",
    boardNameEn: "Rajshahi Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "পদার্থবিজ্ঞান",
    chapter: "অধ্যায় ৩: বল",
    type: "mcq",
    nature: "mathematical",
    difficulty: "medium",
    title: "১০ কেজি ভরের একটি স্থির বস্তুর ওপর ৫০ নিউটন বল ৩ সেকেন্ড ধরে প্রয়োগ করলে ভরবেগের পরিবর্তন কত হবে?",
    options: ["১৫০ কেজি·মি/সে", "৫০ কেজি·মি/সে", "৫০০ কেজি·মি/সে", "৩০ কেজি·মি/সে"],
    correctIndex: 0,
    explanation: "ভরবেগের পরিবর্তন = বলের ঘাত = $F \\times t = ৫০ \\times ৩ = ১৫০ \\text{ kg}\\cdot\\text{m/s}$।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "পদার্থবিজ্ঞান",
    chapter: "অধ্যায় ৪: কাজ, ক্ষমতা ও শক্তি",
    type: "mcq",
    nature: "mathematical",
    difficulty: "easy",
    title: "১ কিলোওয়াট-ঘণ্টা (1 kWh) সমান কত জুল?",
    options: ["৩.৬ × ১০⁶ জুল", "৩.৬ × ১০³ জুল", "১০০০ জুল", "৩৬০ জুল"],
    correctIndex: 0,
    explanation: "$১ \\text{ kWh} = ১০০০ \\text{ W} \\times ৩৬০০ \\text{ s} = ৩.৬ \\times ১০^৬ \\text{ J}$।",
    boardName: "দিনাজপুর বোর্ড",
    boardNameEn: "Dinajpur Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "পদার্থবিজ্ঞান",
    chapter: "অধ্যায় ৪: কাজ, ক্ষমতা ও শক্তি",
    type: "cq",
    nature: "mathematical",
    difficulty: "medium",
    title: "৬০ মিটার উচ্চতা থেকে একটি ২ কেজি ভরের পাথর অবাধে নিচে পড়তে দেওয়া হলো। ($g = ৯.৮ \\text{ মি/সে}^২$)",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Bouncing_ball_strobe_edit.jpg/320px-Bouncing_ball_strobe_edit.jpg",
    subQuestions: [
      { label: "ক", text: "কর্মদক্ষতা কাকে বলে?", marks: 1, answer: "কোনো ইঞ্জিন বা যন্ত্র থেকে প্রাপ্ত মোট লভ্য কার্যকর শক্তি এবং প্রদত্ত মোট শক্তির অনুপাতকে কর্মদক্ষতা বলে।" },
      { label: "খ", text: "অভিকর্ষ বল একটি সংরক্ষণশীল বল কেন?", marks: 2, answer: "কারণ অভিকর্ষ বলের দ্বারা একটি পূর্ণ চক্রে মোট কাজের পরিমাণ শূন্য হয় এবং কৃতকাজ শুধু আদি ও শেষ অবস্থানের ওপর নির্ভর করে, গতিপথের ওপর নয়।" },
      { label: "গ", text: "ভূমি স্পর্শ করার পূর্ব মুহূর্তে পাথরটির গতিশক্তি নির্ণয় কর।", marks: 3, answer: "সর্বোচ্চ উচ্চতার বিভবশক্তি = ভূমি স্পর্শ মুহূর্তের গতিশক্তি = $mgh = ২ \\times ৯.৮ \\times ৬০ = ১১৭৬ \\text{ জুল}$।" },
      { label: "ঘ", text: "ভূমি থেকে কত উচ্চতায় পাথরটির গতিশক্তি বিভবশক্তির দ্বিগুণ হবে? গাণিতিক বিশ্লেষণ কর।", marks: 4, answer: "ধরি ভূমি হতে $x$ উচ্চতায় $E_k = ২ E_p$। $mg(৬০ - x) = ২ mgx \\implies ৬০ - x = ২x \\implies ৩x = ৬০ \\implies x = ২০ \\text{ মিটার}$। অর্থাৎ ভূমি থেকে ২০ মিটার উচ্চতায়।" }
    ],
    explanation: "শক্তির সংরক্ষণশীলতার প্রমাণ সংক্রান্ত বোর্ড সৃজনশীল প্রশ্ন।",
    boardName: "চট্টগ্রাম বোর্ড",
    boardNameEn: "Chittagong Board",
    year: "2023",
    yearBn: "২০২৩",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "পদার্থবিজ্ঞান",
    chapter: "অধ্যায় ৫: পদার্থের অবস্থা ও চাপ",
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: "প্যাসকেলের সূত্র নিচের কোন পদার্থের ক্ষেত্রে প্রযোজ্য?",
    options: ["আবদ্ধ তরল ও বায়বীয় পদার্থ", "শুধু কঠিন পদার্থ", "শুধু তরল পদার্থ", "উন্মুক্ত তরল পদার্থ"],
    correctIndex: 0,
    explanation: "প্যাসকেলের সূত্র যেকোনো আবদ্ধ পাত্রে সংরক্ষিত তরল বা বায়বীয় পদার্থের ওপর সমানভাবে প্রযোজ্য হয়।",
    boardName: "যশোর বোর্ড",
    boardNameEn: "Jessore Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "পদার্থবিজ্ঞান",
    chapter: "অধ্যায় ৭: তরঙ্গ ও শব্দ",
    type: "mcq",
    nature: "mathematical",
    difficulty: "medium",
    title: "বায়ুতে শব্দের বেগ ৩৩২ মি/সে হলে স্পষ্ট প্রতিধ্বনি শোনার জন্য প্রতিফলক ও উৎসের মধ্যবর্তী ন্যূনতম দূরত্ব কত হতে হবে?",
    options: ["১৬.৬ মিটার", "১৭.২ মিটার", "৩৩.২ মিটার", "৮.৩ মিটার"],
    correctIndex: 0,
    explanation: "শব্দানুভূতি স্থায়িত্বকাল ০.১ সেকেন্ড। ন্যূনতম দূরত্ব $d = \\frac{v \\times t}{২} = \\frac{৩৩২ \\times ০.১}{২} = ১৬.৬ \\text{ m}$।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "পদার্থবিজ্ঞান",
    chapter: "অধ্যায় ১১: চলবিদ্যুৎ",
    type: "mcq",
    nature: "mathematical",
    difficulty: "medium",
    title: "৬ ওহম ও ১২ ওহমের দুটি রোধ সমান্তরাল সমবায়ে যুক্ত করলে বর্তনীর তুল্য রোধ কত ওহম হবে?",
    options: ["৪ ওহম", "১৮ ওহম", "২ ওহম", "৯ ওহম"],
    correctIndex: 0,
    explanation: "$\\frac{1}{R_p} = \\frac{1}{৬} + \\frac{1}{১২} = \\frac{২+১}{১২} = \\frac{৩}{১২} = \\frac{1}{৪} \\implies R_p = ৪ \\ \\Omega$।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "পদার্থবিজ্ঞান",
    chapter: "অধ্যায় ১১: চলবিদ্যুৎ",
    type: "cq",
    nature: "mathematical",
    difficulty: "medium",
    title: "একটি বাড়িতে প্রতিদিন ৪টি ১০০ ওয়াটের বাতি ৬ ঘণ্টা এবং ২টি ৮০ ওয়াটের ফ্যান ১০ ঘণ্টা করে চলে। প্রতি ইউনিট (kWh) বিদ্যুতের মূল্য ৬.৫০ টাকা।",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Parallel_circuit.svg/480px-Parallel_circuit.svg.png",
    subQuestions: [
      { label: "ক", text: "১ ভোল্ট কাকে বলে?", marks: 1, answer: "অসীম দূরত্ব বা এক বিন্দু থেকে ১ কুলম্ব ধনাত্মক আধানকে বর্তনীর অন্য বিন্দুতে নিতে ১ জুল কাজ সম্পাদিত হলে তাকে ১ ভোল্ট বিভব পার্থক্য বলে।" },
      { label: "খ", text: "বাসাবাড়ির তার সংযোগে ভূ-সংযোগ (Earth Wire) ব্যবহার করা হয় কেন?", marks: 2, answer: "বৈদ্যুতিক যন্ত্রপাতির ত্রুটিজনিত কারণে শর্ট সার্কিট বা অতিরিক্ত বিদ্যুৎ প্রবাহ ঘটলে তা সরাসরি মাটিতে পাঠিয়ে অগ্নিকাণ্ড ও শক থেকে রক্ষা করতে আর্থিং তার ব্যবহৃত হয়।" },
      { label: "গ", text: "উক্ত বাসাবাড়িতে মে মাসে মোট কত ইউনিট বিদ্যুৎ শক্তি ব্যয় হবে?", marks: 3, answer: "দৈনিক শক্তি $W = \\frac{(৪ \\times ১০০ \\times ৬) + (২ \\times ৮০ \\times ১০)}{১০০০} = \\frac{২৪০০ + ১৬০০}{১০০০} = ৪ \\text{ kWh}$। মে মাসের (৩১ দিন) ব্যয় = $৪ \\times ৩১ = ১২৪ \\text{ ইউনিট}$।" },
      { label: "ঘ", text: "যদি প্রতিটি বাতিকে ২০ ওয়াটের এলইডি বাতি দ্বারা প্রতিস্থাপন করা হয়, তবে মাসিক বিদ্যুৎ বিল কত টাকা সাশ্রয় হবে? গাণিতিক বিশ্লেষণ কর।", marks: 4, answer: "এলইডি ব্যবহারের পর দৈনিক ব্যয় = $\\frac{(৪ \\times ২০ \\times ৬) + ১৬০০}{১০০০} = \\frac{৪৮০ + ১৬০০}{১০০০} = ২.০৮ \\text{ kWh}$। মাসিক ব্যয় = $২.০৮ \\times ৩১ = ৬৪.৪৮ \\text{ ইউনিট}$। সাশ্রয় ইউনিট = ১২৪ - ৬৪.৪৮ = ৫৯.৫২ ইউনিট। আর্থিক সাশ্রয় = $৫৯.৫২ \\times ৬.৫০ = ৩৮৬.৮৮ \\text{ টাকা}$।" }
    ],
    explanation: "বিদ্যুৎ শক্তির হিসাব ও বিল সাশ্রয় সংক্রান্ত বাস্তবধর্মী সৃজনশীল প্রশ্ন (SSC বোর্ড)।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },

  // =========================================================================
  // 2. SSC রসায়ন (Chemistry)
  // =========================================================================
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "রসায়ন",
    chapter: "অধ্যায় ৩: পদার্থের গঠন",
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: "সোডিয়ামের প্রতীক Na কোন ল্যাটিন নাম থেকে গৃহীত হয়েছে?",
    options: ["Natrium", "Kalium", "Ferrum", "Stannum"],
    correctIndex: 0,
    explanation: "সোডিয়ামের ল্যাটিন নাম Natrium থেকে Na প্রতীক এসেছে।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "রসায়ন",
    chapter: "অধ্যায় ৩: পদার্থের গঠন",
    type: "mcq",
    nature: "mathematical",
    difficulty: "medium",
    title: "প্রকৃতিতে ক্লোরিনের দুটি আইসোটোপ ³⁵Cl ও ³⁷Cl এর প্রাচুর্য যথাক্রমে ৭৫% ও ২৫% হলে ক্লোরিনের গড় আপেক্ষিক পারমাণবিক ভর কত?",
    options: ["৩৫.৫", "৩৫.০", "৩৬.০", "৩৭.০"],
    correctIndex: 0,
    explanation: "গড় ভর $= \\frac{(৩৫ \\times ৭৫) + (৩৭ \\times ২৫)}{১০০} = \\frac{২৬২৫ + ৯২৫}{১০০} = \\frac{৩৫৫০}{১০০} = ৩৫.৫$।",
    boardName: "রাজশাহী বোর্ড",
    boardNameEn: "Rajshahi Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "রসায়ন",
    chapter: "অধ্যায় ৩: পদার্থের গঠন",
    type: "cq",
    nature: "theory",
    difficulty: "medium",
    title: "পরমাণুর তিনটি মৌল X, Y এবং Z যাদের পারমাণবিক সংখ্যা যথাক্রমে ১১, ১২ এবং ১৭।",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Electron_shell_011_Sodium.svg/480px-Electron_shell_011_Sodium.svg.png",
    subQuestions: [
      { label: "ক", text: "আইসোটোপ কাকে বলে?", marks: 1, answer: "যেসব পরমাণুর প্রোটন সংখ্যা সমান কিন্তু ভর সংখ্যা ভিন্ন, তাদেরকে পরস্পরের আইসোটোপ বলে।" },
      { label: "খ", text: "পটাশিয়ামের ১৯তম ইলেকট্রনটি 3d অরবিটালে না গিয়ে 4s অরবিটালে প্রবেশ করে কেন?", marks: 2, answer: "আউফবাউ নীতি মতে নিম্ন শক্তির অরবিটালে ইলেকট্রন আগে যায়। (n+l) হিসাব করলে 4s-এর মান (৪+০ = ৪), যা 3d-এর মান (৩+২ = ৫) অপেক্ষা কম।" },
      { label: "গ", text: "X ও Z মৌলদ্বয়ের সমন্বয়ে গঠিত যৌগের বন্ধন প্রকৃতি ব্যাখ্যা কর।", marks: 3, answer: "X (Na) ১টি ইলেকট্রন ত্যাগ করে Na⁺ ক্যাটায়ন এবং Z (Cl) তা গ্রহণ করে Cl⁻ অ্যানায়নে পরিণত হয়ে স্থির বৈদ্যুতিক আকর্ষণে আয়নিক বন্ধন NaCl গঠন করে।" },
      { label: "ঘ", text: "Y ও Z এর সমন্বয়ে গঠিত যৌগের গলনাঙ্ক ও স্ফুটনাঙ্ক উচ্চ হওয়ার কারণ বিশ্লেষণ কর।", marks: 4, answer: "Y (Mg) ও Z (Cl) যুক্ত হয়ে আয়নিক যৌগ MgCl₂ গঠন করে। শক্তিশালী স্থির বৈদ্যুতিক বলের কারণে ত্রিমাত্রিক কেলাস জালিকা ভাঙতে প্রচুর তাপশক্তির প্রয়োজন হওয়ায় এদের গলনাঙ্ক ও স্ফুটনাঙ্ক উচ্চ হয়।" }
    ],
    explanation: "পরমাণুর ইলেকট্রন বিন্যাস ও রাসায়নিক বন্ধন সম্পর্কিত বোর্ড সৃজনশীল প্রশ্ন।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "রসায়ন",
    chapter: "অধ্যায় ৪: পর্যায় সারণি",
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: "আধুনিক পর্যায় সারণিতে মোট কয়টি পর্যায় ও গ্রুপ রয়েছে?",
    options: ["৭টি পর্যায় ও ১৮টি গ্রুপ", "৮টি পর্যায় ও ১৮টি গ্রুপ", "৭টি পর্যায় ও ১৬টি গ্রুপ", "৬টি পর্যায় ও ১৮টি গ্রুপ"],
    correctIndex: 0,
    explanation: "আধুনিক দীর্ঘ পর্যায় সারণিতে ৭টি অনুভূমিক পর্যায় এবং ১৮টি উল্লম্ব গ্রুপ বিদ্যমান।",
    boardName: "চট্টগ্রাম বোর্ড",
    boardNameEn: "Chittagong Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "রসায়ন",
    chapter: "অধ্যায় ৫: রাসায়নিক বন্ধন",
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: "নিচের কোন অণুতে দ্বিবন্ধন বিদ্যমান?",
    options: ["অক্সিজেন (O₂)", "নাইট্রোজেন (N₂)", "হাইড্রোজেন (H₂)", "মিথেন (CH₄)"],
    correctIndex: 0,
    explanation: "অক্সিজেন অণুতে দুটি পরমাণু পরস্পরের সাথে দুটি ইলেকট্রন জোড় শেয়ার করে সমযোজী দ্বিবন্ধন (O=O) গঠন করে।",
    boardName: "কুমিল্লা বোর্ড",
    boardNameEn: "Comilla Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "রসায়ন",
    chapter: "অধ্যায় ৬: মোলের ধারণা ও রাসায়নিক গণনা",
    type: "mcq",
    nature: "mathematical",
    difficulty: "medium",
    title: "প্রমাণ অবস্থায় (STP) ২২.৪ লিটার কার্বন ডাই-অক্সাইড গ্যাসে কয়টি অণু থাকে?",
    options: ["৬.০২৩ × ১০²³ টি", "৩.০১১ × ১০²³ টি", "১.২ × ১০²⁴ টি", "৬.০২৩ × ১০²² টি"],
    correctIndex: 0,
    explanation: "প্রমাণ অবস্থায় ১ মোল বা ২২.৪ লিটার যেকোনো গ্যাসে অ্যাভোগাড্রো সংখ্যক ($৬.০২৩ \\times ১০^{২৩}$) অণু উপস্থিত থাকে।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "রসায়ন",
    chapter: "অধ্যায় ১১: খনিজ সম্পদ: জীবাশ্ম",
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: "অ্যালকিনের সাধারণ আণবিক সংকেত কোনটি?",
    options: ["CnH2n", "CnH2n+2", "CnH2n-2", "CnH2n+1OH"],
    correctIndex: 0,
    explanation: "অ্যালকিনের সাধারণ সংকেত CnH2n (যেখানে একটি কার্বন-কার্বন দ্বিবন্ধন থাকে)।",
    boardName: "সিলেট বোর্ড",
    boardNameEn: "Sylhet Board",
    year: "2023",
    yearBn: "২০২৩",
    exam: "SSC"
  },

  // =========================================================================
  // 3. SSC উচ্চতর গণিত (Higher Mathematics)
  // =========================================================================
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "উচ্চতর গণিত",
    chapter: "অধ্যায় ১: সেট ও ফাংশন",
    type: "mcq",
    nature: "mathematical",
    difficulty: "easy",
    title: "যদি সেট $A = \\{a, b, c\\}$ হয়, তবে $P(A)$-এর উপাদান সংখ্যা কতটি?",
    options: ["৮ টি", "৬ টি", "৪ টি", "১৬ টি"],
    correctIndex: 0,
    explanation: "উপাদান সংখ্যা $n = ৩$ হলে শক্তি সেটের সদস্য সংখ্যা $২^n = ২^৩ = ৮$।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "উচ্চতর গণিত",
    chapter: "অধ্যায় ১: সেট ও ফাংশন",
    type: "cq",
    nature: "mathematical",
    difficulty: "hard",
    title: "একটি ফাংশন $f(x) = \\frac{২x + ২}{x - ১}$ যেখানে $x \\neq ১$।",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Function_color_domain_range.svg/480px-Function_color_domain_range.svg.png",
    subQuestions: [
      { label: "ক", text: "ডোমেন ও রেঞ্জের সংজ্ঞা দাও।", marks: 1, answer: "কোনো অন্বয় বা ফাংশনের ক্রোমজোড়গুলোর প্রথম উপাদানসমূহের সেটকে ডোমেন এবং দ্বিতীয় উপাদানসমূহের সেটকে রেঞ্জ বলে।" },
      { label: "খ", text: "প্রদত্ত ফাংশনটির ডোমেন নির্ণয় কর।", marks: 2, answer: "$x - ১ = ০ \\implies x = ১$ হলে ফাংশন অসংজ্ঞায়িত হয়। অতএব $\\text{Dom } f = \\mathbb{R} \\setminus \\{১\\}$।" },
      { label: "গ", text: "বিপরীত ফাংশন $f^{-১}(x)$ নির্ণয় কর।", marks: 3, answer: "$y = \\frac{২x+২}{x-১} \\implies xy - y = ২x + ২ \\implies x(y-২) = y+২ \\implies x = \\frac{y+২}{y-২}$। অতএব $f^{-১}(x) = \\frac{x+২}{x-২}$।" },
      { label: "ঘ", text: "ফাংশনটি এক-এক কিনা তা গাণিতিকভাবে যাচাই কর।", marks: 4, answer: "$f(a) = f(b) \\implies \\frac{২a+২}{a-১} = \\frac{২b+২}{b-১} \\implies (২a+২)(b-১) = (২b+২)(a-১) \\implies ২ab-২a+২b-২ = ২ab-২b+২a-২ \\implies -৪a = -৪b \\implies a = b$। সুতরাং ফাংশনটি এক-এক।" }
    ],
    explanation: "ফাংশনের ডোমেন, এক-এক যাচাই ও বিপরীত ফাংশন সংক্রান্ত SSC বোর্ড স্ট্যান্ডার্ড সৃজনশীল।",
    boardName: "রাজশাহী বোর্ড",
    boardNameEn: "Rajshahi Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "উচ্চতর গণিত",
    chapter: "অধ্যায় ৭: অসীম ধারা",
    type: "mcq",
    nature: "mathematical",
    difficulty: "medium",
    title: "অসীম গুণোত্তর ধারা $১ + \\frac{১}{২} + \\frac{১}{৪} + \\dots$ এর অসীমতক সমষ্টি কত?",
    options: ["২", "১", "$\\frac{৩}{২}$", "অসীম"],
    correctIndex: 0,
    explanation: "$S_\\infty = \\frac{a}{১ - r} = \\frac{১}{১ - \\frac{১}{২}} = \\frac{১}{\\frac{১}{২}} = ২$।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "উচ্চতর গণিত",
    chapter: "অধ্যায় ৮: ত্রিকোণমিতি",
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: "রেডিয়ান কোণ নিচের কোন ধরনের কোণ?",
    options: ["ধ্রুব কোণ", "স্থূল কোণ", "সূক্ষ্ম কোণ", "প্রবৃদ্ধ কোণ"],
    correctIndex: 0,
    explanation: "বৃত্তের ব্যাসার্ধের সমান চাপ কেন্দ্রে যে কোণ উৎপন্ন করে তা সর্বদা একটি নির্দিষ্ট ধ্রুব কোণ।",
    boardName: "চট্টগ্রাম বোর্ড",
    boardNameEn: "Chittagong Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "উচ্চতর গণিত",
    chapter: "অধ্যায় ১৪: সম্ভাবনা",
    type: "mcq",
    nature: "mathematical",
    difficulty: "easy",
    title: "একটি নিরপেক্ষ ছক্কা একবার নিক্ষেপ করা হলে মৌলিক সংখ্যা আসার সম্ভাবনা কত?",
    options: ["১/২", "১/৩", "১/৬", "২/৩"],
    correctIndex: 0,
    explanation: "মৌলিক সংখ্যা হলো {২, ৩, ৫} = ৩টি। মোট নমুনা বিন্দু = ৬টি। অতএব সম্ভাবনা = ৩/৬ = ১/২।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },

  // =========================================================================
  // 4. SSC জীববিজ্ঞান (Biology)
  // =========================================================================
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "জীববিজ্ঞান",
    chapter: "অধ্যায় ২: জীবকোষ ও টিস্যু",
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: "উদ্ভিদকোষের কোন অঙ্গাণুটিকে কোষের পাওয়ার হাউস (Power House) বলা হয়?",
    options: ["মাইটোকন্ড্রিয়া", "প্লাস্টিড", "গলজি বস্তু", "রাইবোজোম"],
    correctIndex: 0,
    explanation: "মাইটোকন্ড্রিয়ায় কোষের শ্বসনিক বিক্রিয়ায় প্রয়োজনীয় শক্তি (ATP) উৎপন্ন হয় বলে একে কোষের শক্তিকেন্দ্র বলে।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "জীববিজ্ঞান",
    chapter: "অধ্যায় ৪: জীবনীশক্তি",
    type: "mcq",
    nature: "theory",
    difficulty: "medium",
    title: "সালোকসংশ্লেষণের আলোক পর্যায়ে পানির বিভাজন ঘটে অক্সিজেন উৎপন্ন হওয়ার প্রক্রিয়াকে কী বলে?",
    options: ["ফটোলাইসিস (Photolysis)", "ফসফোরাইলেশন", "গ্লাইকোলাইসিস", "ফারমেন্টেশন"],
    correctIndex: 0,
    explanation: "সূর্যালোক ও ক্লোরোফিলের উপস্থিতিতে পানির অণু বিশ্লিষ্ট হওয়ার প্রক্রিয়াকে ফটোলাইসিস বলে।",
    boardName: "রাজশাহী বোর্ড",
    boardNameEn: "Rajshahi Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },

  // =========================================================================
  // 5. HSC পদার্থবিজ্ঞান ১ম পত্র (HSC Physics 1st Paper)
  // =========================================================================
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "পদার্থবিজ্ঞান ১ম পত্র",
    chapter: "অধ্যায় ২: ভেক্টর",
    type: "mcq",
    nature: "mathematical",
    difficulty: "medium",
    title: "দুটি সমমানের ভেক্টরের লব্ধির মান এদের যেকোনো একটির সমান হলে ভেক্টরদ্বয়ের মধ্যবর্তী কোণ কত ডিগ্রি?",
    options: ["১২০°", "৬০°", "৯০°", "১৮০°"],
    correctIndex: 0,
    explanation: "$P^2 = P^2 + P^2 + ২P^2\\cos\\alpha \\implies \\cos\\alpha = -\\frac{১}{২} \\implies \\alpha = ১২০^\\circ$।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "পদার্থবিজ্ঞান ১ম পত্র",
    chapter: "অধ্যায় ২: ভেক্টর",
    type: "cq",
    nature: "mathematical",
    difficulty: "hard",
    title: "একটি নদীর প্রস্থ ৫০০ মিটার। স্রোতের বেগ ৩ কিমি/ঘণ্টা। একজন মাঝি ৫ কিমি/ঘণ্টা বেগে নৌকা চালাতে সক্ষম।",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Crossing_a_river.svg/480px-Crossing_a_river.svg.png",
    subQuestions: [
      { label: "ক", text: "নাল ভেক্টর কাকে বলে?", marks: 1, answer: "যে ভেক্টরের মান শূন্য এবং যার কোনো সুনির্দিষ্ট দিক থাকে না তাকে নাল ভেক্টর বা শূন্য ভেক্টর বলে।" },
      { label: "খ", text: "ডট গুণন বিনিময় সূত্র মেনে চলে কিন্তু ক্রস গুণন কেন মানে না?", marks: 2, answer: "কারণ স্কেলার গুণনে $\\vec{A}\\cdot\\vec{B} = \\vec{B}\\cdot\\vec{A}$, কিন্তু ভেক্টর গুণনে অভিমুখ বিপরীত হওয়ায় $\\vec{A}\\times\\vec{B} = -(\\vec{B}\\times\\vec{A})$ হয়।" },
      { label: "গ", text: "নদীটি ন্যূনতম কত সময়ে পার হওয়া যাবে তা নির্ণয় কর।", marks: 3, answer: "স্রোতের সাথে লম্বভাবে ($৯০^\\circ$) রওনা দিলে সর্বনিম্ন সময় লাগে: $t_{min} = \\frac{d}{v} = \\frac{০.৫ \\text{ km}}{৫ \\text{ km/h}} = ০.১ \\text{ hour} = ৬ \\text{ মিনিট}$।" },
      { label: "ঘ", text: "সরাসরি বিপরীত বিন্দুতে পৌঁছাতে হলে মাঝিকে কোন দিকে কত কোণে নৌকা চালাতে হবে? বিশ্লেষণ কর।", marks: 4, answer: "সরাসরি বিপরীত বিন্দুতে পৌঁছাতে হলে $\\cos\\alpha = -\\frac{u}{v} = -\\frac{৩}{৫} = -০.৬ \\implies \\alpha = \\cos^{-১}(-০.৬) \\approx ১২৬.৮৭^\\circ$ কোণে স্রোতের উজানে নৌকা চালাতে হবে।" }
    ],
    explanation: "নদী-নৌকার সবচেয়ে জনপ্রিয় ও গুরুত্বপূর্ণ HSC বোর্ড সৃজনশীল প্রশ্ন।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "পদার্থবিজ্ঞান ১ম পত্র",
    chapter: "অধ্যায় ৪: নিউটনিয়ান বলবিদ্যা",
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: "কৌণিক ভরবেগের আন্তর্জাতিক (SI) একক নিচের কোনটি?",
    options: ["কেজি·মিটার²/সেকেন্ড (kg·m²/s)", "কেজি·মিটার/সেকেন্ড", "নিউটন·মিটার", "জুল/সেকেন্ড"],
    correctIndex: 0,
    explanation: "$L = I\\omega = (\\text{kg}\\cdot\\text{m}^2) \\times (\\text{rad/s}) = \\text{kg}\\cdot\\text{m}^2/\\text{s}$।",
    boardName: "রাজশাহী বোর্ড",
    boardNameEn: "Rajshahi Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "পদার্থবিজ্ঞান ১ম পত্র",
    chapter: "অধ্যায় ৪: নিউটনিয়ান বলবিদ্যা",
    type: "cq",
    nature: "mathematical",
    difficulty: "medium",
    title: "১০০ মিটার ব্যাসার্ধের একটি অনুভূমিক বৃত্তাকার বাঁকে রাস্তার ব্যাংকিং কোণ ৫°। ($g = ৯.৮ \\text{ মি/সে}^২$)",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Banked_turn.svg/480px-Banked_turn.svg.png",
    subQuestions: [
      { label: "ক", text: "টর্ক কাকে বলে?", marks: 1, answer: "ঘূর্ণন অক্ষ থেকে প্রযুক্ত বলের ক্রিয়ারেখার লম্ব দূরত্ব এবং প্রযুক্ত বলের মানের গুণফলকে টর্ক বলে।" },
      { label: "খ", text: "সাইকেল আরোহী বাঁক ঘোরার সময় বাঁকের কেন্দ্রের দিকে হেলে পড়েন কেন?", marks: 2, answer: "প্রয়োজনীয় কেন্দ্রমুখী বলের জোগান দেওয়ার জন্য আরোহী উল্লম্বের সাথে নির্দিষ্ট কোণে ঝুঁকে পড়েন, ফলে প্রতিক্রিয়া বলের অনুভূমিক উপাংশ কেন্দ্রমুখী বল সৃষ্টি করে।" },
      { label: "গ", text: "রাস্তার বাঁকটিতে কোনো প্রকার ঘর্ষণ বলের সাহায্য ছাড়া সর্বোচ্চ নিরাপদ গতিবেগ নির্ণয় কর।", marks: 3, answer: "$v = \\sqrt{rg \\tan\\theta} = \\sqrt{১০০ \\times ৯.৮ \\times \\tan ৫^\\circ} = \\sqrt{৯৮০ \\times ০.০৮৭৫} \\approx ৯.২৫ \\text{ মি/সে} = ৩৩.৩ \\text{ কিমি/ঘণ্টা}$।" },
      { label: "ঘ", text: "একটি গাড়ি ৫০ কিমি/ঘণ্টা বেগে বাঁক অতিক্রম করতে চাইলে চালক নিরাপদে মোড় নিতে পারবে কি না যুক্তিসহ ব্যাখ্যা কর।", marks: 4, answer: "৫০ কিমি/ঘণ্টা = ১৩.৮৯ মি/সে। যেহেতু ১৩.৮৯ মি/সে > ৯.২৫ মি/সে, চাকা ও রাস্তার পর্যাপ্ত ঘর্ষণ বল না থাকলে গাড়িটি বাইরের দিকে ছিটকে গিয়ে দুর্ঘটনার শিকার হবে।" }
    ],
    explanation: "রাস্তার ব্যাংকিং ও ঘূর্ণন গতিবিদ্যার আদর্শ HSC বোর্ড প্রশ্ন।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "পদার্থবিজ্ঞান ১ম পত্র",
    chapter: "অধ্যায় ১০: আদর্শ গ্যাস ও গ্যাসের গতিতত্ত্ব",
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: "পরম শূন্য তাপমাত্রায় (0 Kelvin) আদর্শ গ্যাসের অণুসমূহের গড় গতিশক্তি কত হয়?",
    options: ["শূন্য", "অসীম", "১ জুল", "অনির্ণেয়"],
    correctIndex: 0,
    explanation: "গ্যাসের গড় গতিশক্তি $E_k = \\frac{৩}{২}kT$। $T = ০ \\text{ K}$ হলে $E_k = ০$ হয়।",
    boardName: "চট্টগ্রাম বোর্ড",
    boardNameEn: "Chittagong Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "পদার্থবিজ্ঞান ১ম পত্র",
    chapter: "অধ্যায় ১০: আদর্শ গ্যাস ও গ্যাসের গতিতত্ত্ব",
    type: "cq",
    nature: "mathematical",
    difficulty: "hard",
    title: "একটি হ্রদের তলদেশ থেকে একটি বায়ুর বুদ্বুদ উপরিপৃষ্ঠে উঠে আসায় এর আয়তন চারগুণ হয়ে গেল। বায়ুমণ্ডলের স্বাভাবিক চাপ ১০⁵ প্যাসকেল এবং পানির ঘনত্ব ১০০০ কেজি/মি³। হ্রদের তাপমাত্রা সর্বত্র সমান।",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Boyles_Law.jpg/320px-Boyles_Law.jpg",
    subQuestions: [
      { label: "ক", text: "সম্পৃক্ত বাষ্পচাপ কাকে বলে?", marks: 1, answer: "নির্দিষ্ট তাপমাত্রায় কোনো আবদ্ধ স্থানের বাষ্প যখন তার সর্বোচ্চ ধারণক্ষমতায় পৌঁছে তরলের সাথে সাম্যাবস্থায় থাকে, তখন সেই বাষ্পের চাপকে সম্পৃক্ত বাষ্পচাপ বলে।" },
      { label: "খ", text: "বায়ুমণ্ডলে আর্দ্রতা বেশি থাকলে ঘাম শুকাতে দেরি হয় কেন?", marks: 2, answer: "কারণ বায়ুমণ্ডলে জলীয় বাষ্পের পরিমাণ বেশি থাকায় বাষ্পায়নের হার কমে যায়, ফলে শরীর থেকে নির্গত ঘাম দ্রুত বাষ্পীভূত হতে পারে না।" },
      { label: "গ", text: "হ্রদের তলদেশে বুদ্বুদটির ওপর মোট চাপ কত ছিল?", marks: 3, answer: "বয়েলের সূত্রানুসারে $P_১ V_১ = P_২ V_২ \\implies P_১ \\times V = ১০^৫ \\times ৪V \\implies P_১ = ৪ \\times ১০^৫ \\text{ Pa}$।" },
      { label: "ঘ", text: "হ্রদটির প্রকৃত গভীরতা গাণিতিকভাবে নির্ণয় কর।", marks: 4, answer: "তলদেশের চাপ $P_১ = P_{atm} + h\\rho g \\implies ৪ \\times ১০^৫ = ১০^৫ + h \\times ১০০০ \\times ৯.৮ \\implies ৩ \\times ১০^৫ = ৯৮০০ h \\implies h = \\frac{৩০০০০০}{৯৮০০} \\approx ৩০.৬১ \\text{ মিটার}$।" }
    ],
    explanation: "হ্রদের তলদেশের বুদ্বুদ সম্পর্কিত বহুল প্রচলিত HSC পদার্থবিজ্ঞান ১ম পত্রের বোর্ড প্রশ্ন।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },

  // =========================================================================
  // 6. HSC পদার্থবিজ্ঞান ২য় পত্র (HSC Physics 2nd Paper)
  // =========================================================================
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "পদার্থবিজ্ঞান ২য় পত্র",
    chapter: "অধ্যায় ১: তাপগতিবিদ্যা",
    type: "mcq",
    nature: "mathematical",
    difficulty: "easy",
    title: "একটি কার্নো ইঞ্জিনের উৎসের তাপমাত্রা ৫০০ K এবং তাপগ্রাহকের তাপমাত্রা ৩০০ K হলে এর কর্মদক্ষতা কত?",
    options: ["৪০%", "৬০%", "২০%", "৫০%"],
    correctIndex: 0,
    explanation: "$\\eta = (১ - \\frac{T_২}{T_১}) \\times ১০০\\% = (১ - \\frac{৩০০}{৫০০}) \\times ১০০\\% = ০.৪ \\times ১০০\\% = ৪০\\%$।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "পদার্থবিজ্ঞান ২য় পত্র",
    chapter: "অধ্যায় ১: তাপগতিবিদ্যা",
    type: "cq",
    nature: "mathematical",
    difficulty: "medium",
    title: "একটি প্রত্যবর্তী কার্নো ইঞ্জিন ২৭°C এবং ১২৭°C তাপমাত্রার মধ্যে কার্যরত থেকে উৎস হতে ৮০০ জুল তাপ গ্রহণ করে।",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Carnot_heat_engine_2.svg/480px-Carnot_heat_engine_2.svg.png",
    subQuestions: [
      { label: "ক", text: "তাপগতিবিদ্যার প্রথম সূত্রটি লিখ।", marks: 1, answer: "যখনই কাজ তাপে বা তাপ কাজে সম্পূর্ণরূপে রূপান্তরিত হয়, তখন কাজ ও তাপ পরস্পরের সমানুপাতিক হয় ($dQ = dU + dW$)।" },
      { label: "খ", text: "রুদ্ধতাপীয় প্রক্রিয়া একটি সম-এনট্রপি প্রক্রিয়া—ব্যাখ্যা কর।", marks: 2, answer: "রুদ্ধতাপীয় প্রক্রিয়ায় সিস্টেম ও পরিবেশের মধ্যে কোনো তাপের আদান-প্রদান হয় না ($dQ = ০$)। তাই এনট্রপির পরিবর্তন $dS = dQ/T = ০$ অর্থাৎ এনট্রপি স্থির থাকে।" },
      { label: "গ", text: "ইঞ্জিনটির কর্মদক্ষতা নির্ণয় কর।", marks: 3, answer: "$T_১ = ১২৭ + ২৭৩ = ৪০০ \\text{ K}$, $T_২ = ২৭ + ২৭৩ = ৩০০ \\text{ K}$। কর্মদক্ষতা $\\eta = (১ - ৩০০/৪০০) \\times ১০০\\% = ২৫\\%$।" },
      { label: "ঘ", text: "ইঞ্জিনটির দক্ষতা ৫০% এ উন্নীত করতে হলে তাপ উৎসের তাপমাত্রা কত কেলভিন বৃদ্ধি করতে হবে? বিশ্লেষণ কর।", marks: 4, answer: "নতুন দক্ষতা $\\eta' = ০.৫$। $০.৫ = ১ - \\frac{৩০০}{T_১'} \\implies \\frac{৩০০}{T_১'} = ০.৫ \\implies T_১' = ৬০০ \\text{ K}$। উৎসের তাপমাত্রা বৃদ্ধি করতে হবে = ৬০০ - ৪০০ = ২০০ K।" }
    ],
    explanation: "কার্নো ইঞ্জিনের দক্ষতা বৃদ্ধি ও এনট্রপি সম্পর্কিত ক্লাসিক HSC বোর্ড সৃজনশীল।",
    boardName: "রাজশাহী বোর্ড",
    boardNameEn: "Rajshahi Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "পদার্থবিজ্ঞান ২য় পত্র",
    chapter: "অধ্যায় ৮: আধুনিক পদার্থবিজ্ঞানের সূচনা",
    type: "mcq",
    nature: "mathematical",
    difficulty: "medium",
    title: "কোন বেগে গতিশীল হলে একটি বস্তুর গতিশীল ভর তার নিশ্চল ভরের দ্বিগুণ হবে?",
    options: ["০.৮৬৬ c", "০.৫ c", "০.৭১ c", "০.৯৯ c"],
    correctIndex: 0,
    explanation: "$m = \\frac{m_০}{\\sqrt{১ - v^২/c^২}} = ২m_০ \\implies \\sqrt{১ - v^২/c^২} = \\frac{১}{২} \\implies ১ - v^২/c^২ = \\frac{১}{৪} \\implies v = \\frac{\\sqrt{৩}}{২}c \\approx ০.৮৬৬ c$।",
    boardName: "কুমিল্লা বোর্ড",
    boardNameEn: "Comilla Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },

  // =========================================================================
  // 7. HSC রসায়ন ১ম ও ২য় পত্র (HSC Chemistry)
  // =========================================================================
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "রসায়ন ১ম পত্র",
    chapter: "অধ্যায় ২: গুণগত রসায়ন",
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: "হুন্ডের নিয়মটি নিচের কোন অরবিটালে ইলেকট্রন প্রবেশের ক্ষেত্রে প্রযোজ্য নয়?",
    options: ["s অরবিটাল", "p অরবিটাল", "d অরবিটাল", "f অরবিটাল"],
    correctIndex: 0,
    explanation: "হুন্ডের নিয়ম কেবল সমশক্তি সম্পন্ন একাধিক অরবিটাল (যেমন p, d, f)-এর ক্ষেত্রে প্রযোজ্য; s অরবিটালে কোনো সমশক্তি সম্পন্ন উপ-অরবিটাল নেই।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "রসায়ন ২য় পত্র",
    chapter: "অধ্যায় ২: জৈব রসায়ন",
    type: "mcq",
    nature: "theory",
    difficulty: "medium",
    title: "অসমমিত অ্যালকিনের সাথে হাইড্রোজেন হ্যালাইডের যুত বিক্রিয়ায় প্রধান উৎপাদ নির্ধারণে কোন নীতিটি ব্যবহৃত হয়?",
    options: ["মার্কভনিকভের নীতি", "সাইজেফের নীতি", "হাফম্যান নীতি", "লে শাতেলিয়ের নীতি"],
    correctIndex: 0,
    explanation: "মার্কভনিকভের নীতি অনুসারে দ্বিবন্ধনযুক্ত যে কার্বনে হাইড্রোজেন কম থাকে, বিকারকের ঋণাত্মক অংশ সেখানে যুক্ত হয়।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "রসায়ন ২য় পত্র",
    chapter: "অধ্যায় ২: জৈব রসায়ন",
    type: "cq",
    nature: "theory",
    difficulty: "hard",
    title: "যৌগ A ($C_২H_৫OH$) কে অতিরিক্ত গাঢ় $H_২SO_৪$ সহ ১৬০°-১৭০°C তাপমাত্রায় উত্তপ্ত করলে যৌগ B তৈরি হয়। যৌগ B ব্রোমিন দ্রবণকে বর্ণহীন করে।",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Ethylene_skeletal.svg/320px-Ethylene_skeletal.svg.png",
    subQuestions: [
      { label: "ক", text: "টটোমারিজম কাকে বলে?", marks: 1, answer: "কার্যকরী মূলক কাঠামোর স্বতঃস্ফূর্ত পরিবর্তনের মাধ্যমে গঠিত দুটি সমাণু গতিশীল সাম্যাবস্থায় থাকাকে টটোমারিজম বলে।" },
      { label: "খ", text: "ফেনল অম্লধর্মী কেন ব্যাখ্যা কর।", marks: 2, answer: "ফেনল থেকে $H^+$ ত্যাগের পর সৃষ্ট ফেনোক্সাইড আয়ন বেনজিন বলয়ের রেজোন্যান্সের মাধ্যমে অধিক স্থিতিশীল হয়, তাই এটি জলীয় দ্রবণে প্রোটন ত্যাগ করে অম্লের মতো আচরণ করে।" },
      { label: "গ", text: "যৌগ B এর ব্রোমিন দ্রবণ পরীক্ষার সমীকরণসহ কার্যপদ্ধতি লেখ।", marks: 3, answer: "যৌগ B হলো ইথিন ($CH_২=CH_২$)। ব্রোমিন পানির সাথে বিক্রিয়া: $CH_২=CH_২ + Br_২ (\\text{লাল}) \\rightarrow CH_২Br-CH_২Br (\\text{বর্ণহীন ১,২-ডাইব্রোমোইথেন})$।" },
      { label: "ঘ", text: "যৌগ A থেকে কীভাবে ক্লোরোফর্ম প্রস্তুত করা যায় বিক্রিয়াসহ বিশ্লেষণ কর।", marks: 4, answer: "ইথানলকে ব্লিচিং পাউডার ও পানির সাথে উত্তপ্ত করলে তিন ধাপে (জারণ, ক্লোরিনেশন ও আর্দ্র বিশ্লেষণ) ক্লোরোফর্ম ($CHCl_৩$) উৎপন্ন হয়: ১) $CH_৩CH_২OH + [O] \\rightarrow CH_৩CHO$, ২) $CH_৩CHO + ৩Cl_২ \\rightarrow CCl_৩CHO + ৩HCl$, ৩) $২CCl_৩CHO + Ca(OH)_২ \\rightarrow ২CHCl_৩ + (HCOO)_২Ca$।" }
    ],
    explanation: "জৈব রসায়নের অত্যন্ত গুরুত্বপূর্ণ হ্যালোফর্ম ও অসম্পৃক্ততা পরীক্ষার HSC বোর্ড সৃজনশীল প্রশ্ন।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },

  // =========================================================================
  // 8. HSC উচ্চতর গণিত (Higher Mathematics 1st & 2nd Paper)
  // =========================================================================
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "উচ্চতর গণিত ১ম পত্র",
    chapter: "অধ্যায় ১: ম্যাট্রিক্স ও নির্ণায়ক",
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: "একটি বর্গ ম্যাট্রিক্স $A$ ব্যতিক্রমী (Singular Matrix) হবে যদি—",
    options: ["$|A| = ০$", "$|A| \\neq ০$", "$A = A^T$", "$A^{-১}$ বিদ্যমান"],
    correctIndex: 0,
    explanation: "যে বর্গ ম্যাট্রিক্সের নির্ণায়কের মান শূন্য ($|A| = ০$), তাকে ব্যতিক্রমী ম্যাট্রিক্স বলে।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "উচ্চতর গণিত ১ম পত্র",
    chapter: "অধ্যায় ৯: অন্তরীকরণ",
    type: "mcq",
    nature: "mathematical",
    difficulty: "medium",
    title: "$\\frac{d}{dx}(\\ln \\sin x)$ এর মান নিচের কোনটি?",
    options: ["$\\cot x$", "$\\tan x$", "$-\\cot x$", "$\\csc x$"],
    correctIndex: 0,
    explanation: "$\\frac{d}{dx}(\\ln \\sin x) = \\frac{১}{\\sin x} \\cdot \\frac{d}{dx}(\\sin x) = \\frac{\\cos x}{\\sin x} = \\cot x$।",
    boardName: "রাজশাহী বোর্ড",
    boardNameEn: "Rajshahi Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "উচ্চতর গণিত ২য় পত্র",
    chapter: "অধ্যায় ৩: জটিল সংখ্যা",
    type: "mcq",
    nature: "mathematical",
    difficulty: "easy",
    title: "এককের একটি কাল্পনিক ঘনমূল $\\omega$ হলে, $১ + \\omega + \\omega^২$-এর মান কত?",
    options: ["০", "১", "-১", "$\\omega$"],
    correctIndex: 0,
    explanation: "এককের তিনটি ঘনমূলের সমষ্টি সর্বদা শূন্য হয় ($১ + \\omega + \\omega^২ = ০$)।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },

  // =========================================================================
  // 9. HSC তথ্য ও যোগাযোগ প্রযুক্তি (ICT)
  // =========================================================================
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "তথ্য ও যোগাযোগ প্রযুক্তি",
    chapter: "অধ্যায় ৩: সংখ্যা পদ্ধতি ও ডিজিটাল ডিভাইস",
    type: "mcq",
    nature: "mathematical",
    difficulty: "easy",
    title: "বাইনারি সংখ্যা $(১১০১)_২$ এর সমকক্ষ ডেসিমেল (দশমিক) মান কত?",
    options: ["১৩", "১১", "১৫", "৯"],
    correctIndex: 0,
    explanation: "$(১১০১)_২ = (১ \\times ৮) + (১ \\times ৪) + (০ \\times ২) + (১ \\times ১) = ৮ + ৪ + ০ + ১ = ১৩$।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "তথ্য ও যোগাযোগ প্রযুক্তি",
    chapter: "অধ্যায় ৩: সংখ্যা পদ্ধতি ও ডিজিটাল ডিভাইস",
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: "নিচের কোন দুটি লজিক গেটকে সার্বজনীন গেট (Universal Gate) বলা হয়?",
    options: ["NAND ও NOR", "AND ও OR", "NOT ও XOR", "XOR ও XNOR"],
    correctIndex: 0,
    explanation: "NAND ও NOR গেট দিয়ে অন্যান্য সব ধরনের মৌলিক গেট তৈরি করা যায় বলে এদের সার্বজনীন গেট বলে।",
    boardName: "রাজশাহী বোর্ড",
    boardNameEn: "Rajshahi Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "তথ্য ও যোগাযোগ প্রযুক্তি",
    chapter: "অধ্যায় ৩: সংখ্যা পদ্ধতি ও ডিজিটাল ডিভাইস",
    type: "cq",
    nature: "mathematical",
    difficulty: "medium",
    title: "একটি ডিজিটাল লজিক সার্কিটের আউটপুট সমীকরণ: $F = \\overline{A}B + AB + A\\overline{B}$। রফিক এই সমীকরণটি সরল করে শুধুমাত্র মৌলিক গেট দ্বারা বাস্তবায়ন করতে চাইল।",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Logic-gate-index.png/480px-Logic-gate-index.png",
    subQuestions: [
      { label: "ক", text: "২-এর পরিপূরক কাকে বলে?", marks: 1, answer: "কোনো বাইনারি সংখ্যার ১-এর পরিপূরকের (বিটগুলো উল্টে দেওয়ার পর) সাথে ১ যোগ করলে যে মান পাওয়া যায় তাকে ২-এর পরিপূরক বলে।" },
      { label: "খ", text: "অ্যাসকি (ASCII) কোড ও ইউনিকোড (Unicode)-এর মধ্যে পার্থক্য লেখ।", marks: 2, answer: "ASCII হলো ৭ বা ৮ বিটের কোড যা সর্বোচ্চ ১২৮ বা ২৫৬টি বর্ণ প্রকাশ করে; অপরদিকে Unicode হলো ১৬ বা ৩২ বিটের কোড যা বিশ্বের প্রায় সকল ভাষার অক্ষর প্রকাশ করতে সক্ষম।" },
      { label: "গ", text: "উদ্দীপকের সমীকরণ $F$-কে বুলিয়ান অ্যালজেব্রার সাহায্যে সরল কর।", marks: 3, answer: "$F = B(\\overline{A} + A) + A\\overline{B} = B(১) + A\\overline{B} = B + A\\overline{B} = (B + A)(B + \\overline{B}) = (A + B)(১) = A + B$।" },
      { label: "ঘ", text: "সরলীকৃত মানকে শুধুমাত্র NAND গেট ব্যবহার করে বাস্তবায়ন করা সম্ভব কি না? চিত্রসহ মূল্যায়ন কর।", marks: 4, answer: "$F = A + B = \\overline{\\overline{A + B}} = \\overline{\\overline{A} \\cdot \\overline{B}}$। প্রথমে দুটি NAND গেট দ্বারা $\\overline{A}$ ও $\\overline{B}$ তৈরি করে সে দুটিকে অপর একটি NAND গেটে ইনপুট দিলে $A+B$ পাওয়া যায়। অতএব ৩টি NAND গেট দিয়ে এটি বাস্তবায়ন সম্ভব।" }
    ],
    explanation: "বুলিয়ান সরলীকরণ ও সার্বজনীন NAND গেট দিয়ে বাস্তবায়নের আদর্শ HSC আইসিটি প্রশ্ন।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "তথ্য ও যোগাযোগ প্রযুক্তি",
    chapter: "অধ্যায় ৪: ওয়েব ডিজাইন পরিচিতি এবং HTML",
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: "HTML ডকুমেন্টে সবচেয়ে বড় আকারের হেডিং প্রদর্শনের জন্য কোন ট্যাগটি ব্যবহৃত হয়?",
    options: ["<h1>", "<h6>", "<head>", "<header>"],
    correctIndex: 0,
    explanation: "HTML-এ `<h1>` ট্যাগ সবচেয়ে বড় হেডিং এবং `<h6>` সবচেয়ে ছোট হেডিং প্রদর্শনের জন্য ব্যবহৃত হয়।",
    boardName: "কুমিল্লা বোর্ড",
    boardNameEn: "Comilla Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "তথ্য ও যোগাযোগ প্রযুক্তি",
    chapter: "অধ্যায় ৫: প্রোগ্রামিং ভাষা",
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: "C প্রোগ্রামিং ভাষায় ভেরিয়েবলের নাম হিসেবে নিচের কোনটি বৈধ?",
    options: ["_total_marks", "2nd_number", "float", "my marks"],
    correctIndex: 0,
    explanation: "C ভাষায় ভেরিয়েবলের নাম আন্ডারস্কোর (_) দিয়ে শুরু হতে পারে, কিন্তু সংখ্যা বা স্পেস দিয়ে শুরু হতে পারে না এবং সংরক্ষিত কীওয়ার্ড (যেমন float) হওয়া যাবে না।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "তথ্য ও যোগাযোগ প্রযুক্তি",
    chapter: "অধ্যায় ৫: প্রোগ্রামিং ভাষা",
    type: "cq",
    nature: "mathematical",
    difficulty: "medium",
    title: "একটি প্রোগ্রামে ব্যবহারকারী তিনটি পূর্ণসংখ্যা ইনপুট দেবে। প্রোগ্রামটি এদের মধ্যে বৃহত্তম সংখ্যাটি আউটপুট হিসেবে প্রদর্শন করবে।",
    subQuestions: [
      { label: "ক", text: "কম্পাইলার কাকে বলে?", marks: 1, answer: "যে অনুবাদক প্রোগ্রাম সম্পূর্ণ সোর্স কোডকে একসাথে পড়ে অবজেক্ট কোডে রূপান্তর করে তাকে কম্পাইলার বলে।" },
      { label: "খ", text: "while লুপ এবং do-while লুপের মধ্যে মূল পার্থক্য লেখ।", marks: 2, answer: "while লুপে শুরুতে শর্ত পরীক্ষা করা হয় (Entry-controlled), আর do-while লুপে শর্ত মিথ্যা হলেও অন্তত একবার লুপের বডি নির্বাহ হয় (Exit-controlled)।" },
      { label: "গ", text: "উদ্দীপকের সমস্যাটির জন্য একটি ফ্লোচার্ট (Flowchart) অঙ্কন কর।", marks: 3, answer: "শুরু -> ইনপুট a, b, c -> যদি a > b এবং a > c তবে বড় = a -> অন্যথায় যদি b > c তবে বড় = b -> অন্যথায় বড় = c -> আউটপুট বড় সংখ্যা -> শেষ।" },
      { label: "ঘ", text: "সমস্যাটির সমাধানের জন্য একটি পূর্ণাঙ্গ C প্রোগ্রাম রচনা কর।", marks: 4, answer: "#include <stdio.h>\\nint main() {\\n  int a, b, c;\\n  scanf(\"%d %d %d\", &a, &b, &c);\\n  if (a >= b && a >= c) printf(\"Largest: %d\\\\n\", a);\\n  else if (b >= a && b >= c) printf(\"Largest: %d\\\\n\", b);\\n  else printf(\"Largest: %d\\\\n\", c);\\n  return 0;\\n}" }
    ],
    explanation: "C প্রোগ্রামিংয়ে তিনটি সংখ্যার মধ্যে বৃহত্তম সংখ্যা নির্ণয়ের প্রমিত HSC আইসিটি বোর্ড প্রশ্ন।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  // Additional Board Questions
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "পদার্থবিজ্ঞান ১ম পত্র",
    chapter: "অধ্যায় ৩: গতিবিদ্যা",
    type: "mcq",
    nature: "mathematical",
    difficulty: "medium",
    title: "একটি বস্তুকে অনুভূমিকের সাথে ৪৫° কোণে ৪০ মি/সে বেগে নিক্ষেপ করা হলে এর সর্বোচ্চ পাল্লা (Range) কত মিটার হবে? ($g = ৯.৮ \\text{ মি/সে}^২$)",
    options: ["১৬৩.২৭ মিটার", "৮১.৬৩ মিটার", "২০০ মিটার", "১৪০ মিটার"],
    correctIndex: 0,
    explanation: "$R_{max} = \\frac{u^2}{g} = \\frac{৪০^২}{৯.৮} = \\frac{১৬০০}{৯.৮} \\approx ১৬৩.২৭ \\text{ m}$।",
    boardName: "রাজশাহী বোর্ড",
    boardNameEn: "Rajshahi Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "পদার্থবিজ্ঞান ১ম পত্র",
    chapter: "অধ্যায় ৫: কাজ, শক্তি ও ক্ষমতা",
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: "একটি আদর্শ স্প্রিংকে টেনে এর দৈর্ঘ্য দ্বিগুণ প্রসারিত করলে এর স্থিতিশক্তি কত গুণ বৃদ্ধি পাবে?",
    options: ["৪ গুণ", "২ গুণ", "৮ গুণ", "অপরিবর্তিত থাকবে"],
    correctIndex: 0,
    explanation: "স্প্রিংয়ের স্থিতিশক্তি $E_p = \\frac{1}{2}kx^2$। প্রসারণ $x$ দ্বিগুণ হলে শক্তি $২^২ = ৪$ গুণ বৃদ্ধি পাবে।",
    boardName: "চট্টগ্রাম বোর্ড",
    boardNameEn: "Chittagong Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "পদার্থবিজ্ঞান ১ম পত্র",
    chapter: "অধ্যায় ৮: পর্যায়বৃত্ত গতি",
    type: "mcq",
    nature: "mathematical",
    difficulty: "easy",
    title: "একটি সেকেন্ড দোলকের কার্যকরী দৈর্ঘ্য কত মিটার হলে এর দোলনকাল ২ সেকেন্ড হবে? ($g = ৯.৮ \\text{ মি/সে}^২$)",
    options: ["০.৯৯৩ মিটার", "১.৫ মিটার", "০.৫ মিটার", "২.০ মিটার"],
    correctIndex: 0,
    explanation: "$T = ২\\pi\\sqrt{\\frac{L}{g}} \\implies ২ = ২\\pi\\sqrt{\\frac{L}{৯.৮}} \\implies L = \\frac{৯.৮}{\\pi^২} \\approx ০.৯৯৩ \\text{ m}$।",
    boardName: "দিনাজপুর বোর্ড",
    boardNameEn: "Dinajpur Board",
    year: "2023",
    yearBn: "২০২৩",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "পদার্থবিজ্ঞান ২য় পত্র",
    chapter: "অধ্যায় ২: স্থির তড়িৎ",
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: "তড়িৎ দ্বিমেরু ভ্রামকের আন্তর্জাতিক (SI) একক কোনটি?",
    options: ["কুলম্ব·মিটার (C·m)", "কুলম্ব/মিটার", "ভোল্ট/মিটার", "নিউটন·মিটার"],
    correctIndex: 0,
    explanation: "তড়িৎ দ্বিমেরু ভ্রামক $p = q \\times 2l$, যার একক কুলম্ব $\\times$ মিটার = C·m।",
    boardName: "সিলেট বোর্ড",
    boardNameEn: "Sylhet Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "পদার্থবিজ্ঞান ২য় পত্র",
    chapter: "অধ্যায় ৩: চল তড়িৎ",
    type: "mcq",
    nature: "mathematical",
    difficulty: "medium",
    title: "একটি হুইটস্টোন ব্রিজের চার বাহুর রোধ যথাক্রমে ৪, ৮, ১২ এবং ২৪ ওহম হলে গ্যালভানোমিটারের মধ্য দিয়ে তড়িৎ প্রবাহ কত হবে?",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Wheatstonebridge.svg/480px-Wheatstonebridge.svg.png",
    options: ["০ অ্যাম্পিয়ার (সাম্যাবস্থা)", "১ অ্যাম্পিয়ার", "০.৫ অ্যাম্পিয়ার", "২ অ্যাম্পিয়ার"],
    correctIndex: 0,
    explanation: "$\\frac{P}{Q} = \\frac{৪}{৮} = \\frac{১}{২}$ এবং $\\frac{R}{S} = \\frac{১২}{২৪} = \\frac{১}{২}$। সেতুটি সাম্যাবস্থায় থাকায় গ্যালভানোমিটার দিয়ে কোনো তড়িৎ প্রবাহিত হবে না।",
    boardName: "কুমিল্লা বোর্ড",
    boardNameEn: "Comilla Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "পদার্থবিজ্ঞান ২য় পত্র",
    chapter: "অধ্যায় ৭: ভৌত আলোকবিজ্ঞান",
    type: "mcq",
    nature: "mathematical",
    difficulty: "medium",
    title: "ইয়ংয়ের দ্বি-চিড় পরীক্ষায় চিড়দ্বয়ের ব্যবধান অর্ধেক করা হলে ডোরা প্রস্থ কেমন হবে?",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Youngs_double_slit_interference.svg/480px-Youngs_double_slit_interference.svg.png",
    options: ["দ্বিগুণ হবে", "অর্ধেক হবে", "চারগুণ হবে", "অপরিবর্তিত থাকবে"],
    correctIndex: 0,
    explanation: "ডোরা প্রস্থ $\\Delta y = \\frac{\\lambda D}{d}$। ব্যবধান $d$ অর্ধেক হলে ডোরা প্রস্থ দ্বিগুণ হবে।",
    boardName: "বরিশাল বোর্ড",
    boardNameEn: "Barisal Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "রসায়ন ১ম পত্র",
    chapter: "অধ্যায় ৩: মৌলের পর্যায়বৃত্ত ধর্ম ও রাসায়নিক বন্ধন",
    type: "mcq",
    nature: "theory",
    difficulty: "medium",
    title: "মিথেন ($CH_4$), অ্যামোনিয়া ($NH_3$) এবং পানি ($H_2O$) অণুতে কেন্দ্রীয় পরমাণুর সংকরণ যথাক্রমে কোনটি?",
    options: ["সবগুলোরই sp³", "sp³, sp², sp", "sp², sp³, dsp²", "sp³, sp, sp²"],
    correctIndex: 0,
    explanation: "তিনটি অণুর কেন্দ্রীয় পরমাণুতেই ৪টি করে ইলেকট্রন জোড় (বন্ধন ও মুক্তজোড় মিলিয়ে) বিদ্যমান থাকায় সবগুলোরই সংকরণ sp³।",
    boardName: "যশোর বোর্ড",
    boardNameEn: "Jessore Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "রসায়ন ১ম পত্র",
    chapter: "অধ্যায় ৪: রাসায়নিক পরিবর্তন",
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: "মানুষের রক্তের স্বাভাবিক pH মান কত?",
    options: ["৭.৪", "৬.৫", "৮.০", "৭.০"],
    correctIndex: 0,
    explanation: "রক্তের স্বাভাবিক pH পরিসীমা ৭.৩৫ থেকে ৭.৪৫, যার গড় মান প্রায় ৭.৪।",
    boardName: "ময়মনসিংহ বোর্ড",
    boardNameEn: "Mymensingh Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "রসায়ন ২য় পত্র",
    chapter: "অধ্যায় ১: পরিবেশ রসায়ন",
    type: "mcq",
    nature: "mathematical",
    difficulty: "easy",
    title: "সার্বজনীন গ্যাস ধ্রুবক R-এর মান লিটার-অ্যাটমোস্ফিয়ার (L·atm/mol·K) এককে কত?",
    options: ["০.০৮২১", "৮.৩১৪", "১.৯৮৭", "০.০৮৩"],
    correctIndex: 0,
    explanation: "$R = ০.০৮২১ \\text{ L}\\cdot\\text{atm}\\cdot\\text{mol}^{-১}\\cdot\\text{K}^{-১}$।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2023",
    yearBn: "২০২৩",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "রসায়ন ২য় পত্র",
    chapter: "অধ্যায় ৩: পরিমাণগত রসায়ন",
    type: "mcq",
    nature: "mathematical",
    difficulty: "medium",
    title: "অম্লীয় মাধ্যমে ১ মোল পটাশিয়াম পারম্যাঙ্গানেট ($KMnO_4$) কয়টি ইলেকট্রন গ্রহণ করে বিজারিত হয়?",
    options: ["৫ টি", "৩ টি", "১ টি", "৬ টি"],
    correctIndex: 0,
    explanation: "$MnO_4^- + 8H^+ + 5e^- \\rightarrow Mn^{2+} + 4H_2O$। অম্লীয় মাধ্যমে ম্যাঙ্গানিজের জারণ সংখ্যা +৭ থেকে +২ এ নেমে ৫টি ইলেকট্রন গ্রহণ করে।",
    boardName: "রাজশাহী বোর্ড",
    boardNameEn: "Rajshahi Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "উচ্চতর গণিত ১ম পত্র",
    chapter: "অধ্যায় ৩: সরলরেখা",
    type: "mcq",
    nature: "mathematical",
    difficulty: "easy",
    title: "$3x - 4y + 12 = 0$ সরলরেখাটির ঢাল কত?",
    options: ["৩/৪", "-৩/৪", "৪/৩", "-৪/৩"],
    correctIndex: 0,
    explanation: "$৪y = ৩x + ১২ \\implies y = \\frac{৩}{৪}x + ৩$। অতএব ঢাল $m = \\frac{৩}{৪}$।",
    boardName: "কুমিল্লা বোর্ড",
    boardNameEn: "Comilla Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "উচ্চতর গণিত ১ম পত্র",
    chapter: "অধ্যায় ৭: সংযুক্ত কোণের ত্রিকোণমিতিক অনুপাত",
    type: "mcq",
    nature: "mathematical",
    difficulty: "easy",
    title: "$\\sin 75^\\circ$ এর সঠিক মান কোনটি?",
    options: ["$\\frac{\\sqrt{6} + \\sqrt{2}}{4}$", "$\\frac{\\sqrt{6} - \\sqrt{2}}{4}$", "$\\frac{\\sqrt{3} + 1}{2\\sqrt{2}}$", "$\\frac{1}{\\sqrt{2}}$"],
    correctIndex: 0,
    explanation: "$\\sin(৪৫^\\circ + ৩০^\\circ) = \\sin ৪৫^\\circ\\cos ৩০^\\circ + \\cos ৪৫^\\circ\\sin ৩০^\\circ = \\frac{১}{\\sqrt{২}}\\frac{\\sqrt{৩}}{২} + \\frac{১}{\\sqrt{২}}\\frac{১}{২} = \\frac{\\sqrt{৬} + \\sqrt{২}}{৪}$।",
    boardName: "চট্টগ্রাম বোর্ড",
    boardNameEn: "Chittagong Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "উচ্চতর গণিত ২য় পত্র",
    chapter: "অধ্যায় ৪: বহুপদী ও বহুপদী সমীকরণ",
    type: "mcq",
    nature: "mathematical",
    difficulty: "easy",
    title: "দ্বিঘাত সমীকরণ $ax^2 + bx + c = 0$-এর নিশ্চয়ক (Discriminant) $D < 0$ হলে মূলগুলো কেমন হবে?",
    options: ["জটিল ও অসমান", "বাস্তব ও সমান", "বাস্তব ও অসমান", "মূলদ"],
    correctIndex: 0,
    explanation: "নিশ্চায়ক $b^২ - ৪ac < ০$ হলে সমীকরণের মূলদ্বয় জটিল (অবাস্তব) ও অসমান হয়।",
    boardName: "যশোর বোর্ড",
    boardNameEn: "Jessore Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "একাদশ-দ্বাদশ শ্রেণি (HSC)",
    subject: "উচ্চতর গণিত ২য় পত্র",
    chapter: "অধ্যায় ৬: কণিক",
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: "একটি উপবৃত্তের উৎকেন্দ্রিকতা e-এর মান কেমন হয়?",
    options: ["0 < e < 1", "e = 1", "e > 1", "e = 0"],
    correctIndex: 0,
    explanation: "উৎকেন্দ্রিকতা $e = ১$ হলে পরাবৃত্ত, $০ < e < ১$ হলে উপবৃত্ত এবং $e > ১$ হলে অধিবৃত্ত হয়।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "HSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "জীববিজ্ঞান",
    chapter: "অধ্যায় ৮: রেচন প্রক্রিয়া",
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: "মানবদেহের বৃক্কের (Kidney) গঠন ও কাজের একক কোনটি?",
    options: ["নেফ্রন (Nephron)", "নিউরণ (Neuron)", "অ্যাক্সন", "অ্যালভিওলাই"],
    correctIndex: 0,
    explanation: "বৃক্কের কার্যকরী একককে নেফ্রন বলে; প্রতিটি মানব বৃক্কে প্রায় ১০-১২ লক্ষ নেফ্রন থাকে।",
    boardName: "ঢাকা বোর্ড",
    boardNameEn: "Dhaka Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  },
  {
    className: "নবম-দশম শ্রেণি (SSC)",
    subject: "জীববিজ্ঞান",
    chapter: "অধ্যায় ১২: জীবের বংশগতি ও বিবর্তন",
    type: "mcq",
    nature: "theory",
    difficulty: "easy",
    title: "বংশগতির ভৌত ভিত্তি কোনটি?",
    options: ["ক্রোমোজোম", "মাইটোকন্ড্রিয়া", "সেন্ট্রোজোম", "সাইটোপ্লাজম"],
    correctIndex: 0,
    explanation: "ক্রোমোজোম বংশগতির বৈশিষ্ট্য ধারণ ও বহন করে বলে একে বংশগতির ভৌত ভিত্তি বলা হয়।",
    boardName: "রাজশাহী বোর্ড",
    boardNameEn: "Rajshahi Board",
    year: "2024",
    yearBn: "২০২৪",
    exam: "SSC"
  }
];

async function seedBoardQuestions() {
  console.log("=== STARTING AUTHENTIC BOARD QUESTIONS SEEDER ===");
  await mongoose.connect(env.MONGODB_URI!);
  console.log("Connected to MongoDB Atlas.");

  let insertedCount = 0;
  let skippedCount = 0;

  for (const item of BOARD_QUESTIONS) {
    // Generate authentic tags
    const boardBanglaTag = `${item.boardName} ${item.yearBn}`;
    const boardEngTag = `${item.boardNameEn} ${item.year}`;
    const examYearTag = `${item.exam} ${item.year}`;
    const generalTag = "বোর্ড প্রশ্ন";

    const tagsSet = new Set<string>([
      boardBanglaTag,
      boardEngTag,
      examYearTag,
      generalTag,
      item.subject,
      item.chapter,
      item.type.toUpperCase(),
      ...(item.extraTags || [])
    ]);
    const tags = Array.from(tagsSet);

    // Check if question with same title already exists
    const existing = await QuestionBankItemModel.findOne({
      title: item.title,
      className: item.className,
      subject: item.subject
    });

    if (existing) {
      // Merge tags and assign board / year
      const mergedTags = Array.from(new Set([...(existing.tags || []), ...tags]));
      existing.tags = mergedTags;
      existing.board = item.boardName;
      existing.year = item.year;
      if (item.imageUrl) existing.imageUrl = item.imageUrl;
      await existing.save();
      skippedCount++;
    } else {
      const id = `brd_${nanoid(12)}`;
      const record: Partial<QuestionBankItemRecord> = {
        id,
        ownerId: "system",
        className: item.className,
        subject: item.subject,
        category: item.subject,
        chapter: item.chapter,
        type: item.type,
        nature: item.nature,
        difficulty: item.difficulty,
        board: item.boardName,
        year: item.year,
        title: item.title,
        subtitle: item.subtitle,
        imageUrl: item.imageUrl,
        marks: item.type === "cq" ? 10 : 1,
        options: item.type === "mcq" ? item.options || ["", "", "", ""] : [],
        correctIndex: item.type === "mcq" ? item.correctIndex ?? 0 : 0,
        subQuestions: item.type === "cq" ? item.subQuestions : undefined,
        explanation: item.explanation,
        tags,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await QuestionBankItemModel.create(record);
      insertedCount++;
    }
  }

  console.log(`\nBoard Seeding Summary:`);
  console.log(`- Inserted new board questions: ${insertedCount}`);
  console.log(`- Updated / Skipped existing: ${skippedCount}`);
  console.log(`- Total Board Questions processed: ${BOARD_QUESTIONS.length}`);
  console.log("=== BOARD QUESTIONS SEEDING COMPLETED ===");

  await mongoose.disconnect();
}

seedBoardQuestions().catch((err) => {
  console.error("Board seeding failed:", err);
  process.exit(1);
});
