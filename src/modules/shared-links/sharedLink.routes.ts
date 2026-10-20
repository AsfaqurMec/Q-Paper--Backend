import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { publicShareRateLimiter } from "../../middleware/security.middleware.js";
import { ApiError, asyncHandler, ok, validate } from "../../utils/http.js";
import { PaperModel } from "../papers/paper.models.js";
import { SharedLinkModel } from "./sharedLink.models.js";

const shareSchema = z.object({
  paperId: z.string().min(1, "Paper ID is required"),
  mode: z.enum(["view_only", "download_pdf"]).default("view_only"),
  password: z.string().min(4, "Password must be at least 4 characters").optional()
});

const verifyPasswordSchema = z.object({
  password: z.string().min(1, "Password is required")
});

async function hashPassword(pwd: string): Promise<string> {
  return bcrypt.hash(pwd, 10);
}

async function verifyPassword(pwd: string, hash?: string): Promise<boolean> {
  if (!hash) return false;
  if (hash.startsWith("$2a$") || hash.startsWith("$2b$")) {
    return bcrypt.compare(pwd, hash);
  }
  // Legacy SHA-256 fallback compatibility
  const legacySha = createHash("sha256").update(pwd).digest("hex");
  return legacySha === hash;
}

export const sharedLinkRouter = Router();

// ================= PUBLIC ROUTES (No login required) =================

// GET /api/shared-links/public/:token - view a shared paper publicly
sharedLinkRouter.get(
  "/public/:token",
  asyncHandler(async (req, res) => {
    const link = await SharedLinkModel.findOne({ token: req.params.token });
    if (!link) {
      throw new ApiError(404, "Shared paper link not found or has been revoked");
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new ApiError(410, "This shared link has expired");
    }

    // Support password from header or query string (header preferred for security)
    const headerPwd = req.headers["x-paper-password"] as string | undefined;
    const queryPwd = (req.query.password as string) || "";
    const providedPwd = (headerPwd || queryPwd || "").trim();

    if (link.isProtected) {
      const isMatch = providedPwd ? await verifyPassword(providedPwd, link.passwordHash) : false;
      if (!isMatch) {
        return ok(res, {
          isProtected: true,
          paperName: link.paperName,
          subject: link.subject,
          className: link.className,
          mode: link.mode
        });
      }
    }

    // Increment visits
    await SharedLinkModel.updateOne({ token: req.params.token }, { $inc: { visits: 1 } });

    // Fetch the actual paper
    const paper = await PaperModel.findOne({ id: link.paperId }).lean();
    if (!paper) {
      throw new ApiError(404, "The associated question paper no longer exists");
    }

    return ok(res, {
      isProtected: false,
      mode: link.mode,
      visits: link.visits + 1,
      paper
    });
  })
);

// POST /api/shared-links/public/:token/verify - verify password for protected link
sharedLinkRouter.post(
  "/public/:token/verify",
  publicShareRateLimiter,
  validate(verifyPasswordSchema),
  asyncHandler(async (req, res) => {
    const link = await SharedLinkModel.findOne({ token: req.params.token });
    if (!link) {
      throw new ApiError(404, "Shared paper link not found or has been revoked");
    }

    if (!link.isProtected) {
      const paper = await PaperModel.findOne({ id: link.paperId }).lean();
      return ok(res, { isProtected: false, mode: link.mode, paper });
    }

    const isValid = await verifyPassword(req.body.password, link.passwordHash);
    if (!isValid) {
      throw new ApiError(401, "Incorrect password for this shared paper");
    }

    // Upgrade legacy hash to bcrypt if needed
    if (link.passwordHash && !link.passwordHash.startsWith("$2a$") && !link.passwordHash.startsWith("$2b$")) {
      const newHash = await hashPassword(req.body.password);
      await SharedLinkModel.updateOne({ token: req.params.token }, { $set: { passwordHash: newHash } });
    }

    // Increment visits
    await SharedLinkModel.updateOne({ token: req.params.token }, { $inc: { visits: 1 } });

    const paper = await PaperModel.findOne({ id: link.paperId }).lean();
    if (!paper) {
      throw new ApiError(404, "The associated question paper no longer exists");
    }

    return ok(res, {
      isProtected: false,
      mode: link.mode,
      visits: link.visits + 1,
      paper
    });
  })
);

// ================= PROTECTED ROUTES (Requires Login) =================
sharedLinkRouter.use(requireAuth);

// GET /api/shared-links - list current user's shared links
sharedLinkRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const links = await SharedLinkModel.find({ userId: req.user!.id })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = links.map((l) => ({
      id: l.id,
      token: l.token,
      paperId: l.paperId,
      paperName: l.paperName,
      subject: l.subject,
      className: l.className,
      url: `/share/${l.token}`,
      mode: l.mode,
      protected: l.isProtected,
      visits: l.visits,
      createdAt: l.createdAt
    }));

    return ok(res, formatted);
  })
);

// POST /api/shared-links - create a new shared link
sharedLinkRouter.post(
  "/",
  validate(shareSchema),
  asyncHandler(async (req, res) => {
    const paper = await PaperModel.findOne({ id: req.body.paperId });
    if (!paper) {
      throw new ApiError(404, "Question paper not found");
    }

    if (req.user!.role !== "admin" && paper.ownerId !== req.user!.id) {
      throw new ApiError(403, "You can only share papers that you created");
    }

    const token = nanoid(12);
    const linkId = `share_${nanoid(10)}`;
    const isProtected = Boolean(req.body.password && req.body.password.trim().length > 0);
    const passwordHash = isProtected ? await hashPassword(req.body.password.trim()) : undefined;

    const newLink = await SharedLinkModel.create({
      id: linkId,
      token,
      paperId: paper.id,
      userId: req.user!.id,
      paperName: paper.name,
      subject: paper.subject,
      className: paper.className,
      mode: "view_only",
      isProtected,
      passwordHash,
      visits: 0
    });

    return ok(
      res,
      {
        id: newLink.id,
        token: newLink.token,
        paperId: newLink.paperId,
        paperName: newLink.paperName,
        url: `/share/${newLink.token}`,
        mode: newLink.mode,
        protected: newLink.isProtected,
        visits: 0,
        createdAt: newLink.createdAt
      },
      "Share link created successfully",
      201
    );
  })
);

// DELETE /api/shared-links/:id - revoke a shared link
sharedLinkRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const link = await SharedLinkModel.findOne({ id: req.params.id });
    if (!link) {
      throw new ApiError(404, "Shared link not found");
    }

    if (req.user!.role !== "admin" && link.userId !== req.user!.id) {
      throw new ApiError(403, "You do not have permission to delete this shared link");
    }

    await SharedLinkModel.deleteOne({ id: req.params.id });
    return ok(res, { id: req.params.id }, "Shared link revoked successfully");
  })
);

