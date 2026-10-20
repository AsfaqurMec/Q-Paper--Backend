import { Router } from "express";
import { asyncHandler, ok } from "../../utils/http.js";
import { getDeviceStatus, resolveDevice } from "./device.service.js";

export const deviceRouter = Router();

// GET /api/device/status - Returns current device usage statistics & free limit status
deviceRouter.get(
  "/status",
  asyncHandler(async (req, res) => {
    const userPlan = req.user?.plan || "free";
    const status = await getDeviceStatus(req, userPlan);
    return ok(res, status);
  })
);

// POST /api/device/sync - Synchronizes client-side device fingerprint
deviceRouter.post(
  "/sync",
  asyncHandler(async (req, res) => {
    const device = await resolveDevice(req, req.user?.id);
    return ok(res, {
      deviceId: device.deviceId,
      freePapersCreated: device.freePapersCreated,
      freeLimitReached: device.freeLimitReached
    });
  })
);
