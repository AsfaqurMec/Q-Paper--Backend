import { Router } from "express";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../../config/env.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { ApiError, asyncHandler, ok, validate } from "../../utils/http.js";
import { sanitizeSvg } from "../../utils/security.js";

const uploadIntentSchema = z.object({
  folder: z.enum(["questions", "logos", "signatures", "watermarks"]),
  fileName: z.string().min(1)
});

const imageUploadSchema = z.object({
  folder: z.enum(["questions", "logos", "signatures", "watermarks"]).default("questions"),
  fileName: z.string().min(1),
  imageData: z.string().startsWith("data:image/")
});

export const uploadRouter = Router();

uploadRouter.use(requireAuth);

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET
  });
}

uploadRouter.post("/intent", validate(uploadIntentSchema), (req, res) =>
  ok(res, {
    provider: "cloudinary",
    folder: `examcraft/${req.body.folder}`,
    uploadPreset: "configure-in-cloudinary",
    previewUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg"
  })
);

uploadRouter.post(
  "/image",
  validate(imageUploadSchema),
  asyncHandler(async (req, res) => {
    let cleanImageData = req.body.imageData;

    // Defend against Stored XSS if uploaded image is an SVG
    if (cleanImageData.startsWith("data:image/svg+xml")) {
      try {
        const parts = cleanImageData.split(",");
        const header = parts[0] || "";
        const payload = parts.slice(1).join(",");
        const isBase64 = header.includes(";base64");
        const rawSvg = isBase64 ? Buffer.from(payload, "base64").toString("utf-8") : decodeURIComponent(payload);
        const sanitized = sanitizeSvg(rawSvg);
        cleanImageData = isBase64
          ? `data:image/svg+xml;base64,${Buffer.from(sanitized).toString("base64")}`
          : `data:image/svg+xml;utf8,${encodeURIComponent(sanitized)}`;
      } catch (err) {
        console.warn("[Upload] Failed to sanitize SVG, rejecting image:", err);
        throw new ApiError(400, "Invalid or malformed SVG data");
      }
    }

    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      return ok(
        res,
        {
          imageUrl: cleanImageData,
          publicId: `data-${Date.now()}`
        },
        "Image stored as data URL"
      );
    }

    try {
      const result = await cloudinary.uploader.upload(cleanImageData, {
        folder: `examcraft/${req.body.folder}`,
        public_id: `${req.user!.id}-${Date.now()}-${req.body.fileName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]/gi, "-")}`,
        resource_type: "image",
        overwrite: true
      });

      return ok(res, {
        imageUrl: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height
      }, "Image uploaded");
    } catch (uploadError) {
      console.warn("[Upload] Cloudinary upload failed, falling back to data URL:", uploadError);
      return ok(
        res,
        {
          imageUrl: cleanImageData,
          publicId: `fallback-${Date.now()}`
        },
        "Image preserved as data URL"
      );
    }
  })
);
