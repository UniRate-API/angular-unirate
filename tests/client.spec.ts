import { describe, it, expect, beforeEach } from "vitest";
import { makeMockFetch, respond, respondText } from "./mock-fetch.js";
import {
  UniRateClient,
  UniRateError,
  AuthenticationError,
  RateLimitError,
  InvalidCurrencyError,
  InvalidRequestError,
  ProRequiredError,
} from "../src/lib/client.js";

describe("UniRateClient", () => {
  let mockFetch: ReturnType<typeof makeMockFetch>;
  let client: UniRateClient;

  beforeEach(() => {
    mockFetch = makeMockFetch();
    client = new UniRateClient({ apiKey: "test-key", fetch: mockFetch });
  });

  describe("constructor", () => {
    it("throws when apiKey is empty", () => {
      expect(() => new UniRateClient({ apiKey: "", fetch: mockFetch })).toThrow(UniRateError);
    });

    it("throws when fetch is unavailable and no custom fetch given", () => {
      const original = globalThis.fetch;
      // @ts-expect-error intentional
      globalThis.fetch = undefined;
      try {
        expect(() => new UniRateClient({ apiKey: "k" })).toThrow(UniRateError);
      } finally {
        globalThis.fetch = original;
      }
    });
  });

  describe("getRate()", () => {
    it("returns a number when `to` is provided", async () => {
      mockFetch.mockResolvedValueOnce(respond({ rate: "0.92" }));
      await expect(client.getRate("USD", "EUR")).resolves.toBe(0.92);
    });

    it("returns a map when `to` is omitted", async () => {
      mockFetch.mockResolvedValueOnce(respond({ rates: { EUR: "0.92", GBP: "0.79" } }));
      const rates = await client.getRate("USD");
      expect(rates).toEqual({ EUR: 0.92, GBP: 0.79 });
    });

    it("uppercases currency codes", async () => {
      mockFetch.mockResolvedValueOnce(respond({ rate: "0.92" }));
      await client.getRate("usd", "eur");
      const url = new URL(mockFetch.mock.calls[0][0] as string);
      expect(url.searchParams.get("from")).toBe("USD");
      expect(url.searchParams.get("to")).toBe("EUR");
    });

    it("attaches api_key to query", async () => {
      mockFetch.mockResolvedValueOnce(respond({ rate: "1" }));
      await client.getRate("USD", "EUR");
      const url = new URL(mockFetch.mock.calls[0][0] as string);
      expect(url.searchParams.get("api_key")).toBe("test-key");
    });

    it("throws UniRateError on malformed response (single rate)", async () => {
      mockFetch.mockResolvedValueOnce(respond({ something: "else" }));
      await expect(client.getRate("USD", "EUR")).rejects.toThrow(UniRateError);
    });

    it("throws UniRateError on malformed response (all rates)", async () => {
      mockFetch.mockResolvedValueOnce(respond({ something: "else" }));
      await expect(client.getRate("USD")).rejects.toThrow(UniRateError);
    });
  });

  describe("convert()", () => {
    it("returns converted amount", async () => {
      mockFetch.mockResolvedValueOnce(respond({ result: "92.50" }));
      await expect(client.convert("EUR", 100, "USD")).resolves.toBe(92.5);
    });

    it("sends correct params", async () => {
      mockFetch.mockResolvedValueOnce(respond({ result: "92.50" }));
      await client.convert("EUR", 100, "USD");
      const url = new URL(mockFetch.mock.calls[0][0] as string);
      expect(url.searchParams.get("to")).toBe("EUR");
      expect(url.searchParams.get("from")).toBe("USD");
      expect(url.searchParams.get("amount")).toBe("100");
    });

    it("throws UniRateError on malformed response", async () => {
      mockFetch.mockResolvedValueOnce(respond({ wrong: "field" }));
      await expect(client.convert("EUR", 1, "USD")).rejects.toThrow(UniRateError);
    });
  });

  describe("listCurrencies()", () => {
    it("returns string array", async () => {
      mockFetch.mockResolvedValueOnce(respond({ currencies: ["USD", "EUR", "GBP"] }));
      await expect(client.listCurrencies()).resolves.toEqual(["USD", "EUR", "GBP"]);
    });

    it("sends Accept: application/json header", async () => {
      mockFetch.mockResolvedValueOnce(respond({ currencies: [] }));
      await client.listCurrencies();
      const headers = mockFetch.mock.calls[0][1]?.headers as Record<string, string>;
      expect(headers["Accept"]).toBe("application/json");
    });

    it("throws UniRateError on malformed response", async () => {
      mockFetch.mockResolvedValueOnce(respond({ not_currencies: [] }));
      await expect(client.listCurrencies()).rejects.toThrow(UniRateError);
    });
  });

  describe("getHistoricalRate()", () => {
    it("returns single rate (amount=1, with to)", async () => {
      mockFetch.mockResolvedValueOnce(respond({ rate: "0.92" }));
      await expect(client.getHistoricalRate("2024-01-01", 1, "USD", "EUR")).resolves.toBe(0.92);
    });

    it("returns converted amount (amount!=1, with to)", async () => {
      mockFetch.mockResolvedValueOnce(respond({ result: "184.00" }));
      await expect(client.getHistoricalRate("2024-01-01", 200, "USD", "EUR")).resolves.toBe(184);
    });

    it("returns rates map when to is omitted", async () => {
      mockFetch.mockResolvedValueOnce(respond({ rates: { EUR: "0.92", GBP: "0.79" } }));
      const r = await client.getHistoricalRate("2024-01-01", 1, "USD");
      expect(r).toEqual({ EUR: 0.92, GBP: 0.79 });
    });

    it("returns results map when amount!=1 and to omitted", async () => {
      mockFetch.mockResolvedValueOnce(respond({ results: { EUR: "92.00", GBP: "79.00" } }));
      const r = await client.getHistoricalRate("2024-01-01", 100, "USD");
      expect(r).toEqual({ EUR: 92, GBP: 79 });
    });
  });

  describe("getHistoricalRates()", () => {
    it("delegates to getHistoricalRate with no `to`", async () => {
      mockFetch.mockResolvedValueOnce(respond({ rates: { EUR: "0.92" } }));
      const r = await client.getHistoricalRates("2024-01-01", 1, "USD");
      expect(r).toEqual({ EUR: 0.92 });
    });
  });

  describe("convertHistorical()", () => {
    it("delegates to getHistoricalRate with `to`", async () => {
      mockFetch.mockResolvedValueOnce(respond({ rate: "0.92" }));
      const r = await client.convertHistorical(1, "USD", "EUR", "2024-01-01");
      expect(r).toBe(0.92);
    });
  });

  describe("getTimeSeries()", () => {
    it("returns data map", async () => {
      const data = {
        "2024-01-01": { EUR: 0.92 },
        "2024-01-02": { EUR: 0.93 },
      };
      mockFetch.mockResolvedValueOnce(respond({ data }));
      await expect(
        client.getTimeSeries("2024-01-01", "2024-01-02", 1, "USD"),
      ).resolves.toEqual(data);
    });

    it("sends currencies as comma-joined string", async () => {
      mockFetch.mockResolvedValueOnce(respond({ data: {} }));
      await client.getTimeSeries("2024-01-01", "2024-01-07", 1, "USD", ["EUR", "GBP"]);
      const url = new URL(mockFetch.mock.calls[0][0] as string);
      expect(url.searchParams.get("currencies")).toBe("EUR,GBP");
    });
  });

  describe("getHistoricalLimits()", () => {
    it("returns limits object", async () => {
      const payload = {
        total_currencies: 170,
        data_source: "test",
        currencies: { USD: { earliest_date: "1999-01-01", latest_date: "2026-01-01", total_days: 9000, description: "US Dollar" } },
      };
      mockFetch.mockResolvedValueOnce(respond(payload));
      await expect(client.getHistoricalLimits()).resolves.toEqual(payload);
    });
  });

  describe("getVATRates()", () => {
    it("returns all VAT rates when no country given", async () => {
      const payload = {
        total_countries: 50,
        date: "2026-01-01",
        vat_rates: { DE: { country_code: "DE", country_name: "Germany", vat_rate: 19 } },
      };
      mockFetch.mockResolvedValueOnce(respond(payload));
      await expect(client.getVATRates()).resolves.toEqual(payload);
    });

    it("returns single country VAT when country given", async () => {
      const payload = {
        country: "DE",
        vat_data: { country_code: "DE", country_name: "Germany", vat_rate: 19 },
      };
      mockFetch.mockResolvedValueOnce(respond(payload));
      await expect(client.getVATRates("DE")).resolves.toEqual(payload);
    });

    it("uppercases country code", async () => {
      mockFetch.mockResolvedValueOnce(respond({ country: "DE", vat_data: {} }));
      await client.getVATRates("de");
      const url = new URL(mockFetch.mock.calls[0][0] as string);
      expect(url.searchParams.get("country")).toBe("DE");
    });
  });

  describe("error mapping", () => {
    it("maps 400 → InvalidRequestError", async () => {
      mockFetch.mockResolvedValueOnce(respond({ error: "bad" }, 400));
      await expect(client.getRate("USD", "EUR")).rejects.toBeInstanceOf(InvalidRequestError);
    });

    it("maps 401 → AuthenticationError", async () => {
      mockFetch.mockResolvedValueOnce(respond({ error: "key" }, 401));
      await expect(client.getRate("USD", "EUR")).rejects.toBeInstanceOf(AuthenticationError);
    });

    it("maps 403 → ProRequiredError", async () => {
      mockFetch.mockResolvedValueOnce(respond({ error: "pro" }, 403));
      await expect(client.getHistoricalLimits()).rejects.toBeInstanceOf(ProRequiredError);
    });

    it("maps 404 → InvalidCurrencyError", async () => {
      mockFetch.mockResolvedValueOnce(respond({ error: "nf" }, 404));
      await expect(client.getRate("USD", "XYZ")).rejects.toBeInstanceOf(InvalidCurrencyError);
    });

    it("maps 429 → RateLimitError", async () => {
      mockFetch.mockResolvedValueOnce(respond({ error: "rl" }, 429));
      await expect(client.getRate("USD", "EUR")).rejects.toBeInstanceOf(RateLimitError);
    });

    it("maps 503 → UniRateError with status 503", async () => {
      mockFetch.mockResolvedValueOnce(respond({ error: "down" }, 503));
      const err = await client.getRate("USD", "EUR").catch((e: UniRateError) => e);
      expect(err).toBeInstanceOf(UniRateError);
      expect((err as UniRateError).status).toBe(503);
    });

    it("wraps network failure in UniRateError", async () => {
      mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));
      await expect(client.getRate("USD", "EUR")).rejects.toBeInstanceOf(UniRateError);
    });

    it("all typed errors extend UniRateError", () => {
      expect(new AuthenticationError()).toBeInstanceOf(UniRateError);
      expect(new RateLimitError()).toBeInstanceOf(UniRateError);
      expect(new InvalidCurrencyError()).toBeInstanceOf(UniRateError);
      expect(new InvalidRequestError()).toBeInstanceOf(UniRateError);
      expect(new ProRequiredError()).toBeInstanceOf(UniRateError);
    });
  });
});
