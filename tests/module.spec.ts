import { describe, it, expect } from "vitest";
import { UniRateModule } from "../src/lib/unirate.module.js";
import { UniRateService } from "../src/lib/unirate.service.js";
import { UNIRATE_CONFIG } from "../src/lib/tokens.js";
import { provideUniRate } from "../src/lib/providers.js";
import { CurrencyRatePipe, CurrencyConvertPipe } from "../src/lib/unirate.pipe.js";

describe("UniRateModule.forRoot()", () => {
  it("returns a ModuleWithProviders with UniRateModule as the module", () => {
    const mwp = UniRateModule.forRoot({ apiKey: "test-key" });
    expect(mwp.ngModule).toBe(UniRateModule);
  });

  it("includes a UNIRATE_CONFIG value provider", () => {
    const mwp = UniRateModule.forRoot({ apiKey: "test-key" });
    const configProvider = mwp.providers?.find(
      (p) => typeof p === "object" && "provide" in p && p.provide === UNIRATE_CONFIG,
    );
    expect(configProvider).toBeDefined();
  });

  it("includes UniRateService in providers", () => {
    const mwp = UniRateModule.forRoot({ apiKey: "test-key" });
    expect(mwp.providers).toContain(UniRateService);
  });
});

describe("UniRateModule.forRootAsync()", () => {
  it("returns a ModuleWithProviders with a factory provider for UNIRATE_CONFIG", () => {
    const factory = () => ({ apiKey: "async-key" });
    const mwp = UniRateModule.forRootAsync({ useFactory: factory });
    expect(mwp.ngModule).toBe(UniRateModule);
    const configProvider = mwp.providers?.find(
      (p) => typeof p === "object" && "provide" in p && p.provide === UNIRATE_CONFIG,
    );
    expect(configProvider).toBeDefined();
    expect(configProvider).toHaveProperty("useFactory", factory);
  });

  it("passes deps array through to the provider", () => {
    const deps = ["TOKEN_A"];
    const mwp = UniRateModule.forRootAsync({ useFactory: () => ({ apiKey: "k" }), deps });
    const configProvider = mwp.providers?.find(
      (p) => typeof p === "object" && "provide" in p && p.provide === UNIRATE_CONFIG,
    ) as { deps: unknown[] };
    expect(configProvider?.deps).toEqual(deps);
  });
});

describe("provideUniRate()", () => {
  it("returns EnvironmentProviders (truthy object)", () => {
    const providers = provideUniRate({ apiKey: "env-key" });
    expect(providers).toBeDefined();
    expect(typeof providers).toBe("object");
  });
});

describe("pipe exports", () => {
  it("CurrencyRatePipe is a class (function)", () => {
    expect(CurrencyRatePipe).toBeDefined();
    expect(typeof CurrencyRatePipe).toBe("function");
  });

  it("CurrencyConvertPipe is a class with transform()", () => {
    expect(typeof CurrencyConvertPipe.prototype.transform).toBe("function");
  });

  it("CurrencyRatePipe is a class with transform()", () => {
    expect(typeof CurrencyRatePipe.prototype.transform).toBe("function");
  });
});
