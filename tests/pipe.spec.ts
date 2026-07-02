import { describe, it, expect, beforeEach } from "vitest";
import { firstValueFrom } from "rxjs";
import { makeMockFetch, respond } from "./mock-fetch.js";
import { UniRateService } from "../src/lib/unirate.service.js";
import { CurrencyRatePipe, CurrencyConvertPipe } from "../src/lib/unirate.pipe.js";

const makeService = (mockFetch: ReturnType<typeof makeMockFetch>): UniRateService =>
  new UniRateService({ apiKey: "pipe-key", fetch: mockFetch });

describe("CurrencyRatePipe", () => {
  let mockFetch: ReturnType<typeof makeMockFetch>;
  let service: UniRateService;
  let pipe: CurrencyRatePipe;

  beforeEach(() => {
    mockFetch = makeMockFetch();
    service = makeService(mockFetch);
    pipe = new CurrencyRatePipe(service);
  });

  it("transform(from) returns Observable<Record> for all rates", async () => {
    mockFetch.mockResolvedValueOnce(respond({ rates: { EUR: "0.92", GBP: "0.79" } }));
    const result = await firstValueFrom(pipe.transform("USD") as ReturnType<typeof pipe.transform>);
    expect(result).toEqual({ EUR: 0.92, GBP: 0.79 });
  });

  it("transform(from, to) returns Observable<number> for paired rate", async () => {
    mockFetch.mockResolvedValueOnce(respond({ rate: "0.92" }));
    const result = await firstValueFrom(pipe.transform("USD", "EUR") as ReturnType<typeof pipe.transform>);
    expect(result).toBe(0.92);
  });

  it("propagates service errors as Observable errors", async () => {
    mockFetch.mockResolvedValueOnce(respond({ error: "not found" }, 404));
    await expect(
      firstValueFrom(pipe.transform("USD", "XYZ") as ReturnType<typeof pipe.transform>),
    ).rejects.toBeDefined();
  });
});

describe("CurrencyConvertPipe", () => {
  let mockFetch: ReturnType<typeof makeMockFetch>;
  let service: UniRateService;
  let pipe: CurrencyConvertPipe;

  beforeEach(() => {
    mockFetch = makeMockFetch();
    service = makeService(mockFetch);
    pipe = new CurrencyConvertPipe(service);
  });

  it("transform(amount, from, to) returns Observable<number>", async () => {
    mockFetch.mockResolvedValueOnce(respond({ result: "92.50" }));
    const result = await firstValueFrom(pipe.transform(100, "USD", "EUR"));
    expect(result).toBe(92.5);
  });

  it("passes correct params to service", async () => {
    mockFetch.mockResolvedValueOnce(respond({ result: "79.00" }));
    await firstValueFrom(pipe.transform(100, "USD", "GBP"));
    const url = new URL(mockFetch.mock.calls[0][0] as string);
    expect(url.searchParams.get("from")).toBe("USD");
    expect(url.searchParams.get("to")).toBe("GBP");
    expect(url.searchParams.get("amount")).toBe("100");
  });

  it("propagates service errors as Observable errors", async () => {
    mockFetch.mockResolvedValueOnce(respond({ error: "rate limit" }, 429));
    await expect(firstValueFrom(pipe.transform(100, "USD", "EUR"))).rejects.toBeDefined();
  });
});
