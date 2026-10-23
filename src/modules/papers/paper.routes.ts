import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { ApiError, asyncHandler, ok, validate } from "../../utils/http.js";
import { nanoid } from "nanoid";
import { createPaper, deletePaper, duplicatePaper, getPaper, listPapers, setStatus, updatePaper, updatePaperQuestions } from "./paper.service.js";
import { createPaperSchema, paperStatusSchema } from "./paper.schemas.js";
import { createSetPaper, renderPaperDocx, renderPaperPdf } from "./paperExport.service.js";
import type { Paper } from "../shared/types.js";
import { getBengaliClass, getBengaliSubject, getBengaliPaperTitle } from "../curriculum/curriculumBengali.js";
import { QuestionBankItemModel } from "../question-bank/questionBank.models.js";

export const paperRouter = Router();

paperRouter.use(requireAuth);

paperRouter.get("/", asyncHandler(async (req, res) => ok(res, await listPapers(req.user!.id))));

paperRouter.post(
  "/",
  validate(createPaperSchema),
  asyncHandler(async (req, res) => ok(res, await createPaper(req.user!.id, req.user!.plan, req.body, req), "Paper created", 201))
);

paperRouter.get("/:id", asyncHandler(async (req, res) => ok(res, await getPaper(String(req.params.id), req.user!.id))));

paperRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const updated = await updatePaper(String(req.params.id), req.user!.id, req.user!.plan, req.body, req.user!.role);
    return ok(res, updated, "Paper updated");
  })
);

paperRouter.post(
  "/:id/duplicate",
  asyncHandler(async (req, res) =>
    ok(res, await duplicatePaper(String(req.params.id), req.user!.id, req.user!.plan, req), "Paper duplicated", 201)
  )
);

paperRouter.patch(
  "/:id/status",
  validate(paperStatusSchema),
  asyncHandler(async (req, res) =>
    ok(res, await setStatus(String(req.params.id), req.user!.id, req.body.status), "Paper status updated")
  )
);

paperRouter.post(
  "/:id/import-bank",
  asyncHandler(async (req, res) => {
    const paper = await getPaper(String(req.params.id), req.user!.id);
    const bankQuestionIds: string[] = req.body.bankQuestionIds;
    if (!Array.isArray(bankQuestionIds) || !bankQuestionIds.length) {
      throw new ApiError(400, "bankQuestionIds array is required");
    }

    const bankItems = await QuestionBankItemModel.find({
      id: { $in: bankQuestionIds },
      $or: [{ ownerId: req.user!.id }, { ownerId: "usr_demo_teacher" }, { ownerId: "system" }]
    }).lean();

    if (!bankItems.length) throw new ApiError(404, "No matching question bank items found");

    const itemMap = new Map(bankItems.map((b: any) => [b.id, b]));
    const orderedItems = bankQuestionIds
      .map((id) => itemMap.get(id))
      .filter((b): b is any => Boolean(b));

    const banglaLabels = ["ক", "খ", "গ", "ঘ"];
    const newQuestions = orderedItems.map((item) => {
      const isCq = item.type === "cq" || (item.subQuestions && item.subQuestions.length > 0);
      if (isCq) {
        const subQuestions = item.subQuestions && item.subQuestions.length > 0
          ? item.subQuestions.map((sq: any, sqIdx: number) => ({
              id: `sq_${nanoid(8)}`,
              label: sq.label || banglaLabels[sqIdx] || String.fromCharCode(97 + sqIdx),
              text: sq.text,
              marks: sq.marks || (sqIdx === 0 ? 1 : sqIdx === 1 ? 2 : sqIdx === 2 ? 3 : 4),
              answer: sq.answer || undefined,
              explanation: sq.explanation || undefined
            }))
          : [
              { id: `sq_${nanoid(8)}`, label: "ক", text: "জ্ঞানমূলক প্রশ্ন", marks: 1 },
              { id: `sq_${nanoid(8)}`, label: "খ", text: "অনুধাবনমূলক প্রশ্ন", marks: 2 },
              { id: `sq_${nanoid(8)}`, label: "গ", text: "প্রয়োগমূলক প্রশ্ন", marks: 3 },
              { id: `sq_${nanoid(8)}`, label: "ঘ", text: "উচ্চতর দক্ষতামূলক প্রশ্ন", marks: 4 }
            ];
        const cqTotalMarks = subQuestions.reduce((sum: number, sq: any) => sum + sq.marks, 0);
        return {
          id: `q_${nanoid(10)}`,
          title: item.title,
          subtitle: item.subtitle || undefined,
          imageUrl: item.imageUrl || undefined,
          marks: item.marks || cqTotalMarks || 10,
          explanation: item.explanation || undefined,
          type: "cq" as const,
          options: [],
          subQuestions
        };
      }

      return {
        id: `q_${nanoid(10)}`,
        title: item.title,
        subtitle: item.subtitle || undefined,
        imageUrl: item.imageUrl || undefined,
        marks: item.marks || 1,
        explanation: item.explanation || undefined,
        type: "mcq" as const,
        options: (item.options || []).map((optText: string, optIndex: number) => ({
          id: `opt_${nanoid(8)}`,
          label: String.fromCharCode(65 + optIndex),
          text: optText,
          isCorrect: optIndex === item.correctIndex
        }))
      };
    });

    const combinedQuestions = [...paper.questions, ...newQuestions];
    const updatedPaper = await updatePaperQuestions(paper.id, req.user!.id, req.user!.plan, combinedQuestions as any);

    await QuestionBankItemModel.updateMany(
      { id: { $in: bankItems.map((b: any) => b.id) } },
      { $inc: { usageCount: 1 }, $set: { updatedAt: new Date().toISOString() } }
    );

    return ok(res, updatedPaper, `${newQuestions.length} question(s) imported from Question Bank`);
  })
);

paperRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => ok(res, await deletePaper(String(req.params.id), req.user!.id), "Paper deleted"))
);

paperRouter.get("/:id/export/:format", asyncHandler(async (req, res) => {
  const paperDoc = await getPaper(String(req.params.id), req.user!.id);
  const paper: Paper = (paperDoc as any).toObject ? (paperDoc as any).toObject() : JSON.parse(JSON.stringify(paperDoc));

  if (req.query.layout === "single" || req.query.layout === "split") {
    paper.layout = req.query.layout;
  }
  if (req.query.cqLayout === "single" || req.query.cqLayout === "split") {
    paper.cqLayout = req.query.cqLayout;
  }
  if (req.query.questionsPerPage !== undefined && !isNaN(Number(req.query.questionsPerPage))) {
    paper.questionsPerPage = Number(req.query.questionsPerPage);
  }

  const sectionFlow =
    req.query.sectionFlow === "single" || req.query.sectionFlow === "separate"
      ? (req.query.sectionFlow as "single" | "separate")
      : (paper.sectionFlow || "separate");

  const rawSet = req.query.set ? String(req.query.set).trim() : (paper.setName ? String(paper.setName).trim() : "");
  const isAllSets = rawSet.toLowerCase() === "all";

  let preparedPaper = paper;
  let fileSuffix = "";

  const isBangla = /[\u0980-\u09FF]/.test(paper.name + paper.subject) || !paper.subject?.toLowerCase().includes("english");
  const banglaSetMap: Record<string, string> = { A: "ক", B: "খ", C: "গ", D: "ঘ" };

  if (isAllSets) {
    fileSuffix = isBangla ? "-সকল-সেট" : "-All-Sets";
  } else if (rawSet && rawSet.toLowerCase() !== "none" && rawSet.toLowerCase() !== "original") {
    preparedPaper = createSetPaper(paper, rawSet);
    const displaySet = isBangla ? (banglaSetMap[preparedPaper.setName?.toUpperCase() || ""] || preparedPaper.setName) : preparedPaper.setName;
    fileSuffix = isBangla ? `-সেট-${displaySet}` : `-Set-${preparedPaper.setName}`;
  } else {
    // Ensure clean sequential numbering
    const toBn = (n: number) => n.toString().replace(/[0-9]/g, (d) => ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"][Number(d)]);
    preparedPaper.questions = (preparedPaper.questions || []).map((q, idx) => ({
      ...q,
      number: q.number && q.number.trim() ? q.number.trim() : (isBangla ? toBn(idx + 1) : String(idx + 1))
    }));
  }

  const format = String(req.params.format).toLowerCase();
  const withAnswerParam = req.query.withAnswer !== undefined ? String(req.query.withAnswer).trim().toLowerCase() : undefined;
  const withAnswer = withAnswerParam !== undefined
    ? (withAnswerParam === "true" || withAnswerParam === "1" || withAnswerParam === "yes" || withAnswerParam === "with")
    : true;
  const answerSuffix = withAnswerParam !== undefined
    ? (withAnswer ? (isBangla ? "-উত্তরসহ" : "-With-Answers") : (isBangla ? "-প্রশ্নপত্র" : "-Question-Paper"))
    : (isBangla ? "-প্রশ্নপত্র" : "");

  let baseName = paper.name.trim();
  if (isBangla) {
    baseName = getBengaliPaperTitle(paper.name, paper.className, paper.subject);
  }

  const dispositionHeader = getExportContentDisposition(baseName, `${fileSuffix}${answerSuffix}`, format);

  if (format === "docx") {
    if (req.user!.plan !== "ultra" && req.user!.plan !== "diamond" && req.user!.role !== "admin") {
      throw new ApiError(403, "DOCX export is only available in the Ultra and Diamond packages. Please upgrade your plan.");
    }
    const file = await renderPaperDocx(preparedPaper, { withAnswer, allSets: isAllSets, sectionFlow });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", dispositionHeader);
    return res.send(file);
  }
  if (format === "pdf") {
    const file = await renderPaperPdf(preparedPaper, { withAnswer, allSets: isAllSets, sectionFlow });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", dispositionHeader);
    return res.send(file);
  }
  throw new ApiError(400, "Unsupported export format");
}));

function sanitizeUnicodeFileName(value: string) {
  return value
    .replace(/[/\\?%*:|"<>#]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "question-paper";
}

function safeAsciiFileName(value: string) {
  return value
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "question-paper";
}

function getExportContentDisposition(baseName: string, suffix: string, ext: string) {
  const unicodeFullName = `${sanitizeUnicodeFileName(baseName)}${suffix}.${ext}`;
  const asciiFullName = `${safeAsciiFileName(baseName)}${safeAsciiFileName(suffix)}.${ext}`;
  return `attachment; filename="${asciiFullName}"; filename*=UTF-8''${encodeURIComponent(unicodeFullName)}`;
}

function paperLines(paper: Paper) {
  const lines = [
    paper.name,
    `${paper.examType} | ${paper.className} | ${paper.subject} | Time: ${paper.duration} | Marks: ${paper.totalMarks}`,
    paper.instructions ?? "",
    ""
  ].filter(Boolean);

  paper.questions.forEach((question, index) => {
    lines.push(`${index + 1}. ${question.title} (${question.marks} mark${question.marks === 1 ? "" : "s"})`);
    if (question.subtitle) lines.push(`   ${question.subtitle}`);
    question.options.forEach((option) => lines.push(`   ${option.label}. ${option.text}`));
    const correct = question.options.find((option) => option.isCorrect);
    if (correct) lines.push(`   Answer: ${correct.label}`);
    if (question.explanation) lines.push(`   Explanation: ${question.explanation}`);
    if (question.imageUrl) lines.push(`   Image: ${question.imageUrl}`);
    lines.push("");
  });

  if (!paper.questions.length) lines.push("No questions saved yet.");
  return lines;
}

function buildPdf(paper: Paper) {
  const lines = paperLines(paper);
  const pageHeight = 792;
  const pageWidth = 612;
  const escapedLines = lines.flatMap((line) => wrapLine(line, 88)).map(escapePdfText);
  const content = [
    "BT",
    "/F1 11 Tf",
    "50 742 Td",
    "14 TL",
    ...escapedLines.map((line) => `(${line}) Tj T*`),
    "ET"
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`
  ];
  const chunks = ["%PDF-1.4\n"];
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(chunks.join("")));
    chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });
  const xrefOffset = Buffer.byteLength(chunks.join(""));
  chunks.push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  offsets.slice(1).forEach((offset) => chunks.push(`${String(offset).padStart(10, "0")} 00000 n \n`));
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  return Buffer.from(chunks.join(""));
}

function wrapLine(line: string, width: number) {
  if (line.length <= width) return [line];
  const words = line.split(" ");
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildDocx(paper: Paper) {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paperLines(paper).map((line) => `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`).join("")}
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;
  return zipStore([
    { name: "[Content_Types].xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>` },
    { name: "_rels/.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>` },
    { name: "word/document.xml", data: documentXml }
  ]);
}

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function zipStore(files: Array<{ name: string; data: string }>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  files.forEach((file) => {
    const name = Buffer.from(file.name);
    const data = Buffer.from(file.data);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    localParts.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + data.length;
  });
  const central = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, central, end]);
}

function crc32(data: Buffer) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
