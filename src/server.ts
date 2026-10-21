import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { app } from "./app.js";
import { deleteExpiredPapers } from "./modules/papers/paper.service.js";
import { startKeepAlive } from "./services/keepAlive.js";

async function bootstrap() {
  await connectDatabase();

  // Clean up question papers older than 45 days on startup and every hour
  deleteExpiredPapers().catch((err) => console.error("[Auto-Clean] Startup cleanup error:", err));
  setInterval(() => {
    deleteExpiredPapers().catch((err) => console.error("[Auto-Clean] Periodic cleanup error:", err));
  }, 60 * 60 * 1000);

  app.listen(env.PORT, () => {
    console.log(`ExamCraft API running on http://localhost:${env.PORT}`);
    startKeepAlive();
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
