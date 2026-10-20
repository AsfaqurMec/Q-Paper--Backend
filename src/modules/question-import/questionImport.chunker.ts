import { env } from "../../config/env.js";

export type ExtractedPage = {
  pageNumber: number;
  text: string;
  sourceName: string;
};

export type TextChunk = {
  id: string;
  text: string;
  pageNumbers: number[];
};

export function repairBengaliSpacedGlyphs(text: string): string {
  // Fixes PDF font kerning artifacts where Bengali words have spaces between every letter (e.g. "নি চে র  ত থ্যে র" -> "নিচের তথ্যের")
  const hasDoubleSpaces = /\S  +\S/.test(text);
  if (hasDoubleSpaces) {
    return text.replace(/([^\s]+(?: [^\s]+)*)/g, (segment) => {
      const tokens = segment.split(" ");
      const isSpacedBengali = tokens.length >= 2 && tokens.filter((t) => /^[\u0980-\u09FF]{1,2}$/u.test(t)).length >= tokens.length * 0.6;
      if (isSpacedBengali) {
        return tokens.join("");
      }
      return segment;
    });
  }

  return text.replace(/(?:[\u0980-\u09FF]{1,2} ){2,}[\u0980-\u09FF]{1,2}/gu, (match) => {
    return match.replace(/ /g, "");
  });
}

export function cleanupOcrText(text: string) {
  const repaired = repairBengaliSpacedGlyphs(text);
  const lines = repaired
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);

  const counts = new Map<string, number>();
  lines.forEach((line) => counts.set(line.toLowerCase(), (counts.get(line.toLowerCase()) ?? 0) + 1));

  return lines
    .filter((line) => {
      if (/^page\s*\d+(\s*of\s*\d+)?$/i.test(line)) return false;
      if (/^\d+$/.test(line) && Number(line) < 1000) return false;
      const repeated = counts.get(line.toLowerCase()) ?? 0;
      return repeated < 3 || looksLikeQuestionLine(line);
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildChunks(pages: ExtractedPage[]) {
  const chunks: TextChunk[] = [];
  const maxPages = env.PARSER_MAX_PAGES_PER_CHUNK;
  const maxChars = env.PARSER_CHUNK_SIZE;

  for (let index = 0; index < pages.length; index += maxPages) {
    const pageGroup = pages.slice(index, index + maxPages);
    const text = pageGroup.map((page) => `[${page.sourceName} page ${page.pageNumber}]\n${cleanupOcrText(page.text)}`).join("\n\n");
    chunks.push(...splitLargeText(text, pageGroup.map((page) => page.pageNumber), maxChars, chunks.length));
  }

  return chunks;
}

function splitLargeText(text: string, pageNumbers: number[], maxChars: number, offset: number): TextChunk[] {
  if (text.length <= maxChars) return [{ id: `chunk_${offset + 1}`, text, pageNumbers }];

  const questionStarts = [...text.matchAll(/\n(?=(?:q(?:uestion)?\s*)?\p{N}+[\).\-]\s+)/giu)].map((match) => match.index ?? 0);
  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length);
    const nextBoundary = questionStarts.filter((position) => position > start + maxChars * 0.6 && position <= end).pop();
    if (nextBoundary) end = nextBoundary;
    chunks.push({ id: `chunk_${offset + chunks.length + 1}`, text: text.slice(start, end).trim(), pageNumbers });
    start = end;
  }

  return chunks.filter((chunk) => chunk.text);
}

function looksLikeQuestionLine(line: string) {
  return /^(?:q(?:uestion)?\s*)?\p{N}+[\).\-]\s+/iu.test(line) || /^(?:option\s*)?[A-Ha-h][\).:\-]\s+/.test(line);
}
