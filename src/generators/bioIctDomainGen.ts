/**
 * Biology & ICT Domain Question Generator
 * Generates 50 distinct mathematical MCQs for any biology or ICT chapter
 */

import { ChapterDef, toBn, makeLogicGateSvg } from "./comprehensiveQuestionEngine.js";
import { GeneratedMCQPayload } from "./mathDomainGen.js";

export function generateBioIctMCQ(
  topic: string,
  chapter: ChapterDef,
  slot: number, // 1 to 50
  p1: number,
  p2: number,
  p3: number,
  p4: number,
  p5: number,
  subject: string = "Science"
): GeneratedMCQPayload {
  const chTag = `[${subject} - Ch ${chapter.number}: ${chapter.title}]`;
  let title = "";
  let rawCorrect = "";
  let rawDistractors: [string, string, string] = ["0", "1", "2"];
  let explanation = "";
  let imageUrl: string | undefined = undefined;

  if (chapter.domain === "ict") {
    if (topic === "ICT_NUMBERS_LOGIC") {
      switch (slot) {
        case 1:
          title = `${chTag} দশমিক সংখ্যা $(${p1})_{10}$-এর সমতুল্য বাইনারি মান কোনটি?`;
          rawCorrect = `$(${p1.toString(2)})_2$`;
          rawDistractors = [`$(${(p1 + 1).toString(2)})_2$`, `$(${p1.toString(8)})_2$`, `$(${p1.toString(16)})_2$`];
          explanation = `$${p1}$ কে ২ দ্বারা ক্রমান্বয়ে ভাগ করে ভাগশেষ নিলে $(${p1.toString(2)})_2$ হয়।`;
          break;
        case 2:
          title = `${chTag} বাইনারি সংখ্যা $(${p1.toString(2)})_2$-এর দশমিক মান কত?`;
          rawCorrect = `$(${p1})_{10}$`;
          rawDistractors = [`$(${p1 + 2})_{10}$`, `$(${p1 - 1})_{10}$`, `$(${p1 * 2})_{10}$`];
          explanation = `স্থানীয় মানের যোগফল: $(${p1.toString(2)})_2 = ${p1}$।`;
          break;
        case 3:
          title = `${chTag} ৮-বিট রেজিস্টারে $+${p4}$-এর ২-এর পরিপূরক (2's Complement) মান কোনটি?`;
          const bin8 = p4.toString(2).padStart(8, "0");
          const comp1 = bin8.split("").map(b => b === "0" ? "1" : "0").join("");
          const comp2 = (parseInt(comp1, 2) + 1).toString(2).padStart(8, "0");
          rawCorrect = `$${comp2}$`;
          rawDistractors = [`$${comp1}$`, `$${bin8}$`, `$11111111$`];
          explanation = `১-এর পরিপূরকের সাথে ১ যোগ করলে ২-এর পরিপূরক মান $${comp2}$ পাওয়া যায়।`;
          break;
        case 4:
          title = `${chTag} লজিক গেট AND-এ ইনপুট $A = 1$ এবং $B = 0$ হলে আউটপুট কত?`;
          rawCorrect = `$0$`;
          rawDistractors = [`$1$`, `$2$`, `অনির্ণেয়`];
          explanation = `AND গেটে যেকোনো একটি ইনপুট ০ হলে আউটপুট সর্বদাই ০ হয় ($1 \\cdot 0 = 0$)।`;
          imageUrl = makeLogicGateSvg("AND", 1, 0, 0);
          break;
        case 5:
          title = `${chTag} লজিক গেট OR-এ ইনপুট $A = 1$ এবং $B = 0$ হলে আউটপুট কত?`;
          rawCorrect = `$1$`;
          rawDistractors = [`$0$`, `$2$`, `$-1$`];
          explanation = `OR গেটে যেকোনো একটি ইনপুট ১ হলে আউটপুট সর্বদাই ১ হয় ($1 + 0 = 1$)।`;
          imageUrl = makeLogicGateSvg("OR", 1, 0, 1);
          break;
        case 6:
          title = `${chTag} বুলিয়ান অ্যালজেব্রায় $A + \\bar{A}$-এর সরলীকৃত মান কোনটি?`;
          rawCorrect = `$1$`;
          rawDistractors = [`$0$`, `$A$`, `$\\bar{A}$`];
          explanation = `বুলিয়ান স্বতঃসিদ্ধ অনুসারে যেকোনো চলক ও তার বিপরীতের সমষ্টি সর্বদাই ১।`;
          break;
        default:
          const ik = slot - 6;
          title = `${chTag} [সমস্যা ${slot}]: হেক্সাডেসিমাল সংখ্যা $(${ik.toString(16).toUpperCase()})_{16}$-এর দশমিক মান কত?`;
          rawCorrect = `$(${ik})_{10}$`;
          rawDistractors = [`$(${ik + 4})_{10}$`, `$(${ik * 2})_{10}$`, `$16$`];
          explanation = `হেক্সাডেসিমাল $(${ik.toString(16).toUpperCase()})_{16} = ${ik}$।`;
          break;
      }
    } else {
      // General ICT (Networking, Programming, Web, DBMS)
      switch (slot) {
        case 1:
          title = `${chTag} একটি ফাইলের আকার $${p4 * 8}\\text{ Megabits}$ এবং ব্যান্ডউইথ $${p4}\\text{ Mbps}$ হলে স্থানান্তরে কত সময় লাগবে?`;
          rawCorrect = `$8\\text{ s}$`;
          rawDistractors = [`$${p4}\\text{ s}$`, `$16\\text{ s}$`, `$1\\text{ s}$`];
          explanation = `$t = \\frac{\\text{Data}}{\\text{Bandwidth}} = \\frac{${p4 * 8}}{${p4}} = 8\\text{ s}$।`;
          break;
        case 2:
          title = `${chTag} একটি সাবনেটে হোস্ট বিট সংখ্যা $n = ${p4}$ হলে মোট ব্যবহারযোগ্য আইপি ঠিকানা (Host IP) কয়টি?`;
          const hostIps = Math.pow(2, p4) - 2;
          rawCorrect = `$${hostIps}$`;
          rawDistractors = [`$${Math.pow(2, p4)}$`, `$${hostIps + 1}$`, `$${p4 * 2}$`];
          explanation = `ব্যবহারযোগ্য হোস্ট আইপি $= 2^n - 2 = 2^{${p4}} - 2 = ${hostIps}$।`;
          break;
        case 3:
          title = `${chTag} সি প্রোগ্রামে \`for(int i = 0; i < ${p4 * 3}; i++)\` লুপটি মোট কতবার আবর্তিত হবে?`;
          rawCorrect = `$${p4 * 3}$ বার`;
          rawDistractors = [`$${p4 * 3 + 1}$ বার`, `$${p4 * 3 - 1}$ বার`, `$${p4}$ বার`];
          explanation = `০ হতে শুরু করে ${p4 * 3 - 1} পর্যন্ত মোট ${p4 * 3} বার লুপটি চলবে।`;
          break;
        default:
          const ictG = slot - 3;
          title = `${chTag} [সমস্যা ${slot}]: ডেটাবেজ রিলেশনে $R_1$-এ ${ictG} টি এবং $R_2$-এ ৩টি রেকর্ড থাকলে কার্তেসীয় গুণজে মোট টাপল (Tuple) সংখ্যা কত?`;
          const tupCount = ictG * 3;
          rawCorrect = `$${tupCount}$ টি`;
          rawDistractors = [`$${tupCount + 3}$ টি`, `$${ictG + 3}$ টি`, `$${ictG}$ টি`];
          explanation = `কার্তেসীয় গুণজের মোট টাপল সংখ্যা $= n(R_1) \\times n(R_2) = ${ictG} \\times 3 = ${tupCount}$।`;
          break;
      }
    }
  } else {
    // Biology Domain (Genetics, Cell, Physiology, Ecology)
    if (topic === "BIO_GENETICS") {
      switch (slot) {
        case 1:
          title = `${chTag} মেন্ডেলের একসংকর (Monohybrid) ক্রসে $F_2$ জনুর ফিনোটাইপিক অনুপাত কোনটি?`;
          rawCorrect = `$3 : 1$`;
          rawDistractors = [`$1 : 2 : 1$`, `$9 : 3 : 3 : 1$`, `$1 : 1$`];
          explanation = `একসংকর ক্রসে ৩ ভাগ প্রকট ও ১ ভাগ প্রচ্ছন্ন বৈশিষ্ট্য প্রকাশিত হয়।`;
          break;
        case 2:
          title = `${chTag} মেন্ডেলের একসংকর ক্রসে $F_2$ জনুর জিনোটাইপিক অনুপাত কোনটি?`;
          rawCorrect = `$1 : 2 : 1$`;
          rawDistractors = [`$3 : 1$`, `$9 : 3 : 3 : 1$`, `$1 : 1 : 1$`];
          explanation = `জিনোটাইপিক অনুপাত $1 TT : 2 Tt : 1 tt$।`;
          break;
        case 3:
          title = `${chTag} মেন্ডেলের দ্বিসংকর ক্রসে $F_2$ জনুর ফিনোটাইপিক অনুপাত কোনটি?`;
          rawCorrect = `$9 : 3 : 3 : 1$`;
          rawDistractors = [`$3 : 1$`, `$1 : 2 : 1$`, `$15 : 1$`];
          explanation = `স্বাধীনভাবে সঞ্চারণের ফলে ৯:৩:৩:১ অনুপাত সৃষ্টি হয়।`;
          break;
        case 4:
          title = `${chTag} হার্ডি-ওয়াইনবার্গ সাম্যাবস্থায় $p = 0.6$ হলে প্রচ্ছন্ন অ্যালিলের ফ্রিকোয়েন্সি $q$ কত?`;
          rawCorrect = `$0.4$`;
          rawDistractors = [`$0.6$`, `$0.36$`, `$0.16$`];
          explanation = `$p + q = 1 \\implies q = 1 - 0.6 = 0.4$।`;
          break;
        default:
          const bgK = slot - 4;
          title = `${chTag} [সমস্যা ${slot}]: $Tt \\times Tt$ ক্রসে মোট ${bgK * 100} টি উদ্ভিদের মধ্যে কতটি খর্বাকার ($tt$) হবে?`;
          const ttCount = (bgK * 100 * 0.25).toFixed(0);
          rawCorrect = `$${ttCount}$ টি`;
          rawDistractors = [`$${(Number(ttCount) * 3).toFixed(0)}$ টি`, `$${(Number(ttCount) / 2).toFixed(0)}$ টি`, `$${bgK * 100}$ টি`];
          explanation = `প্রচ্ছন্ন খর্বাকার উদ্ভিদের সম্ভাবনা ২৫%: $${bgK * 100} \\times 0.25 = ${ttCount}$।`;
          break;
      }
    } else {
      // General Biology (Cell division, Bioenergetics, Nutrition, Ecology)
      switch (slot) {
        case 1:
          title = `${chTag} একজন ব্যক্তির ওজন $W = ${50 + p4 * 3}\\text{ kg}$ এবং উচ্চতা $H = 1.6\\text{ m}$ হলে তার বিএমআই (BMI) কত?`;
          const bmiV = ((50 + p4 * 3) / 2.56).toFixed(1);
          rawCorrect = `$${bmiV}\\text{ kg/m}^2$`;
          rawDistractors = [`$${(Number(bmiV) + 4).toFixed(1)}\\text{ kg/m}^2$`, `$${(Number(bmiV) - 3).toFixed(1)}\\text{ kg/m}^2$`, `$22.0\\text{ kg/m}^2$`];
          explanation = `$\\text{BMI} = \\frac{W}{H^2} = \\frac{${50 + p4 * 3}}{1.6^2} = ${bmiV}\\text{ kg/m}^2$।`;
          break;
        case 2:
          title = `${chTag} সবাত শ্বসনে ১ অণু গ্লুকোজের সম্পূর্ণ জারণে নিট কতটি ATP অণু উৎপন্ন হয়?`;
          rawCorrect = `$38$ টি`;
          rawDistractors = [`$2$ টি`, `$36$ টি`, `$40$ টি`];
          explanation = `গ্লাইকোলাইসিস, ক্রেবস চক্র ও ইটিএস মিলে মোট ৩৮টি এটিপি তৈরি হয়।`;
          break;
        case 3:
          title = `${chTag} একটি মাতৃকোষে পরপর $n = ${p4}$ বার মাইটোসিস বিভাজন ঘটলে মোট কয়টি অপত্য কোষ সৃষ্টি হবে?`;
          const cellCnt = Math.pow(2, p4);
          rawCorrect = `$${cellCnt}$ টি`;
          rawDistractors = [`$${cellCnt - 1}$ টি`, `$${p4 * 2}$ টি`, `$${cellCnt * 2}$ টি`];
          explanation = `প্রতি মাইটোসিসে দ্বিগুণ হওয়ায় মোট অপত্য কোষ $= 2^n = 2^{${p4}} = ${cellCnt}$।`;
          break;
        case 4:
          title = `${chTag} মানুষের দেহকোষে ক্রোমোজোম সংখ্যা ৪৬টি ($2n$) হলে জননকোষে (গ্যামেটে) ক্রোমোজোম সংখ্যা কত?`;
          rawCorrect = `$23$ টি`;
          rawDistractors = [`$46$ টি`, `$92$ টি`, `$12$ টি`];
          explanation = `মায়োসিস বিভাজনের ফলে জননকোষ হ্যাপ্লয়েড ($n = 23$) হয়।`;
          break;
        case 5:
          title = `${chTag} বাস্তুতন্ত্রে উৎপাদকের শক্তি $E = ${p4 * 1000}\\text{ kcal}$ হলে ১০% নিয়মানুসারে ১ম স্তরের খাদক কত শক্তি পাবে?`;
          const e10 = (p4 * 1000 * 0.1).toFixed(0);
          rawCorrect = `$${e10}\\text{ kcal}$`;
          rawDistractors = [`$${p4 * 1000}\\text{ kcal}$`, `$${Number(e10) / 10}\\text{ kcal}$`, `$100\\text{ kcal}$`];
          explanation = `লিন্ডেম্যানের ১০% নিয়ম: $E_1 = 0.10 \\times ${p4 * 1000} = ${e10}\\text{ kcal}$।`;
          break;
        default:
          const bioDef = slot - 5;
          title = `${chTag} [সমস্যা ${slot}]: বৃক্কে গ্লোমেরুলার ফিল্ট্রেশন রেট $GFR = 125\\text{ mL/min}$ হলে $t = ${bioDef * 10}\\text{ min}$-এ মোট কত ফিল্ট্রেট তৈরি হবে?`;
          const gfrTot = 125 * bioDef * 10;
          rawCorrect = `$${gfrTot}\\text{ mL}$`;
          rawDistractors = [`$${gfrTot / 2}\\text{ mL}$`, `$${gfrTot * 2}\\text{ mL}$`, `$1250\\text{ mL}$`];
          explanation = `মোট ফিল্ট্রেট $= 125 \\times ${bioDef * 10} = ${gfrTot}\\text{ mL}$।`;
          break;
      }
    }
  }

  return { title, rawCorrect, rawDistractors, explanation, imageUrl };
}
