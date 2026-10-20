import { env } from "../config/env.js";

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export type GeminiRequest = {
  prompt?: string;
  parts?: GeminiPart[];
  responseSchema?: unknown;
};

export type GeminiResult = {
  text?: string;
  error?: string;
  modelUsed?: string;
  elapsedMs: number;
};

export class GeminiService {
  async generateJson({ prompt, parts, responseSchema }: GeminiRequest): Promise<GeminiResult | null> {
    if (!env.GEMINI_API_KEY) return { error: "GEMINI_API_KEY is not configured", elapsedMs: 0 };

    const resolvedParts: GeminiPart[] = parts && parts.length > 0
      ? parts
      : prompt
        ? [{ text: prompt }]
        : [];

    if (!resolvedParts.length) return null;

    const started = Date.now();
    const timeoutMs = env.GEMINI_TIMEOUT_MS || 50000;

    // Ordered candidate models with independent free-tier quota pools
    const candidateModels = Array.from(
      new Set([
        env.GEMINI_MODEL,
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash",
        "gemini-3.6-flash"
      ].filter(Boolean) as string[])
    );

    let lastError = "";

    for (const model of candidateModels) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const generationConfig: Record<string, unknown> = {
          maxOutputTokens: 8192,
          temperature: env.GEMINI_TEMPERATURE,
          topP: env.GEMINI_TOP_P,
          topK: env.GEMINI_TOP_K,
          responseMimeType: "application/json",
          // Turn off thinking tokens to ensure maximum output tokens for complete questions
          thinkingConfig: {
            thinkingBudget: 0
          }
        };
        if (responseSchema) {
          generationConfig.responseSchema = responseSchema;
        }

        console.log(`[GeminiService] Attempting generation with model '${model}'...`);
        const requestHeaders = {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY
        };
        const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

        let response = await fetch(endpointUrl, {
          method: "POST",
          headers: requestHeaders,
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ role: "user", parts: resolvedParts }],
            generationConfig
          })
        });

        // If 400 bad request with responseSchema, retry immediately without responseSchema
        if (!response.ok && response.status === 400 && responseSchema) {
          console.warn(`[GeminiService] Model '${model}' returned 400 with responseSchema. Retrying without responseSchema...`);
          delete generationConfig.responseSchema;
          response = await fetch(endpointUrl, {
            method: "POST",
            headers: requestHeaders,
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ role: "user", parts: resolvedParts }],
              generationConfig
            })
          });
        }

        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          lastError = `Gemini API error (${response.status}) on ${model}: ${errText.slice(0, 300)}`;
          console.warn(`[GeminiService] ${lastError}`);

          // If rate-limited (429), high demand (503), or server error, immediately failover to next model
          if (response.status === 429 || response.status === 503 || response.status === 500) {
            console.warn(`[GeminiService] Model '${model}' returned ${response.status}. Switching to next candidate model...`);
            continue;
          }
          continue;
        }

        const payload = (await response.json()) as {
          candidates?: Array<{
            content?: {
              parts?: Array<{ text?: string; thought?: boolean }>;
            };
          }>;
        };

        const candidateParts = payload.candidates?.[0]?.content?.parts ?? [];
        const nonThoughtPart = candidateParts.find((p) => p.text && !p.thought);
        const text = (nonThoughtPart?.text ?? candidateParts[0]?.text ?? "").trim();

        if (!text) {
          lastError = `Gemini model ${model} returned empty candidate text`;
          console.warn(`[GeminiService] ${lastError}. Trying next model...`);
          continue;
        }

        console.log(`[GeminiService] Success with model '${model}' in ${Date.now() - started}ms`);
        return { text, modelUsed: model, elapsedMs: Date.now() - started };
      } catch (error) {
        lastError = `Gemini model '${model}' failed: ${error instanceof Error ? error.message : String(error)}`;
        console.warn(`[GeminiService] ${lastError}. Attempting failover...`);
      } finally {
        clearTimeout(timeout);
      }
    }

    return { error: lastError || "All candidate Gemini models failed", elapsedMs: Date.now() - started };
  }
}
