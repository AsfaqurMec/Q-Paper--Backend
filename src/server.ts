import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { app } from "./app.js";
import { deleteExpiredPapers } from "./modules/papers/paper.service.js";
import { getDbPlans } from "./modules/plans/plan.service.js";
import { startKeepAlive } from "./services/keepAlive.js";

async function bootstrap() {
  await connectDatabase();

  // Load active plans from DB into memory cache
  getDbPlans().then((loaded) => {
    console.log(`[Plans] Loaded ${loaded.length} active plans from MongoDB`);
  }).catch((err) => console.error("[Plans] Error pre-loading plans from DB:", err));

  // Clean up question papers older than 45 days on startup and every hour
  deleteExpiredPapers().catch((err) => console.error("[Auto-Clean] Startup cleanup error:", err));
  setInterval(() => {
    deleteExpiredPapers().catch((err) => console.error("[Auto-Clean] Periodic cleanup error:", err));
  }, 60 * 60 * 1000);

  app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`ExamCraft API running on http://127.0.0.1:${env.PORT}`);
    startKeepAlive();
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
