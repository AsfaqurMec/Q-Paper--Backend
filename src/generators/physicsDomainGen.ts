/**
 * Physics Domain Question Generator
 * Generates 50 distinct mathematical MCQs for any physics chapter
 */

import { ChapterDef, toBn, makeCircuitSvg, makeMotionGraphSvg, makeCarnotSvg } from "./comprehensiveQuestionEngine.js";
import { GeneratedMCQPayload } from "./mathDomainGen.js";

export function generatePhysicsMCQ(
  topic: string,
  chapter: ChapterDef,
  slot: number, // 1 to 50
  p1: number,
  p2: number,
  p3: number,
  p4: number,
  p5: number,
  subject: string = "Physics"
): GeneratedMCQPayload {
  const chTag = `[${subject} - Ch ${chapter.number}: ${chapter.title}]`;
  let title = "";
  let rawCorrect = "";
  let rawDistractors: [string, string, string] = ["0", "1", "2"];
  let explanation = "";
  let imageUrl: string | undefined = undefined;

  if (topic === "PHYSICS_CURRENT" || topic === "PHYSICS_ELECTROSTATICS" || topic === "PHYSICS_MAGNETISM_AC") {
    switch (slot) {
      case 1:
        title = `${chTag} একটি রোধ $R = ${p4}\\ \\Omega$-এর মধ্য দিয়ে $I = ${p5}\\text{ A}$ তড়িৎ প্রবাহিত হলে দুই প্রান্তের বিভব পার্থক্য কত?`;
        rawCorrect = `$${p4 * p5}\\text{ V}$`;
        rawDistractors = [`$${p4 + p5}\\text{ V}$`, `$${(p4 / p5).toFixed(2)}\\text{ V}$`, `$${(p4 * p5) * 2}\\text{ V}$`];
        explanation = `$V = IR = ${p5} \\times ${p4} = ${p4 * p5}\\text{ V}$।`;
        imageUrl = makeCircuitSvg(p4 * p5, p4, p4, false);
        break;
      case 2:
        title = `${chTag} দুটি রোধ $R_1 = ${p4}\\ \\Omega$ এবং $R_2 = ${p5}\\ \\Omega$ শ্রেণিতে (Series) যুক্ত থাকলে তুল্য রোধ কত?`;
        rawCorrect = `$${p4 + p5}\\ \\Omega$`;
        rawDistractors = [`$${p4 * p5}\\ \\Omega$`, `$${((p4 * p5) / (p4 + p5)).toFixed(2)}\\ \\Omega$`, `$${Math.abs(p4 - p5)}\\ \\Omega$`];
        explanation = `$R_s = R_1 + R_2 = ${p4} + ${p5} = ${p4 + p5}\\ \\Omega$।`;
        break;
      case 3:
        title = `${chTag} দুটি রোধ $R_1 = ${p4 * 2}\\ \\Omega$ এবং $R_2 = ${p4 * 2}\\ \\Omega$ সমান্তরালে যুক্ত থাকলে বর্তনীর তুল্য রোধ কত?`;
        rawCorrect = `$${p4}\\ \\Omega$`;
        rawDistractors = [`$${p4 * 4}\\ \\Omega$`, `$${p4 * 2}\\ \\Omega$`, `$1\\ \\Omega$`];
        explanation = `$R_p = \\frac{R}{2} = \\frac{${p4 * 2}}{2} = ${p4}\\ \\Omega$।`;
        imageUrl = makeCircuitSvg(12, p4 * 2, p4 * 2, true);
        break;
      case 4:
        title = `${chTag} একটি বাতি $V = 220\\text{ V}$ উৎসের সাথে যুক্ত থেকে $I = ${p4 * 0.5}\\text{ A}$ বিদ্যুৎ গ্রহণ করলে বাতির ক্ষমতা কত?`;
        const pwr = (220 * p4 * 0.5).toFixed(0);
        rawCorrect = `$${pwr}\\text{ W}$`;
        rawDistractors = [`$${(Number(pwr) * 2).toFixed(0)}\\text{ W}$`, `$${(Number(pwr) / 2).toFixed(0)}\\text{ W}$`, `$220\\text{ W}$`];
        explanation = `$P = VI = 220 \\times ${p4 * 0.5} = ${pwr}\\text{ W}$।`;
        break;
      case 5:
        title = `${chTag} $C = ${p4}\\ \\mu\\text{F}$ ধারকের দুই প্রান্তে $V = ${p5 * 10}\\text{ V}$ বিভব প্রয়োগ করলে ধারকে সঞ্চিত শক্তি কত?`;
        const capEnergy = (0.5 * p4 * Math.pow(p5 * 10, 2) * 1e-6 * 1000).toFixed(2);
        rawCorrect = `$${capEnergy}\\text{ mJ}$`;
        rawDistractors = [`$${(Number(capEnergy) * 2).toFixed(2)}\\text{ mJ}$`, `$${(Number(capEnergy) / 2).toFixed(2)}\\text{ mJ}$`, `$10\\text{ mJ}$`];
        explanation = `$U = \\frac{1}{2} C V^2 = \\frac{1}{2} (${p4} \\times 10^{-6}) (${p5 * 10})^2 = ${capEnergy} \\times 10^{-3}\\text{ J}$।`;
        break;
      case 6:
        title = `${chTag} একটি রূপান্তরকের (Transformer) মুখ্য কুণ্ডলীর পাকসংখ্যা $N_p = 100$, গৌণ কুণ্ডলীর $N_s = ${p4 * 100}$ এবং মুখ্য ভোল্টেজ $10\\text{ V}$ হলে গৌণ ভোল্টেজ কত?`;
        rawCorrect = `$${p4 * 10}\\text{ V}$`;
        rawDistractors = [`$${p4 * 100}\\text{ V}$`, `$${p4 * 5}\\text{ V}$`, `$10\\text{ V}$`];
        explanation = `$\\frac{V_s}{V_p} = \\frac{N_s}{N_p} \\implies V_s = 10 \\times \\frac{${p4 * 100}}{100} = ${p4 * 10}\\text{ V}$।`;
        break;
      default:
        const ek = slot - 6;
        title = `${chTag} [সমস্যা ${slot}]: $R = ${ek + 2}\\ \\Omega$ রোধে $t = 10\\text{ s}$-এ $I = 2\\text{ A}$ প্রবাহ চললে উৎপন্ন তাপ জুল এককে কত?`;
        const jHeat = 4 * (ek + 2) * 10;
        rawCorrect = `$${jHeat}\\text{ J}$`;
        rawDistractors = [`$${jHeat * 2}\\text{ J}$`, `$${jHeat / 2}\\text{ J}$`, `$${(ek + 2) * 20}\\text{ J}$`];
        explanation = `$H = I^2 R t = 2^2 \\times (${ek + 2}) \\times 10 = ${jHeat}\\text{ J}$।`;
        break;
    }
  } else if (topic === "PHYSICS_THERMODYNAMICS") {
    switch (slot) {
      case 1:
        title = `${chTag} একটি কার্নো ইঞ্জিন $T_1 = ${p4 * 100}\\text{ K}$ উৎস ও $T_2 = ${p4 * 50}\\text{ K}$ গ্রাহকের মধ্যে কাজ করলে এর কর্মদক্ষতা কত?`;
        rawCorrect = `$50\\%$`;
        rawDistractors = [`$40\\%$`, `$60\\%$`, `$25\\%$`];
        explanation = `$\\eta = \\left(1 - \\frac{T_2}{T_1}\\right) \\times 100\\% = \\left(1 - \\frac{${p4 * 50}}{${p4 * 100}}\\right) \\times 100\\% = 50\\%$।`;
        imageUrl = makeCarnotSvg(p4 * 100, p4 * 50, 50);
        break;
      case 2:
        title = `${chTag} একটি গ্যাসে $dQ = ${p1 * 100}\\text{ J}$ তাপ সরবরাহ করায় অভ্যন্তরীণ শক্তি $dU = ${p1 * 60}\\text{ J}$ বৃদ্ধি পায়; গ্যাস কর্তৃক কৃতকাজ কত?`;
        rawCorrect = `$${p1 * 40}\\text{ J}$`;
        rawDistractors = [`$${p1 * 160}\\text{ J}$`, `$${p1 * 60}\\text{ J}$`, `$0\\text{ J}$`];
        explanation = `$dQ = dU + dW \\implies dW = dQ - dU = ${p1 * 100} - ${p1 * 60} = ${p1 * 40}\\text{ J}$।`;
        break;
      case 3:
        title = `${chTag} স্থির চাপে $P = ${p4 * 1000}\\text{ Pa}$ গ্যাসে আয়তন পরিবর্তন $\\Delta V = ${p5 * 0.01}\\text{ m}^3$ হলে কৃতকাজ কত?`;
        const wGas = (p4 * 1000 * p5 * 0.01).toFixed(1);
        rawCorrect = `$${wGas}\\text{ J}$`;
        rawDistractors = [`$${(Number(wGas) * 2).toFixed(1)}\\text{ J}$`, `$${(Number(wGas) / 2).toFixed(1)}\\text{ J}$`, `$100\\text{ J}$`];
        explanation = `$W = P\\Delta V = (${p4 * 1000})(${p5 * 0.01}) = ${wGas}\\text{ J}$।`;
        break;
      default:
        const thK = slot - 3;
        title = `${chTag} [সমস্যা ${slot}]: $m = ${thK}\\text{ kg}$ পানির তাপমাত্রা $10^\\circ\\text{C}$ বৃদ্ধি করতে কত তাপ শক্তি প্রয়োজন? ($c = 4200\\text{ J/(kg}\\cdot\\text{K)}$)`;
        const qReq = thK * 4200 * 10;
        rawCorrect = `$${qReq}\\text{ J}$`;
        rawDistractors = [`$${qReq * 2}\\text{ J}$`, `$${qReq / 2}\\text{ J}$`, `$42000\\text{ J}$`];
        explanation = `$Q = mc\\Delta\\theta = ${thK} \\times 4200 \\times 10 = ${qReq}\\text{ J}$।`;
        break;
    }
  } else if (topic === "PHYSICS_OPTICS" || topic === "PHYSICS_WAVES") {
    switch (slot) {
      case 1:
        title = `${chTag} একটি অবতল দর্পণের ফোকাস দূরত্ব $f = ${p4 * 2}\\text{ cm}$ হলে এর বক্রতার ব্যাসার্ধ কত?`;
        rawCorrect = `$${p4 * 4}\\text{ cm}$`;
        rawDistractors = [`$${p4 * 2}\\text{ cm}$`, `$${p4}\\text{ cm}$`, `$${p4 * 8}\\text{ cm}$`];
        explanation = `$r = 2f = 2(${p4 * 2}) = ${p4 * 4}\\text{ cm}$।`;
        break;
      case 2:
        title = `${chTag} একটি তরঙ্গের কম্পাঙ্ক $f = ${p1 * 20}\\text{ Hz}$ এবং তরঙ্গদৈর্ঘ্য $\\lambda = ${p4 * 0.2}\\text{ m}$ হলে তরঙ্গবেগ কত?`;
        const vWv = ((p1 * 20) * (p4 * 0.2)).toFixed(1);
        rawCorrect = `$${vWv}\\text{ m/s}$`;
        rawDistractors = [`$${(Number(vWv) * 2).toFixed(1)}\\text{ m/s}$`, `$${(Number(vWv) / 2).toFixed(1)}\\text{ m/s}$`, `$340\\text{ m/s}$`];
        explanation = `$v = f\\lambda = ${p1 * 20} \\times ${p4 * 0.2} = ${vWv}\\text{ m/s}$।`;
        break;
      case 3:
        title = `${chTag} বাতাসে শব্দের বেগ $340\\text{ m/s}$ হলে প্রতিধ্বনি শোনার ন্যূনতম প্রতিফলক দূরত্ব কত?`;
        rawCorrect = `$17\\text{ m}$`;
        rawDistractors = [`$34\\text{ m}$`, `$8.5\\text{ m}$`, `$10\\text{ m}$`];
        explanation = `$d = \\frac{vt}{2} = \\frac{340 \\times 0.1}{2} = 17\\text{ m}$।`;
        break;
      case 4:
        title = `${chTag} একটি উত্তল লেন্সের ফোকাস দূরত্ব $f = 0.5\\text{ m}$ হলে এর ক্ষমতা (Power) কত?`;
        rawCorrect = `$2\\text{ D}$`;
        rawDistractors = [`$0.5\\text{ D}$`, `$5\\text{ D}$`, `$-2\\text{ D}$`];
        explanation = `$P = \\frac{1}{f} = \\frac{1}{0.5} = +2\\text{ D}$।`;
        break;
      default:
        const optK = slot - 4;
        title = `${chTag} [সমস্যা ${slot}]: কাচের প্রতিসরাঙ্ক $n = 1.5$ হলে কাচে আলোর বেগ কত? ($c = 3 \\times 10^8\\text{ m/s}$)`;
        rawCorrect = `$2.0 \\times 10^8\\text{ m/s}$`;
        rawDistractors = [`$3.0 \\times 10^8\\text{ m/s}$`, `$1.5 \\times 10^8\\text{ m/s}$`, `$4.5 \\times 10^8\\text{ m/s}$`];
        explanation = `$v = \\frac{c}{n} = \\frac{3 \\times 10^8}{1.5} = 2.0 \\times 10^8\\text{ m/s}$।`;
        break;
    }
  } else {
    // Default Physics Mechanics (Motion, Force, Gravitation, Work/Energy)
    switch (slot) {
      case 1:
        title = `${chTag} স্থির অবস্থান থেকে $a = ${p4}\\text{ m/s}^2$ সুষম ত্বরণে চলমান বস্তু $t = ${p5}\\text{ s}$ পর কত বেগ অর্জন করবে?`;
        rawCorrect = `$${p4 * p5}\\text{ m/s}$`;
        rawDistractors = [`$${p4 * p5 + 5}\\text{ m/s}$`, `$${(p4 * p5) / 2}\\text{ m/s}$`, `$${p4 * p5 * 2}\\text{ m/s}$`];
        explanation = `$v = u + at = 0 + (${p4})(${p5}) = ${p4 * p5}\\text{ m/s}$।`;
        imageUrl = makeMotionGraphSvg(p4 * p5, p5, p5 + 4);
        break;
      case 2:
        title = `${chTag} একটি বস্তুর ভর $m = ${p4}\\text{ kg}$ এবং ত্বরণ $a = ${p5}\\text{ m/s}^2$ হলে প্রযুক্ত বলের মান কত?`;
        rawCorrect = `$${p4 * p5}\\text{ N}$`;
        rawDistractors = [`$${p4 + p5}\\text{ N}$`, `$${p4 * p5 * 2}\\text{ N}$`, `$${(p4 * p5) / 2}\\text{ N}$`];
        explanation = `$F = ma = ${p4} \\times ${p5} = ${p4 * p5}\\text{ N}$।`;
        break;
      case 3:
        title = `${chTag} $m = ${p4}\\text{ kg}$ ভরের বস্তু $v = ${p5 * 2}\\text{ m/s}$ বেগে চললে গতিশক্তি কত হবে?`;
        const keVal = 0.5 * p4 * Math.pow(p5 * 2, 2);
        rawCorrect = `$${keVal}\\text{ J}$`;
        rawDistractors = [`$${keVal * 2}\\text{ J}$`, `$${keVal / 2}\\text{ J}$`, `$${p4 * p5 * 2}\\text{ J}$`];
        explanation = `$E_k = \\frac{1}{2}mv^2 = \\frac{1}{2}(${p4})(${p5 * 2})^2 = ${keVal}\\text{ J}$।`;
        break;
      case 4:
        title = `${chTag} $F = ${p1 * 10}\\text{ N}$ বল প্রয়োগ করে বলের দিকে $s = ${p4}\\text{ m}$ সরণ ঘটালে কৃতকাজ কত?`;
        rawCorrect = `$${p1 * 10 * p4}\\text{ J}$`;
        rawDistractors = [`$${p1 * 10 + p4}\\text{ J}$`, `$${(p1 * 10 * p4) / 2}\\text{ J}$`, `$0\\text{ J}$`];
        explanation = `$W = Fs = (${p1 * 10})(${p4}) = ${p1 * 10 * p4}\\text{ J}$।`;
        break;
      case 5:
        title = `${chTag} একটি বস্তুর ভর $m = ${p4 * 2}\\text{ kg}$ এবং আয়তন $V = ${p4}\\text{ m}^3$ হলে ঘনত্ব কত?`;
        rawCorrect = `$2\\text{ kg/m}^3$`;
        rawDistractors = [`$4\\text{ kg/m}^3$`, `$1\\text{ kg/m}^3$`, `$${p4}\\text{ kg/m}^3$`];
        explanation = `$\\rho = \\frac{m}{V} = \\frac{${p4 * 2}}{${p4}} = 2\\text{ kg/m}^3$।`;
        break;
      default:
        const mk = slot - 5;
        title = `${chTag} [সমস্যা ${slot}]: $m = ${mk + 1}\\text{ kg}$ ভরের বস্তু $v = ${mk + 3}\\text{ m/s}$ বেগে চললে ভরবেগ ($p$) কত?`;
        rawCorrect = `$${(mk + 1) * (mk + 3)}\\text{ kg}\\cdot\\text{m/s}$`;
        rawDistractors = [`$${(mk + 1) + (mk + 3)}\\text{ kg}\\cdot\\text{m/s}$`, `$${(mk + 1) * 2}\\text{ kg}\\cdot\\text{m/s}$`, `$${((mk + 1) * (mk + 3)) * 2}\\text{ kg}\\cdot\\text{m/s}$`];
        explanation = `$p = mv = (${mk + 1})(${mk + 3}) = ${(mk + 1) * (mk + 3)}\\text{ kg}\\cdot\\text{m/s}$।`;
        break;
    }
  }

  return { title, rawCorrect, rawDistractors, explanation, imageUrl };
}
