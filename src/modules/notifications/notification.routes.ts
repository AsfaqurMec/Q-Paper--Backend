import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { ok } from "../../utils/http.js";

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get("/", (_req, res) =>
  ok(res, [
    { id: "ntf_1", type: "subscription_expiry", title: "Subscription renews in 7 days", read: false },
    { id: "ntf_2", type: "paper_generated", title: "SSC Physics PDF export is ready", read: false },
    { id: "ntf_3", type: "new_feature", title: "Multiple paper versions are available on Pro", read: true }
  ])
);

notificationRouter.patch("/:id/read", (req, res) => ok(res, { id: String(req.params.id), read: true }, "Notification marked read"));
