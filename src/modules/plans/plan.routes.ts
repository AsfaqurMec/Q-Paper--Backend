import { Router } from "express";
import { ok } from "../../utils/http.js";
import { getDbPlans } from "./plan.service.js";

export const planRouter = Router();

planRouter.get("/", async (_req, res, next) => {
  try {
    const activePlans = await getDbPlans();
    return ok(res, activePlans);
  } catch (error) {
    return next(error);
  }
});
