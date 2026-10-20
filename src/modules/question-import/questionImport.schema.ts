import { z } from "zod";

export const parsedTableSchema = z.object({
  caption: z.string().nullable(),
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string()))
});

export const parsedSubQuestionSchema = z.object({
  id: z.string().optional(),
  label: z.string().nullable().optional(),
  text: z.string(),
  marks: z.number().nullable().optional(),
  answer: z.string().nullable().optional(),
  explanation: z.string().nullable().optional()
});

export const parsedQuestionSchema = z.object({
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  marks: z.number().nullable().optional(),
  options: z.array(z.string()).default([]),
  correct: z.number().int().nullable().optional(),
  explanation: z.string().nullable().optional(),
  warnings: z.array(z.string()).default([]),
  type: z.enum(["mcq", "cq", "written", "fill_blank", "matching", "true_false", "multiple_answer", "programming", "diagram", "table", "mathematics", "unknown"]).default("mcq"),
  number: z.string().nullable().optional(),
  images: z.array(z.string()).default([]),
  tables: z.array(parsedTableSchema).default([]),
  subQuestions: z.array(parsedSubQuestionSchema).optional()
});

export const parsedQuestionArraySchema = z.array(parsedQuestionSchema);

export type ParsedQuestion = z.infer<typeof parsedQuestionSchema>;
export type ParsedSubQuestion = z.infer<typeof parsedSubQuestionSchema>;

export const rawQuestionSchema = z.object({
  page: z.number().int().nullable().optional(),
  pages: z.array(z.number().int()).default([]),
  number: z.string().nullable().optional(),
  raw: z.string(),
  warnings: z.array(z.string()).default([])
});

export const rawQuestionArraySchema = z.array(rawQuestionSchema);

export type RawQuestion = z.infer<typeof rawQuestionSchema>;

export const geminiRawQuestionResponseSchema = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      page: { type: "INTEGER", nullable: true },
      pages: { type: "ARRAY", items: { type: "INTEGER" } },
      number: { type: "STRING", nullable: true },
      raw: { type: "STRING" },
      warnings: { type: "ARRAY", items: { type: "STRING" } }
    },
    required: ["page", "pages", "number", "raw", "warnings"]
  }
};

export const geminiQuestionResponseSchema = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      subtitle: { type: "STRING", nullable: true },
      marks: { type: "NUMBER", nullable: true },
      options: { type: "ARRAY", items: { type: "STRING" } },
      correct: { type: "INTEGER", nullable: true },
      explanation: { type: "STRING", nullable: true },
      warnings: { type: "ARRAY", items: { type: "STRING" } },
      type: {
        type: "STRING",
        enum: ["mcq", "cq", "written", "fill_blank", "matching", "true_false", "multiple_answer", "programming", "diagram", "table", "mathematics", "unknown"]
      },
      number: { type: "STRING", nullable: true },
      images: { type: "ARRAY", items: { type: "STRING" } },
      tables: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            caption: { type: "STRING", nullable: true },
            headers: { type: "ARRAY", items: { type: "STRING" } },
            rows: { type: "ARRAY", items: { type: "ARRAY", items: { type: "STRING" } } }
          },
          required: ["caption", "headers", "rows"]
        }
      },
      subQuestions: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            label: { type: "STRING", nullable: true },
            text: { type: "STRING" },
            marks: { type: "NUMBER", nullable: true },
            answer: { type: "STRING", nullable: true },
            explanation: { type: "STRING", nullable: true }
          },
          required: ["text"]
        }
      }
    },
    required: ["title", "options", "warnings", "type"]
  }
};

export const geminiSingleQuestionResponseSchema = geminiQuestionResponseSchema.items;
