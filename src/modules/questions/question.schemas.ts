import { z } from "zod";

const optionSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(5),
  text: z.string().min(1).max(500),
  isCorrect: z.boolean()
});

const subQuestionSchema = z.object({
  id: z.string(),
  label: z.string().max(10).optional(),
  text: z.string().min(1).max(1200),
  marks: z.coerce.number().min(0.25).max(100),
  answer: z.string().max(2000).optional(),
  explanation: z.string().max(2000).optional()
});

export const saveQuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string(),
        number: z.string().max(20).optional(),
        title: z.string().min(1).max(1200),
        subtitle: z.string().max(500).optional(),
        imageUrl: z.string().url().optional(),
        marks: z.coerce.number().min(0.25).max(100),
        explanation: z.string().max(2000).optional(),
        type: z.enum(["mcq", "cq"]).default("mcq"),
        options: z.array(optionSchema).max(8).default([]),
        subQuestions: z.array(subQuestionSchema).max(12).optional()
      })
    )
    .max(150)
});
