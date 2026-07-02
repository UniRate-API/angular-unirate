import { Inject, Injectable } from "@angular/core";
import { Observable, from as rxjsFrom } from "rxjs";

import {
  UniRateClient,
  type UniRateConfig,
  type VATRatesAll,
  type VATRateOne,
  type HistoricalLimitsResponse,
} from "./client.js";
import { UNIRATE_CONFIG } from "./tokens.js";

/**
 * Injectable service wrapping `UniRateClient`. All methods return
 * `Observable<T>` for idiomatic Angular template and reactive usage.
 *
 * Provide via `UniRateModule.forRoot({ apiKey })` or the standalone
 * `provideUniRate({ apiKey })` helper.
 *
 * ```ts
 * // standalone app (app.config.ts):
 * provideUniRate({ apiKey: environment.UNIRATE_API_KEY })
 *
 * // NgModule (app.module.ts):
 * UniRateModule.forRoot({ apiKey: environment.UNIRATE_API_KEY })
 * ```
 */
@Injectable()
export class UniRateService {
  readonly #client: UniRateClient;

  constructor(@Inject(UNIRATE_CONFIG) config: UniRateConfig) {
    this.#client = new UniRateClient(config);
  }

  /** Underlying client — escape hatch for raw Promise-based access. */
  get raw(): UniRateClient {
    return this.#client;
  }

  getRate(from: string, to: string): Observable<number>;
  getRate(from: string): Observable<Record<string, number>>;
  getRate(from: string, to?: string): Observable<number | Record<string, number>> {
    return rxjsFrom(this.#client.getRate(from, to as string));
  }

  convert(to: string, amount: number, from: string): Observable<number> {
    return rxjsFrom(this.#client.convert(to, amount, from));
  }

  listCurrencies(): Observable<string[]> {
    return rxjsFrom(this.#client.listCurrencies());
  }

  getHistoricalRate(date: string, amount: number, from: string, to: string): Observable<number>;
  getHistoricalRate(date: string, amount: number, from: string): Observable<Record<string, number>>;
  getHistoricalRate(
    date: string,
    amount: number,
    from: string,
    to?: string,
  ): Observable<number | Record<string, number>> {
    return rxjsFrom(this.#client.getHistoricalRate(date, amount, from, to as string));
  }

  getHistoricalRates(date: string, amount: number, base: string): Observable<Record<string, number>> {
    return rxjsFrom(this.#client.getHistoricalRates(date, amount, base));
  }

  convertHistorical(amount: number, from: string, to: string, date: string): Observable<number> {
    return rxjsFrom(this.#client.convertHistorical(amount, from, to, date));
  }

  getTimeSeries(
    startDate: string,
    endDate: string,
    amount: number,
    base: string,
    currencies?: string[],
  ): Observable<Record<string, Record<string, number>>> {
    return rxjsFrom(this.#client.getTimeSeries(startDate, endDate, amount, base, currencies));
  }

  getHistoricalLimits(): Observable<HistoricalLimitsResponse> {
    return rxjsFrom(this.#client.getHistoricalLimits());
  }

  getVATRates(): Observable<VATRatesAll>;
  getVATRates(country: string): Observable<VATRateOne>;
  getVATRates(country?: string): Observable<VATRatesAll | VATRateOne> {
    return rxjsFrom(this.#client.getVATRates(country as string));
  }
}
