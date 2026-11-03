import { afterEach, describe, expect, it, vi } from "vitest";

import { GroqClient, LlmError } from "./llm";

const ok = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
const rateLimited = () =>
  new Response(JSON.stringify({ error: { message: "Rate limit reached" } }), {
    status: 429,
    headers: { "retry-after": "0.01" },
  });

describe("GroqClient", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("waits out a rate limit and retries instead of failing the question", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(rateLimited()).mockResolvedValueOnce(ok("ruling(consume(beer), H)"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(new GroqClient("k").complete("s", "u")).resolves.toBe("ruling(consume(beer), H)");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up after a bounded number of retries, reporting the rate limit", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => rateLimited()));
    const error = await new GroqClient("k").complete("s", "u").catch((e) => e);
    expect(error).toBeInstanceOf(LlmError);
    expect(error.kind).toBe("rate_limit");
  });

  it("classifies a network failure and does not retry it", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    vi.stubGlobal("fetch", fetchMock);
    const error = await new GroqClient("k").complete("s", "u").catch((e) => e);
    expect(error.kind).toBe("network");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("classifies a rejected key as an auth failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));
    const error = await new GroqClient("k").complete("s", "u").catch((e) => e);
    expect(error.kind).toBe("auth");
  });
});

describe("GroqClient rate-limit wait", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reads the wait Groq names in its message", async () => {
    const limited = new Response(
      JSON.stringify({ error: { message: "Rate limit reached ... Please try again in 0.02s. Need more tokens?" } }),
      { status: 429 }
    );
    const fetchMock = vi.fn().mockResolvedValueOnce(limited).mockResolvedValueOnce(ok("x"));
    vi.stubGlobal("fetch", fetchMock);
    const started = Date.now();
    await expect(new GroqClient("k").complete("s", "u")).resolves.toBe("x");
    expect(Date.now() - started).toBeLessThan(2_000);
  });
});
