import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

const safeDirname = typeof __dirname !== "undefined" ? __dirname : process.cwd();
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  ImageRun,
  Math as DocxMath,
  MathFraction,
  MathIntegral,
  MathLimitLower,
  MathRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  WidthType,
  XmlComponent
} from "docx";
import { env } from "../../config/env.js";
import type { Paper, Question } from "../shared/types.js";
import { formatMathForExport, convertBracketMatricesToLatex } from "./mathExportFormatter.js";
import {
  getBengaliClass,
  getBengaliSubject,
  getBengaliPaperTitle,
  getBengaliExamType,
  formatBengaliDuration,
  toBengaliDigits
} from "../curriculum/curriculumBengali.js";

type ImageAsset = { buffer: Buffer; width: number; height: number };
type ImageMap = Map<string, ImageAsset>;

// Reduced left & right margins for compact, authentic exam paper layout
const page = {
  width: 595.28,
  height: 841.89,
  marginSide: 26, // Reduced from 42pt to 26pt (~9mm)
  marginTop: 32,
  marginBottom: 32
};

function getMathFontPath(): { regular: string; bold: string } | null {
  const candidates = [
    { regular: path.resolve(process.cwd(), "assets/fonts/seguisym.ttf"), bold: path.resolve(process.cwd(), "assets/fonts/seguisym.ttf") },
    { regular: path.resolve(process.cwd(), "backend/assets/fonts/seguisym.ttf"), bold: path.resolve(process.cwd(), "backend/assets/fonts/seguisym.ttf") },
    { regular: path.resolve(safeDirname, "../../assets/fonts/seguisym.ttf"), bold: path.resolve(safeDirname, "../../assets/fonts/seguisym.ttf") },
    { regular: "C:\\Windows\\Fonts\\seguisym.ttf", bold: "C:\\Windows\\Fonts\\seguisym.ttf" },
    { regular: "C:\\Windows\\Fonts\\calibri.ttf", bold: "C:\\Windows\\Fonts\\calibrib.ttf" },
    { regular: "C:\\Windows\\Fonts\\segoeui.ttf", bold: "C:\\Windows\\Fonts\\segoeuib.ttf" },
    { regular: "C:\\Windows\\Fonts\\times.ttf", bold: "C:\\Windows\\Fonts\\timesbd.ttf" },
    { regular: "C:\\Windows\\Fonts\\arial.ttf", bold: "C:\\Windows\\Fonts\\arialbd.ttf" },
    { regular: "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", bold: "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" },
    { regular: "/usr/share/fonts/opentype/noto/NotoSans-Regular.ttf", bold: "/usr/share/fonts/opentype/noto/NotoSans-Bold.ttf" }
  ];
  for (const font of candidates) {
    if (fs.existsSync(font.regular)) {
      return {
        regular: font.regular,
        bold: fs.existsSync(font.bold) ? font.bold : font.regular
      };
    }
  }
  return null;
}

function getBanglaFontPath(): string | null {
  const candidates = [
    path.resolve(process.cwd(), "assets/fonts/kalpurush.ttf"),
    path.resolve(process.cwd(), "backend/assets/fonts/kalpurush.ttf"),
    path.resolve(safeDirname, "../../assets/fonts/kalpurush.ttf"),
    "C:\\Windows\\Fonts\\kalpurush.ttf"
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

export function getSoftwareUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const client = env.CLIENT_URL || "http://localhost:3000";
  try {
    const u = new URL(client);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
      return "www.examcraft.app";
    }
    return u.host;
  } catch {}
  return "www.examcraft.app";
}

export function getSoftwareLogoBuffer(): Buffer | null {
  const candidates = [
    path.resolve(process.cwd(), "assets/logo-small.png"),
    path.resolve(process.cwd(), "backend/assets/logo-small.png"),
    path.resolve(safeDirname, "../../assets/logo-small.png"),
    path.resolve(safeDirname, "../../../frontend/public/logo-small.png"),
    path.resolve(process.cwd(), "frontend/public/logo-small.png"),
    path.resolve(process.cwd(), "assets/logo.png"),
    path.resolve(process.cwd(), "backend/assets/logo.png")
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        return fs.readFileSync(c);
      } catch {}
    }
  }
  return null;
}

export async function loadSingleImage(imageUrl?: string): Promise<ImageAsset | null> {
  if (!imageUrl) return null;
  try {
    let buffer: Buffer | null = null;
    const trimmed = imageUrl.trim();

    if (trimmed.startsWith("data:")) {
      const marker = ";base64,";
      const markerIdx = trimmed.indexOf(marker);
      if (markerIdx !== -1) {
        buffer = Buffer.from(trimmed.slice(markerIdx + marker.length), "base64");
      }
    } else {
      let url = trimmed;
      if (url.startsWith("/")) {
        const baseUrl =
          process.env.SERVER_URL ||
          process.env.RENDER_EXTERNAL_URL ||
          `http://127.0.0.1:${process.env.PORT || 5000}`;
        url = `${baseUrl.replace(/\/+$/, "")}${url}`;
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { "User-Agent": "ExamCraft-Export/1.0" }
        });
        if (response.ok) {
          buffer = Buffer.from(await response.arrayBuffer());
        }
      } finally {
        clearTimeout(timer);
      }
    }

    if (buffer && buffer.length > 0) {
      const size = readImageSize(buffer);
      if (size) return { buffer, ...size };
    }
  } catch {
    // Return null if image cannot be loaded
  }
  return null;
}

function drawWatermarkFooter(doc: PDFKit.PDFDocument, hasBanglaFont: boolean) {
  const range = doc.bufferedPageRange();
  const logoBuffer = getSoftwareLogoBuffer();
  const footerY = page.height - 21;
  const lineY = page.height - 26;
  const softwareName = "ExamCraft";
  const softwareUrl = getSoftwareUrl();

  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.save();

    // Divider line across bottom
    doc.strokeColor("#cbd5e1").lineWidth(0.5);
    doc.moveTo(page.marginSide, lineY).lineTo(page.width - page.marginSide, lineY).stroke();

    // Left side: Software logo & Name
    let textX = page.marginSide;
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, page.marginSide, footerY - 2, { height: 13, width: 13 });
        textX += 17;
      } catch {}
    }

    doc.fillColor("#475569").fontSize(8.5);
    if (hasBanglaFont) {
      doc.font("BanglaFont-Bold");
    } else {
      doc.font("Helvetica-Bold");
    }
    doc.text(softwareName, textX, footerY, { lineBreak: false });

    // Right side: Software URL
    doc.fillColor("#64748b").fontSize(8);
    if (hasBanglaFont) {
      doc.font("BanglaFont");
    } else {
      doc.font("Helvetica");
    }
    doc.text(softwareUrl, page.marginSide, footerY, {
      width: page.width - page.marginSide * 2,
      align: "right",
      lineBreak: false
    });

    doc.restore();
  }
}

export function createSetPaper(basePaper: Paper, setKey: string): Paper {
  const banglaToEnglishSet: Record<string, string> = { "ক": "A", "খ": "B", "গ": "C", "ঘ": "D" };
  const rawKey = (setKey || "").trim();
  const normalizedKey = banglaToEnglishSet[rawKey] || rawKey.toUpperCase() || "A";

  const paper: Paper = JSON.parse(JSON.stringify(basePaper));
  paper.setName = normalizedKey;

  const isBangla =
    /[\u0980-\u09FF]/.test(paper.name + paper.subject) ||
    !paper.subject?.toLowerCase().includes("english");
  const toBn = (n: number) =>
    n.toString().replace(/[0-9]/g, (d) => ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"][Number(d)]);

  const allQuestions = paper.questions || [];
  const mcqs = allQuestions.filter((q) => (q.type || "mcq").toLowerCase().trim() === "mcq");
  const cqs = allQuestions.filter((q) => (q.type || "").toLowerCase().trim() === "cq");
  const others = allQuestions.filter((q) => {
    const t = (q.type || "mcq").toLowerCase().trim();
    return t !== "mcq" && t !== "cq";
  });

  if (mcqs.length > 1) {
    let shuffledMcqs = [...mcqs];
    if (normalizedKey !== "A" && normalizedKey !== "1" && normalizedKey !== "ORIGINAL") {
      const seedStr = `${paper.id}_set_${normalizedKey}`;
      let seed = 0;
      for (let i = 0; i < seedStr.length; i++) {
        seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
      }
      const pseudoRand = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };

      for (let i = shuffledMcqs.length - 1; i > 0; i--) {
        const j = Math.floor(pseudoRand() * (i + 1));
        [shuffledMcqs[i], shuffledMcqs[j]] = [shuffledMcqs[j], shuffledMcqs[i]];
      }
    }

    const numberedMcqs = shuffledMcqs.map((q, idx) => ({
      ...q,
      number: isBangla ? toBn(idx + 1) : String(idx + 1)
    }));

    const numberedCqs = cqs.map((q, cIdx) => ({
      ...q,
      number: q.number && q.number.trim() ? q.number.trim() : (isBangla ? toBn(numberedMcqs.length + cIdx + 1) : String(numberedMcqs.length + cIdx + 1))
    }));

    paper.questions = [...numberedMcqs, ...numberedCqs, ...others];
  } else {
    // Single question or CQ only
    const numberedQuestions = allQuestions.map((q, idx) => ({
      ...q,
      number: q.number && q.number.trim() ? q.number.trim() : (isBangla ? toBn(idx + 1) : String(idx + 1))
    }));
    paper.questions = numberedQuestions;
  }

  return paper;
}

export async function renderPaperPdf(
  paper: Paper,
  options?: {
    withAnswer?: boolean;
    allSets?: boolean;
    sectionFlow?: "separate" | "single";
    watermark?: boolean;
    branding?: boolean;
  }
) {
  const [images, instLogo] = await Promise.all([
    loadQuestionImages(paper),
    options?.branding !== false && paper.instituteLogo ? loadSingleImage(paper.instituteLogo) : Promise.resolve(null)
  ]);
  const doc = new PDFDocument({
    size: "A4",
    margins: {
      top: page.marginTop,
      bottom: 0,
      left: page.marginSide,
      right: page.marginSide
    },
    bufferPages: true
  });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));

  const mathFonts = getMathFontPath();
  const banglaFont = getBanglaFontPath();

  if (mathFonts) {
    doc.registerFont("MathFont", mathFonts.regular);
    doc.registerFont("MathFont-Bold", mathFonts.bold);
  }
  if (banglaFont) {
    doc.registerFont("BanglaFont", banglaFont);
    doc.registerFont("BanglaFont-Bold", banglaFont);
  }

  const effectiveSectionFlow = options?.sectionFlow || paper.sectionFlow || "separate";

  if (options?.allSets) {
    const setKeys = ["A", "B", "C", "D"];
    for (let sIdx = 0; sIdx < setKeys.length; sIdx++) {
      const sKey = setKeys[sIdx];
      const setPaper = createSetPaper(paper, sKey);
      if (sIdx > 0) {
        doc.addPage();
      }
      const headerEndY = drawHeader(doc, setPaper, Boolean(banglaFont), instLogo, options);
      drawQuestions(doc, setPaper, images, Boolean(banglaFont), headerEndY, effectiveSectionFlow);
      if (options?.withAnswer !== false) {
        drawAnswers(doc, setPaper, Boolean(banglaFont));
      }
    }
  } else {
    const headerEndY = drawHeader(doc, paper, Boolean(banglaFont), instLogo, options);
    drawQuestions(doc, paper, images, Boolean(banglaFont), headerEndY, effectiveSectionFlow);
    if (options?.withAnswer !== false) {
      drawAnswers(doc, paper, Boolean(banglaFont));
    }
  }

  if (options?.watermark) {
    drawWatermarkFooter(doc, Boolean(banglaFont));
  }

  doc.end();

  return new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });
}


type FractionItem = {
  type: "fraction";
  whole?: string;
  num: string;
  den: string;
  width?: number;
};

type MatrixItem = {
  type: "matrix";
  env: "bmatrix" | "pmatrix" | "vmatrix" | "Vmatrix" | "matrix";
  rows: string[][];
  width?: number;
  height?: number;
};

type LimitItem = {
  type: "limit";
  condition: string;
  width?: number;
  height?: number;
};

type IntegralItem = {
  type: "integral";
  symbol: string;
  lower?: string;
  upper?: string;
  width?: number;
  height?: number;
};

type WordItem = {
  type: "word";
  text: string;
  width?: number;
};

type LayoutItem = FractionItem | MatrixItem | LimitItem | IntegralItem | WordItem;

class GenericXmlComponent extends XmlComponent {
  constructor(name: string, children: any[] = []) {
    super(name);
    for (const c of children) (this as any).root.push(c);
  }
  public addChild(child: any): this {
    (this as any).root.push(child);
    return this;
  }
}

class MathMatrixElement extends XmlComponent {
  constructor(children: Array<XmlComponent>) {
    super("m:e");
    for (const c of children) this.root.push(c);
  }
}

class MathMatrixRow extends XmlComponent {
  constructor(elements: Array<XmlComponent>) {
    super("m:mr");
    for (const e of elements) this.root.push(e);
  }
}

class MathMatrixBlock extends XmlComponent {
  constructor(rows: Array<XmlComponent>) {
    super("m:m");
    for (const r of rows) this.root.push(r);
  }
}

class MathDelimited extends XmlComponent {
  constructor(open: string, close: string, children: Array<XmlComponent>) {
    super("m:d");
    const dPr = new GenericXmlComponent("m:dPr");
    if (open) {
      dPr.addChild(new GenericXmlComponent("m:begChr", [{ _attr: { "m:val": open } }]));
    }
    if (close) {
      dPr.addChild(new GenericXmlComponent("m:endChr", [{ _attr: { "m:val": close } }]));
    }
    this.root.push(dPr);
    const e = new GenericXmlComponent("m:e", children);
    this.root.push(e);
  }
}

function createDocxMatrix(env: string, rows: string[][]): XmlComponent {
  const [open, close] =
    env === "vmatrix" ? ["|", "|"] :
    env === "Vmatrix" ? ["‖", "‖"] :
    env === "bmatrix" ? ["[", "]"] :
    env === "pmatrix" ? ["(", ")"] :
    ["", ""];

  const rowComponents = rows.map((r) => {
    const elComponents = r.map((cell) => new MathMatrixElement([new MathRun(cell)]));
    return new MathMatrixRow(elComponents);
  });

  const matrix = new MathMatrixBlock(rowComponents);
  if (open || close) {
    return new MathDelimited(open, close, [matrix]);
  }
  return matrix;
}

class MathIntegralBlock extends XmlComponent {
  constructor(symbol: string, lower?: string, upper?: string) {
    super("m:nary");
    const naryPr = new GenericXmlComponent("m:naryPr");
    if (symbol) {
      naryPr.addChild(new GenericXmlComponent("m:chr", [{ _attr: { "m:val": symbol } }]));
    }
    naryPr.addChild(new GenericXmlComponent("m:limLoc", [{ _attr: { "m:val": "subSup" } }]));
    this.root.push(naryPr);

    if (lower) {
      this.root.push(new GenericXmlComponent("m:sub", [new MathRun(lower)]));
    }
    if (upper) {
      this.root.push(new GenericXmlComponent("m:sup", [new MathRun(upper)]));
    }
    this.root.push(new GenericXmlComponent("m:e"));
  }
}

function drawInlineFraction(
  doc: PDFKit.PDFDocument,
  whole: string | undefined,
  num: string,
  den: string,
  x: number,
  y: number,
  fontSize: number,
  color: string = "#0f172a",
  bold: boolean = false,
  hasBanglaFont: boolean = false
): number {
  const fracFontSize = Math.max(7, Math.round(fontSize * 0.72));
  let currentX = x;

  const setFont = (isBangla: boolean, isBold: boolean, size: number) => {
    doc.fontSize(size);
    if (isBangla && hasBanglaFont) {
      doc.font(isBold ? "BanglaFont-Bold" : "BanglaFont");
    } else {
      doc.font(isBold ? "MathFont-Bold" : "MathFont");
    }
  };

  // 1. Draw whole number if present
  if (whole && whole.trim()) {
    const isBangla = /[\u0980-\u09FF]/.test(whole);
    setFont(isBangla, bold, fontSize);
    doc.fillColor(color);
    doc.text(whole.trim(), currentX, y, { lineBreak: false });
    currentX += doc.widthOfString(whole.trim()) + 3;
  }

  // 2. Measure num and den with tokenized font selection
  const numWidth = measureTokenizedString(doc, num || " ", fracFontSize, bold, hasBanglaFont);
  const denWidth = measureTokenizedString(doc, den || " ", fracFontSize, bold, hasBanglaFont);

  // Fraction line width: maximum of num/den plus 6pt padding (3pt on each side)
  const barWidth = Math.max(numWidth, denWidth) + 6;

  // Visual math axis: vertically aligned with '-', '+', and '=' of surrounding text
  const barY = y + Math.round(fontSize * 0.68);

  // 3. Draw fraction bar (crisp horizontal straight line)
  doc
    .save()
    .moveTo(currentX, barY)
    .lineTo(currentX + barWidth, barY)
    .lineWidth(0.8)
    .strokeColor(color)
    .stroke()
    .restore();

  // 4. Draw Numerator: centered above bar with clean 2.5pt clearance
  const numX = currentX + (barWidth - numWidth) / 2;
  const numY = barY - 2.5 - Math.round(1.08 * fracFontSize);
  drawTokenizedString(doc, num, numX, numY, fracFontSize, bold, color, hasBanglaFont);

  // 5. Draw Denominator: centered below bar with clean 2.5pt clearance
  const denX = currentX + (barWidth - denWidth) / 2;
  const denY = barY + 2.5 - Math.round(0.38 * fracFontSize);
  drawTokenizedString(doc, den, denX, denY, fracFontSize, bold, color, hasBanglaFont);

  return (currentX - x) + barWidth;
}

function measureInlineFraction(
  doc: PDFKit.PDFDocument,
  whole: string | undefined,
  num: string,
  den: string,
  fontSize: number,
  bold: boolean = false,
  hasBanglaFont: boolean = false
): number {
  const cache = getDocCache(doc);
  const fracKey = `f\0${whole || ""}\0${num}\0${den}\0${fontSize}\0${bold ? 1 : 0}\0${hasBanglaFont ? 1 : 0}`;
  const cached = cache.tokenMeasureCache.get(fracKey);
  if (cached !== undefined) return cached;

  const fracFontSize = Math.max(7, Math.round(fontSize * 0.72));
  let width = 0;

  if (whole && whole.trim()) {
    width += measureTokenizedString(doc, whole.trim(), fontSize, bold, hasBanglaFont) + 3;
  }

  const numWidth = measureTokenizedString(doc, num || " ", fracFontSize, bold, hasBanglaFont);
  const denWidth = measureTokenizedString(doc, den || " ", fracFontSize, bold, hasBanglaFont);

  width += Math.max(numWidth, denWidth) + 6;
  cache.tokenMeasureCache.set(fracKey, width);
  return width;
}

function measureInlineMatrix(
  doc: PDFKit.PDFDocument,
  env: string,
  rows: string[][],
  fontSize: number,
  bold: boolean = false,
  hasBanglaFont: boolean = false
): { width: number; height: number; colWidths: number[]; rowHeight: number } {
  const numRows = rows.length;
  const numCols = Math.max(...rows.map((r) => r.length));
  const matrixFontSize = Math.max(9, Math.round(fontSize * 0.88));

  const colWidths: number[] = [];
  for (let c = 0; c < numCols; c++) {
    let maxW = 0;
    for (let r = 0; r < numRows; r++) {
      const cellText = rows[r]?.[c] || "";
      const w = measureTokenizedString(doc, cellText, matrixFontSize, bold, hasBanglaFont);
      if (w > maxW) maxW = w;
    }
    colWidths.push(maxW + 8);
  }

  const contentWidth = colWidths.reduce((a, b) => a + b, 0);
  const pad = env === "matrix" ? 4 : 10;
  const totalWidth = contentWidth + pad * 2;
  const rowHeight = Math.max(12, Math.round(matrixFontSize * 1.35));
  const totalHeight = numRows * rowHeight + 4;

  return { width: totalWidth, height: totalHeight, colWidths, rowHeight };
}

function drawInlineMatrix(
  doc: PDFKit.PDFDocument,
  env: string,
  rows: string[][],
  x: number,
  y: number,
  fontSize: number,
  color: string = "#0f172a",
  bold: boolean = false,
  hasBanglaFont: boolean = false
): number {
  const { width: totalWidth, height: totalHeight, colWidths, rowHeight } = measureInlineMatrix(
    doc,
    env,
    rows,
    fontSize,
    bold,
    hasBanglaFont
  );
  const matrixFontSize = Math.max(9, Math.round(fontSize * 0.88));
  const pad = env === "matrix" ? 4 : 10;

  const topY = y + 2;
  const bottomY = topY + totalHeight;

  // Draw cells
  for (let r = 0; r < rows.length; r++) {
    const rowY = topY + 2 + r * rowHeight;
    let cellX = x + pad;
    for (let c = 0; c < colWidths.length; c++) {
      const cellText = rows[r]?.[c] || "";
      const w = measureTokenizedString(doc, cellText, matrixFontSize, bold, hasBanglaFont);
      const alignX = cellX + (colWidths[c] - w) / 2;
      drawTokenizedString(doc, cellText, alignX, rowY, matrixFontSize, bold, color, hasBanglaFont);
      cellX += colWidths[c];
    }
  }

  // Draw vector brackets / bars
  doc.save().lineWidth(0.9).strokeColor(color);
  if (env === "bmatrix") {
    doc.moveTo(x + 5, topY).lineTo(x + 2, topY).lineTo(x + 2, bottomY).lineTo(x + 5, bottomY).stroke();
    doc.moveTo(x + totalWidth - 5, topY).lineTo(x + totalWidth - 2, topY).lineTo(x + totalWidth - 2, bottomY).lineTo(x + totalWidth - 5, bottomY).stroke();
  } else if (env === "vmatrix") {
    doc.moveTo(x + 3, topY).lineTo(x + 3, bottomY).stroke();
    doc.moveTo(x + totalWidth - 3, topY).lineTo(x + totalWidth - 3, bottomY).stroke();
  } else if (env === "Vmatrix") {
    doc.moveTo(x + 2, topY).lineTo(x + 2, bottomY).stroke();
    doc.moveTo(x + 4.5, topY).lineTo(x + 4.5, bottomY).stroke();
    doc.moveTo(x + totalWidth - 4.5, topY).lineTo(x + totalWidth - 4.5, bottomY).stroke();
    doc.moveTo(x + totalWidth - 2, topY).lineTo(x + totalWidth - 2, bottomY).stroke();
  } else if (env === "pmatrix") {
    doc.moveTo(x + 5, topY).bezierCurveTo(x + 1, topY + totalHeight * 0.35, x + 1, topY + totalHeight * 0.65, x + 5, bottomY).stroke();
    doc.moveTo(x + totalWidth - 5, topY).bezierCurveTo(x + totalWidth - 1, topY + totalHeight * 0.35, x + totalWidth - 1, topY + totalHeight * 0.65, x + totalWidth - 5, bottomY).stroke();
  }
  doc.restore();

  return totalWidth;
}

function measureInlineLimit(
  doc: PDFKit.PDFDocument,
  condition: string,
  fontSize: number,
  bold: boolean = false,
  hasBanglaFont: boolean = false
): { width: number; height: number } {
  const baseWidth = measureTokenizedString(doc, "lim", fontSize, bold, hasBanglaFont);
  const condFontSize = Math.max(7, Math.round(fontSize * 0.72));
  const condWidth = measureTokenizedString(doc, condition, condFontSize, false, hasBanglaFont);
  const limitWidth = Math.max(baseWidth, condWidth) + 4;
  return { width: limitWidth, height: fontSize + condFontSize };
}

function drawInlineLimit(
  doc: PDFKit.PDFDocument,
  condition: string,
  x: number,
  y: number,
  fontSize: number,
  color: string = "#0f172a",
  bold: boolean = false,
  hasBanglaFont: boolean = false
): number {
  const baseWidth = measureTokenizedString(doc, "lim", fontSize, bold, hasBanglaFont);
  const condFontSize = Math.max(7, Math.round(fontSize * 0.72));
  const condWidth = measureTokenizedString(doc, condition, condFontSize, false, hasBanglaFont);
  const limitWidth = Math.max(baseWidth, condWidth) + 4;

  const limX = x + (limitWidth - baseWidth) / 2;
  drawTokenizedString(doc, "lim", limX, y, fontSize, bold, color, hasBanglaFont);

  const condX = x + (limitWidth - condWidth) / 2;
  const condY = y + Math.round(fontSize * 0.82);
  drawTokenizedString(doc, condition, condX, condY, condFontSize, false, color, hasBanglaFont);

  return limitWidth;
}

function measureInlineIntegral(
  doc: PDFKit.PDFDocument,
  symbol: string,
  lower: string | undefined,
  upper: string | undefined,
  fontSize: number,
  bold: boolean = false,
  hasBanglaFont: boolean = false
): number {
  const intFontSize = Math.round(fontSize * 1.35);
  doc.fontSize(intFontSize);
  const symWidth = doc.widthOfString(symbol);
  const subSupFontSize = Math.max(7, Math.round(fontSize * 0.70));
  const lowerWidth = lower ? measureTokenizedString(doc, lower, subSupFontSize, false, hasBanglaFont) : 0;
  const upperWidth = upper ? measureTokenizedString(doc, upper, subSupFontSize, false, hasBanglaFont) : 0;
  const limitsWidth = Math.max(lowerWidth, upperWidth);
  return symWidth + (limitsWidth > 0 ? limitsWidth + 2 : 2);
}

function drawInlineIntegral(
  doc: PDFKit.PDFDocument,
  symbol: string,
  lower: string | undefined,
  upper: string | undefined,
  x: number,
  y: number,
  fontSize: number,
  color: string = "#0f172a",
  bold: boolean = false,
  hasBanglaFont: boolean = false
): number {
  const intFontSize = Math.round(fontSize * 1.35);
  doc.fontSize(intFontSize).font(bold ? "MathFont-Bold" : "MathFont").fillColor(color);
  const symWidth = doc.widthOfString(symbol);
  const subSupFontSize = Math.max(7, Math.round(fontSize * 0.70));

  const intY = y - Math.round(fontSize * 0.18);
  doc.text(symbol, x, intY, { lineBreak: false });

  if (upper) {
    const upperX = x + symWidth - 0.5;
    const upperY = y - Math.round(fontSize * 0.25);
    drawTokenizedString(doc, upper, upperX, upperY, subSupFontSize, false, color, hasBanglaFont);
  }
  if (lower) {
    const lowerX = x + symWidth - 2.5;
    const lowerY = y + Math.round(fontSize * 0.75);
    drawTokenizedString(doc, lower, lowerX, lowerY, subSupFontSize, false, color, hasBanglaFont);
  }

  const lowerWidth = lower ? measureTokenizedString(doc, lower, subSupFontSize, false, hasBanglaFont) : 0;
  const upperWidth = upper ? measureTokenizedString(doc, upper, subSupFontSize, false, hasBanglaFont) : 0;
  const limitsWidth = Math.max(lowerWidth, upperWidth);
  return symWidth + (limitsWidth > 0 ? limitsWidth + 2 : 2);
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

const globalParseMathCache = new Map<string, LayoutItem[]>();

function parseTextWithMath(rawText: string): LayoutItem[] {
  if (!rawText) return [];
  const cached = globalParseMathCache.get(rawText);
  if (cached) return cached;

  const text = convertBracketMatricesToLatex(rawText);
  const items: LayoutItem[] = [];
  let idx = 0;

  const pushWords = (chunk: string) => {
    if (!chunk) return;
    const words = chunk.split(/(\s+)/);
    for (const w of words) {
      if (w) items.push({ type: "word", text: w });
    }
  };

  while (idx < text.length) {
    // 1. Matrix: \begin{bmatrix}...\end{bmatrix} etc.
    const matrixMatch = text.slice(idx).match(/^\\begin\{(bmatrix|pmatrix|vmatrix|Vmatrix|matrix)\}([\s\S]*?)\\end\{\1\}/);
    if (matrixMatch) {
      const env = matrixMatch[1] as "bmatrix" | "pmatrix" | "vmatrix" | "Vmatrix" | "matrix";
      const body = matrixMatch[2];
      const rows = body
        .split(/\\\\+|\s*\\cr\s*/)
        .map((r) => r.trim())
        .filter((r) => r.length > 0)
        .map((r) => r.split("&").map((c) => c.trim()).filter((c) => c.length > 0));
      items.push({ type: "matrix", env, rows });
      idx += matrixMatch[0].length;
      continue;
    }

    // 2. Limit: \lim_{...}
    if (text.startsWith("\\lim", idx)) {
      let condStart = idx + 4;
      while (text[condStart] === " ") condStart++;
      if (text[condStart] === "_") {
        let braceStart = condStart + 1;
        while (text[braceStart] === " ") braceStart++;
        if (text[braceStart] === "{") {
          const b = extractBalancedBraces(text, braceStart);
          if (b) {
            items.push({ type: "limit", condition: b.content.trim() });
            idx = b.endIndex + 1;
            continue;
          }
        }
      }
    }

    // 3. Integral: \int_{lower}^{upper} or \int or \iint or \oint or unicode ∫, ∬, ∭, ∮
    const intMatch = text.slice(idx).match(/^(?:\\(int|iint|iiint|oint)|([∫∬∭∮]))(?:_\{([^}]+)\}\^\{([^}]+)\}|_\{([^}]+)\}|\^\{([^}]+)\}|_([^\s^]+)\^([^\s_]+)|_([^\s]+)|\^([^\s]+))?/);
    if (intMatch) {
      const symName = intMatch[1];
      const symbol = symName
        ? (symName === "iint" ? "∬" : symName === "iiint" ? "∭" : symName === "oint" ? "∮" : "∫")
        : (intMatch[2] || "∫");
      const lower = intMatch[3] || intMatch[5] || intMatch[7] || intMatch[9];
      const upper = intMatch[4] || intMatch[6] || intMatch[8] || intMatch[10];
      items.push({
        type: "integral",
        symbol,
        lower: lower ? lower.trim() : undefined,
        upper: upper ? upper.trim() : undefined
      });
      idx += intMatch[0].length;
      continue;
    }

    // 4. Fraction: \frac{num}{den} with optional preceding whole number
    if (text.startsWith("\\frac", idx)) {
      let whole: string | undefined = undefined;
      if (items.length > 0 && items[items.length - 1].type === "word") {
        const lastWord = (items[items.length - 1] as WordItem).text.trim();
        if (/^[\d\u09E6-\u09EF]+$/.test(lastWord)) {
          whole = lastWord;
          items.pop();
          if (items.length > 0 && items[items.length - 1].type === "word" && !(items[items.length - 1] as WordItem).text.trim()) {
            items.pop();
          }
        }
      }

      const num = extractBalancedBraces(text, idx + 5);
      if (num) {
        const den = extractBalancedBraces(text, num.endIndex + 1);
        if (den) {
          items.push({ type: "fraction", whole, num: num.content, den: den.content });
          idx = den.endIndex + 1;
          continue;
        }
      }
    }

    // Advance to next special token
    const nextSpecial = text.slice(idx + 1).search(/\\begin\{(?:bmatrix|pmatrix|vmatrix|Vmatrix|matrix)\}|\\lim|\\int|\\iint|\\iiint|\\oint|[∫∬∭∮]|\\frac/);
    if (nextSpecial === -1) {
      pushWords(text.slice(idx));
      break;
    } else {
      pushWords(text.slice(idx, idx + 1 + nextSpecial));
      idx = idx + 1 + nextSpecial;
    }
  }

  if (globalParseMathCache.size < 5000) {
    globalParseMathCache.set(rawText, items);
  }
  return items;
}

const parseTextWithFractions = parseTextWithMath;

const NON_BANGLA_MATH_REGEX = /([\u002B\u002D\u003C-\u003E\u00B0-\u00B3\u00B7\u00B9\u00D7\u00F7\u02B0-\u02FF\u0370-\u03FF\u1D00-\u1DBF\u2016\u2022\u2070-\u209F\u2100-\u214F\u2190-\u21FF\u2200-\u22FF\u2300-\u23FF\u25A0-\u25FF\u27C0-\u27EF\u2980-\u29FF\u2A00-\u2AFF\|\[\]\^]+)/g;

function isMathSymbolOrOperator(tok: string): boolean {
  const t = tok.trim();
  return /^[+\-−–—×*·÷=±∓<>≤≥≠≈≡~·∈∉∋⊂⊆⊃⊇∪∩∖∂∇→⇒↔⇔∴∵]+$/.test(t) || t === "×" || t === "÷";
}

function getMathOpVerticalOffset(fontSize: number, hasBanglaFont: boolean): { size: number; yOffset: number } {
  // Moderate scaling so operators are crisp, clear, and visible
  const opFontSize = Math.round(fontSize * 1.12);
  if (hasBanglaFont) {
    // Kalpurush visual math axis center from top-left y: ~0.672 * fontSize
    // Segoe UI Symbol operator center in PDFKit from top-left y: (1613 / 2048) * opFontSize
    // yOffset shifts Segoe symbol upward to match Kalpurush math axis:
    const kalAxis = 0.672 * fontSize;
    const segCenter = (1613 / 2048) * opFontSize;
    const yOffset = Math.round(kalAxis - segCenter);
    return { size: opFontSize, yOffset };
  }
  // Pure Latin / English text with Segoe UI Symbol:
  const segDigitCenter = (1493 / 2048) * fontSize;
  const segCenter = (1613 / 2048) * opFontSize;
  const yOffset = Math.round(segDigitCenter - segCenter);
  return { size: opFontSize, yOffset };
}

interface PdfRenderCache {
  widthCache: Map<string, number>;
  tokenMeasureCache: Map<string, number>;
  parseMathCache: Map<string, LayoutItem[]>;
  layoutCache: Map<string, Array<{ items: Array<LayoutItem & { width: number }>; totalWidth: number; lineHeight: number }>>;
  measurePdfTextCache: Map<string, number>;
}

function getDocCache(doc: PDFKit.PDFDocument): PdfRenderCache {
  let cache = (doc as any)._qpaperCache;
  if (!cache) {
    cache = {
      widthCache: new Map<string, number>(),
      tokenMeasureCache: new Map<string, number>(),
      parseMathCache: new Map<string, LayoutItem[]>(),
      layoutCache: new Map<string, Array<{ items: Array<LayoutItem & { width: number }>; totalWidth: number; lineHeight: number }>>(),
      measurePdfTextCache: new Map<string, number>()
    };
    (doc as any)._qpaperCache = cache;
  }
  return cache;
}

function getCachedWidth(doc: PDFKit.PDFDocument, fontName: string, fontSize: number, text: string): number {
  if (!text) return 0;
  const cache = getDocCache(doc);
  const key = `${fontName}\0${fontSize}\0${text}`;
  let w = cache.widthCache.get(key);
  if (w === undefined) {
    doc.fontSize(fontSize);
    doc.font(fontName);
    w = doc.widthOfString(text);
    cache.widthCache.set(key, w);
  }
  return w;
}

function measureTokenizedString(
  doc: PDFKit.PDFDocument,
  text: string,
  fontSize: number,
  bold: boolean,
  hasBanglaFont: boolean
): number {
  if (!text) return 0;
  const cache = getDocCache(doc);
  const cacheKey = `${text}\0${fontSize}\0${bold ? 1 : 0}\0${hasBanglaFont ? 1 : 0}`;
  const cached = cache.tokenMeasureCache.get(cacheKey);
  if (cached !== undefined) return cached;

  let result = 0;
  const isBangla = /[\u0964\u0965\u0980-\u09FF]/.test(text) && hasBanglaFont;
  const hasSpecialMath = NON_BANGLA_MATH_REGEX.test(text);
  NON_BANGLA_MATH_REGEX.lastIndex = 0;

  if (!isBangla && !hasSpecialMath) {
    const isOp = isMathSymbolOrOperator(text);
    const { size } = isOp ? getMathOpVerticalOffset(fontSize, hasBanglaFont) : { size: fontSize };
    const fontName = bold ? "MathFont-Bold" : "MathFont";
    result = getCachedWidth(doc, fontName, size, text);
  } else if (!hasSpecialMath) {
    const fontName = bold ? "BanglaFont-Bold" : "BanglaFont";
    result = getCachedWidth(doc, fontName, fontSize, text);
  } else {
    const tokens = text.split(NON_BANGLA_MATH_REGEX).filter(Boolean);
    let w = 0;
    for (const tok of tokens) {
      const isMathGlyph = NON_BANGLA_MATH_REGEX.test(tok);
      NON_BANGLA_MATH_REGEX.lastIndex = 0;
      const isOp = isMathSymbolOrOperator(tok);
      const { size } = isOp ? getMathOpVerticalOffset(fontSize, hasBanglaFont) : { size: fontSize };
      const fontName = isMathGlyph ? (bold ? "MathFont-Bold" : "MathFont") : (bold ? "BanglaFont-Bold" : "BanglaFont");
      w += getCachedWidth(doc, fontName, size, tok);
    }
    result = w;
  }

  cache.tokenMeasureCache.set(cacheKey, result);
  return result;
}

function drawTokenizedString(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  bold: boolean,
  color: string,
  hasBanglaFont: boolean
): number {
  doc.fillColor(color);
  const isBangla = /[\u0964\u0965\u0980-\u09FF]/.test(text) && hasBanglaFont;
  const hasSpecialMath = NON_BANGLA_MATH_REGEX.test(text);
  NON_BANGLA_MATH_REGEX.lastIndex = 0;

  if (!isBangla && !hasSpecialMath) {
    const isOp = isMathSymbolOrOperator(text);
    const { size, yOffset } = isOp ? getMathOpVerticalOffset(fontSize, hasBanglaFont) : { size: fontSize, yOffset: 0 };
    const fontName = bold ? "MathFont-Bold" : "MathFont";
    doc.fontSize(size);
    doc.font(fontName);
    doc.text(text, x, y + yOffset, { lineBreak: false });
    return getCachedWidth(doc, fontName, size, text);
  }

  if (!hasSpecialMath) {
    const fontName = bold ? "BanglaFont-Bold" : "BanglaFont";
    doc.fontSize(fontSize);
    doc.font(fontName);
    doc.text(text, x, y, { lineBreak: false });
    return getCachedWidth(doc, fontName, fontSize, text);
  }

  const tokens = text.split(NON_BANGLA_MATH_REGEX).filter(Boolean);
  let curX = x;
  for (const tok of tokens) {
    const isMathGlyph = NON_BANGLA_MATH_REGEX.test(tok);
    NON_BANGLA_MATH_REGEX.lastIndex = 0;
    const isOp = isMathSymbolOrOperator(tok);
    const { size, yOffset } = isOp ? getMathOpVerticalOffset(fontSize, hasBanglaFont) : { size: fontSize, yOffset: 0 };
    const fontName = isMathGlyph ? (bold ? "MathFont-Bold" : "MathFont") : (bold ? "BanglaFont-Bold" : "BanglaFont");
    doc.fontSize(size);
    doc.font(fontName);
    doc.text(tok, curX, y + yOffset, { lineBreak: false });
    curX += getCachedWidth(doc, fontName, size, tok);
  }
  return curX - x;
}

function layoutTextWithMath(
  doc: PDFKit.PDFDocument,
  items: LayoutItem[],
  width: number,
  fontSize: number,
  hasBanglaFont: boolean,
  bold: boolean,
  lineGap: number = 1,
  cacheKey?: string
): Array<{ items: Array<LayoutItem & { width: number }>; totalWidth: number; lineHeight: number }> {
  const cache = getDocCache(doc);
  const layoutKey = cacheKey ? `${cacheKey}\0${width}\0${fontSize}\0${hasBanglaFont ? 1 : 0}\0${bold ? 1 : 0}\0${lineGap}` : "";
  if (layoutKey) {
    const cached = cache.layoutCache.get(layoutKey);
    if (cached) return cached;
  }

  const lines: Array<{ items: Array<LayoutItem & { width: number }>; totalWidth: number; lineHeight: number }> = [];
  let currentLine: Array<LayoutItem & { width: number }> = [];
  let currentLineWidth = 0;

  const computeLineHeight = (lineItems: Array<LayoutItem & { width: number }>): number => {
    let lineH = Math.max(14, Math.round(fontSize * 1.45 + lineGap));
    for (const it of lineItems) {
      if (it.type === "matrix") {
        lineH = Math.max(lineH, (it.height ?? 26) + 8);
      } else if (it.type === "limit") {
        lineH = Math.max(lineH, Math.round(fontSize * 1.75));
      } else if (it.type === "fraction") {
        lineH = Math.max(lineH, Math.round(fontSize * 1.48));
      } else if (it.type === "integral" && (it.lower || it.upper)) {
        lineH = Math.max(lineH, Math.round(fontSize * 1.48));
      }
    }
    return lineH;
  };

  for (const rawItem of items) {
    let itemWidth = 0;
    if (rawItem.type === "word") {
      itemWidth = measureTokenizedString(doc, rawItem.text, fontSize, bold, hasBanglaFont);
    } else if (rawItem.type === "fraction") {
      itemWidth = measureInlineFraction(doc, rawItem.whole, rawItem.num, rawItem.den, fontSize, bold, hasBanglaFont);
    } else if (rawItem.type === "matrix") {
      const mSize = measureInlineMatrix(doc, rawItem.env, rawItem.rows, fontSize, bold, hasBanglaFont);
      rawItem.height = mSize.height;
      itemWidth = mSize.width;
    } else if (rawItem.type === "limit") {
      const lSize = measureInlineLimit(doc, rawItem.condition, fontSize, bold, hasBanglaFont);
      rawItem.height = lSize.height;
      itemWidth = lSize.width;
    } else if (rawItem.type === "integral") {
      itemWidth = measureInlineIntegral(doc, rawItem.symbol, rawItem.lower, rawItem.upper, fontSize, bold, hasBanglaFont);
    }

    const item = { ...rawItem, width: itemWidth };

    // Avoid leading whitespace at beginning of line
    if (currentLine.length === 0 && item.type === "word" && !item.text.trim()) {
      continue;
    }

    if (currentLineWidth + itemWidth > width && currentLine.length > 0) {
      let carriedItems: Array<LayoutItem & { width: number }> = [];
      if (item.type === "matrix") {
        // Check if currentLine ends with something like ["C", " ", "=", " "]
        let trimIdx = currentLine.length;
        while (trimIdx > 0) {
          const prev = currentLine[trimIdx - 1];
          if (prev && prev.type === "word" && !prev.text.trim()) {
            trimIdx--;
          } else {
            break;
          }
        }
        const eqToken = trimIdx > 0 ? currentLine[trimIdx - 1] : undefined;
        if (eqToken && eqToken.type === "word" && eqToken.text.trim() === "=") {
          trimIdx--;
          while (trimIdx > 0) {
            const prev = currentLine[trimIdx - 1];
            if (prev && prev.type === "word" && !prev.text.trim()) {
              trimIdx--;
            } else {
              break;
            }
          }
          const varToken = trimIdx > 0 ? currentLine[trimIdx - 1] : undefined;
          if (varToken && varToken.type === "word" && /^[a-zA-Z\u0980-\u09FF\d_]+$/.test(varToken.text.trim())) {
            trimIdx--;
            if (trimIdx > 0) {
              carriedItems = currentLine.slice(trimIdx);
              currentLine = currentLine.slice(0, trimIdx);
              currentLineWidth = currentLine.reduce((acc, it) => acc + it.width, 0);
            }
          }
        }
      }

      lines.push({ items: currentLine, totalWidth: currentLineWidth, lineHeight: computeLineHeight(currentLine) });
      if (item.type === "word" && !item.text.trim()) {
        currentLine = [];
        currentLineWidth = 0;
      } else {
        currentLine = [...carriedItems, item];
        currentLineWidth = currentLine.reduce((acc, it) => acc + it.width, 0);
      }
    } else {
      currentLine.push(item);
      currentLineWidth += itemWidth;
    }
  }

  if (currentLine.length > 0) {
    lines.push({ items: currentLine, totalWidth: currentLineWidth, lineHeight: computeLineHeight(currentLine) });
  }

  const result = lines.length > 0
    ? lines
    : [{ items: [], totalWidth: 0, lineHeight: Math.max(13, Math.round(fontSize * 1.38 + lineGap)) }];

  if (layoutKey) {
    cache.layoutCache.set(layoutKey, result);
  }
  return result;
}

const layoutTextWithFractions = layoutTextWithMath;

function drawPdfText(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  hasBanglaFont: boolean,
  options: {
    width?: number;
    align?: "left" | "center" | "right";
    fontSize?: number;
    bold?: boolean;
    color?: string;
    lineGap?: number;
  } = {}
): void {
  const { width = 400, align = "left", fontSize = 11, bold = false, color = "#0f172a", lineGap = 1 } = options;

  doc.fontSize(fontSize);
  doc.fillColor(color);

  // Normalize punctuation spacing: never allow orphan spaces before ?, !, :, etc.
  const normalizedText = text.replace(/\s+([?,.!;:])(?=\s|$)/g, "$1");

  const hasMathBlock = /\\frac|\\begin\{(?:bmatrix|pmatrix|vmatrix|Vmatrix|matrix)\}|\[\s*\[|\|\s*\[|\\lim|\\(int|iint|iiint|oint)\b/.test(normalizedText);
  const hasSpecialMath = NON_BANGLA_MATH_REGEX.test(normalizedText);
  NON_BANGLA_MATH_REGEX.lastIndex = 0;

  // Plain text without any complex math blocks or math symbols/operators:
  if (!hasMathBlock && !hasSpecialMath) {
    const isBangla = /[\u0980-\u09FF]/.test(normalizedText) && hasBanglaFont;
    doc.font(isBangla ? (bold ? "BanglaFont-Bold" : "BanglaFont") : (bold ? "MathFont-Bold" : "MathFont"));
    doc.text(normalizedText, x, y, { width, align, lineGap });
    return;
  }

  // Text contains fractions, matrices, limits, or integrals: wrap and draw with token positioning
  const items = parseTextWithMath(normalizedText);
  const lines = layoutTextWithMath(doc, items, width, fontSize, hasBanglaFont, bold, lineGap, normalizedText);

  let currentY = y;
  lines.forEach((line) => {
    let curX = x;
    if (align === "center") {
      curX = x + Math.max(0, (width - line.totalWidth) / 2);
    } else if (align === "right") {
      curX = x + Math.max(0, width - line.totalWidth);
    }

    const maxMatrixH = line.items.reduce((max, it) => it.type === "matrix" ? Math.max(max, it.height ?? 0) : max, 0);

    for (const item of line.items) {
      const yOffset = maxMatrixH > 0 && item.type !== "matrix"
        ? Math.max(0, Math.round((maxMatrixH - fontSize) / 2))
        : 0;

      if (item.type === "word") {
        drawTokenizedString(doc, item.text, curX, currentY + yOffset, fontSize, bold, color, hasBanglaFont);
      } else if (item.type === "fraction") {
        drawInlineFraction(doc, item.whole, item.num, item.den, curX, currentY + yOffset, fontSize, color, bold, hasBanglaFont);
      } else if (item.type === "matrix") {
        drawInlineMatrix(doc, item.env, item.rows, curX, currentY, fontSize, color, bold, hasBanglaFont);
      } else if (item.type === "limit") {
        drawInlineLimit(doc, item.condition, curX, currentY + yOffset, fontSize, color, bold, hasBanglaFont);
      } else if (item.type === "integral") {
        drawInlineIntegral(doc, item.symbol, item.lower, item.upper, curX, currentY + yOffset, fontSize, color, bold, hasBanglaFont);
      }
      curX += item.width;
    }

    currentY += line.lineHeight;
  });
}

function measurePdfText(
  doc: PDFKit.PDFDocument,
  text: string,
  width: number,
  fontSize: number,
  hasBanglaFont: boolean,
  bold: boolean = false
): number {
  if (!text) return 0;
  const cache = getDocCache(doc);
  const cacheKey = `${text}\0${width}\0${fontSize}\0${hasBanglaFont ? 1 : 0}\0${bold ? 1 : 0}`;
  const cached = cache.measurePdfTextCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const normalizedText = text.replace(/\s+([?,.!;:])(?=\s|$)/g, "$1");
  const hasMathBlock = /\\frac|\\begin\{(?:bmatrix|pmatrix|vmatrix|Vmatrix|matrix)\}|\[\s*\[|\|\s*\[|\\lim|\\(int|iint|iiint|oint)\b/.test(normalizedText);
  const hasSpecialMath = NON_BANGLA_MATH_REGEX.test(normalizedText);
  NON_BANGLA_MATH_REGEX.lastIndex = 0;

  let h = 0;
  if (!hasMathBlock && !hasSpecialMath) {
    doc.fontSize(fontSize);
    const isBangla = /[\u0980-\u09FF]/.test(normalizedText) && hasBanglaFont;
    doc.font(isBangla ? (bold ? "BanglaFont-Bold" : "BanglaFont") : (bold ? "MathFont-Bold" : "MathFont"));
    h = doc.heightOfString(normalizedText, { width, lineGap: 1 });
  } else {
    const items = parseTextWithMath(normalizedText);
    const lines = layoutTextWithMath(doc, items, width, fontSize, hasBanglaFont, bold, 1, normalizedText);
    h = lines.reduce((sum, line) => sum + line.lineHeight, 0);
  }

  cache.measurePdfTextCache.set(cacheKey, h);
  return h;
}

function drawHeader(
  doc: PDFKit.PDFDocument,
  paper: Paper,
  hasBanglaFont: boolean,
  instLogoAsset?: ImageAsset | null,
  options?: { branding?: boolean }
): number {
  const isBangla = hasBanglaFont && (/[\u0980-\u09FF]/.test(paper.name + paper.subject) || !paper.subject?.toLowerCase().includes("english"));
  const cleanName = isBangla
    ? getBengaliPaperTitle(paper.name, paper.className, paper.subject)
    : formatMathForExport(paper.name);
  const cleanInstructions = paper.instructions ? formatMathForExport(paper.instructions) : "";
  const headerWidth = page.width - page.marginSide * 2;

  // Format Duration & Marks cleanly
  const durationFormatted = isBangla ? formatBengaliDuration(paper.duration) : (paper.duration || "2 hours");
  const timeText = isBangla ? `সময়: ${durationFormatted}` : `Time: ${paper.duration}`;
  const marksText = isBangla ? `পূর্ণমান: ${toBengaliDigits(paper.totalMarks)}` : `Marks: ${paper.totalMarks}`;

  let currentY = 22;

  // 1. Top Bar: Set Badge & Institute (guarantees zero collision with Exam Title)
  const canBrand = options?.branding !== false;
  const hasInstitute = Boolean(canBrand && paper.institute && paper.institute.trim());
  const hasInstLogo = Boolean(canBrand && instLogoAsset);
  const hasSet = Boolean(paper.setName && paper.setName.trim());

  if (hasInstitute || hasSet || hasInstLogo) {
    if (hasSet) {
      const banglaSetMap: Record<string, string> = { A: "ক", B: "খ", C: "গ", D: "ঘ" };
      const displaySet = isBangla ? (banglaSetMap[paper.setName!.trim().toUpperCase()] || paper.setName) : paper.setName;
      const setBadgeText = isBangla ? `সেট: ${displaySet}` : `Set: ${displaySet}`;
      const badgeW = 64;
      const badgeH = 18;
      const badgeX = page.width - page.marginSide - badgeW;
      const badgeY = currentY;

      doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3).fillColor("#f0fdfa").fill();
      doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3).strokeColor("#0d9488").lineWidth(0.8).stroke();
      drawPdfText(doc, setBadgeText, badgeX, badgeY + 3, hasBanglaFont, {
        width: badgeW,
        align: "center",
        fontSize: 10,
        bold: true,
        color: "#0f766e"
      });
    }

    if (hasInstLogo && instLogoAsset) {
      try {
        const logoSize = 22;
        doc.image(instLogoAsset.buffer, page.marginSide, currentY - 1, { height: logoSize, width: logoSize });
      } catch {}
    }

    if (hasInstitute) {
      const logoOffset = hasInstLogo ? 28 : 0;
      const rightReserved = hasSet ? 74 : (hasInstLogo ? 28 : 0);
      const instWidth = headerWidth - logoOffset - rightReserved;
      drawPdfText(doc, paper.institute!.trim(), page.marginSide + logoOffset, currentY + 1, hasBanglaFont, {
        width: instWidth,
        align: hasInstLogo ? "left" : "center",
        fontSize: 13,
        bold: true,
        color: "#0f766e"
      });
    }

    currentY += 24;
  } else {
    currentY = 24;
  }

  // 2. Exam Name / Title (Centered, bold, prominent - full width without collision)
  drawPdfText(doc, cleanName, page.marginSide, currentY, hasBanglaFont, {
    width: headerWidth,
    align: "center",
    fontSize: 17,
    bold: true
  });
  const nameHeight = measurePdfText(doc, cleanName, headerWidth, 17, hasBanglaFont, true);

  currentY += Math.max(22, nameHeight + 6);

  // 3. Class & Subject Line (Centered, bold, distinct line)
  const bnClass = isBangla ? getBengaliClass(paper.className) : paper.className;
  const bnSubject = isBangla ? getBengaliSubject(paper.subject) : paper.subject;
  const classLabel = isBangla ? `শ্রেণি: ${bnClass}` : `Class: ${paper.className}`;
  const subjectLabel = isBangla ? `বিষয়: ${bnSubject}` : `Subject: ${paper.subject}`;
  const classSubjectLine = `${classLabel}        |        ${subjectLabel}`;
  drawPdfText(doc, classSubjectLine, page.marginSide, currentY, hasBanglaFont, {
    width: headerWidth,
    align: "center",
    fontSize: 11.5,
    bold: true,
    color: "#0f172a"
  });
  currentY += 18;

  // 4. Time & Marks Line: Left-aligned Time, Right-aligned Marks (Zero collision!)
  drawPdfText(doc, timeText, page.marginSide + 4, currentY, hasBanglaFont, {
    width: headerWidth / 2,
    align: "left",
    fontSize: 10.5,
    color: "#334155"
  });
  drawPdfText(doc, marksText, page.marginSide + headerWidth / 2 - 4, currentY, hasBanglaFont, {
    width: headerWidth / 2,
    align: "right",
    fontSize: 10.5,
    bold: true,
    color: "#334155"
  });
  currentY += 18;

  // 5. Instructions (if present)
  if (cleanInstructions) {
    drawPdfText(doc, cleanInstructions, page.marginSide, currentY, hasBanglaFont, {
      width: headerWidth,
      align: "center",
      fontSize: 9.5,
      color: "#475569"
    });
    const instrHeight = measurePdfText(doc, cleanInstructions, headerWidth, 9.5, hasBanglaFont, false);
    currentY += instrHeight + 5;
  } else {
    currentY += 4;
  }

  // 6. Horizontal separator line
  doc.moveTo(page.marginSide, currentY).lineTo(page.width - page.marginSide, currentY).strokeColor("#cbd5e1").lineWidth(0.8).stroke();
  return currentY + 10;
}

function getQuestionDisplaySerial(question: Question, index: number): string {
  const raw = question.number && question.number.trim() ? question.number.trim() : `${index + 1}`;
  return raw.endsWith(".") || raw.endsWith("।") ? raw : `${raw}.`;
}

function getCleanQuestionTitle(title: string): string {
  const formatted = formatMathForExport(title || "Untitled question");
  return formatted
    .replace(/^(\d+|[\u09E6-\u09EF]+|[A-Za-z]+)[\.\:\)]\s*/, "")
    .replace(/\s+([?,.!;:])(?=\s|$)/g, "$1");
}

function getExportImageSize(image: ImageAsset, isSplit: boolean, isCq: boolean = false) {
  // Standard compact exam diagram dimensions: fits comfortably within column/page without overwhelming questions
  const maxWidth = isSplit ? (isCq ? 145 : 130) : (isCq ? 180 : 160);
  const maxHeight = isSplit ? (isCq ? 80 : 70) : (isCq ? 90 : 80);
  return fitImage(image, maxWidth, maxHeight);
}

const BANGLA_OPTION_LABELS = ["(ক)", "(খ)", "(গ)", "(ঘ)", "(ঙ)", "(চ)"];
const ENGLISH_UPPER_LABELS = ["(A)", "(B)", "(C)", "(D)", "(E)", "(F)"];
const ENGLISH_LOWER_LABELS = ["(a)", "(b)", "(c)", "(d)", "(e)", "(f)"];
const NUMERIC_LABELS = ["(1)", "(2)", "(3)", "(4)", "(5)", "(6)"];

function getOptionExportLabel(
  option: { label?: string; text?: string },
  index: number,
  style?: string,
  isBangla?: boolean
): string {
  if (style === "bangla") {
    return BANGLA_OPTION_LABELS[index] || `(${index + 1})`;
  }
  if (style === "upper-alpha") {
    return ENGLISH_UPPER_LABELS[index] || `(${String.fromCharCode(65 + index)})`;
  }
  if (style === "lower-alpha") {
    return ENGLISH_LOWER_LABELS[index] || `(${String.fromCharCode(97 + index)})`;
  }
  if (style === "numeric") {
    return NUMERIC_LABELS[index] || `(${index + 1})`;
  }
  // Auto-detect if paper or question is Bangla
  if (isBangla) {
    return BANGLA_OPTION_LABELS[index] || `(${index + 1})`;
  }
  if (option.label && option.label.trim()) {
    const raw = option.label.trim();
    if (raw.startsWith("(") && raw.endsWith(")")) return raw;
    if (raw.endsWith(".")) return `(${raw.slice(0, -1)})`;
    return `(${raw})`;
  }
  return ENGLISH_UPPER_LABELS[index] || `(${String.fromCharCode(65 + index)})`;
}

const BANGLA_CQ_LABELS = ["(ক)", "(খ)", "(গ)", "(ঘ)", "(ঙ)", "(চ)"];
const BANGLA_CQ_MAP: Record<string, string> = {
  a: "(ক)", b: "(খ)", c: "(গ)", d: "(ঘ)", e: "(ঙ)",
  A: "(ক)", B: "(খ)", C: "(গ)", D: "(ঘ)", E: "(ঙ)",
  "ক": "(ক)", "খ": "(খ)", "গ": "(গ)", "ঘ": "(ঘ)", "ঙ": "(ঙ)",
  "(ক)": "(ক)", "(খ)": "(খ)", "(গ)": "(গ)", "(ঘ)": "(ঘ)", "(ঙ)": "(ঙ)"
};

function getCqSubQuestionLabel(rawLabel: string | undefined, index: number, isBangla: boolean): string {
  if (isBangla) {
    if (rawLabel && BANGLA_CQ_MAP[rawLabel]) return BANGLA_CQ_MAP[rawLabel];
    if (rawLabel && rawLabel.startsWith("(") && rawLabel.endsWith(")")) return rawLabel;
    if (rawLabel && /[\u0980-\u09FF]/.test(rawLabel)) return `(${rawLabel.replace(/[\.\:\)]/g, "")})`;
    return BANGLA_CQ_LABELS[index] || `(${index + 1})`;
  }
  if (rawLabel) {
    if (rawLabel.startsWith("(") && rawLabel.endsWith(")")) return rawLabel;
    if (rawLabel.endsWith(".")) return rawLabel;
    return `(${rawLabel})`;
  }
  return `(${String.fromCharCode(97 + index)})`;
}

function measureQuestionHeight(
  doc: PDFKit.PDFDocument,
  question: Question,
  index: number,
  width: number,
  images: ImageMap,
  hasBanglaFont: boolean,
  optionLabelStyle?: string
): number {
  const cache = getDocCache(doc);
  const qKey = `qh\0${question.id || index}\0${width}\0${hasBanglaFont ? 1 : 0}\0${optionLabelStyle || ""}`;
  const cachedH = cache.measurePdfTextCache.get(qKey);
  if (cachedH !== undefined) return cachedH;

  const serial = getQuestionDisplaySerial(question, index);
  const cleanTitle = getCleanQuestionTitle(question.title);
  const serialWidth = Math.max(18, measurePdfText(doc, serial, 60, 11, hasBanglaFont, true) + 4);
  const titleWidth = width - 44 - serialWidth;
  const titleHeight = Math.max(14, measurePdfText(doc, cleanTitle, titleWidth, 11, hasBanglaFont, true));

  const cleanSubtitle = question.subtitle ? formatMathForExport(question.subtitle) : "";
  const subtitleHeight = cleanSubtitle ? measurePdfText(doc, cleanSubtitle, width - serialWidth, 9.5, hasBanglaFont, false) + 2 : 0;

  const isSplit = width < 350;
  const isBangla = hasBanglaFont && (optionLabelStyle === "bangla" || /[\u0980-\u09FF]/.test(cleanTitle) || /[\u0980-\u09FF]/.test(serial));

  const image = images.get(question.id);
  const imageSize = image ? getExportImageSize(image, isSplit, question.type === "cq") : undefined;
  const imageHeight = imageSize ? imageSize.height + 4 : 0;

  let optionsHeight = 0;
  let subHeight = 0;

  // Options & Sub-questions indentation
  const indent = 16;

  if (question.type === "cq") {
    (question.subQuestions ?? []).forEach((item, itemIndex) => {
      const label = getCqSubQuestionLabel(item.label, itemIndex, isBangla);
      const cleanItemText = formatMathForExport(item.text);
      const itemText = `${label} ${cleanItemText}`;
      const itemHeight = Math.max(14, measurePdfText(doc, itemText, width - indent - 44, 10, hasBanglaFont, false));
      subHeight += itemHeight + 3;
    });
  } else {
    const optionAreaWidth = width - indent;
    const optionColWidth = (optionAreaWidth - 8) / 2;
    const opts = question.options || [];
    for (let i = 0; i < opts.length; i += 2) {
      const opt1 = opts[i];
      const opt2 = opts[i + 1];
      const t1 = opt1 ? `${getOptionExportLabel(opt1, i, optionLabelStyle, isBangla)} ${formatMathForExport(opt1.text)}` : "";
      const t2 = opt2 ? `${getOptionExportLabel(opt2, i + 1, optionLabelStyle, isBangla)} ${formatMathForExport(opt2.text)}` : "";
      const h1 = t1 ? measurePdfText(doc, t1, optionColWidth - 4, 10, hasBanglaFont, false) : 0;
      const h2 = t2 ? measurePdfText(doc, t2, optionColWidth - 4, 10, hasBanglaFont, false) : 0;
      optionsHeight += Math.max(14, Math.max(h1, h2)) + 2;
    }
  }

  const totalH = titleHeight + 2 + subtitleHeight + imageHeight + (question.type === "cq" ? subHeight : optionsHeight) + 8;
  cache.measurePdfTextCache.set(qKey, totalH);
  return totalH;
}

type TwoColumnPage = {
  startY: number;
  left: Array<{ question: Question; index: number }>;
  right: Array<{ question: Question; index: number }>;
};

function paginateTwoColumnSection(
  doc: PDFKit.PDFDocument,
  questions: Question[],
  startIndex: number,
  columnWidth: number,
  images: ImageMap,
  hasBanglaFont: boolean,
  firstPageStartY: number,
  questionsPerPage: number,
  optionLabelStyle?: string
): TwoColumnPage[] {
  const pages: TwoColumnPage[] = [];
  let currentIdx = 0;
  let pageIndex = 0;
  const maxPageY = page.height - page.marginBottom - 6;
  const subsequentStartY = page.marginTop + 2;

  while (currentIdx < questions.length) {
    const startY = pageIndex === 0 ? firstPageStartY : subsequentStartY;
    const maxColHeight = maxPageY - startY;

    const maxLeftCapacity = questionsPerPage > 0 ? Math.ceil(questionsPerPage / 2) : Infinity;
    const maxPageCapacity = questionsPerPage > 0 ? questionsPerPage : Infinity;

    // 1. Fill Left Column
    const left: Array<{ question: Question; index: number }> = [];
    let leftH = 0;

    while (currentIdx < questions.length) {
      const q = questions[currentIdx];
      const globalIdx = startIndex + currentIdx;
      const h = measureQuestionHeight(doc, q, globalIdx, columnWidth, images, hasBanglaFont, optionLabelStyle);

      // If left already has questions and this question cannot fit (or count reaches column capacity):
      // STOP! It must NOT be put on the left side!
      // It shifts to the right side of the page!
      if (left.length > 0 && (leftH + h > maxColHeight || left.length >= maxLeftCapacity)) {
        break;
      }

      left.push({ question: q, index: globalIdx });
      leftH += h;
      currentIdx++;
    }

    // 2. Fill Right Column
    const right: Array<{ question: Question; index: number }> = [];
    let rightH = 0;

    while (currentIdx < questions.length) {
      const q = questions[currentIdx];
      const globalIdx = startIndex + currentIdx;
      const h = measureQuestionHeight(doc, q, globalIdx, columnWidth, images, hasBanglaFont, optionLabelStyle);

      // If right already has questions and this question cannot fit (or count reaches page capacity):
      // STOP! It cannot fit on the right side either!
      // It shifts to the NEXT PAGE!
      if (right.length > 0 && (rightH + h > maxColHeight || (left.length + right.length) >= maxPageCapacity)) {
        break;
      }

      if (right.length === 0 && left.length > 0 && h > maxColHeight && pageIndex === 0) {
        break;
      }

      right.push({ question: q, index: globalIdx });
      rightH += h;
      currentIdx++;
    }

    pages.push({ startY, left, right });
    pageIndex++;
  }

  return pages.length ? pages : [{ startY: firstPageStartY, left: [], right: [] }];
}

type SingleColumnPage = {
  startY: number;
  questions: Array<{ question: Question; index: number }>;
};

function paginateSingleColumnSection(
  doc: PDFKit.PDFDocument,
  questions: Question[],
  startIndex: number,
  printableWidth: number,
  images: ImageMap,
  hasBanglaFont: boolean,
  firstPageStartY: number,
  questionsPerPage: number,
  optionLabelStyle?: string
): SingleColumnPage[] {
  const pages: SingleColumnPage[] = [];
  let currentIdx = 0;
  let pageIndex = 0;
  const maxPageY = page.height - page.marginBottom - 6;
  const subsequentStartY = page.marginTop + 2;

  while (currentIdx < questions.length) {
    const startY = pageIndex === 0 ? firstPageStartY : subsequentStartY;
    const maxPageHeight = maxPageY - startY;
    const maxCapacity = questionsPerPage > 0 ? questionsPerPage : Infinity;

    const pageQuestions: Array<{ question: Question; index: number }> = [];
    let currentH = 0;

    while (currentIdx < questions.length) {
      const q = questions[currentIdx];
      const globalIdx = startIndex + currentIdx;
      const h = measureQuestionHeight(doc, q, globalIdx, printableWidth, images, hasBanglaFont, optionLabelStyle);

      // If page already has questions and this question cannot fit, shift to NEXT PAGE!
      if (pageQuestions.length > 0 && (currentH + h > maxPageHeight || pageQuestions.length >= maxCapacity)) {
        break;
      }

      pageQuestions.push({ question: q, index: globalIdx });
      currentH += h;
      currentIdx++;
    }

    pages.push({ startY, questions: pageQuestions });
    pageIndex++;
  }

  return pages.length ? pages : [{ startY: firstPageStartY, questions: [] }];
}

function drawSectionHeadline(
  doc: PDFKit.PDFDocument,
  title: string,
  instructions: string,
  y: number,
  width: number,
  hasBanglaFont: boolean
): number {
  const bannerHeight = instructions ? 30 : 22;
  doc.rect(page.marginSide, y, width, bannerHeight).fillColor("#f1f5f9").fill();
  doc.rect(page.marginSide, y, width, bannerHeight).strokeColor("#cbd5e1").lineWidth(0.8).stroke();

  // Full-width section title (no score/number text as requested)
  drawPdfText(doc, title, page.marginSide + 8, y + 4, hasBanglaFont, {
    width: width - 16,
    fontSize: 11,
    bold: true,
    color: "#0f172a"
  });

  if (instructions) {
    drawPdfText(doc, instructions, page.marginSide + 8, y + 17, hasBanglaFont, {
      width: width - 16,
      fontSize: 8.5,
      color: "#475569"
    });
  }

  return y + bannerHeight + 6;
}

function drawQuestions(
  doc: PDFKit.PDFDocument,
  paper: Paper,
  images: ImageMap,
  hasBanglaFont: boolean,
  headerEndY: number,
  sectionFlow: "separate" | "single" = "separate"
) {
  const mcqLayout = paper.layout || "split";
  const cqLayout = paper.cqLayout || paper.layout || "split";
  const perPage = Number(paper.questionsPerPage ?? 10);
  const gutter = 18;
  const printableWidth = page.width - page.marginSide * 2;
  const columnWidth = (printableWidth - gutter) / 2; // ~262.64 pt

  const isBangla =
    hasBanglaFont &&
    (/[\u0980-\u09FF]/.test(paper.name + paper.subject) || !paper.subject.toLowerCase().includes("english"));

  const mcqs = paper.questions.filter((q) => (q.type || "mcq") === "mcq");
  const cqs = paper.questions.filter((q) => q.type === "cq");
  const hasBoth = mcqs.length > 0 && cqs.length > 0;

  const mcqTitle = paper.mcqSectionTitle?.trim() || (hasBoth
    ? (isBangla ? "ক-বিভাগ: বহু-নির্বাচনী প্রশ্ন" : "Section A: Multiple Choice Questions (MCQ)")
    : (isBangla ? "বহু-নির্বাচনী প্রশ্ন" : "Multiple Choice Questions (MCQ)"));
  const mcqInstr = isBangla ? "সকল প্রশ্নের উত্তর দিতে হবে। প্রতিটি প্রশ্নের মান ১।" : "Answer all questions. Each carries 1 mark.";

  const cqTitle = paper.cqSectionTitle?.trim() || (hasBoth
    ? (isBangla ? "খ-বিভাগ: সৃজনশীল প্রশ্ন" : "Section B: Creative Questions (CQ)")
    : (isBangla ? "সৃজনশীল প্রশ্ন" : "Creative Questions (CQ)"));
  const cqInstr = isBangla
    ? "প্রতিটি উদ্দীপক পড়ে সংশ্লিষ্ট প্রশ্নগুলোর উত্তর দাও। প্রতিটির মান ১০ (১+২+৩+৪)।"
    : "Read each scenario carefully and answer all sub-questions (10 marks each).";

  const maxPageY = page.height - page.marginBottom - 6;
  let currentY = headerEndY;

  // 1. DRAW MCQ SECTION
  if (mcqs.length > 0) {
    currentY = drawSectionHeadline(doc, mcqTitle, mcqInstr, currentY, printableWidth, hasBanglaFont);

    if (mcqLayout === "split") {
      const mcqPages = paginateTwoColumnSection(
        doc,
        mcqs,
        0,
        columnWidth,
        images,
        hasBanglaFont,
        currentY,
        perPage,
        paper.optionLabelStyle
      );

      mcqPages.forEach((p, pageIndex) => {
        if (pageIndex > 0) {
          doc.addPage();
        }
        const startY = p.startY;
        const leftX = page.marginSide;
        const rightX = page.marginSide + columnWidth + gutter;
        const dividerX = page.marginSide + columnWidth + gutter / 2;

        let leftY = startY;
        p.left.forEach(({ question, index }) => {
          leftY = drawQuestionCard(doc, question, index, leftX, leftY, columnWidth, images, hasBanglaFont, paper.optionLabelStyle);
        });

        let rightY = startY;
        p.right.forEach(({ question, index }) => {
          rightY = drawQuestionCard(doc, question, index, rightX, rightY, columnWidth, images, hasBanglaFont, paper.optionLabelStyle);
        });

        const dividerBottom = Math.max(leftY, rightY) - 4;
        if (dividerBottom > startY && (p.left.length > 0 || p.right.length > 0)) {
          doc
            .moveTo(dividerX, startY)
            .lineTo(dividerX, dividerBottom)
            .strokeColor("#cbd5e1")
            .lineWidth(0.6)
            .stroke();
        }

        currentY = Math.max(leftY, rightY) + 8;
      });
    } else {
      const mcqPages = paginateSingleColumnSection(
        doc,
        mcqs,
        0,
        printableWidth,
        images,
        hasBanglaFont,
        currentY,
        perPage,
        paper.optionLabelStyle
      );

      mcqPages.forEach((p, pageIndex) => {
        if (pageIndex > 0) {
          doc.addPage();
        }
        let y = p.startY;
        p.questions.forEach(({ question, index }) => {
          y = drawQuestionCard(doc, question, index, page.marginSide, y, printableWidth, images, hasBanglaFont, paper.optionLabelStyle);
        });
        currentY = y + 8;
      });
    }
  }

  // 2. DRAW CQ SECTION (DYNAMIC: 2 SPLIT LAYOUT OR SINGLE LAYOUT)
  if (cqs.length > 0) {
    const isCqSplit = cqLayout === "split";
    const cqColWidth = isCqSplit ? columnWidth : printableWidth;
    const isSingleFlow = sectionFlow === "single";

    if (mcqs.length > 0) {
      if (isSingleFlow) {
        // Continuous / Single page flow: if there is empty space after MCQs, start immediately; no CQ heading
        const firstCqH = measureQuestionHeight(doc, cqs[0], mcqs.length, cqColWidth, images, hasBanglaFont, paper.optionLabelStyle);
        const spaceNeededForFirstCq = firstCqH + 10;
        if (maxPageY - currentY < spaceNeededForFirstCq) {
          doc.addPage();
          currentY = 34;
        } else {
          currentY += 8;
        }
      } else {
        // Separate page flow (default): force CQ to start on a new page
        doc.addPage();
        currentY = 34;
      }
    }

    // Only draw CQ headline if not single flow (or if no MCQs exist in the paper)
    if (!isSingleFlow || mcqs.length === 0) {
      currentY = drawSectionHeadline(doc, cqTitle, cqInstr, currentY, printableWidth, hasBanglaFont);
    }

    if (isCqSplit) {
      const cqPages = paginateTwoColumnSection(
        doc,
        cqs,
        mcqs.length,
        columnWidth,
        images,
        hasBanglaFont,
        currentY,
        perPage,
        paper.optionLabelStyle
      );

      cqPages.forEach((p, pageIndex) => {
        if (pageIndex > 0) {
          doc.addPage();
        }
        const startY = p.startY;
        const leftX = page.marginSide;
        const rightX = page.marginSide + columnWidth + gutter;
        const dividerX = page.marginSide + columnWidth + gutter / 2;

        let leftY = startY;
        p.left.forEach(({ question, index }) => {
          leftY = drawQuestionCard(doc, question, index, leftX, leftY, columnWidth, images, hasBanglaFont, paper.optionLabelStyle);
        });

        let rightY = startY;
        p.right.forEach(({ question, index }) => {
          rightY = drawQuestionCard(doc, question, index, rightX, rightY, columnWidth, images, hasBanglaFont, paper.optionLabelStyle);
        });

        const dividerBottom = Math.max(leftY, rightY) - 4;
        if (dividerBottom > startY && (p.left.length > 0 || p.right.length > 0)) {
          doc
            .moveTo(dividerX, startY)
            .lineTo(dividerX, dividerBottom)
            .strokeColor("#cbd5e1")
            .lineWidth(0.6)
            .stroke();
        }

        currentY = Math.max(leftY, rightY) + 8;
      });
    } else {
      const cqPages = paginateSingleColumnSection(
        doc,
        cqs,
        mcqs.length,
        printableWidth,
        images,
        hasBanglaFont,
        currentY,
        perPage,
        paper.optionLabelStyle
      );

      cqPages.forEach((p, pageIndex) => {
        if (pageIndex > 0) {
          doc.addPage();
        }
        let y = p.startY;
        p.questions.forEach(({ question, index }) => {
          y = drawQuestionCard(doc, question, index, page.marginSide, y, printableWidth, images, hasBanglaFont, paper.optionLabelStyle);
        });
        currentY = y + 8;
      });
    }
  }
}

function drawQuestionCard(
  doc: PDFKit.PDFDocument,
  question: Question,
  index: number,
  x: number,
  y: number,
  width: number,
  images: ImageMap,
  hasBanglaFont: boolean,
  optionLabelStyle?: string
): number {
  const isSplit = width < 350;
  const image = images.get(question.id);
  const imageSize = image ? getExportImageSize(image, isSplit, question.type === "cq") : undefined;
  const serial = getQuestionDisplaySerial(question, index);
  const cleanTitle = getCleanQuestionTitle(question.title);
  const cleanSubtitle = question.subtitle ? formatMathForExport(question.subtitle) : "";
  const isBangla = hasBanglaFont && (optionLabelStyle === "bangla" || /[\u0980-\u09FF]/.test(cleanTitle) || /[\u0980-\u09FF]/.test(serial));

  // Measure serial width so cleanTitle starts after serial and subsequent wrapped lines wrap after serial
  // Under the serial number, no text will be present!
  const serialWidth = Math.max(18, measurePdfText(doc, serial, 60, 11, hasBanglaFont, true) + 4);
  const titleWidth = width - 44 - serialWidth;
  const titleHeight = Math.max(14, measurePdfText(doc, cleanTitle, titleWidth, 11, hasBanglaFont, true));

  const subtitleHeight = cleanSubtitle ? measurePdfText(doc, cleanSubtitle, width - serialWidth, 9.5, hasBanglaFont, false) + 2 : 0;

  // Align serial and title
  const titleItems = parseTextWithMath(cleanTitle);
  const titleLines = layoutTextWithMath(doc, titleItems, titleWidth, 11, hasBanglaFont, true, 1, cleanTitle.replace(/\s+([?,.!;:])(?=\s|$)/g, "$1"));
  const firstTitleMatrixH = titleLines[0]?.items.reduce((max, it) => it.type === "matrix" ? Math.max(max, it.height ?? 0) : max, 0) ?? 0;
  const serialYOffset = firstTitleMatrixH > 0 ? Math.max(0, Math.round((firstTitleMatrixH - 11) / 2)) : 0;

  // NOTE: User requested NO BORDER on questions!
  // 1. Draw serial number on the left
  drawPdfText(doc, serial, x, y + serialYOffset, hasBanglaFont, {
    width: serialWidth,
    fontSize: 11,
    bold: true
  });

  // 2. Draw question title to the right of serial
  // Any wrapped lines wrap within titleWidth at x + serialWidth, so under the serial number NO text is present!
  drawPdfText(doc, cleanTitle, x + serialWidth, y, hasBanglaFont, {
    width: titleWidth,
    fontSize: 11,
    bold: true
  });

  const qMarksText = isBangla ? toBengaliDigits(question.marks) : `${question.marks} mark${question.marks === 1 ? "" : "s"}`;
  drawPdfText(doc, qMarksText, x + width - 42, y + serialYOffset + 1, hasBanglaFont, {
    width: 42,
    align: "right",
    fontSize: 8.5,
    color: "#64748b"
  });

  let cursorY = y + titleHeight + 2;

  // 3. Subtitle (drawn starting at x + serialWidth so nothing is under serial)
  if (cleanSubtitle) {
    drawPdfText(doc, cleanSubtitle, x + serialWidth, cursorY, hasBanglaFont, {
      width: width - serialWidth,
      fontSize: 9.5,
      color: "#475569"
    });
    cursorY += subtitleHeight;
  }

  // Centered Image with standard compact size
  if (image && imageSize) {
    const imageX = x + Math.max(0, Math.round((width - imageSize.width) / 2));
    doc.image(image.buffer, imageX, cursorY, { width: imageSize.width, height: imageSize.height });
    cursorY += imageSize.height + 4;
  }

  // Indentation of Options (MCQ) & Sub-questions (CQ): indented to the right of serial
  const indent = Math.max(16, serialWidth);

  if (question.type === "cq") {
    (question.subQuestions ?? []).forEach((item, itemIndex) => {
      const label = getCqSubQuestionLabel(item.label, itemIndex, isBangla);
      const cleanItemText = formatMathForExport(item.text);
      const labelWidth = Math.max(16, measurePdfText(doc, label, 40, 10, hasBanglaFont, true) + 4);
      const subItems = parseTextWithMath(cleanItemText);
      const subLines = layoutTextWithMath(doc, subItems, width - indent - labelWidth - 44, 10, hasBanglaFont, false, 1, cleanItemText.replace(/\s+([?,.!;:])(?=\s|$)/g, "$1"));
      const firstLineMatrixH = subLines[0]?.items.reduce((max, it) => it.type === "matrix" ? Math.max(max, it.height ?? 0) : max, 0) ?? 0;
      const subLabelYOffset = firstLineMatrixH > 0 ? Math.max(0, Math.round((firstLineMatrixH - 10) / 2)) : 0;

      // Under CQ subquestion label, no text either
      drawPdfText(doc, label, x + indent, cursorY + subLabelYOffset, hasBanglaFont, {
        width: labelWidth,
        fontSize: 10,
        bold: true
      });
      drawPdfText(doc, cleanItemText, x + indent + labelWidth, cursorY, hasBanglaFont, {
        width: width - indent - labelWidth - 44,
        fontSize: 10
      });
      const subMarksText = isBangla ? toBengaliDigits(item.marks || 1) : `${item.marks} mark`;
      drawPdfText(doc, subMarksText, x + width - 42, cursorY + subLabelYOffset + 1, hasBanglaFont, {
        width: 42,
        align: "right",
        fontSize: 8.5,
        color: "#64748b"
      });
      const itemH = Math.max(14, measurePdfText(doc, cleanItemText, width - indent - labelWidth - 44, 10, hasBanglaFont, false));
      cursorY += itemH + 3;
    });
  } else {
    const optionAreaWidth = width - indent;
    const optionColWidth = (optionAreaWidth - 8) / 2;
    const opts = question.options || [];
    for (let i = 0; i < opts.length; i += 2) {
      const opt1 = opts[i];
      const opt2 = opts[i + 1];
      const t1 = opt1 ? `${getOptionExportLabel(opt1, i, optionLabelStyle, isBangla)} ${formatMathForExport(opt1.text)}` : "";
      const t2 = opt2 ? `${getOptionExportLabel(opt2, i + 1, optionLabelStyle, isBangla)} ${formatMathForExport(opt2.text)}` : "";
      const h1 = t1 ? measurePdfText(doc, t1, optionColWidth - 4, 10, hasBanglaFont, false) : 0;
      const h2 = t2 ? measurePdfText(doc, t2, optionColWidth - 4, 10, hasBanglaFont, false) : 0;
      const rowHeight = Math.max(14, Math.max(h1, h2));

      if (t1) {
        drawPdfText(doc, t1, x + indent, cursorY, hasBanglaFont, { width: optionColWidth - 4, fontSize: 10 });
      }
      if (t2) {
        drawPdfText(doc, t2, x + indent + optionColWidth + 8, cursorY, hasBanglaFont, { width: optionColWidth - 4, fontSize: 10 });
      }
      cursorY += rowHeight + 2;
    }
  }

  // Standard compact gap between question items: 8pt
  return cursorY + 8;
}

function drawAnswers(doc: PDFKit.PDFDocument, paper: Paper, hasBanglaFont: boolean) {
  doc.addPage();
  let y = 36;
  const contentWidth = page.width - page.marginSide * 2;
  const isBangla = hasBanglaFont && (paper.optionLabelStyle === "bangla" || /[\u0980-\u09FF]/.test(paper.name + paper.subject) || !paper.subject.toLowerCase().includes("english"));
  const ansHeading = isBangla ? "উত্তরমালা ও ব্যাখ্যা" : "Answer and Explanation";
  const ansLabel = isBangla ? "উত্তর:" : "Answer:";
  const expLabel = isBangla ? "ব্যাখ্যা:" : "Explanation:";

  drawPdfText(doc, ansHeading, page.marginSide, y, hasBanglaFont, {
    fontSize: 16,
    bold: true
  });
  y += 24;

  paper.questions.forEach((question, index) => {
    if (y > page.height - 60) {
      doc.addPage();
      y = 36;
    }
    const serial = getQuestionDisplaySerial(question, index);
    const cleanTitle = getCleanQuestionTitle(question.title);
    const serialWidth = Math.max(18, measurePdfText(doc, serial, 60, 11, hasBanglaFont, true) + 4);
    drawPdfText(doc, serial, page.marginSide, y, hasBanglaFont, {
      width: serialWidth,
      fontSize: 11,
      bold: true
    });
    drawPdfText(doc, cleanTitle, page.marginSide + serialWidth, y, hasBanglaFont, {
      width: contentWidth - serialWidth,
      fontSize: 11,
      bold: true
    });
    const titleH = measurePdfText(doc, cleanTitle, contentWidth - serialWidth, 11, hasBanglaFont, true);
    y += titleH + 2;

    if (question.type === "cq") {
      (question.subQuestions ?? []).forEach((item, itemIndex) => {
        const label = getCqSubQuestionLabel(item.label, itemIndex, isBangla);
        const cleanAnswer = formatMathForExport(item.answer || "-");
        const cleanExplanation = item.explanation ? formatMathForExport(item.explanation) : "";
        const text = `${label} ${ansLabel} ${cleanAnswer}${cleanExplanation ? ` | ${expLabel} ${cleanExplanation}` : ""}`;
        drawPdfText(doc, text, page.marginSide + 16, y, hasBanglaFont, {
          width: contentWidth - 16,
          fontSize: 10,
          color: "#334155"
        });
        const h = measurePdfText(doc, text, contentWidth - 16, 10, hasBanglaFont, false);
        y += Math.max(14, h) + 3;
      });
    } else {
      const opts = question.options || [];
      const correctIndex = opts.findIndex((option) => option.isCorrect);
      const correct = correctIndex >= 0 ? opts[correctIndex] : undefined;
      const cleanCorrectText = correct ? formatMathForExport(correct.text) : "-";
      const cleanExplanation = question.explanation ? formatMathForExport(question.explanation) : "";
      const correctLabel = correct ? getOptionExportLabel(correct, correctIndex, paper.optionLabelStyle, isBangla) : "";
      const text = `${ansLabel} ${correct ? `${correctLabel} ${cleanCorrectText}` : "-"}${cleanExplanation ? ` | ${expLabel} ${cleanExplanation}` : ""}`;
      drawPdfText(doc, text, page.marginSide + 16, y, hasBanglaFont, {
        width: contentWidth - 16,
        fontSize: 10,
        color: "#334155"
      });
      const h = measurePdfText(doc, text, contentWidth - 16, 10, hasBanglaFont, false);
      y += Math.max(15, h) + 4;
    }
  });
}

function docxSectionHeadline(title: string, instructions?: string): Paragraph[] {
  const p: Paragraph[] = [
    new Paragraph({
      spacing: { before: 200, after: instructions ? 40 : 100 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "cbd5e1" },
        top: { style: BorderStyle.SINGLE, size: 6, color: "cbd5e1" }
      },
      shading: { fill: "f1f5f9" },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 24,
          color: "0f172a",
          font: { ascii: "Segoe UI Symbol", hAnsi: "Segoe UI Symbol", cs: "Kalpurush" }
        })
      ]
    })
  ];
  if (instructions) {
    p.push(paragraph(instructions, { size: 20, spacing: { after: 100 } }));
  }
  return p;
}

function buildDocxBodyForPaper(
  paper: Paper,
  images: ImageMap,
  options?: { withAnswer?: boolean; allSets?: boolean; sectionFlow?: "separate" | "single"; branding?: boolean; watermark?: boolean },
  isFirstPaper = true
): Array<Paragraph | Table> {
  const cleanName = formatMathForExport(paper.name);
  const cleanInstructions = paper.instructions ? formatMathForExport(paper.instructions) : "";
  const isSplit = paper.layout === "split";
  const isCqSplit = (paper.cqLayout || paper.layout) === "split";

  const isBangla =
    /[\u0980-\u09FF]/.test(paper.name + paper.subject) || !paper.subject.toLowerCase().includes("english");

  const mcqs = paper.questions.filter((q) => (q.type || "mcq") === "mcq");
  const cqs = paper.questions.filter((q) => q.type === "cq");
  const hasBoth = mcqs.length > 0 && cqs.length > 0;

  const mcqTitle = paper.mcqSectionTitle?.trim() || (hasBoth
    ? (isBangla ? "ক-বিভাগ: বহু-নির্বাচনী প্রশ্ন" : "Section A: Multiple Choice Questions (MCQ)")
    : (isBangla ? "বহু-নির্বাচনী প্রশ্ন" : "Multiple Choice Questions (MCQ)"));
  const mcqInstr = isBangla ? "সকল প্রশ্নের উত্তর দিতে হবে। প্রতিটি প্রশ্নের মান ১।" : "Answer all questions. Each carries 1 mark.";

  const cqTitle = paper.cqSectionTitle?.trim() || (hasBoth
    ? (isBangla ? "খ-বিভাগ: সৃজনশীল প্রশ্ন" : "Section B: Creative Questions (CQ)")
    : (isBangla ? "সৃজনশীল প্রশ্ন" : "Creative Questions (CQ)"));
  const cqInstr = isBangla
    ? "প্রতিটি উদ্দীপক পড়ে সংশ্লিষ্ট প্রশ্নগুলোর উত্তর দাও। প্রতিটির মান ১০ (১+২+৩+৪)।"
    : "Read each scenario carefully and answer all sub-questions (10 marks each).";

  const banglaSetMap: Record<string, string> = { A: "ক", B: "খ", C: "গ", D: "ঘ" };
  const displaySet = paper.setName
    ? (isBangla ? (banglaSetMap[paper.setName.toUpperCase()] || paper.setName) : paper.setName)
    : "";
  let docxTitle = isBangla
    ? getBengaliPaperTitle(paper.name, paper.className, paper.subject)
    : cleanName;
  const titleWithSet = paper.setName
    ? `${docxTitle} (${isBangla ? `সেট: ${displaySet}` : `Set: ${displaySet}`})`
    : docxTitle;

  const docxClass = isBangla ? getBengaliClass(paper.className) : paper.className;
  const docxSubject = isBangla ? getBengaliSubject(paper.subject) : paper.subject;
  const docxDuration = isBangla ? formatBengaliDuration(paper.duration) : (paper.duration || "2 hours");
  const docxTime = isBangla ? `সময়: ${docxDuration}` : `Time: ${paper.duration}`;
  const docxMarks = isBangla ? `পূর্ণমান: ${toBengaliDigits(paper.totalMarks)}` : `Marks: ${paper.totalMarks}`;
  const docxClassLabel = isBangla ? `শ্রেণি: ${docxClass}` : `Class: ${paper.className}`;
  const docxSubjectLabel = isBangla ? `বিষয়: ${docxSubject}` : `Subject: ${paper.subject}`;
  const docxSubHeader = `${docxClassLabel}        |        ${docxSubjectLabel}        |        ${docxTime}        |        ${docxMarks}`;

  const canBrand = options?.branding !== false;

  // Header
  const headerChildren: Paragraph[] = [
    ...(isFirstPaper ? [] : [new Paragraph({ text: "", pageBreakBefore: true })]),
    ...(canBrand && paper.institute?.trim() ? [paragraph(paper.institute.trim(), { bold: true, size: 28, center: true, spacing: { after: 30 } })] : []),
    paragraph(titleWithSet, { bold: true, size: 32, center: true, spacing: { after: 60 } }),
    paragraph(docxSubHeader, {
      center: true,
      size: 22,
      spacing: { after: cleanInstructions ? 40 : 80 }
    }),
    ...(cleanInstructions ? [paragraph(cleanInstructions, { center: true, size: 20, spacing: { after: 80 } })] : [])
  ];

  const bodyChildren: Array<Paragraph | Table> = [...headerChildren];

  // 1. MCQ SECTION
  if (mcqs.length > 0) {
    bodyChildren.push(...docxSectionHeadline(mcqTitle, mcqInstr));

    if (isSplit) {
      const perPage = paper.questionsPerPage > 0 ? paper.questionsPerPage : 16;
      const chunks = chunk(mcqs, perPage);

      chunks.forEach((pageQuestions, pageIdx) => {
        const leftCapacity = Math.ceil(perPage / 2);
        const leftQuestions = pageQuestions.slice(0, leftCapacity);
        const rightQuestions = pageQuestions.slice(leftCapacity);

        const leftChildren: Paragraph[] = [];
        leftQuestions.forEach((q, idx) => {
          leftChildren.push(...docxQuestionParagraphs(q, pageIdx * perPage + idx, images, true, paper.optionLabelStyle, isBangla));
        });

        const rightChildren: Paragraph[] = [];
        rightQuestions.forEach((q, idx) => {
          rightChildren.push(...docxQuestionParagraphs(q, pageIdx * perPage + leftCapacity + idx, images, true, paper.optionLabelStyle, isBangla));
        });

        if (pageIdx > 0) {
          bodyChildren.push(new Paragraph({ text: "", pageBreakBefore: true }));
        }

        bodyChildren.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableNoBorders(),
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    margins: { top: 0, bottom: 0, left: 0, right: 180 },
                    borders: tableNoBorders(),
                    children: leftChildren.length ? leftChildren : [paragraph("")]
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    margins: { top: 0, bottom: 0, left: 180, right: 0 },
                    borders: tableNoBorders(),
                    children: rightChildren.length ? rightChildren : [paragraph("")]
                  })
                ]
              })
            ]
          })
        );
      });
    } else {
      mcqs.forEach((question, index) => {
        bodyChildren.push(...docxQuestionParagraphs(question, index, images, false, paper.optionLabelStyle, isBangla));
      });
    }
  }

  // 2. CQ SECTION (DYNAMIC: 2 SPLIT LAYOUT OR SINGLE LAYOUT)
  if (cqs.length > 0) {
    const isSingleFlow = (options?.sectionFlow || paper.sectionFlow) === "single";

    if (mcqs.length > 0 && !isSingleFlow) {
      bodyChildren.push(new Paragraph({ text: "", pageBreakBefore: true }));
    }

    if (!isSingleFlow || mcqs.length === 0) {
      bodyChildren.push(...docxSectionHeadline(cqTitle, cqInstr));
    }

    if (isCqSplit) {
      const cqPerPage = paper.questionsPerPage > 0 ? paper.questionsPerPage : 6;
      const chunks = chunk(cqs, cqPerPage);

      chunks.forEach((pageQuestions, pageIdx) => {
        const leftCapacity = Math.ceil(cqPerPage / 2);
        const leftQuestions = pageQuestions.slice(0, leftCapacity);
        const rightQuestions = pageQuestions.slice(leftCapacity);

        const leftChildren: Paragraph[] = [];
        leftQuestions.forEach((q, idx) => {
          leftChildren.push(...docxQuestionParagraphs(q, mcqs.length + pageIdx * cqPerPage + idx, images, true, paper.optionLabelStyle, isBangla));
        });

        const rightChildren: Paragraph[] = [];
        rightQuestions.forEach((q, idx) => {
          rightChildren.push(...docxQuestionParagraphs(q, mcqs.length + pageIdx * cqPerPage + leftCapacity + idx, images, true, paper.optionLabelStyle, isBangla));
        });

        if (pageIdx > 0) {
          bodyChildren.push(new Paragraph({ text: "", pageBreakBefore: true }));
        }

        bodyChildren.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableNoBorders(),
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    margins: { top: 0, bottom: 0, left: 0, right: 180 },
                    borders: tableNoBorders(),
                    children: leftChildren.length ? leftChildren : [paragraph("")]
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    margins: { top: 0, bottom: 0, left: 180, right: 0 },
                    borders: tableNoBorders(),
                    children: rightChildren.length ? rightChildren : [paragraph("")]
                  })
                ]
              })
            ]
          })
        );
      });
    } else {
      cqs.forEach((question, cqIdx) => {
        bodyChildren.push(...docxQuestionParagraphs(question, mcqs.length + cqIdx, images, false, paper.optionLabelStyle, isBangla));
      });
    }
  }

  // Answer Key on new page (if requested)
  if (options?.withAnswer !== false) {
    bodyChildren.push(new Paragraph({ text: "", pageBreakBefore: true }));
    const answerHeading = isBangla ? "উত্তরমালা ও ব্যাখ্যা" : "Answer and Explanation";
    bodyChildren.push(paragraph(answerHeading, { bold: true, size: 26, spacing: { after: 100 } }));
    paper.questions.forEach((question, index) => {
      bodyChildren.push(...docxAnswer(question, index, paper.optionLabelStyle, isBangla));
    });
  }

  return bodyChildren;
}

export async function renderPaperDocx(
  paper: Paper,
  options?: {
    withAnswer?: boolean;
    allSets?: boolean;
    sectionFlow?: "separate" | "single";
    branding?: boolean;
    watermark?: boolean;
  }
) {
  const images = await loadQuestionImages(paper);
  const bodyChildren: Array<Paragraph | Table> = [];

  if (options?.allSets) {
    const setKeys = ["A", "B", "C", "D"];
    for (let sIdx = 0; sIdx < setKeys.length; sIdx++) {
      const sKey = setKeys[sIdx];
      const setPaper = createSetPaper(paper, sKey);
      const setChildren = buildDocxBodyForPaper(setPaper, images, options, sIdx === 0);
      bodyChildren.push(...setChildren);
    }
  } else {
    bodyChildren.push(...buildDocxBodyForPaper(paper, images, options, true));
  }

  const footers = options?.watermark
    ? {
        default: new Footer({
          children: [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE }
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: "ExamCraft", bold: true, size: 16, color: "475569" })]
                        })
                      ]
                    }),
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          children: [new TextRun({ text: getSoftwareUrl(), size: 16, color: "64748B" })]
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        })
      }
    : undefined;

  const document = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: {
              ascii: "Segoe UI Symbol",
              hAnsi: "Segoe UI Symbol",
              cs: "Kalpurush"
            }
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 }
          }
        },
        footers,
        children: bodyChildren
      }
    ]
  });

  return Packer.toBuffer(document);
}

function docxMathChildren(
  text: string,
  options: { bold?: boolean; size?: number; color?: string } = {}
): Array<TextRun | DocxMath> {
  const { bold = false, size = 22, color } = options;
  const font = {
    ascii: "Segoe UI Symbol",
    hAnsi: "Segoe UI Symbol",
    cs: "Kalpurush"
  };
  const children: Array<TextRun | DocxMath> = [];

  const items = parseTextWithMath(text);
  for (const item of items) {
    if (item.type === "word") {
      children.push(new TextRun({ text: item.text, bold, size, color, font }));
    } else if (item.type === "fraction") {
      if (item.whole && item.whole.trim()) {
        children.push(new TextRun({ text: item.whole.trim() + " ", bold, size, color, font }));
      }
      children.push(
        new DocxMath({
          children: [
            new MathFraction({
              numerator: [new MathRun(item.num)],
              denominator: [new MathRun(item.den)]
            })
          ]
        })
      );
    } else if (item.type === "matrix") {
      children.push(
        new DocxMath({
          children: [createDocxMatrix(item.env, item.rows)]
        })
      );
    } else if (item.type === "limit") {
      children.push(
        new DocxMath({
          children: [
            new MathLimitLower({
              children: [new MathRun("lim")],
              limit: [new MathRun(item.condition)]
            })
          ]
        })
      );
    } else if (item.type === "integral") {
      children.push(
        new DocxMath({
          children: [new MathIntegralBlock(item.symbol, item.lower, item.upper)]
        })
      );
    }
  }

  return children.length > 0 ? children : [new TextRun({ text: "", size, font })];
}

function docxQuestionParagraphs(
  question: Question,
  index: number,
  images: ImageMap,
  isSplit: boolean,
  optionLabelStyle?: string,
  isBangla?: boolean
): Paragraph[] {
  const serial = getQuestionDisplaySerial(question, index);
  const cleanTitle = getCleanQuestionTitle(question.title);
  const marksLabel = isBangla ? toBengaliDigits(question.marks) : `${question.marks} mark${question.marks === 1 ? "" : "s"}`;
  const paragraphs: Paragraph[] = [
    paragraph(`${serial}\t${cleanTitle} (${marksLabel})`, {
      bold: true,
      size: 23,
      spacing: { before: 60, after: 20 },
      indent: { left: 400, hanging: 400 }
    })
  ];
  if (question.subtitle) {
    paragraphs.push(
      paragraph(formatMathForExport(question.subtitle), {
        size: 20,
        spacing: { after: 20 },
        indent: { left: 400 }
      })
    );
  }
  const image = images.get(question.id);
  if (image) {
    const size = getExportImageSize(image, isSplit, question.type === "cq");
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({ data: image.buffer, transformation: size, type: imageType(image.buffer) })],
        spacing: { before: 20, after: 30 }
      })
    );
  }
  if (question.type === "cq") {
    (question.subQuestions ?? []).forEach((item, itemIndex) => {
      const label = getCqSubQuestionLabel(item.label, itemIndex, Boolean(isBangla));
      const cleanItemText = formatMathForExport(item.text);
      const subMarksText = isBangla ? toBengaliDigits(item.marks || 1) : `${item.marks} mark${item.marks === 1 ? "" : "s"}`;
      paragraphs.push(
        new Paragraph({
          indent: { left: 540, hanging: 300 }, // Hanging indent for CQ subquestions
          spacing: { after: 20 },
          children: docxMathChildren(`${label}\t${cleanItemText} (${subMarksText})`, { size: 22 })
        })
      );
    });
  } else {
    // MCQ Options: 2 options per line with clean tab stops and indent
    const opts = question.options || [];
    for (let i = 0; i < opts.length; i += 2) {
      const opt1 = opts[i];
      const opt2 = opts[i + 1];
      const t1 = opt1 ? `${getOptionExportLabel(opt1, i, optionLabelStyle, isBangla)} ${formatMathForExport(opt1.text)}` : "";
      const t2 = opt2 ? `${getOptionExportLabel(opt2, i + 1, optionLabelStyle, isBangla)} ${formatMathForExport(opt2.text)}` : "";
      if (t2) {
        paragraphs.push(
          new Paragraph({
            indent: { left: 360 }, // Indent MCQ options to the right
            spacing: { after: 20 },
            tabStops: [{ type: TabStopType.LEFT, position: isSplit ? 2400 : 4000 }],
            children: [
              ...docxMathChildren(t1, { size: 22 }),
              new TextRun({ text: "\t" }),
              ...docxMathChildren(t2, { size: 22 })
            ]
          })
        );
      } else if (t1) {
        paragraphs.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { after: 20 },
            children: docxMathChildren(t1, { size: 22 })
          })
        );
      }
    }
  }
  return paragraphs;
}

function docxAnswer(
  question: Question,
  index: number,
  optionLabelStyle?: string,
  isBangla?: boolean
) {
  const serial = getQuestionDisplaySerial(question, index);
  const cleanTitle = getCleanQuestionTitle(question.title);
  const ansLabel = isBangla ? "উত্তর:" : "Answer:";
  const expLabel = isBangla ? "ব্যাখ্যা:" : "Explanation:";

  const children = [
    paragraph(`${serial}\t${cleanTitle}`, {
      bold: true,
      size: 23,
      spacing: { before: 50, after: 20 },
      indent: { left: 400, hanging: 400 }
    })
  ];
  if (question.type === "cq") {
    (question.subQuestions ?? []).forEach((item, itemIndex) => {
      const label = getCqSubQuestionLabel(item.label, itemIndex, Boolean(isBangla));
      const cleanAnswer = formatMathForExport(item.answer || "-");
      const cleanExplanation = item.explanation ? formatMathForExport(item.explanation) : "";
      children.push(
        new Paragraph({
          indent: { left: 360 },
          spacing: { after: 20 },
          children: docxMathChildren(
            `${label} ${ansLabel} ${cleanAnswer}${cleanExplanation ? ` | ${expLabel} ${cleanExplanation}` : ""}`,
            { size: 22 }
          )
        })
      );
    });
  } else {
    const opts = question.options || [];
    const correctIndex = opts.findIndex((option) => option.isCorrect);
    const correct = correctIndex >= 0 ? opts[correctIndex] : undefined;
    const cleanOptionText = correct ? formatMathForExport(correct.text) : "-";
    const cleanExplanation = question.explanation ? formatMathForExport(question.explanation) : "";
    const correctLabel = correct ? getOptionExportLabel(correct, correctIndex, optionLabelStyle, isBangla) : "";
    children.push(
      new Paragraph({
        indent: { left: 360 },
        spacing: { after: 30 },
        children: docxMathChildren(
          `${ansLabel} ${correct ? `${correctLabel} ${cleanOptionText}` : "-"}${cleanExplanation ? ` | ${expLabel} ${cleanExplanation}` : ""}`,
          { size: 22 }
        )
      })
    );
  }
  return children;
}

function paragraph(
  text: string,
  options: {
    bold?: boolean;
    size?: number;
    center?: boolean;
    spacing?: { before?: number; after?: number };
    indent?: { left?: number; hanging?: number };
  } = {}
) {
  return new Paragraph({
    alignment: options.center ? AlignmentType.CENTER : undefined,
    spacing: options.spacing ?? { after: 40 },
    indent: options.indent,
    children: docxMathChildren(text, { bold: options.bold, size: options.size ?? 22 })
  });
}

function tableNoBorders() {
  return {
    top: { style: BorderStyle.NONE },
    bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE },
    insideHorizontal: { style: BorderStyle.NONE },
    insideVertical: { style: BorderStyle.NONE }
  };
}

async function loadQuestionImages(paper: Paper) {
  const images: ImageMap = new Map();
  await Promise.all(
    paper.questions.map(async (question) => {
      if (!question.imageUrl) return;
      try {
        let buffer: Buffer | null = null;
        const trimmed = question.imageUrl.trim();

        if (trimmed.startsWith("data:")) {
          const marker = ";base64,";
          const markerIdx = trimmed.indexOf(marker);
          if (markerIdx !== -1) {
            buffer = Buffer.from(trimmed.slice(markerIdx + marker.length), "base64");
          }
        } else {
          let url = trimmed;
          if (url.startsWith("/")) {
            const baseUrl =
              process.env.SERVER_URL ||
              process.env.RENDER_EXTERNAL_URL ||
              `http://127.0.0.1:${process.env.PORT || 5000}`;
            url = `${baseUrl.replace(/\/+$/, "")}${url}`;
          }

          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 3000);
          try {
            const response = await fetch(url, {
              signal: controller.signal,
              headers: { "User-Agent": "ExamCraft-Export/1.0" }
            });
            if (response.ok) {
              buffer = Buffer.from(await response.arrayBuffer());
            }
          } finally {
            clearTimeout(timer);
          }
        }

        if (buffer && buffer.length > 0) {
          const size = readImageSize(buffer);
          if (size) images.set(question.id, { buffer, ...size });
        }
      } catch {
        // Export should still work smoothly if a remote image is temporarily unavailable.
      }
    })
  );
  return images;
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks.length ? chunks : [[]];
}

function fitImage(image: ImageAsset, maxWidth: number, maxHeight: number) {
  const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  return { width: Math.round(image.width * ratio), height: Math.round(image.height * ratio) };
}

function readImageSize(buffer: Buffer) {
  if (buffer[0] === 0x89 && buffer.toString("ascii", 1, 4) === "PNG") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xc3) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      offset += 2 + length;
    }
  }
  return undefined;
}

function imageType(buffer: Buffer): "png" | "jpg" {
  return buffer[0] === 0x89 ? "png" : "jpg";
}
