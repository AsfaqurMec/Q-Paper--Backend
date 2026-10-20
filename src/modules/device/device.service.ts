import crypto from "node:crypto";
import type { Request } from "express";
import { DeviceModel, type DeviceRecord } from "./device.models.js";
import { PaperModel } from "../papers/paper.models.js";
import type { PlanCode } from "../shared/types.js";

const now = () => new Date().toISOString();
export const MAX_FREE_PAPERS_PER_DEVICE = 2;

export function extractDeviceInfo(req: Request) {
  const headerDeviceId = req.headers["x-device-id"] as string | undefined;
  const headerFingerprint = req.headers["x-device-fingerprint"] as string | undefined;
  const cookieDeviceId = req.cookies?.qpaper_device_id as string | undefined;
  const bodyDeviceId = req.body && typeof req.body === "object" ? (req.body as any).deviceId : undefined;
  const bodyFingerprint = req.body && typeof req.body === "object" ? (req.body as any).fingerprintHash : undefined;

  const rawIp =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
    req.ip ||
    req.socket.remoteAddress ||
    "127.0.0.1";
  const userAgent = (req.headers["user-agent"] as string | undefined) || "unknown";
  const platform = (req.headers["sec-ch-ua-platform"] as string | undefined) || "";

  // Compute immutable server-side fingerprint based on connection metadata
  const serverFingerprint = crypto
    .createHash("sha256")
    .update(`${rawIp}:::${userAgent}:::${platform}`)
    .digest("hex");

  // If client provided deviceId or fingerprint, use it with fallback to server-side anchor
  let deviceId = headerDeviceId || cookieDeviceId || bodyDeviceId;
  let fingerprintHash = headerFingerprint || bodyFingerprint || serverFingerprint;

  if (!deviceId) {
    deviceId = `dev_${serverFingerprint.slice(0, 16)}`;
  }

  return {
    deviceId: String(deviceId).trim(),
    fingerprintHash: String(fingerprintHash).trim(),
    serverFingerprint,
    ip: rawIp,
    userAgent,
    platform
  };
}

export async function resolveDevice(req: Request, userId?: string): Promise<DeviceRecord> {
  const info = extractDeviceInfo(req);
  const timestamp = now();

  // Try finding existing device by deviceId, client fingerprint, OR server-anchored fingerprint
  const queryConditions: Array<Record<string, any>> = [
    { deviceId: info.deviceId },
    { fingerprintHash: info.fingerprintHash },
    { fingerprintHash: info.serverFingerprint }
  ];
  if (userId) {
    queryConditions.push({ associatedUserIds: userId });
  }

  let device = await DeviceModel.findOne({ $or: queryConditions });

  if (!device) {
    device = await DeviceModel.create({
      deviceId: info.deviceId,
      fingerprintHash: info.fingerprintHash,
      ipAddresses: [info.ip],
      userAgent: info.userAgent,
      platform: info.platform,
      associatedUserIds: userId ? [userId] : [],
      freePapersCreated: 0,
      freeLimitReached: false,
      lastActiveAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  } else {
    let modified = false;
    if (!device.ipAddresses.includes(info.ip)) {
      device.ipAddresses.push(info.ip);
      modified = true;
    }
    if (userId && !device.associatedUserIds.includes(userId)) {
      device.associatedUserIds.push(userId);
      modified = true;
    }
    device.lastActiveAt = timestamp;
    device.updatedAt = timestamp;
    if (modified) {
      await device.save();
    } else {
      await DeviceModel.updateOne({ _id: device._id }, { $set: { lastActiveAt: timestamp, updatedAt: timestamp } });
    }
  }

  return device.toObject ? device.toObject() : device;
}

export async function checkDeviceFreeLimit(
  req: Request,
  userPlan: PlanCode | string
): Promise<{ allowed: boolean; reason: string; deviceId?: string }> {
  // Paid plans (Pro, Ultra) are exempt from device free limits
  if (userPlan === "pro" || userPlan === "ultra") {
    return { allowed: true, reason: "Allowed" };
  }

  const device = await resolveDevice(req, req.user?.id);

  // 1. Direct check on device counters
  if (device.freeLimitReached || device.freePapersCreated >= MAX_FREE_PAPERS_PER_DEVICE) {
    return {
      allowed: false,
      reason: `Free package limit has already been used on this device (maximum ${MAX_FREE_PAPERS_PER_DEVICE} question papers per device). Please upgrade to Pro or Ultra to create question papers from this device.`,
      deviceId: device.deviceId
    };
  }

  // 2. Cross-verify by querying all papers created by any associated users on this device
  if (device.associatedUserIds && device.associatedUserIds.length > 0) {
    const totalPapersAcrossAssociatedUsers = await PaperModel.countDocuments({
      ownerId: { $in: device.associatedUserIds },
      status: { $ne: "archived" }
    });

    if (totalPapersAcrossAssociatedUsers >= MAX_FREE_PAPERS_PER_DEVICE) {
      await DeviceModel.updateOne(
        { deviceId: device.deviceId },
        {
          $set: {
            freePapersCreated: Math.max(device.freePapersCreated, totalPapersAcrossAssociatedUsers),
            freeLimitReached: true,
            updatedAt: now()
          }
        }
      );
      return {
        allowed: false,
        reason: `Free package limit has already been used on this device across associated accounts (maximum ${MAX_FREE_PAPERS_PER_DEVICE} question papers per device). Please upgrade to Pro or Ultra to create question papers.`,
        deviceId: device.deviceId
      };
    }
  }

  return { allowed: true, reason: "Allowed", deviceId: device.deviceId };
}

export async function recordDevicePaperCreation(req: Request, userId: string, userPlan: PlanCode | string) {
  if (userPlan !== "free") return;

  const device = await resolveDevice(req, userId);
  const updatedCount = (device.freePapersCreated || 0) + 1;
  const isLimitReached = updatedCount >= MAX_FREE_PAPERS_PER_DEVICE;

  await DeviceModel.updateOne(
    { deviceId: device.deviceId },
    {
      $set: {
        freePapersCreated: updatedCount,
        freeLimitReached: isLimitReached,
        updatedAt: now()
      },
      $addToSet: { associatedUserIds: userId }
    }
  );
}

export async function getDeviceStatus(req: Request, userPlan: PlanCode | string) {
  const device = await resolveDevice(req, req.user?.id);
  const isPaid = userPlan === "pro" || userPlan === "ultra";

  return {
    deviceId: device.deviceId,
    freePapersCreated: device.freePapersCreated,
    maxFreePapers: MAX_FREE_PAPERS_PER_DEVICE,
    freeLimitReached: device.freeLimitReached || device.freePapersCreated >= MAX_FREE_PAPERS_PER_DEVICE,
    isPaidPlan: isPaid
  };
}
