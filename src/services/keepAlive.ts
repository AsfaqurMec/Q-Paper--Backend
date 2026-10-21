import { env } from "../config/env.js";

/**
 * Render free tier instances spin down after 15 minutes of inactivity.
 * This service pings the server's public /health endpoint periodically
 * to simulate inbound network traffic and prevent Render from sleeping.
 */
export function startKeepAlive(): () => void {
  if (!env.KEEP_ALIVE_ENABLED) {
    console.log("[Keep-Alive] Disabled via KEEP_ALIVE_ENABLED=false.");
    return () => {};
  }

  // Render automatically sets RENDER_EXTERNAL_URL (e.g., https://examcraft-backend.onrender.com)
  // Users can also manually supply SERVER_URL in environment variables.
  const targetUrl = env.SERVER_URL || env.RENDER_EXTERNAL_URL;

  if (!targetUrl) {
    console.log(
      "[Keep-Alive] Self-ping idle (Neither SERVER_URL nor RENDER_EXTERNAL_URL was detected). " +
      "When running on Render, RENDER_EXTERNAL_URL is set automatically."
    );
    return () => {};
  }

  const normalizedBase = targetUrl.replace(/\/+$/, "");
  const pingUrl = `${normalizedBase}/health`;
  const intervalMinutes = Math.max(1, env.KEEP_ALIVE_INTERVAL_MINUTES || 10);
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(
    `[Keep-Alive] Initialized: Pinging ${pingUrl} every ${intervalMinutes} minutes to keep Render alive.`
  );

  const ping = async () => {
    try {
      const response = await fetch(pingUrl, {
        method: "GET",
        headers: {
          "User-Agent": "ExamCraft-KeepAlive/1.0",
          "Cache-Control": "no-cache",
        },
      });

      if (response.ok) {
        console.log(
          `[Keep-Alive] Health ping successful (${response.status}) at ${new Date().toISOString()}`
        );
      } else {
        console.warn(
          `[Keep-Alive] Health ping returned non-200 status: ${response.status}`
        );
      }
    } catch (err: any) {
      console.warn(
        `[Keep-Alive] Ping to ${pingUrl} failed: ${err?.message || err}`
      );
    }
  };

  // First ping after 30 seconds of uptime, then every intervalMs
  const initialTimer = setTimeout(ping, 30 * 1000);
  const recurringTimer = setInterval(ping, intervalMs);

  return () => {
    clearTimeout(initialTimer);
    clearInterval(recurringTimer);
  };
}
