import { afterEach, describe, expect, it, vi } from "vitest";

import { GroqClient, LlmError, rateLimitWaitMs } from "./llm";

function rateLimited(seconds: number): Response {
  return new Response(
    JSON.stringify({
      error: { message: `Rate limit reached in organization \`org_secret\`. Please try again in ${seconds}s.` },
    }),
    { status: 429 }
  );
}

function completion(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
}

describe("rateLimitWaitMs", () => {
  it("prefers the Retry-After header", () => {
    expect(rateLimitWaitMs("3", "try again in 16.2s")).toBe(3000);
  });

  it("falls back to the wait in Groq's message", () => {
    expect(rateLimitWaitMs(null, "Please try again in 16.2524s. Need more tokens?")).toBe(16253);
  });

  it("returns undefined when neither says", () => {
    expect(rateLimitWaitMs(null, "something else")).toBeUndefined();
  });
});

describe("GroqClient rate limiting", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("waits out a short 429 and retries", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(rateLimited(2)).mockResolvedValueOnce(completion("ok"));
    vi.stubGlobal("fetch", fetchMock);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(new GroqClient("key", "model", sleep).complete("s", "u")).resolves.toBe("ok");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(2250);
  });

  it("gives up on a wait longer than the cap, without leaking the provider message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(rateLimited(45)));
    const sleep = vi.fn().mockResolvedValue(undefined);

    const error = await new GroqClient("key", "model", sleep).complete("s", "u").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(LlmError);
    expect((error as LlmError).message).toContain("Try again in 45 seconds");
    expect((error as LlmError).message).not.toContain("org_secret");
    expect(sleep).not.toHaveBeenCalled();
  });

  it("stops after the retry budget", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(rateLimited(1)));
    vi.stubGlobal("fetch", fetchMock);

    await expect(new GroqClient("key", "model", vi.fn().mockResolvedValue(undefined)).complete("s", "u")).rejects.toThrow(
      /rate-limited/
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
