# @unirate/angular

Official Angular module for the [UniRate API](https://unirateapi.com) — free
currency exchange rates, historical data, and VAT rates.

- Observable-based `UniRateService` with full API parity
- `UniRateModule.forRoot()` for NgModule apps
- `provideUniRate()` for standalone Angular 16+ apps
- `currencyRate` and `currencyConvert` pipes (use with Angular's built-in `async` pipe)
- Zero runtime dependencies (peer deps: `@angular/core`, `@angular/common`, `rxjs`)
- Compiled with [ng-packagr](https://github.com/ng-packagr/ng-packagr) in Angular Package Format (APF) — AOT and Ivy compatible

## Install

```bash
npm install @unirate/angular
```

Requires Angular 16–22 and RxJS 7.

## Quick start

### Standalone app (`app.config.ts`)

```ts
import { provideUniRate } from '@unirate/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideUniRate({ apiKey: environment.UNIRATE_API_KEY }),
  ],
};
```

### NgModule app (`app.module.ts`)

```ts
import { UniRateModule } from '@unirate/angular';

@NgModule({
  imports: [
    UniRateModule.forRoot({ apiKey: environment.UNIRATE_API_KEY }),
  ],
})
export class AppModule {}
```

### Inject the service

```ts
import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { UniRateService } from '@unirate/angular';

@Component({
  selector: 'app-rates',
  standalone: true,
  imports: [AsyncPipe],
  template: `<p>EUR: {{ rate$ | async }}</p>`,
})
export class RatesComponent implements OnInit {
  private rates = inject(UniRateService);
  rate$!: Observable<number>;

  ngOnInit() {
    this.rate$ = this.rates.getRate('USD', 'EUR');
  }
}
```

### Use the pipes

```ts
// In a standalone component:
import { CurrencyRatePipe, CurrencyConvertPipe } from '@unirate/angular';

@Component({
  standalone: true,
  imports: [AsyncPipe, CurrencyRatePipe, CurrencyConvertPipe],
  template: `
    <p>1 USD = {{ 'USD' | currencyRate:'EUR' | async }} EUR</p>
    <p>100 USD = {{ 100 | currencyConvert:'USD':'EUR' | async }} EUR</p>
  `,
})
```

Or add `UniRateModule` to `imports` in an NgModule to get the pipes automatically.

### Async config (`forRootAsync`)

```ts
UniRateModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    apiKey: config.getOrThrow('UNIRATE_API_KEY'),
  }),
  deps: [ConfigService],
})
```

## API

### `UniRateService`

All methods return `Observable<T>`. Subscribe with Angular's `async` pipe or `firstValueFrom()`.

```ts
getRate(from: string, to: string): Observable<number>
getRate(from: string): Observable<Record<string, number>>

convert(to: string, amount: number, from: string): Observable<number>

listCurrencies(): Observable<string[]>

// Pro-gated — returns 403 on the free tier
getHistoricalRate(date: string, amount: number, from: string, to: string): Observable<number>
getHistoricalRate(date: string, amount: number, from: string): Observable<Record<string, number>>
getHistoricalRates(date: string, amount: number, base: string): Observable<Record<string, number>>
convertHistorical(amount: number, from: string, to: string, date: string): Observable<number>
getTimeSeries(startDate: string, endDate: string, amount: number, base: string, currencies?: string[]): Observable<Record<string, Record<string, number>>>
getHistoricalLimits(): Observable<HistoricalLimitsResponse>
getVATRates(): Observable<VATRatesAll>
getVATRates(country: string): Observable<VATRateOne>
```

Raw Promise-based access: `service.raw.getRate(...)` returns a `Promise<T>` from the underlying `UniRateClient`.

### Error handling

All errors extend `UniRateError`:

| Class | HTTP status |
|---|---|
| `AuthenticationError` | 401 |
| `ProRequiredError` | 403 |
| `InvalidCurrencyError` | 404 |
| `InvalidRequestError` | 400 |
| `RateLimitError` | 429 |
| `UniRateError` | other / network |

```ts
import { catchError } from 'rxjs/operators';
import { UniRateError, ProRequiredError } from '@unirate/angular';

this.rates.getHistoricalRate('2023-01-01', 1, 'USD', 'EUR').pipe(
  catchError((err: UniRateError) => {
    if (err instanceof ProRequiredError) {
      console.warn('Historical rates require a Pro plan.');
    }
    throw err;
  }),
).subscribe();
```

## Rate limits

The free plan allows 1,000 requests/month. Historical endpoints (`/api/historical/*`) require a Pro subscription and return `ProRequiredError` on the free tier.

## Related clients

<!-- unirate-ecosystem-start -->
| Ecosystem | Package |
|---|---|
| Python | [unirate-api](https://pypi.org/project/unirate-api/) |
| Node.js | [unirate-api](https://www.npmjs.com/package/unirate-api) |
| React | [@unirate/react](https://www.npmjs.com/package/@unirate/react) |
| Vue | [@unirate/vue](https://www.npmjs.com/package/@unirate/vue) |
| Next.js | [@unirate/next](https://www.npmjs.com/package/@unirate/next) |
| SvelteKit | [@unirate/sveltekit](https://www.npmjs.com/package/@unirate/sveltekit) |
| NestJS | [@unirate/nestjs](https://www.npmjs.com/package/@unirate/nestjs) |
| Nuxt | [@unirate/nuxt](https://www.npmjs.com/package/@unirate/nuxt) |
| Remix | [@unirate/remix](https://www.npmjs.com/package/@unirate/remix) |
| Eleventy | [@unirate/eleventy](https://www.npmjs.com/package/@unirate/eleventy) |
| Astro | [@unirate/astro](https://www.npmjs.com/package/@unirate/astro) |
| Go | [unirate-api-go](https://github.com/UniRate-API/unirate-api-go) |
| Rust | [unirate-api](https://crates.io/crates/unirate-api) |
| Swift | [unirate-api-swift](https://github.com/UniRate-API/unirate-api-swift) |
| MCP Server | [@unirate/mcp](https://www.npmjs.com/package/@unirate/mcp) |
<!-- unirate-ecosystem-end -->

## License

MIT — see [LICENSE](LICENSE).
