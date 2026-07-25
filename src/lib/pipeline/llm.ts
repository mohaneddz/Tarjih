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

export class GroqClient implements LlmClient {
  constructor(
    private readonly apiKey: string,
    private readonly model = "llama-3.3-70b-versatile"
  ) {}

  async complete(system: string, user: string, options: { json?: boolean; temperature?: number } = {}): Promise<string> {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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

    if (!response.ok) {
      let detail: string | undefined;
      try {
        const body = await response.json();
        detail = body?.error?.message;
      } catch {
        // Response body wasn't JSON; fall through with no detail.
      }
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
