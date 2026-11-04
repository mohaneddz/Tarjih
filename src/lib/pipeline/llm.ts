/**
 * The single point of contact with the LLM provider.
 *
 * Isolated on purpose: everywhere else in the pipeline works with plain
 * strings in and plain strings out, so this is the only module that needs
 * mocking in tests and the only one that changes if the provider does.
 */

export class LlmError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "LlmError";
  }
}

export interface LlmClient {
  complete(system: string, user: string, options?: { json?: boolean; temperature?: number }): Promise<string>;
}

/**
 * How long to wait out a 429 before retrying, and how many times.
 *
 * Groq's free tier allows 8,000 tokens a minute and one question spends
 * roughly 7,000 across grounding and narration, so a second question inside
 * the same minute is rate-limited almost every time. Waiting a few seconds
 * clears short bursts; a wait longer than the cap is not worth holding the
 * request open for.
 */
const RATE_LIMIT_RETRIES = 2;
const MAX_RATE_LIMIT_WAIT_MS = 20_000;

/** Reads Groq's suggested wait from the Retry-After header or its "try again in 16.25s" message. */
export function rateLimitWaitMs(retryAfter: string | null, detail: string | undefined): number | undefined {
  const header = retryAfter ? Number(retryAfter) : NaN;
  if (Number.isFinite(header)) return Math.ceil(header * 1000);
  const match = detail?.match(/try again in ([\d.]+)s/i);
  return match ? Math.ceil(Number(match[1]) * 1000) : undefined;
}

export class GroqClient implements LlmClient {
  constructor(
    private readonly apiKey: string,
    private readonly model = "openai/gpt-oss-120b",
    private readonly sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms))
  ) {}

  async complete(system: string, user: string, options: { json?: boolean; temperature?: number } = {}): Promise<string> {
    const request = () =>
      fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: options.temperature ?? 0.1,
          ...(options.json ? { response_format: { type: "json_object" } } : {}),
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });

    let response = await request();
    let wait: number | undefined;
    for (let attempt = 0; response.status === 429; attempt++) {
      wait = rateLimitWaitMs(response.headers.get("retry-after"), await readErrorDetail(response));
      if (attempt >= RATE_LIMIT_RETRIES || (wait ?? 0) > MAX_RATE_LIMIT_WAIT_MS) break;
      await this.sleep((wait ?? 5_000) + 250);
      response = await request();
    }

    if (response.status === 429) {
      // The provider's own message carries the account's organisation id and
      // an upsell link; neither belongs in front of the person asking.
      throw new LlmError(
        "The language model is rate-limited right now (the free tier allows about one question a minute). " +
          (wait ? `Try again in ${Math.ceil(wait / 1000)} seconds.` : "Try again in a minute.")
      );
    }

    if (!response.ok) {
      const detail = await readErrorDetail(response);
      throw new LlmError(`Groq request failed (${response.status}): ${detail ?? response.statusText}`);
    }

    const body = await response.json();
    const content = body?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.length === 0) {
      throw new LlmError("Groq returned an empty completion.");
    }
    return content;
  }
}

async function readErrorDetail(response: Response): Promise<string | undefined> {
  try {
    const body = await response.json();
    return body?.error?.message;
  } catch {
    // Response body wasn't JSON (or was already read); fall through with no detail.
    return undefined;
  }
}
