/**
 * The single point of contact with the LLM provider.
 *
 * Isolated on purpose: everywhere else in the pipeline works with plain
 * strings in and plain strings out, so this is the only module that needs
 * mocking in tests and the only one that changes if the provider does.
 */

/**
 * Why a call failed, coarsely — enough for the UI to tell someone what to do
 * about it, without leaking a raw `fetch failed` or a provider stack.
 */
export type LlmErrorKind = "timeout" | "network" | "rate_limit" | "auth" | "upstream" | "empty";

export class LlmError extends Error {
  /** For a rate limit: how long the provider asked us to wait, when it said. */
  retryAfterMs?: number;

  constructor(
    message: string,
    readonly kind: LlmErrorKind = "upstream",
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "LlmError";
  }
}

/** A sentence a person can act on, for each way the language model can fail. */
export function describeLlmFailure(kind: LlmErrorKind | undefined): string {
  switch (kind) {
    case "timeout":
      return "The language model took too long to respond. Please try again in a moment.";
    case "network":
      return "Couldn't reach the language model service. Check the internet connection and try again.";
    case "rate_limit":
      return "The language model is receiving too many requests right now. Please wait a few seconds and try again.";
    case "auth":
      return "The language model rejected the server's API key. The GROQ_API_KEY setting needs to be checked.";
    default:
      return "The language model service had a problem answering. Please try again.";
  }
}

/** Generous for a reasoning model, short enough that nobody stares at a spinner forever. */
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Groq's free tier allows 8,000 tokens a minute, and one question costs most
 * of that, so a second question inside the minute is told to wait 10-25 s.
 * Waiting that out (the spinner keeps turning) beats failing the question;
 * past this cap the user is told to try again instead.
 */
const MAX_RATE_LIMIT_RETRIES = 2;
const MAX_RETRY_WAIT_MS = 25_000;

export interface LlmClient {
  complete(system: string, user: string, options?: { json?: boolean; temperature?: number }): Promise<string>;
}

export class GroqClient implements LlmClient {
  constructor(
    private readonly apiKey: string,
    private readonly model = "openai/gpt-oss-120b",
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS
  ) {}

  /**
   * One completion, retrying a rate-limited call. Groq's free tier limits
   * requests and tokens per minute, and a burst — a demo audience all asking
   * at once, or the build-time seed — hits it quickly. A 429 says to wait,
   * not that anything is wrong, so wait briefly (the provider's Retry-After,
   * capped) and try again before giving up.
   */
  async complete(system: string, user: string, options: { json?: boolean; temperature?: number } = {}): Promise<string> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.completeOnce(system, user, options);
      } catch (e) {
        if (!(e instanceof LlmError) || e.kind !== "rate_limit" || attempt >= MAX_RATE_LIMIT_RETRIES) throw e;
        await new Promise((resolve) => setTimeout(resolve, e.retryAfterMs ?? 2_000));
      }
    }
  }

  private async completeOnce(system: string, user: string, options: { json?: boolean; temperature?: number }): Promise<string> {
    let response: Response;
    try {
      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(this.timeoutMs),
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
    } catch (e) {
      const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
      throw new LlmError(
        timedOut
          ? `Groq request timed out after ${this.timeoutMs} ms`
          : `Groq request failed: ${e instanceof Error ? e.message : String(e)}`,
        timedOut ? "timeout" : "network",
        e
      );
    }

    if (!response.ok) {
      let detail: string | undefined;
      try {
        const body = await response.json();
        detail = body?.error?.message;
      } catch {
        // Response body wasn't JSON; fall through with no detail.
      }
      const kind: LlmErrorKind =
        response.status === 429 ? "rate_limit" : response.status === 401 || response.status === 403 ? "auth" : "upstream";
      const error = new LlmError(`Groq request failed (${response.status}): ${detail ?? response.statusText}`, kind);
      if (kind === "rate_limit") {
        // Groq gives the wait in the Retry-After header and, more precisely, in the message.
        const fromMessage = /try again in ([\d.]+)s/i.exec(detail ?? "")?.[1];
        const seconds = Number(fromMessage ?? response.headers.get("retry-after"));
        error.retryAfterMs =
          Number.isFinite(seconds) && seconds > 0 ? Math.min(Math.ceil(seconds * 1000) + 250, MAX_RETRY_WAIT_MS) : undefined;
      }
      throw error;
    }

    const body = await response.json();
    const content = body?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.length === 0) {
      throw new LlmError("Groq returned an empty completion.", "empty");
    }
    return content;
  }
}
