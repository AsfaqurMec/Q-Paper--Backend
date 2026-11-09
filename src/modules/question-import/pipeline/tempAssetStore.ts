import { v2 as cloudinary } from "cloudinary";
import { env } from "../../../config/env.js";
import type { TempAsset, ExtractionJob } from "./types.js";

/**
 * Job-Scoped Temporary Asset & Job Store
 * 
 * Strict Requirement:
 * - NO extracted diagram, equation crop, or image is uploaded to Cloudinary during parsing or preview.
 * - Stores assets in-memory / temporary cache scoped to (jobId, userId).
 * - Only approved images are uploaded to Cloudinary when the user explicitly saves questions.
 * - Auto-expires old jobs and assets (default 60 minutes).
 */
class TempAssetStore {
  private jobs = new Map<string, ExtractionJob>();
  private assets = new Map<string, TempAsset>(); // key: `${jobId}:${assetId}`
  private jobTtlMs = 60 * 60 * 1000; // 1 hour expiration

  constructor() {
    // Run cleanup sweep every 10 minutes
    setInterval(() => this.cleanupExpired(), 10 * 60 * 1000).unref();
  }

  createJob(id: string, userId: string, importType: ExtractionJob["importType"]): ExtractionJob {
    const now = Date.now();
    const job: ExtractionJob = {
      id,
      userId,
      importType,
      createdAt: now,
      expiresAt: now + this.jobTtlMs,
      status: "pending",
      pages: [],
      regions: [],
      questions: [],
      warnings: [],
      metrics: {
        totalPages: 0,
        detectedRegionsCount: 0,
        ocrExecutionTimeMs: 0,
        totalPipelineTimeMs: 0
      }
    };
    this.jobs.set(id, job);
    return job;
  }

  getJob(jobId: string, userId?: string): ExtractionJob | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    if (Date.now() > job.expiresAt) {
      this.deleteJob(jobId);
      return null;
    }
    // Enforce authorization isolation between concurrent users
    if (userId && job.userId !== userId && job.userId !== "system") {
      return null;
    }
    return job;
  }

  updateJob(jobId: string, update: Partial<ExtractionJob>): ExtractionJob | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    Object.assign(job, update);
    return job;
  }

  storeAsset(asset: TempAsset): void {
    const key = `${asset.jobId}:${asset.id}`;
    this.assets.set(key, asset);
  }

  getAsset(jobId: string, assetId: string, userId?: string): TempAsset | null {
    const job = this.getJob(jobId, userId);
    if (!job) return null;
    const key = `${jobId}:${assetId}`;
    return this.assets.get(key) || null;
  }

  deleteJob(jobId: string): void {
    this.jobs.delete(jobId);
    for (const [key] of this.assets.entries()) {
      if (key.startsWith(`${jobId}:`)) {
        this.assets.delete(key);
      }
    }
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [jobId, job] of this.jobs.entries()) {
      if (now > job.expiresAt) {
        this.deleteJob(jobId);
      }
    }
  }

  /**
   * Upload an approved temporary asset to Cloudinary.
   * Called STRICTLY when a user saves a question, never during parsing or preview.
   */
  async uploadAssetToCloudinary(
    jobId: string,
    assetId: string,
    ownerId: string,
    folder = "questions"
  ): Promise<string> {
    const asset = this.getAsset(jobId, assetId);
    if (!asset) {
      throw new Error(`Temporary asset ${assetId} in job ${jobId} not found or expired.`);
    }

    const dataUrl = `data:${asset.mimeType};base64,${asset.buffer.toString("base64")}`;

    // If Cloudinary credentials are not configured, preserve as high-quality data URL
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      return dataUrl;
    }

    try {
      const uploadRes = await cloudinary.uploader.upload(dataUrl, {
        folder: `examcraft/${folder}`,
        public_id: `${ownerId}-${Date.now()}-${asset.filename.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]/gi, "-")}`,
        resource_type: "image",
        overwrite: true
      });

      return uploadRes.secure_url;
    } catch (err) {
      console.warn(`[TempAssetStore] Cloudinary upload failed for ${assetId}, falling back to data URL:`, err);
      return dataUrl;
    }
  }

  /**
   * Helper to resolve any temporary preview URL (`/api/question-import/jobs/:jobId/assets/:assetId`)
   * into a permanent Cloudinary URL upon user save.
   */
  async resolveTemporaryUrlOnSave(url: string, ownerId: string): Promise<string> {
    if (!url) return url;
    const tempUrlMatch = url.match(/\/api\/question-import\/jobs\/([a-zA-Z0-9_-]+)\/assets\/([a-zA-Z0-9_-]+)/);
    if (!tempUrlMatch) {
      return url; // Already an external or Cloudinary URL
    }

    const [, jobId, assetId] = tempUrlMatch;
    return this.uploadAssetToCloudinary(jobId, assetId, ownerId);
  }
}

export const tempAssetStore = new TempAssetStore();
