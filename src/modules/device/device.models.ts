import mongoose, { Schema, type Model } from "mongoose";

export type DeviceRecord = {
  deviceId: string;
  fingerprintHash: string;
  ipAddresses: string[];
  userAgent?: string;
  platform?: string;
  associatedUserIds: string[];
  freePapersCreated: number;
  freeLimitReached: boolean;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
};

const deviceSchema = new Schema<DeviceRecord>(
  {
    deviceId: { type: String, required: true, unique: true, index: true },
    fingerprintHash: { type: String, required: true, index: true },
    ipAddresses: { type: [String], default: [] },
    userAgent: { type: String },
    platform: { type: String },
    associatedUserIds: { type: [String], default: [], index: true },
    freePapersCreated: { type: Number, default: 0 },
    freeLimitReached: { type: Boolean, default: false, index: true },
    lastActiveAt: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
  },
  { versionKey: false }
);

deviceSchema.index({ deviceId: 1, fingerprintHash: 1 });

export const DeviceModel =
  (mongoose.models.Device as Model<DeviceRecord> | undefined) ??
  mongoose.model<DeviceRecord>("Device", deviceSchema, "devices");
