import { nanoid } from "nanoid";
import { PaymentOptionModel, PaymentRequestModel, type PaymentRequestStatus } from "./billing.models.js";
import { UserModel } from "../auth/auth.models.js";
import { PaperModel } from "../papers/paper.models.js";
import { getPlan } from "../plans/plan.service.js";
import { ApiError } from "../../utils/http.js";
import { escapeRegex } from "../../utils/security.js";

// Seed initial default Bangladeshi payment gateways if table is empty
export async function seedDefaultPaymentOptionsIfNeeded() {
  const count = await PaymentOptionModel.countDocuments();
  if (count === 0) {
    await PaymentOptionModel.insertMany([
      {
        id: `opt_${nanoid(8)}`,
        title: "bKash (Personal)",
        subtitle: "Send Money to this personal number",
        number: "01700-123456",
        instruction: "bKash অ্যাপ বা *247# ডায়াল করে Send Money অপশন বেছে নিন। উপরোক্ত নম্বরে নির্ধারিত টাকা পাঠিয়ে SMS থেকে প্রাপ্ত Transaction ID (TrxID) নিচে ইনপুট দিন।",
        isActive: true
      },
      {
        id: `opt_${nanoid(8)}`,
        title: "Nagad (Personal)",
        subtitle: "Send Money to this personal number",
        number: "01800-654321",
        instruction: "Nagad অ্যাপ বা *167# ডায়াল করে Send Money করুন। লেনদেন শেষে প্রাপ্ত Transaction ID টি প্রদান করুন।",
        isActive: true
      },
      {
        id: `opt_${nanoid(8)}`,
        title: "Rocket (Personal)",
        subtitle: "Send Money to this personal number",
        number: "01900-112233",
        instruction: "Rocket অ্যাপ বা *322# ডায়াল করে Send Money করুন। সফল লেনদেনের পর Transaction ID দিয়ে ফর্ম সাবমিট করুন।",
        isActive: true
      }
    ]);
  }
}

// 1. Get active payment options for checkout
export async function getActivePaymentOptions() {
  await seedDefaultPaymentOptionsIfNeeded();
  return PaymentOptionModel.find({ isActive: true }).sort({ createdAt: 1 }).lean();
}

// 2. Get all payment options for admin
export async function getAllPaymentOptions() {
  await seedDefaultPaymentOptionsIfNeeded();
  return PaymentOptionModel.find().sort({ createdAt: -1 }).lean();
}

// 3. Create payment option
export async function createPaymentOption(data: {
  title: string;
  subtitle: string;
  number: string;
  instruction?: string;
  isActive?: boolean;
}) {
  const option = await PaymentOptionModel.create({
    id: `opt_${nanoid(8)}`,
    title: data.title.trim(),
    subtitle: data.subtitle.trim(),
    number: data.number.trim(),
    instruction: data.instruction?.trim() || "",
    isActive: data.isActive !== undefined ? data.isActive : true
  });
  return option.toObject();
}

// 4. Update payment option
export async function updatePaymentOption(
  id: string,
  data: Partial<{
    title: string;
    subtitle: string;
    number: string;
    instruction: string;
    isActive: boolean;
  }>
) {
  const option = await PaymentOptionModel.findOne({ id });
  if (!option) {
    throw new ApiError(404, "Payment option not found");
  }

  if (data.title !== undefined) option.title = data.title.trim();
  if (data.subtitle !== undefined) option.subtitle = data.subtitle.trim();
  if (data.number !== undefined) option.number = data.number.trim();
  if (data.instruction !== undefined) option.instruction = data.instruction.trim();
  if (data.isActive !== undefined) option.isActive = data.isActive;

  await option.save();
  return option.toObject();
}

// 5. Delete payment option
export async function deletePaymentOption(id: string) {
  const result = await PaymentOptionModel.deleteOne({ id });
  if (result.deletedCount === 0) {
    throw new ApiError(404, "Payment option not found");
  }
  return { id, deleted: true };
}

// 6. User initiates checkout & payment request
export async function submitPaymentRequest(
  userId: string,
  data: {
    planCode: string;
    paymentOptionId: string;
    transactionId: string;
    senderNumber?: string;
    customerNote?: string;
  }
) {
  const user = await UserModel.findOne({ id: userId });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const normalizedPlanCode = data.planCode === "standard" ? "pro" : data.planCode;
  const planInfo = getPlan(normalizedPlanCode);
  if (!planInfo || planInfo.price <= 0) {
    throw new ApiError(400, "Invalid package selected for payment");
  }

  const paymentOption = await PaymentOptionModel.findOne({ id: data.paymentOptionId });
  if (!paymentOption || !paymentOption.isActive) {
    throw new ApiError(400, "Selected payment option is invalid or unavailable");
  }

  const trimmedTxId = data.transactionId.trim();
  if (!trimmedTxId || trimmedTxId.length < 4) {
    throw new ApiError(400, "Please provide a valid Transaction ID");
  }

  // Check if a pending request with exact same transactionId already exists
  const existingPending = await PaymentRequestModel.findOne({
    transactionId: trimmedTxId,
    status: { $in: ["pending", "approved"] }
  });
  if (existingPending) {
    if (existingPending.status === "approved") {
      throw new ApiError(400, "This Transaction ID has already been verified and approved.");
    }
    throw new ApiError(400, "A payment request with this Transaction ID is already pending review.");
  }

  const newRequest = await PaymentRequestModel.create({
    id: `req_${nanoid(10)}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    planCode: normalizedPlanCode,
    planName: planInfo.name,
    amount: planInfo.price,
    paymentOptionId: paymentOption.id,
    paymentOptionTitle: paymentOption.title,
    paymentOptionSubtitle: paymentOption.subtitle,
    paymentOptionNumber: paymentOption.number,
    transactionId: trimmedTxId,
    senderNumber: data.senderNumber?.trim() || "",
    customerNote: data.customerNote?.trim() || "",
    status: "pending"
  });

  return newRequest.toObject();
}

// 7. Get user's own payment requests
export async function getUserPaymentRequests(userId: string) {
  return PaymentRequestModel.find({ userId }).sort({ createdAt: -1 }).lean();
}

// 8. Admin: Get all payment requests with filtering
export async function getAdminPaymentRequests(query: {
  status?: string;
  search?: string;
  limit?: number;
  skip?: number;
}) {
  const filter: Record<string, any> = {};

  if (query.status && query.status !== "all") {
    filter.status = query.status;
  }

  if (query.search) {
    const safePattern = escapeRegex(query.search.trim());
    filter.$or = [
      { userName: { $regex: safePattern, $options: "i" } },
      { userEmail: { $regex: safePattern, $options: "i" } },
      { transactionId: { $regex: safePattern, $options: "i" } },
      { senderNumber: { $regex: safePattern, $options: "i" } },
      { id: { $regex: safePattern, $options: "i" } }
    ];
  }

  const limit = Math.min(100, Math.max(1, query.limit || 50));
  const skip = Math.max(0, query.skip || 0);

  const [requests, total, pendingCount] = await Promise.all([
    PaymentRequestModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    PaymentRequestModel.countDocuments(filter),
    PaymentRequestModel.countDocuments({ status: "pending" })
  ]);

  return { requests, total, pendingCount, limit, skip };
}

// 9. Admin: Get single payment request with user details
export async function getAdminPaymentRequestById(id: string) {
  const request = await PaymentRequestModel.findOne({ id }).lean();
  if (!request) {
    throw new ApiError(404, "Payment request not found");
  }

  const [user, paperCount] = await Promise.all([
    UserModel.findOne({ id: request.userId }).select("-passwordHash").lean(),
    PaperModel.countDocuments({ ownerId: request.userId })
  ]);

  return {
    ...request,
    user: user || null,
    userPaperCount: paperCount
  };
}

// 10. Admin confirms and activates the user
export async function approvePaymentRequest(id: string, adminUserId: string, adminNote?: string) {
  const request = await PaymentRequestModel.findOne({ id });
  if (!request) {
    throw new ApiError(404, "Payment request not found");
  }

  if (request.status === "approved") {
    throw new ApiError(400, "This payment request is already approved");
  }

  const user = await UserModel.findOne({ id: request.userId });
  if (!user) {
    throw new ApiError(404, "Target user not found");
  }

  // Activate & upgrade user plan
  const targetPlan = request.planCode === "standard" ? "pro" : request.planCode;
  user.plan = targetPlan;
  user.verified = true;
  user.updatedAt = new Date().toISOString();
  await user.save();

  // Mark request as approved
  request.status = "approved";
  request.reviewedBy = adminUserId;
  request.reviewedAt = new Date().toISOString();
  if (adminNote) {
    request.adminNote = adminNote.trim();
  }
  await request.save();

  return {
    request: request.toObject(),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      verified: user.verified
    }
  };
}

// 11. Admin rejects payment request
export async function rejectPaymentRequest(id: string, adminUserId: string, reason?: string) {
  const request = await PaymentRequestModel.findOne({ id });
  if (!request) {
    throw new ApiError(404, "Payment request not found");
  }

  if (request.status === "approved") {
    throw new ApiError(400, "Cannot reject an already approved request");
  }

  request.status = "rejected";
  request.reviewedBy = adminUserId;
  request.reviewedAt = new Date().toISOString();
  request.adminNote = reason?.trim() || "Rejected by administrator";
  await request.save();

  return request.toObject();
}
