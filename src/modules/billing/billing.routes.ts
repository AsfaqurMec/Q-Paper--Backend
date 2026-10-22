import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { asyncHandler, ok, validate } from "../../utils/http.js";
import {
  getActivePaymentOptions,
  getUserPaymentRequests,
  submitPaymentRequest
} from "./billing.service.js";

const checkoutSchema = z.object({
  planCode: z.string().min(1, "Please select a plan"),
  paymentOptionId: z.string().min(1, "Please select a payment option"),
  transactionId: z.string().min(3, "Please enter a valid Transaction ID"),
  senderNumber: z.string().optional(),
  customerNote: z.string().optional()
});

export const billingRouter = Router();

billingRouter.use(requireAuth);

// GET /api/billing/payment-options - fetch active payment gateways for checkout
billingRouter.get(
  "/payment-options",
  asyncHandler(async (_req, res) => {
    const options = await getActivePaymentOptions();
    return ok(res, options);
  })
);

// POST /api/billing/checkout - user submits checkout payment request
billingRouter.post(
  "/checkout",
  validate(checkoutSchema),
  asyncHandler(async (req, res) => {
    const paymentRequest = await submitPaymentRequest(req.user!.id, req.body);
    return ok(
      res,
      paymentRequest,
      "পেমেন্ট রিকোয়েস্ট সফলভাবে জমা হয়েছে! এডমিন যাচাই করে আপনার প্যাকেজ সক্রিয় করবে।",
      201
    );
  })
);

// GET /api/billing/my-requests - current user's submitted requests
billingRouter.get(
  "/my-requests",
  asyncHandler(async (req, res) => {
    const requests = await getUserPaymentRequests(req.user!.id);
    return ok(res, requests);
  })
);

// Fallback legacy endpoint
billingRouter.post(
  "/payments",
  asyncHandler(async (req, res) => {
    if (req.body.paymentOptionId && req.body.transactionId) {
      const paymentRequest = await submitPaymentRequest(req.user!.id, req.body);
      return ok(res, paymentRequest, "Payment initiated", 201);
    }
    return ok(
      res,
      {
        id: `pay_${Date.now()}`,
        status: "pending_approval",
        ...req.body
      },
      "Payment initiated",
      201
    );
  })
);
