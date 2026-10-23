import { z } from "zod";

export const createPaperSchema = z.object({
  name: z.string().min(2).max(120),
  subject: z.string().min(2).max(80),
  className: z.string().min(1).max(40),
  examType: z.string().min(2).max(80),
  duration: z.string().min(1).max(40),
  totalMarks: z.coerce.number().min(1).max(1000),
  institute: z.string().max(160).optional(),
  instituteLogo: z.string().max(2000).optional(),
  instituteBranding: z.boolean().optional(),
  instructions: z.string().max(2000).optional(),
  questionNumberStyle: z.enum(["numeric", "upper-alpha", "lower-alpha", "roman"]).default("numeric"),
  optionLabelStyle: z.enum(["upper-alpha", "bangla", "lower-alpha", "numeric"]).default("upper-alpha"),
  questionsPerPage: z.coerce.number().min(0).max(50).default(10),
  layout: z.enum(["single", "split"]).default("split"),
  cqLayout: z.enum(["single", "split"]).optional(),
  setName: z.string().max(30).optional(),
  mcqSectionTitle: z.string().max(120).optional(),
  cqSectionTitle: z.string().max(120).optional()
});

export const paperStatusSchema = z.object({
  status: z.enum(["draft", "published", "archived"])
});
