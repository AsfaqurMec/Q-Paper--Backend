const SUPERSCRIPTS: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "০": "⁰", "১": "¹", "২": "²", "৩": "³", "৪": "⁴", "৫": "⁵", "৬": "⁶", "৭": "⁷", "৮": "⁸", "৯": "⁹",
  "+": "⁺", "-": "⁻", "−": "⁻", "=": "⁼", "(": "⁽", ")": "⁾", "*": "˟", "°": "°", "′": "′", "'": "′",
  "a": "ᵃ", "b": "ᵇ", "c": "ᶜ", "d": "ᵈ", "e": "ᵉ", "f": "ᶠ", "g": "ᵍ", "h": "ʰ", "i": "ⁱ", "j": "ʲ",
  "k": "ᵏ", "l": "ˡ", "m": "ᵐ", "n": "ⁿ", "o": "ᵒ", "p": "ᵖ", "r": "ʳ", "s": "ˢ", "t": "ᵗ", "u": "ᵘ",
  "v": "ᵛ", "w": "ʷ", "x": "ˣ", "y": "ʸ", "z": "ᶻ",
  "A": "ᴬ", "B": "ᴮ", "C": "ᶜ", "D": "ᴰ", "E": "ᴱ", "F": "ᶠ", "G": "ᴳ", "H": "ᴴ", "I": "ᴵ", "J": "ᴶ",
  "K": "ᴷ", "L": "ᴸ", "M": "ᴹ", "N": "ᴺ", "O": "ᴼ", "P": "ᴾ", "R": "ᴿ", "T": "ᵀ", "U": "ᵁ", "V": "ᵛ",
  "W": "ᵂ", "X": "ˣ", "Y": "ʸ", "Z": "ᶻ"
};

const SUBSCRIPTS: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "০": "₀", "১": "₁", "২": "₂", "৩": "₃", "৪": "₄", "৫": "₅", "৬": "₆", "৭": "₇", "৮": "₈", "৯": "₉",
  "+": "₊", "-": "₋", "−": "₋", "=": "₌", "(": "₍", ")": "₎",
  "a": "ₐ", "e": "ₑ", "h": "ₕ", "i": "ᵢ", "j": "ⱼ", "k": "ₖ", "l": "ₗ", "m": "ₘ", "n": "ₙ", "o": "ₒ",
  "p": "ₚ", "r": "ᵣ", "s": "ₛ", "t": "ₜ", "u": "ᵤ", "v": "ᵥ", "x": "ₓ"
};

export const COMMANDS: Record<string, string> = {
  // Greek letters
  alpha: "α", beta: "β", gamma: "γ", Gamma: "Γ",
  delta: "δ", Delta: "Δ", epsilon: "ε", varepsilon: "ε",
  zeta: "ζ", eta: "η", theta: "θ", vartheta: "θ", Theta: "Θ",
  iota: "ι", kappa: "κ", lambda: "λ", Lambda: "Λ",
  mu: "μ", nu: "ν", xi: "ξ", Xi: "Ξ",
  pi: "π", Pi: "Π", rho: "ρ", varrho: "ρ", sigma: "σ", Sigma: "Σ",
  tau: "τ", upsilon: "υ", Upsilon: "Υ", phi: "φ", varphi: "φ", Phi: "Φ",
  chi: "χ", psi: "ψ", Psi: "Ψ", omega: "ω", Omega: "Ω",

  // Angles, Geometry & Circles
  angle: "∠", measuredangle: "∡", sphericalangle: "∢",
  triangle: "△", bigtriangleup: "△", bigtriangledown: "▽",
  square: "□", Box: "□", diamond: "◇", Diamond: "◇",
  odot: "⊙", bigcirc: "◯", circ: "°", degree: "°",
  parallel: "∥", nparallel: "∦", perp: "⊥",
  cong: "≅", sim: "∼", simeq: "≃", approx: "≈", asymp: "≍",
  equiv: "≡", arc: "⌒", wideparen: "⌒", overarc: "⌒",

  // Set Theory & Logic
  cup: "∪", cap: "∩", setminus: "∖",
  in: "∈", notin: "∉", ni: "∋", owns: "∋",
  subset: "⊂", supset: "⊃", subseteq: "⊆", supseteq: "⊇",
  nsubset: "⊄", nsubseteq: "⊈", nsupseteq: "⊉",
  emptyset: "∅", empty: "∅", varnothing: "∅",
  complement: "∁", mid: "|", nmid: "∤",
  forall: "∀", exists: "∃", nexists: "∄",
  neg: "¬", lnot: "¬", lor: "∨", land: "∧",
  therefore: "∴", because: "∵",

  // Arithmetic & Relations
  times: "×", cdot: "·", div: "÷", pm: "±", mp: "∓",
  neq: "≠", ne: "≠", leq: "≤", le: "≤",
  geq: "≥", ge: "≥", infty: "∞", propto: "∝",
  nabla: "∇", partial: "∂",

  // Arrows
  rightarrow: "→", to: "→", leftarrow: "←", gets: "←",
  Rightarrow: "⇒", Leftarrow: "⇐", leftrightarrow: "↔", Leftrightarrow: "⇔",
  implies: "⇒", iff: "⇔",

  // Calculus
  int: "∫", iint: "∬", iiint: "∭", oint: "∮",
  sum: "∑", prod: "∏",

  // Trigonometry
  sin: "sin", cos: "cos", tan: "tan", cot: "cot",
  sec: "sec", csc: "csc", cosec: "cosec",
  arcsin: "arcsin", arccos: "arccos", arctan: "arctan",
  sinh: "sinh", cosh: "cosh", tanh: "tanh", coth: "coth",
  sech: "sech", csch: "csch",
  ln: "ln", log: "log",

  // Spacing
  quad: "   ", qquad: "      "
};

export function toSuperscript(str: string): string {
  if (!str) return "";
  const cleaned = str.replace(/[{}\s]/g, "");
  return cleaned.split("").map((c) => SUPERSCRIPTS[c] || c).join("");
}

export function toSubscript(str: string): string {
  if (!str) return "";
  const cleaned = str.replace(/[{}\s]/g, "");
  return cleaned.split("").map((c) => SUBSCRIPTS[c] || c).join("");
}

function cleanMatrixCell(cell: string): string {
  let c = cell.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1/$2");
  c = c.replace(/\\([a-zA-Z]+)/g, (match, name) => COMMANDS[name] ?? match);
  // Format binary operators with spaces, but keep unary minus intact
  c = c.replace(/([0-9a-zA-Z\u0980-\u09EF\^²³ⁿ])\s*([=+\-−×÷])\s*([0-9a-zA-Z\u0980-\u09EF\^²³ⁿ])/g, "$1 $2 $3");
  // Unary minus at start or after open paren: -3, −2
  c = c.replace(/(?:^|\()\s*([+\-−])\s*([0-9a-zA-Z\u0980-\u09EF])/g, "$1$2");
  c = c.replace(/\s+/g, " ").trim();
  return c;
}

export function convertBracketMatricesToLatex(text?: string | null): string {
  if (!text) return "";

  // 1. Nested bracket determinants: |[[1, 2], [3, 4]]| or | [[1, 2], [3, 4]] |
  let res = text.replace(/\|\s*\[\s*(\[[^\[\]]+\](?:\s*,?\s*\[[^\[\]]+\])*)\s*\]\s*\|/g, (_, inner) => {
    const rawRows = inner.split(/\]\s*,?\s*\[/).map((r: string) => r.replace(/[\[\]]/g, "").trim());
    const latexRows = rawRows.map((r: string) => {
      const cells = r.includes(",")
        ? r.split(/\s*,\s*/).map((c: string) => c.trim()).filter(Boolean)
        : r.split(/\s+/).map((c: string) => c.trim()).filter(Boolean);
      return cells.join(" & ");
    });
    return `\\begin{vmatrix} ${latexRows.join(" \\\\ ")} \\end{vmatrix}`;
  });

  // 2. Nested bracket matrices: [[1, 2, -3], [-2, 1, 0]] or [[x², 2x], [5, 3]]
  res = res.replace(/\[\s*(\[[^\[\]]+\](?:\s*,?\s*\[[^\[\]]+\])*)\s*\]/g, (_, inner) => {
    const rawRows = inner.split(/\]\s*,?\s*\[/).map((r: string) => r.replace(/[\[\]]/g, "").trim());
    const latexRows = rawRows.map((r: string) => {
      const cells = r.includes(",")
        ? r.split(/\s*,\s*/).map((c: string) => c.trim()).filter(Boolean)
        : r.split(/\s+/).map((c: string) => c.trim()).filter(Boolean);
      return cells.join(" & ");
    });
    return `\\begin{bmatrix} ${latexRows.join(" \\\\ ")} \\end{bmatrix}`;
  });

  // 3. Semicolon determinants: |[1, 2; 3, 4]| or |1, 2; 3, 4|
  res = res.replace(/\|\s*(?:\[\s*)?([a-zA-Z0-9\u0980-\u09EF+\-−.,\s\^²³ⁿ]+;[a-zA-Z0-9\u0980-\u09EF+\-−.,\s\^²³ⁿ;]+)(?:\s*\])?\s*\|/g, (match, inner) => {
    const rawRows = inner.split(/\s*;\s*/).map((r: string) => r.trim()).filter(Boolean);
    if (rawRows.length < 2) return match;
    const latexRows = rawRows.map((r: string) => {
      const cells = r.includes(",")
        ? r.split(/\s*,\s*/).map((c: string) => c.trim()).filter(Boolean)
        : r.split(/\s+/).map((c: string) => c.trim()).filter(Boolean);
      return cells.join(" & ");
    });
    return `\\begin{vmatrix} ${latexRows.join(" \\\\ ")} \\end{vmatrix}`;
  });

  // 4. Semicolon bracket matrices: [1, 2; 3, 4] or [k  2 ; 2  k]
  res = res.replace(/\[\s*([a-zA-Z0-9\u0980-\u09EF+\-−.,\s\^²³ⁿ]+;[a-zA-Z0-9\u0980-\u09EF+\-−.,\s\^²³ⁿ;]+)\s*\]/g, (match, inner) => {
    const rawRows = inner.split(/\s*;\s*/).map((r: string) => r.trim()).filter(Boolean);
    if (rawRows.length < 2) return match;
    const latexRows = rawRows.map((r: string) => {
      const cells = r.includes(",")
        ? r.split(/\s*,\s*/).map((c: string) => c.trim()).filter(Boolean)
        : r.split(/\s+/).map((c: string) => c.trim()).filter(Boolean);
      return cells.join(" & ");
    });
    return `\\begin{bmatrix} ${latexRows.join(" \\\\ ")} \\end{bmatrix}`;
  });

  return res;
}

export function cleanMatrixEnvironments(expr: string): string {
  if (!expr) return "";
  let s = convertBracketMatricesToLatex(expr);
  s = s.replace(/(?<!\\)begin\{(vmatrix|Vmatrix|bmatrix|pmatrix|matrix|cases|aligned)\}/g, "\\begin{$1}");
  s = s.replace(/(?<!\\)end\{(vmatrix|Vmatrix|bmatrix|pmatrix|matrix|cases|aligned)\}/g, "\\end{$1}");

  return s.replace(
    /\\begin\{(vmatrix|Vmatrix|bmatrix|pmatrix|matrix|cases|aligned)\}([\s\S]*?)\\end\{\1\}/g,
    (_, env, body) => {
      const rawRows = body
        .split(/\\\\|\\cr/)
        .map((r: string) => r.trim())
        .filter((r: string) => r.length > 0);

      const formattedRows = rawRows.map((row: string) => {
        const cells = row
          .split("&")
          .map((c: string) => cleanMatrixCell(c.trim()))
          .filter((c: string) => c.length > 0);
        return cells.join(" & ");
      });

      if (env === "aligned") {
        return formattedRows.join(", ");
      }

      if (env === "cases") {
        return "{ " + formattedRows.join(" ; ") + " }";
      }

      return `\\begin{${env}} ${formattedRows.join(" \\\\ ")} \\end{${env}}`;
    }
  );
}

export function normalizeLimits(text: string): string {
  if (!text) return "";
  return text.replace(
    /\\?lim(?:it)?\s*(?:_\{\s*([^}]+)\s*\}|_\s*([a-zA-Z0-9\u09E6-\u09EF\\]+)\s*(?:\\to|\\rightarrow|->|→)\s*([a-zA-Z0-9\u09E6-\u09EF+\-−∞\\]+)|\(\s*([a-zA-Z0-9\u09E6-\u09EF\\]+)\s*(?:\\to|\\rightarrow|->|→)\s*([a-zA-Z0-9\u09E6-\u09EF+\-−∞\\]+)\s*\))/gi,
    (match, b1, v1, t1, v2, t2) => {
      let cond = b1 || (v1 ? `${v1} → ${t1}` : `${v2} → ${t2}`);
      cond = cond
        .replace(/\\(?:to|rightarrow)|->/g, "→")
        .replace(/\\infty/g, "∞")
        .replace(/\s*→\s*/g, " → ")
        .replace(/\^\{\s*([+\-−])\s*\}/g, (_: string, s: string) => s === "+" ? "⁺" : "⁻")
        .replace(/\^([+\-−])/g, (_: string, s: string) => s === "+" ? "⁺" : "⁻")
        .trim();
      return `\\lim_{${cond}}`;
    }
  );
}

export function normalizeIntegrals(text: string): string {
  if (!text) return "";
  const cleanLim = (str: string) => str.replace(/\\pi/g, "π").replace(/\\infty/g, "∞").replace(/\\theta/g, "θ").trim();

  let res = text.replace(
    /\\int\s*_\{\s*([^}]+)\s*\}\s*\^\s*\{\s*([^}]+)\s*\}/g,
    (_, l, u) => `\\int_{${cleanLim(l)}}^{${cleanLim(u)}}`
  );
  res = res.replace(
    /\\int\s*\^\s*\{\s*([^}]+)\s*\}\s*_\s*\{\s*([^}]+)\s*\}/g,
    (_, u, l) => `\\int_{${cleanLim(l)}}^{${cleanLim(u)}}`
  );
  res = res.replace(
    /\\int\s*_\s*([0-9a-zA-Z\u09E6-\u09EF\-−\\]+)\s*\^\s*([0-9a-zA-Z\u09E6-\u09EF\-−\\]+)/g,
    (_, l, u) => `\\int_{${cleanLim(l)}}^{${cleanLim(u)}}`
  );
  res = res.replace(
    /\\int\s*\^\s*([0-9a-zA-Z\u09E6-\u09EF\-−\\]+)\s*_\s*([0-9a-zA-Z\u09E6-\u09EF\-−\\]+)/g,
    (_, u, l) => `\\int_{${cleanLim(l)}}^{${cleanLim(u)}}`
  );
  return res;
}

function extractBalancedBraces(str: string, startIndex: number): { content: string; endIndex: number } | null {
  if (str[startIndex] !== "{") return null;
  let depth = 0;
  for (let i = startIndex; i < str.length; i++) {
    if (str[i] === "{") depth++;
    else if (str[i] === "}") {
      depth--;
      if (depth === 0) {
        return { content: str.slice(startIndex + 1, i), endIndex: i };
      }
    }
  }
  return null;
}

/**
 * Normalizes trigonometric expressions where theta might mistakenly be placed as an exponent/power.
 * Examples:
 *   sin^theta, \sin^\theta, sin^\theta, sin^{theta}, sin^θ -> sin θ
 *   sin^2\theta, sin^2 theta, sin^{2}\theta -> sin² θ
 *   \sin\theta, sin\theta, \tan\theta -> sin θ, tan θ
 */
export function normalizeTrigPowersAndTheta(expr: string): string {
  if (!expr) return "";

  // 1. Trig functions mistakenly followed by caret theta in any form:
  // e.g. sin^theta, \sin^\theta, sin^{\theta}, sin^θ, sin^{θ}, sin^(θ), sin^(theta), \cos^\theta
  let res = expr.replace(
    /\\?(sin|cos|tan|cot|sec|csc|cosec)\s*\^\s*(?:\{?\\?(?:theta|vartheta|θ)\}?|\(\s*\\?(?:theta|vartheta|θ)\s*\))/gi,
    "$1 θ"
  );

  // 1b. Unicode superscript theta (ᶿ) or spelled power (ᵗʰᵉᵗᵃ) on trig functions
  res = res.replace(
    /\b(sin|cos|tan|cot|sec|csc|cosec)\s*(?:[ᶿ]|ᵗʰᵉᵗᵃ)/gi,
    "$1 θ"
  );

  // 2. Trig functions with explicit powers followed by theta
  // e.g. sin^2\theta, sin^2 theta, sin^{2}\theta, sin^2 θ, sin^{2}θ, \sin^2\theta
  res = res.replace(
    /\\?(sin|cos|tan|cot|sec|csc|cosec)\s*\^\s*\{?([0-9\u09E6-\u09EF+\-−n]+)\}?\s*(?:\\?(?:theta|vartheta)\b|θ|\(\s*(?:\\?(?:theta|vartheta)|θ)\s*\))/gi,
    (_, fn, p) => `${fn}${toSuperscript(p)} θ`
  );

  // 3. Trig functions with unicode superscript followed by theta
  // e.g. sin²θ, cos²θ, tan²θ, sin² θ
  res = res.replace(
    /\b(sin|cos|tan|cot|sec|csc|cosec)([⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ⁻⁺]+)\s*(?:\\?(?:theta|vartheta)\b|θ|\(\s*(?:\\?(?:theta|vartheta)|θ)\s*\))/gi,
    "$1$2 θ"
  );

  // 4. Regular trig followed by theta without exponent
  // e.g. \sin\theta, sin\theta, \tan\theta, sin theta, sin θ, sin(θ), sin(theta), sin( \theta )
  res = res.replace(
    /\\?(sin|cos|tan|cot|sec|csc|cosec)\s*(?:\\?(?:theta|vartheta)\b|θ|\(\s*(?:\\?(?:theta|vartheta)|θ)\s*\))/gi,
    "$1 θ"
  );

  // 5. Clean up any standalone caret-theta that was not attached to trig
  res = res.replace(/\^\s*(?:\{?\\?(?:theta|vartheta|θ)\}?|\(\s*\\?(?:theta|vartheta|θ)\s*\))/gi, " θ");

  // 5b. Standalone 'theta' or '\theta' outside other words:
  // e.g. "যদি theta = 30° হয়" -> "যদি θ = 30° হয়"
  res = res.replace(/\\(?:theta|vartheta)\b/gi, "θ");
  res = res.replace(/(?<![a-zA-Z0-9\u0980-\u09FF])theta(?![a-zA-Z0-9\u0980-\u09FF])/gi, "θ");

  // 6. Normalize degrees so 30^\circ, 30^{\circ}, 30^\degree, 30^° become 30°
  res = res.replace(/([\d\u09E6-\u09EF]+)\s*\^\{\s*\\?(?:circ|degree|°)\s*\}/gi, "$1°");
  res = res.replace(/([\d\u09E6-\u09EF]+)\s*\^\s*\\?(?:circ|degree)\b/gi, "$1°");
  res = res.replace(/([\d\u09E6-\u09EF]+)\s*\^°/g, "$1°");
  res = res.replace(/\^\{\s*\\?(?:circ|degree|°)\s*\}/gi, "°");
  res = res.replace(/\^\s*\\?(?:circ|degree)\b/gi, "°");

  return res;
}

/**
 * Converts divide expressions (e.g. 1/2, a/b, 8/17, ২/৩, (x+y)/(x-y), 1/√2, sin θ/cos θ)
 * into standard fraction format \frac{num}{den} with horizontal fraction lines,
 * while safely preserving units (km/h, m/s^2), dates (12/10/2026), and URLs.
 */
export function convertDivisionToFractions(text: string): string {
  if (!text) return "";

  const placeholders: Array<{ key: string; val: string }> = [];
  const protect = (val: string) => {
    const key = `§§PFRAC${placeholders.length}§§`;
    placeholders.push({ key, val });
    return key;
  };

  // 1. Protect URLs
  let s = text.replace(/https?:\/\/[^\s]+/gi, protect);

  // 2. Protect units
  s = s.replace(/\b(?:km\/h|m\/s\^?2|m\/s²|m\/s|kg\/m\^?3|kg\/m³|kg\/m|rad\/s|N\/m|N\.s\/m²|Pa\.s|g\/cm³|g\/cm\^?3)\b/gi, protect);

  // 3. Protect dates & years
  s = s.replace(/\b\d{1,4}\/\d{1,4}\/\d{2,4}\b/g, protect);
  s = s.replace(/\b\d{4}\/\d{2,4}\b/g, protect);

  // 4. Protect common non-math slash words
  s = s.replace(/\b(and|or|true|false|yes|no|input|output|mcq|cq)\/(and|or|true|false|yes|no|input|output|mcq|cq)\b/gi, protect);

  // 5. Parenthesized division expressions:
  // e.g. (tan θ + sec θ)/(tan θ - sec θ), (x + y)/(x - y), 1/(1 + tan²θ), (a + b)/c
  s = s.replace(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, "\\frac{$1}{$2}");
  s = s.replace(/([0-9\u09E6-\u09EFa-zA-Zα-ωΑ-Ω²³ⁿθπ√]+(?:\s+[a-zA-Zα-ωΑ-Ωθ])?)\s*\/\s*\(([^()]+)\)/g, "\\frac{$1}{$2}");
  s = s.replace(/\(([^()]+)\)\s*\/\s*([0-9\u09E6-\u09EFa-zA-Zα-ωΑ-Ω²³ⁿθπ√]+(?:\s+[a-zA-Zα-ωΑ-Ωθ])?)/g, "\\frac{$1}{$2}");

  // 6. Mixed fractions: e.g. 2 1/2 or ২ ১/৩
  s = s.replace(/([\d\u09E6-\u09EF]+)\s+([\d\u09E6-\u09EF]+)\s*\/\s*([\d\u09E6-\u09EF]+)/g, "$1 \\frac{$2}{$3}");

  // 7. Trigonometric functions with arguments in fractions:
  // e.g. sin θ / cos θ, sin² θ / cos² θ, 1 / cos θ, 1 / tan θ, sin x / cos x, tan θ / 2
  const trigTerm = "(?:(?:sin|cos|tan|cot|sec|csc|cosec)(?:[²³⁴⁵⁶⁷⁸⁹ⁿ]+|\\^[0-9]+)?\\s*(?:[a-zA-Zα-ωΑ-Ωθ]|\\([a-zA-Z0-9α-ωΑ-Ωθ+\\- ]+\\)))";
  const numOrVar = "(?:[0-9\u09E6-\u09EFa-zA-Zα-ωΑ-Ωθπ√²³ⁿ]+)";

  // Trig / Trig
  s = s.replace(new RegExp(`(${trigTerm})\\s*\\/\\s*(${trigTerm})`, "gi"), "\\frac{$1}{$2}");
  // Trig / Number
  s = s.replace(new RegExp(`(${trigTerm})\\s*\\/\\s*(${numOrVar})`, "gi"), "\\frac{$1}{$2}");
  // Number / Trig
  s = s.replace(new RegExp(`(${numOrVar})\\s*\\/\\s*(${trigTerm})`, "gi"), "\\frac{$1}{$2}");

  // 8. Fractions with roots and Pi / Greek letters: e.g. 1/√2, √3/2, π/6, 5π/6, θ/2, 2π/3
  const greekOrRoot = "(?:√[0-9\u09E6-\u09EFa-zA-Z]+|[0-9\u09E6-\u09EF]*[πθθα-ωΑ-Ω]|[0-9\u09E6-\u09EF]+)";
  s = s.replace(new RegExp(`(?:^|[\\s=+\\-(])(${greekOrRoot})\\s*\\/\\s*(${greekOrRoot})(?=[\\s=+\\-(),.;]|$)`, "giu"), (match, n, d) => {
    const prefix = match.slice(0, match.indexOf(n));
    return `${prefix}\\frac{${n.trim()}}{${d.trim()}}`;
  });

  // 8b. Calculus differential operators:
  // Higher-order: d^2y/dx^2, d^2/dx^2, d²y/dx², d²u/dt², d^3y/dx^3, d³y/dx³, ∂²u/∂x²
  s = s.replace(
    /(?:^|[\s=+\-(])(d\^[0-9]+[yfuwvzsxa]?|d[²³⁴⁵⁶⁷⁸⁹ⁿ]+[yfuwvzsxa]?|∂\^[0-9]+[yfuwvzsxa]?|∂[²³⁴⁵⁶⁷⁸⁹ⁿ]+[yfuwvzsxa]?)\s*\/\s*(d[xtyzθu]\^[0-9]+|d[xtyzθu][²³⁴⁵⁶⁷⁸⁹ⁿ]+|∂[xtyzθu]\^[0-9]+|∂[xtyzθu][²³⁴⁵⁶⁷⁸⁹ⁿ]+)(?=[\s=+\-(),.;]|$)/g,
    (match, n, d) => {
      const prefix = match.slice(0, match.indexOf(n));
      const cleanN = n.replace(/\^([0-9]+)/g, (_: string, p: string) => toSuperscript(p));
      const cleanD = d.replace(/\^([0-9]+)/g, (_: string, p: string) => toSuperscript(p));
      return `${prefix}\\frac{${cleanN}}{${cleanD}}`;
    }
  );
  // First-order: d/dx, dy/dx, df/dx, du/dx, dv/dx, dw/dx, dz/dx, dx/dt, dy/dt, ds/dt, dv/dt, da/dt, d/dt, d/dθ, dy/dθ, d/dy, dx/dy, \partial/\partial x
  s = s.replace(
    /(?:^|[\s=+\-(])(d[yfuwvzsxa]?|∂[yfuwvzsxa]?|\\partial[yfuwvzsxa]?)\s*\/\s*(d[xtyzθu]|∂[xtyzθu]|\\partial[xtyzθu])(?=[\s=+\-(),.;]|$)/g,
    (match, n, d) => {
      const prefix = match.slice(0, match.indexOf(n));
      const cleanN = n.replace(/^\\partial/, "∂");
      const cleanD = d.replace(/^\\partial/, "∂");
      return `${prefix}\\frac{${cleanN}}{${cleanD}}`;
    }
  );

  // 9. Bengali and numeric fractions: e.g. ২/৩, ১০/৩, 1/2, 8/17, 5/12
  s = s.replace(/([\d\u09E6-\u09EF]+)\s*\/\s*([\d\u09E6-\u09EF]+)/g, "\\frac{$1}{$2}");

  // 10. Common algebraic variable fractions: e.g. 1/x, 1/p, 1/n, a/b, p/q, x/y, dy/dx, AB/CD, A/B
  s = s.replace(/(?:^|[\s=+\-(])([a-zA-Zα-ωΑ-Ω\d]{1,4})\s*\/\s*([a-zA-Zα-ωΑ-Ω\d]{1,4})(?=[\s=+\-(),.;]|$)/g, (match, n, d) => {
    const prefix = match.slice(0, match.indexOf(n));
    return `${prefix}\\frac{${n}}{${d}}`;
  });

  // Restore protected items
  for (let i = placeholders.length - 1; i >= 0; i--) {
    s = s.replace(placeholders[i].key, placeholders[i].val);
  }

  return s;
}

const formatMathCache = new Map<string, string>();

export function formatMathForExport(text?: string | null): string {
  if (!text) return "";
  const cached = formatMathCache.get(text);
  if (cached !== undefined) return cached;

  // 1. Normalize trigonometric theta positioning and degree expressions
  let result = normalizeTrigPowersAndTheta(text);

  // 2. Clean matrix environments
  result = cleanMatrixEnvironments(result);

  // 3. Replace explicit math blocks $$...$$, \[...\], $...$, \(...\)
  result = result.replace(
    /\\\$|(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|(?<!\\)\$((?:\\\$|[^\$])+?)(?<!\\)\$|\\\([\s\S]+?\\\))/g,
    (_, formula) => {
      if (!formula) return "$";
      let f = formula;
      if (f.startsWith("$$") && f.endsWith("$$")) f = f.slice(2, -2);
      else if (f.startsWith("$") && f.endsWith("$")) f = f.slice(1, -1);
      else if (f.startsWith("\\[") && f.endsWith("\\]")) f = f.slice(2, -2);
      else if (f.startsWith("\\(") && f.endsWith("\\)")) f = f.slice(2, -2);

      return cleanLatexFormula(f.trim());
    }
  );

  // 4. Normalize limits and integrals outside math delimiters
  result = normalizeLimits(result);
  result = normalizeIntegrals(result);

  // 5. Protect matrices, limits, and integrals before plain-text transformations
  const mathBlockPlaceholders: Array<{ key: string; val: string }> = [];
  const protectMath = (m: string) => {
    const key = `§§MBK${mathBlockPlaceholders.length}§§`;
    mathBlockPlaceholders.push({ key, val: m });
    return key;
  };

  result = result.replace(/\\begin\{(?:vmatrix|Vmatrix|bmatrix|pmatrix|matrix)\}[\s\S]*?\\end\{(?:vmatrix|Vmatrix|bmatrix|pmatrix|matrix)\}/g, protectMath);
  result = result.replace(/\\lim_\{[^{}]+\}/g, protectMath);
  result = result.replace(/(?:\\(?:int|iint|iiint|oint)|[∫∬∭∮])(?:_\{[^{}]+\}\^\{[^{}]+\}|_\{[^{}]+\}|\^\{[^{}]+\}|_[^\s^]+\^[^\s_]+|_[^\s]+|\^[^\s]+)?/g, protectMath);

  // 5b. Also clean standalone LaTeX commands and symbols outside math delimiters
  result = cleanLatexFormula(result);

  // 5c. Format multiplication and subtraction operators:
  // Convert * between numbers or math terms to × (e.g. 2 * 3 -> 2 × 3, sin θ * cos θ -> sin θ × cos θ)
  result = result.replace(/([0-9\u09E6-\u09EFa-zA-Zα-ωΑ-Ωθ)\]])\s*\*\s*([0-9\u09E6-\u09EFa-zA-Zα-ωΑ-Ωθ(\[])/g, "$1 × $2");
  // Convert standalone 'x' or 'X' between digits/numbers to × (e.g. 5 x 10, 5x10, ৩ x ৫, ৩x৫ -> 5 × 10, ৩ × ৫)
  result = result.replace(/([\d\u09E6-\u09EF]+)\s*[xX]\s*([\d\u09E6-\u09EF]+)/g, "$1 × $2");
  // Convert standalone 'x' or 'X' with spaces between variables/terms to × (e.g. A x B -> A × B, 3 x 3 -> 3 × 3)
  result = result.replace(/([0-9\u09E6-\u09EFa-zA-Zα-ωΑ-Ωθ)\]])\s+[xX]\s+([0-9\u09E6-\u09EFa-zA-Zα-ωΑ-Ωθ(\[])/g, "$1 × $2");
  // Convert binary minus '-' with spaces or between terms into mathematical minus '−'
  result = result.replace(/([0-9\u09E6-\u09EFa-zA-Zα-ωΑ-Ωθ)\]])\s+-\s+([0-9\u09E6-\u09EFa-zA-Zα-ωΑ-Ωθ(\[])/g, "$1 − $2");
  result = result.replace(/\s+-\s+/g, " − ");

  // 6. Convert division expressions (1/2, a/b, d/dx, dy/dx, ২/৩, (x+y)/(x-y), sin θ/cos θ) into \frac{num}{den}
  result = convertDivisionToFractions(result);

  // 7. Format plain-text powers outside math blocks:
  // (a) Braced powers: base^{exp} e.g. 10^{5}, x^{-2}, (x+1)^{2}, ১০^{৫}, a^{2x}
  result = result.replace(
    /([a-zA-Z0-9\u0980-\u09EF\)\}\]])\^\{([^{}]+)\}/g,
    (_, base, exp) => `${base}${toSuperscript(exp)}`
  );

  // (b) Unbraced powers: base^exp e.g. 10^5, x^-1, x^2, ১০^৫, (x+1)^2
  result = result.replace(
    /([a-zA-Z0-9\u0980-\u09EF\)\}\]])\^([0-9\u09E6-\u09EF+\-−a-zA-Z]+)/g,
    (_, base, exp) => `${base}${toSuperscript(exp)}`
  );

  // (c) Any remaining standalone carets with tokens: e.g. ^2, ^-1, ^৫
  result = result.replace(/\^\{([^{}]+)\}/g, (_, exp) => toSuperscript(exp));
  result = result.replace(/\^([0-9\u09E6-\u09EF+\-−a-zA-Z]+)/g, (_, exp) => toSuperscript(exp));

  // 8. Restore protected matrix, limit, and integral blocks
  for (let i = mathBlockPlaceholders.length - 1; i >= 0; i--) {
    result = result.replace(mathBlockPlaceholders[i].key, mathBlockPlaceholders[i].val);
  }

  if (formatMathCache.size < 5000) {
    formatMathCache.set(text, result);
  }
  return result;
}

export function cleanLatexFormula(expr: string): string {
  let res = cleanMatrixEnvironments(expr);

  // 0. Pre-normalize theta on trig functions & degrees
  res = normalizeTrigPowersAndTheta(res);

  // Protect matrix environments during formula cleaning
  const matrixHolders: Array<{ key: string; val: string }> = [];
  res = res.replace(/\\begin\{(?:vmatrix|Vmatrix|bmatrix|pmatrix|matrix)\}[\s\S]*?\\end\{(?:vmatrix|Vmatrix|bmatrix|pmatrix|matrix)\}/g, (m) => {
    const key = `§§CFMBK${matrixHolders.length}§§`;
    matrixHolders.push({ key, val: m });
    return key;
  });

  // 1. Text wrappers: \text{...}, \mathrm{...}, \mathbf{...}, \mathit{...}
  res = res.replace(/\\(text|mathrm|mathbf|mathit)\{([^{}]+)\}/g, "$2");

  // Number sets: \mathbb{N}, \mathbb{R}, \mathbb{Z}, \mathbb{Q}, \mathbb{C}
  res = res.replace(/\\mathbb\{([A-Za-z]+)\}/g, (_, letter) => {
    const map: Record<string, string> = { N: "ℕ", Z: "ℤ", Q: "ℚ", R: "ℝ", C: "ℂ", P: "ℙ", H: "ℍ" };
    return map[letter] || letter;
  });

  // Operators: \operatorname{cosec} -> cosec
  res = res.replace(/\\operatorname\{([^{}]+)\}/g, "$1");

  // Vectors, bars, hats
  res = res.replace(/\\vec\{([^}]+)\}/g, "$1");
  res = res.replace(/\\(overline|bar)\{([^}]+)\}/g, "$2");
  res = res.replace(/\\hat\{([^}]+)\}/g, "$1^");

  // 2. Roots: \sqrt[n]{...} or \sqrt{...}
  let sqrtIdx: number;
  while ((sqrtIdx = res.indexOf("\\sqrt")) !== -1) {
    let cursor = sqrtIdx + 5;
    let rootN = "";
    if (res[cursor] === "[") {
      const closeBracket = res.indexOf("]", cursor);
      if (closeBracket !== -1) {
        rootN = toSuperscript(res.slice(cursor + 1, closeBracket));
        cursor = closeBracket + 1;
      }
    }
    const inner = extractBalancedBraces(res, cursor);
    if (inner) {
      const formattedInner = cleanLatexFormula(inner.content);
      const replacement = (rootN || "") + "√(" + formattedInner + ")";
      res = res.slice(0, sqrtIdx) + replacement + res.slice(inner.endIndex + 1);
    } else {
      break;
    }
  }

  // 3. Fractions: preserve \frac{num}{den} for PDF and clean export
  let fracSearchStart = 0;
  let fracIdx: number;
  while ((fracIdx = res.indexOf("\\frac", fracSearchStart)) !== -1) {
    const num = extractBalancedBraces(res, fracIdx + 5);
    if (!num) {
      fracSearchStart = fracIdx + 5;
      continue;
    }
    const den = extractBalancedBraces(res, num.endIndex + 1);
    if (!den) {
      fracSearchStart = num.endIndex + 1;
      continue;
    }

    const formattedNum = cleanLatexFormula(num.content).trim();
    const formattedDen = cleanLatexFormula(den.content).trim();
    let replacement = `\\frac{${formattedNum}}{${formattedDen}}`;

    // Ensure space separation if preceded by a whole number digit
    if (fracIdx > 0 && /[\d\u09E6-\u09EF]$/u.test(res.slice(0, fracIdx))) {
      replacement = " " + replacement;
    }

    res = res.slice(0, fracIdx) + replacement + res.slice(den.endIndex + 1);
    fracSearchStart = fracIdx + replacement.length;
  }

  // 4. Normalize limits & integrals and protect them from subscript/superscript mangling
  res = normalizeLimits(res);
  res = normalizeIntegrals(res);

  const mathHolders: Array<{ key: string; val: string }> = [];
  res = res.replace(/\\lim_\{[^{}]+\}/g, (m) => {
    const key = `§§MLIM${mathHolders.length}§§`;
    mathHolders.push({ key, val: m });
    return key;
  });
  res = res.replace(/\\int(?:_\{[^{}]+\}\^\{[^{}]+\}|_\{[^{}]+\}|\^\{[^{}]+\})?/g, (m) => {
    const key = `§§MINT${mathHolders.length}§§`;
    mathHolders.push({ key, val: m });
    return key;
  });

  // 5. Greek, Angles, Geometry, Sets, Operators, Symbols via COMMANDS map
  res = res.replace(/\\([a-zA-Z]+)/g, (match, name) => COMMANDS[name] ?? match);

  // 6. Superscripts: ^{...} or ^x
  res = res.replace(/\^\{([^{}]+)\}/g, (_, inner) => toSuperscript(inner));
  res = res.replace(/\^([0-9a-zA-Z\u09E6-\u09EF+\-−])/g, (_, char) => toSuperscript(char));

  // 7. Subscripts: _{...} or _x
  res = res.replace(/_\{([^{}]+)\}/g, (_, inner) => toSubscript(inner));
  res = res.replace(/_([0-9a-zA-Z\u09E6-\u09EF+\-−])/g, (_, char) => toSubscript(char));

  // 8. Delimiters & Spacing
  res = res.replace(/\\left\(/g, "(").replace(/\\right\)/g, ")");
  res = res.replace(/\\left\[/g, "[").replace(/\\right\]/g, "]");
  res = res.replace(/\\left\\\{/g, "{").replace(/\\right\\\}/g, "}");
  res = res.replace(/\\\{/g, "{").replace(/\\\}/g, "}");
  res = res.replace(/\\[,;:! ]/g, " ");

  // Format spacing around function names and operators
  res = res.replace(/\b(arcsin|arccos|arctan|sinh|cosh|tanh|coth|sech|csch|cosec|csc|sec|cot|tan|sin|cos|ln|log)\b\s*([a-zA-Zα-ωΑ-Ω])/g, (m, fn, next) => {
    if (fn === "cos" && (next === "e" || next === "h")) return m;
    if (fn === "sin" && next === "h") return m;
    if (fn === "tan" && next === "h") return m;
    if (fn === "cot" && next === "h") return m;
    if (fn === "sec" && next === "h") return m;
    return `${fn} ${next}`;
  });
  res = res.replace(/\s*([=+\-−×÷≈≠≤≥→⇒])\s*/g, " $1 ");
  res = res.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");
  res = res.replace(/^\s*-\\s+([a-zA-Z0-9α-ωΑ-Ω])/, "-$1");
  res = res.replace(/\(\s*-\\s+([a-zA-Z0-9α-ωΑ-Ω])/, "(-$1");

  // Restore protected limits and integrals
  for (let i = mathHolders.length - 1; i >= 0; i--) {
    res = res.replace(mathHolders[i].key, mathHolders[i].val);
  }

  // Restore protected matrices
  for (let i = matrixHolders.length - 1; i >= 0; i--) {
    res = res.replace(matrixHolders[i].key, matrixHolders[i].val);
  }

  // Clean double spaces
  res = res.replace(/\s+/g, " ").trim();
  return res;
}
