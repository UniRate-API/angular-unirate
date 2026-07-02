import { Pipe, PipeTransform } from "@angular/core";
import { Observable } from "rxjs";

import { UniRateService } from "./unirate.service.js";

/**
 * Returns the exchange rate from one currency to another as an Observable.
 * Use with Angular's built-in `async` pipe in templates.
 *
 * ```html
 * <!-- all rates from USD -->
 * {{ 'USD' | currencyRate | async | json }}
 *
 * <!-- single rate USD → EUR -->
 * {{ 'USD' | currencyRate:'EUR' | async }}
 * ```
 */
@Pipe({ name: "currencyRate", standalone: true })
export class CurrencyRatePipe implements PipeTransform {
  constructor(private readonly service: UniRateService) {}

  transform(from: string, to?: string): Observable<number | Record<string, number>> {
    return to ? this.service.getRate(from, to) : this.service.getRate(from);
  }
}

/**
 * Converts an amount from one currency to another as an Observable.
 * Use with Angular's built-in `async` pipe in templates.
 *
 * ```html
 * <!-- 100 USD → EUR -->
 * {{ 100 | currencyConvert:'USD':'EUR' | async }}
 * ```
 */
@Pipe({ name: "currencyConvert", standalone: true })
export class CurrencyConvertPipe implements PipeTransform {
  constructor(private readonly service: UniRateService) {}

  transform(amount: number, from: string, to: string): Observable<number> {
    return this.service.convert(to, amount, from);
  }
}
