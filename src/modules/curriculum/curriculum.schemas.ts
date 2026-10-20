import { z } from "zod";

const parseAliases = (val: unknown): string[] => {
  if (Array.isArray(val)) {
    return val.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof val === "string") {
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

export const createAcademicClassSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Class name is required").max(100),
  code: z
    .string()
    .min(1, "Class code is required")
    .max(50)
    .transform((c) => c.trim().toUpperCase()),
  aliases: z.preprocess(parseAliases, z.array(z.string())).default([]),
  order: z.coerce.number().int().default(0),
  status: z.enum(["active", "inactive"]).default("active")
});

export const updateAcademicClassSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z
    .string()
    .min(1)
    .max(50)
    .transform((c) => c.trim().toUpperCase())
    .optional(),
  aliases: z.preprocess(parseAliases, z.array(z.string())).optional(),
  order: z.coerce.number().int().optional(),
  status: z.enum(["active", "inactive"]).optional()
});

export const createSubjectSchema = z.object({
  id: z.string().optional(),
  classId: z.string().min(1, "classId is required"),
  name: z.string().min(1, "Subject name is required").max(100),
  code: z
    .string()
    .max(50)
    .default("GEN")
    .transform((c) => (c ? c.trim().toUpperCase() : "GEN")),
  category: z.string().max(100).default("General"),
  aliases: z.preprocess(parseAliases, z.array(z.string())).default([]),
  order: z.coerce.number().int().default(0),
  status: z.enum(["active", "inactive"]).default("active")
});

export const updateSubjectSchema = z.object({
  classId: z.string().min(1).optional(),
  name: z.string().min(1).max(100).optional(),
  code: z
    .string()
    .max(50)
    .transform((c) => (c ? c.trim().toUpperCase() : undefined))
    .optional(),
  category: z.string().max(100).optional(),
  aliases: z.preprocess(parseAliases, z.array(z.string())).optional(),
  order: z.coerce.number().int().optional(),
  status: z.enum(["active", "inactive"]).optional()
});

export const createChapterSchema = z.object({
  id: z.string().optional(),
  classId: z.string().min(1).optional(),
  subjectId: z.string().min(1, "subjectId is required"),
  chapterNumber: z.coerce.number().int().min(1).default(1),
  name: z.string().min(1, "Chapter name is required").max(200),
  aliases: z.preprocess(parseAliases, z.array(z.string())).default([]),
  order: z.coerce.number().int().default(0),
  status: z.enum(["active", "inactive"]).default("active")
});

export const updateChapterSchema = z.object({
  classId: z.string().min(1).optional(),
  subjectId: z.string().min(1).optional(),
  chapterNumber: z.coerce.number().int().min(1).optional(),
  name: z.string().min(1).max(200).optional(),
  aliases: z.preprocess(parseAliases, z.array(z.string())).optional(),
  order: z.coerce.number().int().optional(),
  status: z.enum(["active", "inactive"]).optional()
});
