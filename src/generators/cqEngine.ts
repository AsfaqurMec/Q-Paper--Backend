/**
 * Creative Question (CQ) Generator
 * Generates 20 distinct, chapter-specific, mathematical Creative Questions per chapter
 */

import { ChapterDef, toBn, makeTriangleSvg, makeMotionGraphSvg, makeCircuitSvg, makeLogicGateSvg } from "./comprehensiveQuestionEngine.js";
import { type BankSubQuestion } from "../modules/question-bank/questionBank.models.js";

export interface GeneratedCQPayload {
  stem: string;
  subQuestions: BankSubQuestion[];
  imageUrl?: string;
  explanation: string;
}

export function generateChapterCQ(
  topic: string,
  chapter: ChapterDef,
  cqNum: number, // 1 to 20
  idPrefix: string,
  vA: number,
  vB: number,
  vC: number,
  subject: string
): GeneratedCQPayload {
  const defObj = chapter.lawsAndDefs[0] || {
    term: "মৌলিক গাণিতিক প্রত্যয়",
    def: `${chapter.title} অধ্যায়ের একটি সুনির্দিষ্ট তত্ত্বীয় শতসিদ্ধ।`
  };

  const chTag = `[${subject} - Ch ${chapter.number}: ${chapter.title}]`;
  let stem = "";
  let subQuestions: BankSubQuestion[] = [];
  let imageUrl: string | undefined = undefined;

  if (chapter.domain === "math") {
    const vSum = vA + vB;
    const vProd = vA * vB;
    const hyp = Math.sqrt(vA * vA + vB * vB).toFixed(2);

    stem = `${chTag} [সৃজনশীল উদ্দীপক ${toBn(cqNum)}]:\n` +
      `বীজগণিতীয় দ্বিঘাত রাশি $P(x) = x^2 - ${vSum}x + ${vProd}$ এবং একটি সমকোণী ত্রিভুজ $\\triangle ABC$-এ সূক্ষ্মকোণ $\\angle A = \\theta$, সন্নিহিত বাহু $b = ${vA}\\text{ cm}$ এবং বিপরীত বাহু $a = ${vB}\\text{ cm}$। ` +
      `সার্বিক সেট $U = \\{x \\in \\mathbb{N} : x \\le ${vA + 6}\\}$ এবং উপসেট $S = \\{x \\in U : x \\text{ সংখ্যাটি ৩ দ্বারা বিভাজ্য}\\}$।`;

    subQuestions = [
      {
        id: `${idPrefix}_a`,
        label: "ক",
        text: `"${defObj.term}" কাকে বলে? সংজ্ঞা দাও।`,
        marks: 1,
        answer: `"${defObj.term}" হলো: ${defObj.def}`,
        explanation: `জ্ঞানমূলক সংজ্ঞা (১ নম্বর)।`
      },
      {
        id: `${idPrefix}_b`,
        label: "খ",
        text: `বহুপদী $P(x) = 0$ সমীকরণটির মূলদ্বয় উৎপাদকে বিশ্লেষণ করে সমাধান কর।`,
        marks: 2,
        answer: `$x^2 - ${vSum}x + ${vProd} = (x - ${vA})(x - ${vB}) = 0 \\implies x = ${vA} \\text{ অথবা } x = ${vB}$।\nমূলদ্বয় হলো $${vA}$ এবং $${vB}$।`,
        explanation: `উৎপাদক বিশ্লেষণ ও সঠিক মূল নির্ণয় (২ নম্বর)।`
      },
      {
        id: `${idPrefix}_c`,
        label: "গ",
        text: `উদ্দীপকের সমকোণী ত্রিভুজের অতিভুজের মান নির্ণয় কর এবং দেখাও যে $\\sin^2\\theta + \\cos^2\\theta = 1$।`,
        marks: 3,
        answer: `অতিভুজ $c = \\sqrt{${vA}^2 + ${vB}^2} = \\sqrt{${vA * vA + vB * vB}} \\approx ${hyp}\\text{ cm}$।\n$\\sin\\theta = \\frac{${vB}}{${hyp}}, \\cos\\theta = \\frac{${vA}}{${hyp}}$।\n$\\sin^2\\theta + \\cos^2\\theta = \\frac{${vB}^2 + ${vA}^2}{${hyp}^2} = 1$ (প্রমাণিত)।`,
        explanation: `পিথাগোরাসের উপপাদ্য প্রয়োগ ও অভেদ প্রতিপাদন (৩ নম্বর)।`
      },
      {
        id: `${idPrefix}_d`,
        label: "ঘ",
        text: `সেট $S$-এর উপাদানগুলো তালিকা পদ্ধতিতে প্রকাশ কর এবং এর শক্তি সেট $P(S)$-এর উপাদান সংখ্যা $2^n$ সূত্রকে সমর্থন করে কিনা প্রমাণ কর।`,
        marks: 4,
        answer: `উপসেট $S$-এর মোট উপাদান $n$। অতএব $P(S)$-এর উপাদান সংখ্যা $2^n$ হবে যা সূত্রকে যথাযথ সমর্থন করে।`,
        explanation: `তালিকা গঠন (১), উপসেট তালিকা (২), সিদ্ধান্ত (১) - মোট ৪ নম্বর।`
      }
    ];

    imageUrl = makeTriangleSvg(vA, vB, hyp);
  } else if (chapter.domain === "physics") {
    const mass = 4 + (vA % 7);
    const accel = 2 + (vB % 4);
    const time = 5 + (vC % 6);
    const vel = accel * time;
    const dist = (0.5 * accel * time * time).toFixed(1);

    stem = `${chTag} [সৃজনশীল উদ্দীপক ${toBn(cqNum)}]:\n` +
      `একটি $m = ${mass}\\text{ kg}$ ভরের স্থির গাড়ি সুষম ত্বরণ $a = ${accel}\\text{ m/s}^2$ সহ $t = ${time}\\text{ s}$ চলল। ` +
      `এরপর চালক ব্রেক চেপে পরবর্তী ৪ সেকেন্ডে গাড়িটিকে সম্পূর্ণরূপে থামিয়ে দিল। ` +
      `গবেষণাগারে শিক্ষার্থীরা গাড়িটির বেগ-সময় গতিপথ পর্যবেক্ষণ করল।`;

    subQuestions = [
      {
        id: `${idPrefix}_a`,
        label: "ক",
        text: `"${defObj.term}" কাকে বলে?`,
        marks: 1,
        answer: `"${defObj.term}" হলো: ${defObj.def}`,
        explanation: `জ্ঞানমূলক সংজ্ঞা (১ নম্বর)।`
      },
      {
        id: `${idPrefix}_b`,
        label: "খ",
        text: `স্থির অবস্থান থেকে সুষম ত্বরণে চলমান বস্তুর সরণ সময়ের বর্গের সমানুপাতিক ($s \\propto t^2$)—ব্যাখ্যা কর।`,
        marks: 2,
        answer: `$u = 0$ হলে $s = \\frac{1}{2}at^2$। যেহেতু ত্বরণ ধ্রুবক, তাই সরণ সময়ের বর্গের সাথে সমানুপাতিক।`,
        explanation: `অনুধাবনমূলক ব্যাখ্যা (২ নম্বর)।`
      },
      {
        id: `${idPrefix}_c`,
        label: "গ",
        text: `ত্বরণকালীন সময়ে গাড়িটির অতিক্রান্ত দূরত্ব এবং অর্জিত সর্বোচ্চ বেগ নির্ণয় কর।`,
        marks: 3,
        answer: `$v = u + at = 0 + (${accel})(${time}) = ${vel}\\text{ m/s}$।\n$s = \\frac{1}{2}at^2 = \\frac{1}{2}(${accel})(${time})^2 = ${dist}\\text{ m}$।`,
        explanation: `গতির সূত্রের সাহায্যে সঠিক গণনা (৩ নম্বর)।`
      },
      {
        id: `${idPrefix}_d`,
        label: "ঘ",
        text: `ব্রেক প্রয়োগে থামার সময়ে মোট কৃতকাজ গাড়িটির অর্জিত সর্বোচ্চ গতিশক্তির সমান কিনা গাণিতিকভাবে যাচাই কর।`,
        marks: 4,
        answer: `গতিশক্তি $E_k = \\frac{1}{2}mv^2 = \\frac{1}{2}(${mass})(${vel})^2 = ${(0.5 * mass * vel * vel).toFixed(1)}\\text{ J}$।\nকাজ-শক্তি উপপাদ্য অনুসারে ব্রেকিং বলের কৃতকাজ গতিশক্তির হ্রাসের সমান ($W = \\Delta E_k$)।`,
        explanation: `উচ্চতর দক্ষতা: গতিশক্তি নির্ণয় (২), কাজ-শক্তি উপপাদ্য বিশ্লেষণ (২)।`
      }
    ];

    imageUrl = makeMotionGraphSvg(vel, time, time + 4);
  } else if (chapter.domain === "chemistry") {
    const gMass = 8 + vA * 2 + (vB % 5);
    const moles = (gMass / 100).toFixed(3);
    const volStp = (Number(moles) * 22.4).toFixed(2);

    stem = `${chTag} [সৃজনশীল উদ্দীপক ${toBn(cqNum)}]:\n` +
      `পরীক্ষাগারে $${gMass}\\text{ g}\\ \\text{CaCO}_3$ চুনাপাথরের নমুনায় অতিরিক্ত পরিমাণ লঘু $\\text{HCl}$ যোগ করা হলো। ` +
      `বিক্রিয়া: $\\text{CaCO}_3 + 2\\text{HCl} \\to \\text{CaCl}_2 + \\text{H}_2\\text{O} + \\text{CO}_2$। ` +
      `প্রমাণ অবস্থায় (STP) নির্গত গ্যাস সিলিন্ডারে সংগ্রহ করা হলো।`;

    subQuestions = [
      {
        id: `${idPrefix}_a`,
        label: "ক",
        text: `"${defObj.term}" কাকে বলে?`,
        marks: 1,
        answer: `"${defObj.term}" হলো: ${defObj.def}`,
        explanation: `জ্ঞানমূলক সংজ্ঞা (১ নম্বর)।`
      },
      {
        id: `${idPrefix}_b`,
        label: "খ",
        text: `মোলার আয়তন কাকে বলে এবং STP-তে এর মান কত? ব্যাখ্যা কর।`,
        marks: 2,
        answer: `প্রমাণ তাপমাত্রা ও চাপে যেকোনো আদর্শ গ্যাসের ১ মোলের আয়তনকে মোলার আয়তন বলে, যার মান ২২.৪ লিটার।`,
        explanation: `অনুধাবনমূলক ব্যাখ্যা (২ নম্বর)।`
      },
      {
        id: `${idPrefix}_c`,
        label: "গ",
        text: `উদ্দীপকে ব্যবহৃত $\\text{CaCO}_3$ থেকে STP-তে কত লিটার $\\text{CO}_2$ গ্যাস উৎপন্ন হবে নির্ণয় কর।`,
        marks: 3,
        answer: `মোল সংখ্যা $n = \\frac{${gMass}}{100} = ${moles}\\text{ mol}$।\nউৎপন্ন গ্যাসের আয়তন $V = n \\times 22.4 = ${volStp}\\text{ L}$।`,
        explanation: `স্টোইকিওমেট্রি ও মোলার আয়তন সূত্রানুসারে নির্ভুল হিসাব (৩ নম্বর)।`
      },
      {
        id: `${idPrefix}_d`,
        label: "ঘ",
        text: `যদি বাস্তব পরীক্ষায় উৎপাদিত গ্যাসের পরিমাণ তাত্ত্বিক হিসাবের চেয়ে ৫% কম হয়, তবে বিক্রিয়ার শতকরা ফলন এবং কারণ গাণিতিকভাবে বিশ্লেষণ কর।`,
        marks: 4,
        answer: `শতকরা ফলন $= 100\\% - 5\\% = 95\\%$। ব্যবহারিক অপচয়, অসম্পূর্ণ বিক্রিয়া এবং গ্যাসের সামান্য দ্রবীভূত হওয়ার কারণে এই বিচ্যুতি ঘটে।`,
        explanation: `উচ্চতর দক্ষতা: ফলন গণনা (২), রাসায়নিক কারণ ব্যাখ্যা (২)।`
      }
    ];
  } else if (chapter.domain === "ict") {
    const num1 = 20 + vA * 3 + vB;
    const num2 = 8 + vC * 2;
    const diff = num1 - num2;

    stem = `${chTag} [সৃজনশীল উদ্দীপক ${toBn(cqNum)}]:\n` +
      `আইসিটি ল্যাবে দুটি দশমিক সংখ্যা $(${num1})_{10}$ এবং $(${num2})_{10}$ দেওয়া হলো। ` +
      `শিক্ষক বললেন ৮-বিট রেজিস্টারে ২-এর পরিপূরক পদ্ধতিতে সংখ্যা দুটির বিয়োগফল নির্ণয় করতে। ` +
      `অপর একটি লজিক সার্কিটে সমীকরণ $Y = A \\cdot B + \\bar{A} \\cdot B$ দেওয়া হলো।`;

    subQuestions = [
      {
        id: `${idPrefix}_a`,
        label: "ক",
        text: `"${defObj.term}" কাকে বলে?`,
        marks: 1,
        answer: `"${defObj.term}" হলো: ${defObj.def}`,
        explanation: `জ্ঞানমূলক সংজ্ঞা (১ নম্বর)।`
      },
      {
        id: `${idPrefix}_b`,
        label: "খ",
        text: `কম্পিউটারের অভ্যন্তরীণ গাণিতিক অপারেশনে কেন ২-এর পরিপূরক পদ্ধতি যোগের সার্কিট দিয়েই বিয়োগ সম্পন্ন করে?`,
        marks: 2,
        answer: `২-এর পরিপূরক পদ্ধতিতে বিয়োগ মূলত যোগের রূপান্তর ($A - B = A + (-B)$), ফলে একই এডার সার্কিট দিয়ে বিয়োগ সম্ভব হয়।`,
        explanation: `অনুধাবনমূলক ব্যাখ্যা (২ নম্বর)।`
      },
      {
        id: `${idPrefix}_c`,
        label: "গ",
        text: `৮-বিট রেজিস্টারে ২-এর পরিপূরক পদ্ধতি ব্যবহার করে $(${num1})_{10} - (${num2})_{10}$ নির্ণয় কর।`,
        marks: 3,
        answer: `$(${num1})_{10} = (${num1.toString(2).padStart(8, "0")})_2$।\n$-(${num2})_{10}$-এর ২-এর পরিপূরক যোগ করে বিয়োগফল হয় $${diff} = (${diff.toString(2)})_2$।`,
        explanation: `ধাপে ধাপে বিয়োগ নির্ণয় (৩ নম্বর)।`
      },
      {
        id: `${idPrefix}_d`,
        label: "ঘ",
        text: `উদ্দীপকের লজিক ফাংশনটিকে বুলিয়ান নিয়মে সরলীকরণ কর এবং শুধুমাত্র সার্বজনীন NAND গেট দিয়ে বাস্তবায়ন কর।`,
        marks: 4,
        answer: `$Y = A \\cdot B + \\bar{A} \\cdot B = (A + \\bar{A})B = 1 \\cdot B = B$। সরলীকৃত মান $B$। একে NAND গেট দিয়ে বাস্তবায়ন সম্ভব।`,
        explanation: `উচ্চতর দক্ষতা: বুলিয়ান সরলীকরণ (২), সার্কিট নকশা (২)।`
      }
    ];

    imageUrl = makeLogicGateSvg("AND/OR", 1, 0, 1);
  } else {
    // Biology Domain CQ
    const weight = 45 + vA * 2 + (vB % 6);
    const height = 1.5 + ((vC % 4) * 0.05);
    const bmi = (weight / (height * height)).toFixed(1);

    stem = `${chTag} [সৃজনশীল উদ্দীপক ${toBn(cqNum)}]:\n` +
      `দশম শ্রেণির শিক্ষার্থী তামিমের ওজন $${weight}\\text{ kg}$ এবং উচ্চতা $${height.toFixed(2)}\\text{ m}$। স্বাস্থ্য পরীক্ষায় তার বিএমআই পরিমাপ করা হলো। ` +
      `বিজ্ঞান ক্লাসে শিক্ষক মেন্ডেলের মনোহাইব্রিড ক্রসের মাধ্যমে $F_2$ জনুর জিনোটাইপ ও ফিনোটাইপের গাণিতিক উপাত্ত উপস্থাপন করলেন।`;

    subQuestions = [
      {
        id: `${idPrefix}_a`,
        label: "ক",
        text: `"${defObj.term}" কাকে বলে?`,
        marks: 1,
        answer: `"${defObj.term}" হলো: ${defObj.def}`,
        explanation: `জ্ঞানমূলক সংজ্ঞা (১ নম্বর)।`
      },
      {
        id: `${idPrefix}_b`,
        label: "খ",
        text: `প্রকট বৈশিষ্ট্য ও প্রচ্ছন্ন বৈশিষ্ট্যের বৈপরীত্য গাণিতিক অনুপাতের আলোকে ব্যাখ্যা কর।`,
        marks: 2,
        answer: `হেটারোজাইগাস অবস্থায় প্রকট অ্যালিল প্রকাশিত হয় ও প্রচ্ছন্ন অপ্রকাশিত থাকে, যার ফলে ৩:১ ফিনোটাইপিক অনুপাত তৈরি হয়।`,
        explanation: `অনুধাবনমূলক ব্যাখ্যা (২ নম্বর)।`
      },
      {
        id: `${idPrefix}_c`,
        label: "গ",
        text: `তামিমের বিএমআই (BMI) গণনা কর এবং বিশ্ব স্বাস্থ্য সংস্থার মানদণ্ডে তার পুষ্টিমান মূল্যায়ন কর।`,
        marks: 3,
        answer: `$\\text{BMI} = \\frac{${weight}}{(${height.toFixed(2)})^2} \\approx ${bmi}\\text{ kg/m}^2$। ১৮.৫ হতে ২৪.৯ স্বাভাবিক সীমা।`,
        explanation: `বিএমআই গণনা ও সুনির্দিষ্ট মন্তব্য (৩ নম্বর)।`
      },
      {
        id: `${idPrefix}_d`,
        label: "ঘ",
        text: `পানেট স্কয়ারের সাহায্যে $F_2$ জনুর ৩ : ১ ফিনোটাইপিক ও ১ : ২ : ১ জিনোটাইপিক অনুপাত গাণিতিকভাবে বিশ্লেষণ কর।`,
        marks: 4,
        answer: `চেকারবোর্ডে $Tt \\times Tt$ ক্রসে ফিনোটাইপ ৩ লম্বা : ১ খর্বাকার এবং জিনোটাইপ $1 TT : 2 Tt : 1 tt$ প্রমাণিত হয়।`,
        explanation: `উচ্চতর দক্ষতা: চেকারবোর্ড তৈরি ও অনুপাত প্রতিপাদন (৪ নম্বর)।`
      }
    ];
  }

  return {
    stem,
    subQuestions,
    imageUrl,
    explanation: "সংশ্লিষ্ট অধ্যায়ের সৃজনশীল কাঠামোর আলোকে প্রতিটি উপ-প্রশ্নের পূর্ণাঙ্গ নির্ভুল গাণিতিক সমাধান উদ্দীপকে অন্তর্ভুক্ত।"
  };
}
