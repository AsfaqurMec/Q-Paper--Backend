/**
 * Chemistry Domain Question Generator
 * Generates 50 distinct mathematical MCQs for any chemistry chapter
 */

import { ChapterDef, toBn } from "./comprehensiveQuestionEngine.js";
import { GeneratedMCQPayload } from "./mathDomainGen.js";

export function generateChemistryMCQ(
  topic: string,
  chapter: ChapterDef,
  slot: number, // 1 to 50
  p1: number,
  p2: number,
  p3: number,
  p4: number,
  p5: number,
  subject: string = "Chemistry"
): GeneratedMCQPayload {
  const chTag = `[${subject} - Ch ${chapter.number}: ${chapter.title}]`;
  let title = "";
  let rawCorrect = "";
  let rawDistractors: [string, string, string] = ["0", "1", "2"];
  let explanation = "";
  let imageUrl: string | undefined = undefined;

  if (topic === "CHEM_MOLE_QUANTITATIVE") {
    switch (slot) {
      case 1:
        title = `${chTag} $${p4 * 18}\\text{ g}$ পানিতে ($\\text{H}_2\\text{O}$) কত মোল পানি অণু উপস্থিত? (মোলার ভর $18\\text{ g/mol}$)`;
        rawCorrect = `$${p4}\\text{ mol}$`;
        rawDistractors = [`$${p4 * 2}\\text{ mol}$`, `$1\\text{ mol}$`, `$${p4 * 18}\\text{ mol}$`];
        explanation = `$n = \\frac{w}{M} = \\frac{${p4 * 18}}{18} = ${p4}\\text{ mol}$।`;
        break;
      case 2:
        title = `${chTag} প্রমাণ তাপমাত্রা ও চাপে (STP) $${p4}\\text{ mol}\\ \\text{CO}_2$ গ্যাসের আয়তন কত লিটার?`;
        const volGas = (p4 * 22.4).toFixed(1);
        rawCorrect = `$${volGas}\\text{ L}$`;
        rawDistractors = [`$22.4\\text{ L}$`, `$${(p4 * 11.2).toFixed(1)}\\text{ L}$`, `$${(p4 * 24.8).toFixed(1)}\\text{ L}$`];
        explanation = `$V = n \\times 22.4 = ${p4} \\times 22.4 = ${volGas}\\text{ L}$।`;
        break;
      case 3:
        title = `${chTag} $250\\text{ mL}$ দ্রবণে $${p4 * 4}\\text{ g}\\ \\text{NaOH}$ দ্রবীভূত থাকলে দ্রবণের মোলারিটি ($S$) কত? ($M = 40\\text{ g/mol}$)`;
        const molConc = ((1000 * (p4 * 4)) / (40 * 250)).toFixed(2);
        rawCorrect = `$${molConc}\\text{ M}$`;
        rawDistractors = [`$1.0\\text{ M}$`, `$${(Number(molConc) * 2).toFixed(2)}\\text{ M}$`, `$0.1\\text{ M}$`];
        explanation = `$S = \\frac{1000w}{MV} = \\frac{1000 \\times ${p4 * 4}}{40 \\times 250} = ${molConc}\\text{ M}$।`;
        break;
      default:
        const mk = slot - 3;
        title = `${chTag} [সমস্যা ${slot}]: $${mk * 2}\\text{ mol}\\ \\text{O}_2$ গ্যাসের মোট অণু সংখ্যা কত? ($N_A = 6.02 \\times 10^{23}$)`;
        const molTotal = ((mk * 2) * 6.02).toFixed(2);
        rawCorrect = `$${molTotal} \\times 10^{23}$ টি`;
        rawDistractors = [`$6.02 \\times 10^{23}$ টি`, `$${(Number(molTotal) / 2).toFixed(2)} \\times 10^{23}$ টি`, `$${mk * 2} \\times 10^{23}$ টি`];
        explanation = `$N = n \\times N_A = ${mk * 2} \\times 6.02 \\times 10^{23} = ${molTotal} \\times 10^{23}$ টি অণু।`;
        break;
    }
  } else if (topic === "CHEM_ACID_BASE") {
    switch (slot) {
      case 1:
        title = `${chTag} কোনো জলীয় দ্রবণে $[H^+] = 10^{-${p4}}\\text{ M}$ হলে দ্রবণটির pH কত?`;
        rawCorrect = `$${p4}$`;
        rawDistractors = [`$${14 - p4}$`, `$10^{-${p4}}$`, `$7$`];
        explanation = `$\\text{pH} = -\\log[H^+] = -\\log(10^{-${p4}}) = ${p4}$।`;
        break;
      case 2:
        title = `${chTag} একটি দ্রবণের pH মান $${p4}$ হলে এর pOH কত?`;
        rawCorrect = `$${14 - p4}$`;
        rawDistractors = [`$${p4}$`, `$7$`, `$14$`];
        explanation = `$\\text{pH} + \\text{pOH} = 14 \\implies \\text{pOH} = 14 - ${p4} = ${14 - p4}$।`;
        break;
      default:
        const ak = slot - 2;
        title = `${chTag} [সমস্যা ${slot}]: $0.${ak}\\text{ M}\\ \\text{HCl}$ এসিডের তীব্র জলীয় দ্রবণের $[H^+]$ ঘনমাত্রা কত?`;
        rawCorrect = `$0.${ak}\\text{ M}$`;
        rawDistractors = [`$0.${ak * 2}\\text{ M}$`, `$10^{-${ak}}\\text{ M}$`, `$1.0\\text{ M}$`];
        explanation = `$\\text{HCl}$ তীব্র এসিড হওয়ায় সম্পূর্ণ আয়নিত হয়ে সমপরিমাণ $[H^+]$ ($0.${ak}\\text{ M}$) উৎপন্ন করে।`;
        break;
    }
  } else if (topic === "CHEM_ORGANIC") {
    switch (slot) {
      case 1:
        title = `${chTag} অ্যালকেনের সাধারণ সংকেত $\\text{C}_n\\text{H}_{2n+2}$ হলে $n = ${p4}$ বিশিষ্ট যৌগে হাইড্রোজেন পরমাণু কয়টি?`;
        rawCorrect = `$${2 * p4 + 2}$ টি`;
        rawDistractors = [`$${2 * p4}$ টি`, `$${2 * p4 - 2}$ টি`, `$${p4}$ টি`];
        explanation = `$n = ${p4}$ হলে হাইড্রোজেনের সংখ্যা $= 2(${p4}) + 2 = ${2 * p4 + 2}$।`;
        break;
      case 2:
        title = `${chTag} ইথেন ($\\text{C}_2\\text{H}_6$)-এর মোলার ভর কত? (C=12, H=1)`;
        rawCorrect = `$30\\text{ g/mol}$`;
        rawDistractors = [`$28\\text{ g/mol}$`, `$32\\text{ g/mol}$`, `$26\\text{ g/mol}$`];
        explanation = `$M = 2(12) + 6(1) = 24 + 6 = 30\\text{ g/mol}$।`;
        break;
      default:
        const orgK = slot - 2;
        title = `${chTag} [সমস্যা ${slot}]: $n = ${orgK + 1}$ বিশিষ্ট অ্যালকিনের ($\\text{C}_n\\text{H}_{2n}$) মোলার ভর কত?`;
        const mAlkene = (orgK + 1) * 12 + 2 * (orgK + 1);
        rawCorrect = `$${mAlkene}\\text{ g/mol}$`;
        rawDistractors = [`$${mAlkene + 2}\\text{ g/mol}$`, `$${mAlkene - 2}\\text{ g/mol}$`, `$${(orgK + 1) * 14 + 2}\\text{ g/mol}$`];
        explanation = `মোলার ভর $= 12(${orgK + 1}) + 2(${orgK + 1}) = ${mAlkene}\\text{ g/mol}$।`;
        break;
    }
  } else {
    // Default Chemistry (States, Periodic, Reactions, Electrochemistry, Applied)
    switch (slot) {
      case 1:
        title = `${chTag} $\\text{CH}_4$ (মোলার ভর ১৬) ও $\\text{SO}_2$ (মোলার ভর ৬৪)-এর গ্রাহামের ব্যাপন হারের অনুপাত $r_1 : r_2$ কত?`;
        rawCorrect = `$2 : 1$`;
        rawDistractors = [`$1 : 2$`, `$4 : 1$`, `$1 : 4$`];
        explanation = `$\\frac{r_1}{r_2} = \\sqrt{\\frac{M_2}{M_1}} = \\sqrt{\\frac{64}{16}} = 2 \\implies 2 : 1$।`;
        break;
      case 2:
        title = `${chTag} কার্বন-১২ পরমাণুতে ($^{12}_6\\text{C}$) প্রোটন, নিউট্রন ও ইলেকট্রন সংখ্যা কত?`;
        rawCorrect = `$6, 6, 6$`;
        rawDistractors = [`$6, 12, 6$`, `$12, 6, 6$`, `$6, 8, 6$`];
        explanation = `প্রোটন $= 6$, ইলেকট্রন $= 6$, নিউট্রন $= 12 - 6 = 6$।`;
        break;
      case 3:
        title = `${chTag} বোর পরমাণু মডেল অনুসারে $n = ${p4}$ তম প্রধান শক্তিস্তরে সর্বোচ্চ ইলেকট্রন ধারণক্ষমতা ($2n^2$) কত?`;
        const eCap = 2 * p4 * p4;
        rawCorrect = `$${eCap}$ টি`;
        rawDistractors = [`$${p4 * p4}$ টি`, `$${2 * p4}$ টি`, `$${eCap + 4}$ টি`];
        explanation = `$2n^2 = 2(${p4})^2 = 2(${p4 * p4}) = ${eCap}$।`;
        break;
      default:
        const ck = slot - 3;
        title = `${chTag} [সমস্যা ${slot}]: $n = ${ck + 1}\\text{ mol}$ গ্যাসের STP-তে আয়তন কত লিটার?`;
        const vStp = ((ck + 1) * 22.4).toFixed(1);
        rawCorrect = `$${vStp}\\text{ L}$`;
        rawDistractors = [`$22.4\\text{ L}$`, `$${((ck + 1) * 11.2).toFixed(1)}\\text{ L}$`, `$${(ck + 1) * 22}\\text{ L}$`];
        explanation = `$V = n \\times 22.4 = ${ck + 1} \\times 22.4 = ${vStp}\\text{ L}$।`;
        break;
    }
  }

  return { title, rawCorrect, rawDistractors, explanation, imageUrl };
}
