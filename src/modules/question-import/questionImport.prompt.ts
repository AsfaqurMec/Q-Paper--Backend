const stemAndLanguageRules = [
  "CRITICAL: Never translate between languages. Preserve Bengali (বাংলা) and English exactly as presented in the source.",
  "BENGALI LANGUAGE RULES:",
  "- Fully preserve Bengali script, complex ligatures (যুক্তবর্ণ যেমন ক্ষ, জ্ঞ, ত্ত, ত্র, ঙ্গ, ঞ্চ, ঞ্জ, ণ্ট, ণ্ড, ন্ত, ন্দ, ন্ধ, ম্প, ষ্ট, ষ্ঠ, স্ন, স্প, হ্ন, হ্ম ইত্যাদি), nukta, hasant, darhi (।), and punctuation.",
  "- Preserve Bengali numbers (০, ১, ২, ৩, ৪, ৫, ৬, ৭, ৮, ৯) and numbering styles (১., ২., ৩. etc.).",
  "- For Bengali MCQ options labeled with ক, খ, গ, ঘ, or (ক), (খ), (গ), (ঘ): strip ONLY the leading marker label ('ক.', '(ক)', etc.) from the option text, and map the correct answer: ক -> 0, খ -> 1, গ -> 2, ঘ -> 3.",
  "- If the question is a Bengali Creative Question (সৃজনশীল প্রশ্ন / CQ) having a stem/passage (উদ্দীপক / দৃশ্যকল্প) and sub-parts (ক, খ, গ, ঘ):",
  "  * Set type = 'cq'.",
  "  * Put the entire stem/passage in 'title'.",
  "  * In 'subQuestions', extract each sub-part with its label ('ক', 'খ', 'গ', 'ঘ'), text, marks (typically 1, 2, 3, 4 or 2, 4, 4), and answer/explanation if provided.",
  "  * Keep options = [].",
  "",
  "DOCUMENT LAYOUT & SECTION CLASSIFICATION:",
  "- Multi-Column Layout: When pages have 2 or more columns side by side, read questions in strict sequential question numbering order (১, ২, ৩, ৪... or 1, 2, 3, 4...) or column 1 top-to-bottom, then column 2 top-to-bottom. NEVER interleave text from adjacent columns.",
  "- Section Headers:",
  "  * 'বহুনির্বাচনি প্রশ্ন' (Multiple Choice Questions / MCQ): Set type = 'mcq', extract 4 options into 'options', default marks = 1.",
  "  * 'ছোট লিখিত প্রশ্ন' or 'সংক্ষিপ্ত প্রশ্ন' (Short / Written Questions): Set type = 'written', options = [], extract marks as stated (e.g. 5) or 1.",
  "  * 'সৃজনশীল প্রশ্ন' (Creative Questions / CQ): Set type = 'cq', title = stem/context, subQuestions = [{ label: 'ক', text: '...', marks: 2 }, ...], options = [].",
  "- Multi-Statement / Roman Numeral Stems (e.g. 'তথ্যগুলো লক্ষ কর: i. ... ii. ... iii. ... নিচের কোনটি সঠিক?'):",
  "  * Put the entire stem including statements i, ii, iii and question 'নিচের কোনটি সঠিক?' inside 'title'.",
  "  * Put the options (e.g. 'i ও ii', 'ii ও iii', 'i, ii ও iii') into 'options'.",
  "",
  "MATHEMATICS & PHYSICS RULES:",
  "- Standardize all mathematical and physics expressions into clean, standard LaTeX enclosed in `$ ... $` (e.g. `$x^2 + y^2 = r^2$`, `$\\frac{a}{b}$`, `$\\sqrt{b^2 - 4ac}$`, `$\\lim_{x \\to 0}$`, `$\\int_0^1 f(x)dx$`, `$\\sum_{i=1}^n$`, `$\\theta$`, `$\\lambda$`, `$\\Omega$`, `$\\vec{F}$`, `$\\pm$`, `$\\le$`, `$\\ge$`).",
  "- VERTICAL FRACTIONS & MIXED FRACTIONS:",
  "  * Any fraction stacked vertically (numerator over denominator) MUST be converted to LaTeX `$\\frac{numerator}{denominator}$`, e.g. `$\\frac{2}{3}$`, `$\\frac{7}{3}$`, `$\\frac{3}{5}$`.",
  "  * Mixed fractions (whole number followed by a vertical fraction) MUST be converted to LaTeX `$A\\frac{B}{C}$`, e.g. `$9\\frac{3}{5}$` or `$৯\\frac{৩}{৫}$`, `$18\\frac{1}{2}$` or `$১৮\\frac{১}{২}$`, `$৫৭\\frac{১}{৪}$`.",
  "  * Preserve all arithmetic operators: `\\times`, `\\div`, `+`, `-`, `=`, e.g. `$\\frac{2}{3} \\times \\frac{7}{3} = $ কত?` and `$\\frac{3}{5} \\div \\frac{2}{3}$`.",
  "- Clean Unicode math symbols (², ³, ½, √, π, θ, Δ, ±, ≤, ≥, ≠, →, ∞) are also acceptable if already in source.",
  "- Never omit fractions, powers/exponents, roots, subscripts, or negative signs.",
  "- For Physics, preserve all units ($m/s^2$, $kg\\cdot m/s$, $\\Omega$, $N$, $J$, $W$, $Pa$, $\\mu C$, $Hz$), vector arrows ($\\vec{v}$), and Greek symbols ($\\alpha, \\beta, \\gamma, \\theta, \\lambda, \\mu, \\pi, \\rho, \\sigma, \\tau, \\omega, \\Omega$).",
  "",
  "CHEMISTRY RULES:",
  "- Preserve chemical formulas with exact subscripts and superscripts (e.g. `$H_2SO_4$`, `$CaCO_3$`, `$KMnO_4$`, `$C_6H_{12}O_6$`, `$Fe^{3+}$`, `$SO_4^{2-}$`, `$OH^-$`).",
  "- Preserve reaction equations, arrows (`\\rightarrow`, `\\rightleftharpoons`), catalysts, temperatures, and physical states: `(s)`, `(l)`, `(g)`, `(aq)`.",
  "- Never confuse letter 'O' with number '0' in chemical formulas (e.g. H2O, not H20; CO2, not C02).",
  "",
  "ANSWER & EXPLANATION RULES:",
  "- Only set 'correct' (0-indexed integer) if the answer is explicitly given in the source (e.g., 'উত্তর: খ', 'Ans: B', 'Correct: C', marked checkmark).",
  "- NEVER GUESS correct answers. If not provided in the document, set correct = null.",
  "- Extract explanation / সমাধান / ব্যাখ্যা if present into 'explanation'."
];

export function buildDocumentQuestionExtractionPrompt(optionalExtraInstructions?: string) {
  return [
    "You are an expert, production-grade examination paper parser specialized in Bengali, English, and STEM (Mathematics, Physics, Chemistry, Biology) curricula.",
    "Your task is to extract ALL examination questions from the provided document into a clean, structured JSON array matching the schema.",
    "",
    "Rules:",
    ...stemAndLanguageRules,
    "Extraction Quality:",
    "- Extract EVERY question in the document without missing any.",
    "- For MCQ questions: extract title, options (array of strings with options A, B, C, D or ক, খ, গ, ঘ stripped of markers), marks, correct (0-based index or null), explanation.",
    "- For CQ (Creative Questions): extract stem as title, and populate subQuestions with parts ক, খ, গ, ঘ (or a, b, c, d) and their marks.",
    "- For Written / Short Questions: set type = 'written', options = [].",
    "- Output ONLY valid JSON matching the schema.",
    optionalExtraInstructions ? `Additional context:\n${optionalExtraInstructions}` : ""
  ].filter(Boolean).join("\n");
}

export function buildQuestionDetectionPrompt(text: string) {
  return [
    "You are Pass 1 of an examination paper parser specialized in Bengali and STEM.",
    "Separate every question from this document chunk. Do not miss any questions.",
    "Return ONLY valid JSON matching the schema.",
    "",
    "Rules:",
    ...stemAndLanguageRules,
    "Document chunk:",
    text
  ].join("\n");
}

export function buildQuestionParsingPrompt(rawQuestion: string) {
  return [
    "You are Pass 2 of an examination paper parser.",
    "Parse exactly ONE question into the final schema with high precision for Bengali, Math, Chemistry, and Physics.",
    "Return ONLY valid JSON matching the schema.",
    "",
    "Rules:",
    ...stemAndLanguageRules,
    "Raw question:",
    rawQuestion
  ].join("\n");
}

export function buildVerificationPrompt(originalText: string, parsedJson: string) {
  return [
    "You are the verification pass for an examination paper parser.",
    "Compare the original document chunk with the parsed JSON questions.",
    "Return ONLY questions that were missing, lost formulas, or incorrectly parsed.",
    "If everything was correctly extracted, return [].",
    "",
    "Rules:",
    ...stemAndLanguageRules,
    "Original document chunk:",
    originalText,
    "",
    "Parsed JSON:",
    parsedJson
  ].join("\n");
}

export function buildRepairPrompt(invalidJson: string, validationError: string) {
  return [
    "The previous output is invalid.",
    "Repair it and return ONLY valid JSON matching the schema.",
    "Preserve all Bengali script, mathematical formulas, and chemical equations.",
    "",
    "Validation error:",
    validationError,
    "",
    "Invalid JSON:",
    invalidJson
  ].join("\n");
}
