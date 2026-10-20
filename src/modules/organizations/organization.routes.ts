import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { ok, validate } from "../../utils/http.js";

const organizationSchema = z.object({
  type: z.enum(["individual_teacher", "coaching_center", "school", "college"]),
  name: z.string().min(2),
  logoUrl: z.string().url().optional(),
  address: z.string().min(2),
  phone: z.string().min(5),
  website: z.string().url().optional()
});

export const organizationRouter = Router();

organizationRouter.use(requireAuth);

organizationRouter.get("/", (_req, res) =>
  ok(res, {
    type: "school",
    name: "North Star Model School",
    logoUrl: "",
    address: "Dhaka, Bangladesh",
    phone: "+880 1700 000000",
    website: "https://example.edu"
  })
);

organizationRouter.put("/", validate(organizationSchema), (req, res) =>
  ok(res, { ...req.body, updatedAt: new Date().toISOString() }, "Organization updated")
);
