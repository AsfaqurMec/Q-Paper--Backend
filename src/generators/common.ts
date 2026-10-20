export function toBn(n: number | string): string {
  const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(n).replace(/\d/g, (d) => bn[Number(d)]);
}

export interface ChapterMeta {
  num: number;
  name: string;
  terms: [string, string, string, string, string, string, string, string];
  units: [string, string, string, string];
  formulas: [string, string, string, string];
  laws: [string, string, string, string];
  qualities: [string, string, string, string];
  cqStems: Array<{
    stem: string;
    qA: string;
    aA: string;
    qB: string;
    aB: string;
    qC: string;
    aC: string;
    qD: string;
    aD: string;
  }>;
}

export interface QuestionBankItemPayload {
  id: string;
  ownerId: string;
  className: string;
  subject: string;
  chapter: string;
  category: string;
  type: "mcq" | "cq";
  nature: "theory" | "mathematical";
  difficulty: "easy" | "medium" | "hard";
  title: string;
  marks: number;
  options: string[];
  correctIndex: number;
  subQuestions?: Array<{
    label: string;
    text: string;
    marks: number;
    answer?: string;
  }>;
  explanation: string;
  tags: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Ensures 4 distinct options and cleans whitespace without truncating text.
 */
export function cleanOptions(options: string[]): [string, string, string, string] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const opt of options) {
    const trimmed = opt.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
    if (result.length === 4) break;
  }

  const fallbacks = ["ক ও খ উভয়ই", "কোনটিই নয়", "সবগুলো সঠিক", "তথ্য অপর্যাপ্ত"];
  let fbIndex = 0;
  while (result.length < 4) {
    const fb = fallbacks[fbIndex++] || `বিকল্প ${result.length + 1}`;
    if (!seen.has(fb)) {
      seen.add(fb);
      result.push(fb);
    }
  }

  return [result[0], result[1], result[2], result[3]];
}

/**
 * Shuffles correct answer among 3 distractors so correctIndex is randomly distributed (0 to 3),
 * ensuring all 4 options are completely distinct.
 */
export function shuffleOptions(
  correctText: string,
  distractors: [string, string, string],
  preferredIndex?: number
): { options: [string, string, string, string]; correctIndex: number } {
  const cleanCorrect = correctText.trim();
  const validDistractors: string[] = [];
  const seen = new Set<string>([cleanCorrect.toLowerCase()]);

  for (const d of distractors) {
    const trimmed = d.trim();
    if (trimmed && !seen.has(trimmed.toLowerCase())) {
      seen.add(trimmed.toLowerCase());
      validDistractors.push(trimmed);
    }
  }

  const fallbacks = [
    "কোনটিই নয়",
    "অপরিবর্তিত থাকে",
    "উভয় দিকে সমান",
    "অসীম মান",
    "শূন্য",
    "মান নির্দিষ্ট নয়"
  ];
  let fbIdx = 0;
  while (validDistractors.length < 3) {
    const fb = fallbacks[fbIdx++];
    if (!seen.has(fb.toLowerCase())) {
      seen.add(fb.toLowerCase());
      validDistractors.push(fb);
    }
  }

  const targetIndex =
    preferredIndex !== undefined && preferredIndex >= 0 && preferredIndex <= 3
      ? preferredIndex
      : Math.floor(Math.random() * 4);

  const finalOptions: string[] = [];
  let distIdx = 0;
  for (let i = 0; i < 4; i++) {
    if (i === targetIndex) {
      finalOptions.push(cleanCorrect);
    } else {
      finalOptions.push(validDistractors[distIdx++]);
    }
  }

  return {
    options: [finalOptions[0], finalOptions[1], finalOptions[2], finalOptions[3]],
    correctIndex: targetIndex
  };
}

/**
 * Formats a Bengali composite (বহুপদী সমাপ্তিসূচক) question with statements i, ii, iii
 */
export function buildCompositeQuestion(
  preamble: string,
  stmt1: string,
  stmt2: string,
  stmt3: string,
  correctCombination: "i ও ii" | "ii ও iii" | "i ও iii" | "i, ii ও iii"
): { title: string; options: [string, string, string, string]; correctIndex: number } {
  const title = `${preamble}\ni. ${stmt1}\nii. ${stmt2}\niii. ${stmt3}\nনিচের কোনটি সঠিক?`;

  const combinations: Array<"i ও ii" | "ii ও iii" | "i ও iii" | "i, ii ও iii"> = [
    "i ও ii",
    "ii ও iii",
    "i ও iii",
    "i, ii ও iii"
  ];

  const distractors = combinations.filter((c) => c !== correctCombination) as [
    string,
    string,
    string
  ];

  const shuffled = shuffleOptions(correctCombination, distractors);

  return {
    title,
    options: shuffled.options,
    correctIndex: shuffled.correctIndex
  };
}
