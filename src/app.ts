import express from "express";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { billingRouter } from "./modules/billing/billing.routes.js";
import { notificationRouter } from "./modules/notifications/notification.routes.js";
import { organizationRouter } from "./modules/organizations/organization.routes.js";
import { paperRouter } from "./modules/papers/paper.routes.js";
import { planRouter } from "./modules/plans/plan.routes.js";
import { questionBankRouter } from "./modules/question-bank/questionBank.routes.js";
import { questionImportRouter } from "./modules/question-import/questionImport.routes.js";
import { questionRouter } from "./modules/questions/question.routes.js";
import { sharedLinkRouter } from "./modules/shared-links/sharedLink.routes.js";
import { supportRouter } from "./modules/support/support.routes.js";
import { uploadRouter } from "./modules/uploads/upload.routes.js";
import { versionRouter } from "./modules/versions/version.routes.js";
import { curriculumRouter } from "./modules/curriculum/curriculum.routes.js";
import { deviceRouter } from "./modules/device/device.routes.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import { applySecurity } from "./middleware/security.middleware.js";

export const app = express();

app.set("trust proxy", 1);
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
applySecurity(app);

app.get("/health", (_req, res) => res.json({ status: "ok", service: "examcraft-api" }));
app.use("/api/auth", authRouter);
app.use("/api/plans", planRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/organizations", organizationRouter);
app.use("/api/papers", paperRouter);
app.use("/api/papers", questionRouter);
app.use("/api/papers", versionRouter);
app.use("/api/question-bank", questionBankRouter);
app.use("/api/question-import", questionImportRouter);
app.use("/api/curriculum", curriculumRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/shared-links", sharedLinkRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/support", supportRouter);
app.use("/api/billing", billingRouter);
app.use("/api/device", deviceRouter);
app.use("/api/admin", adminRouter);

app.use(notFound);
app.use(errorHandler);
