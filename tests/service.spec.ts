import { describe, it, expect, beforeEach } from "vitest";
import { firstValueFrom } from "rxjs";
import { makeMockFetch, respond } from "./mock-fetch.js";
import { UniRateService } from "../src/lib/unirate.service.js";
import { UniRateError } from "../src/lib/client.js";

// UniRateService is tested by instantiating directly with a config that
// includes a mock fetch — no TestBed or zone.js needed.

const makeService = (mockFetch: ReturnType<typeof makeMockFetch>): UniRateService =>
  new UniRateService({ apiKey: "svc-key", fetch: mockFetch });

describe("UniRateService", () => {
  let mockFetch: ReturnType<typeof makeMockFetch>;
  let service: UniRateService;

  beforeEach(() => {
    mockFetch = makeMockFetch();
    service = makeService(mockFetch);
  });

  it("exposes the underlying client via .raw", () => {
    expect(service.raw).toBeDefined();
    expect(typeof service.raw.getRate).toBe("function");
  });

  describe("getRate()", () => {
    it("returns Observable<number> for paired request", async () => {
      mockFetch.mockResolvedValueOnce(respond({ rate: "0.85" }));
      const result = await firstValueFrom(service.getRate("USD", "EUR"));
      expect(result).toBe(0.85);
    });

    it("returns Observable<Record<string,number>> for unpaired request", async () => {
      mockFetch.mockResolvedValueOnce(respond({ rates: { EUR: "0.85", GBP: "0.73" } }));
      const result = await firstValueFrom(service.getRate("USD"));
      expect(result).toEqual({ EUR: 0.85, GBP: 0.73 });
    });

    it("propagates errors from the client", async () => {
      mockFetch.mockResolvedValueOnce(respond({ error: "bad key" }, 401));
      await expect(firstValueFrom(service.getRate("USD", "EUR"))).rejects.toBeInstanceOf(UniRateError);
    });
  });

  describe("convert()", () => {
    it("returns Observable<number>", async () => {
      mockFetch.mockResolvedValueOnce(respond({ result: "85.00" }));
      const result = await firstValueFrom(service.convert("EUR", 100, "USD"));
      expect(result).toBe(85);
    });
  });

  describe("listCurrencies()", () => {
    it("returns Observable<string[]>", async () => {
      mockFetch.mockResolvedValueOnce(respond({ currencies: ["USD", "EUR"] }));
      const result = await firstValueFrom(service.listCurrencies());
      expect(result).toEqual(["USD", "EUR"]);
    });
  });

  describe("getHistoricalRate()", () => {
    it("returns Observable<number> when `to` is set", async () => {
      mockFetch.mockResolvedValueOnce(respond({ rate: "0.92" }));
      const result = await firstValueFrom(service.getHistoricalRate("2024-01-01", 1, "USD", "EUR"));
      expect(result).toBe(0.92);
    });

    it("returns Observable<Record> when `to` is omitted", async () => {
      mockFetch.mockResolvedValueOnce(respond({ rates: { EUR: "0.92" } }));
      const result = await firstValueFrom(service.getHistoricalRate("2024-01-01", 1, "USD"));
      expect(result).toEqual({ EUR: 0.92 });
    });
  });

  describe("getHistoricalRates()", () => {
    it("returns Observable<Record>", async () => {
      mockFetch.mockResolvedValueOnce(respond({ rates: { EUR: "0.92", GBP: "0.79" } }));
      const result = await firstValueFrom(service.getHistoricalRates("2024-01-01", 1, "USD"));
      expect(result).toEqual({ EUR: 0.92, GBP: 0.79 });
    });
  });

  describe("convertHistorical()", () => {
    it("returns Observable<number>", async () => {
      mockFetch.mockResolvedValueOnce(respond({ rate: "0.92" }));
      const result = await firstValueFrom(service.convertHistorical(1, "USD", "EUR", "2024-01-01"));
      expect(result).toBe(0.92);
    });
  });

  describe("getTimeSeries()", () => {
    it("returns Observable<Record<string,Record<string,number>>>", async () => {
      const data = { "2024-01-01": { EUR: 0.92 }, "2024-01-02": { EUR: 0.93 } };
      mockFetch.mockResolvedValueOnce(respond({ data }));
      const result = await firstValueFrom(
        service.getTimeSeries("2024-01-01", "2024-01-02", 1, "USD"),
      );
      expect(result).toEqual(data);
    });
  });

  describe("getHistoricalLimits()", () => {
    it("returns Observable<HistoricalLimitsResponse>", async () => {
      const payload = {
        total_currencies: 170,
        data_source: "ecb",
        currencies: {},
      };
      mockFetch.mockResolvedValueOnce(respond(payload));
      const result = await firstValueFrom(service.getHistoricalLimits());
      expect(result.total_currencies).toBe(170);
    });
  });

  describe("getVATRates()", () => {
    it("returns Observable<VATRatesAll> when no country given", async () => {
      const payload = { total_countries: 50, date: "2026-01-01", vat_rates: {} };
      mockFetch.mockResolvedValueOnce(respond(payload));
      const result = await firstValueFrom(service.getVATRates());
      expect(result).toEqual(payload);
    });

    it("returns Observable<VATRateOne> when country given", async () => {
      const payload = { country: "DE", vat_data: { country_code: "DE", country_name: "Germany", vat_rate: 19 } };
      mockFetch.mockResolvedValueOnce(respond(payload));
      const result = await firstValueFrom(service.getVATRates("DE"));
      expect(result).toEqual(payload);
    });
  });
});
