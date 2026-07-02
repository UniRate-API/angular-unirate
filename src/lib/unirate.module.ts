import {
  ModuleWithProviders,
  NgModule,
  Provider,
  InjectionToken,
  FactoryProvider,
  ValueProvider,
} from "@angular/core";

import type { UniRateConfig } from "./client.js";
import { UNIRATE_CONFIG } from "./tokens.js";
import { UniRateService } from "./unirate.service.js";
import { CurrencyConvertPipe, CurrencyRatePipe } from "./unirate.pipe.js";

export interface UniRateModuleAsyncOptions {
  useFactory: (...args: unknown[]) => UniRateConfig | Promise<UniRateConfig>;
  deps?: (InjectionToken<unknown> | unknown)[];
}

const SERVICE_PROVIDERS: Provider[] = [UniRateService];
const PIPE_EXPORTS = [CurrencyRatePipe, CurrencyConvertPipe];

/**
 * Angular module for the UniRate currency-exchange API.
 *
 * ```ts
 * // Synchronous (app.module.ts):
 * UniRateModule.forRoot({ apiKey: environment.UNIRATE_API_KEY })
 *
 * // Async — read key from a ConfigService:
 * UniRateModule.forRootAsync({
 *   useFactory: (config: ConfigService) => ({ apiKey: config.get('UNIRATE_API_KEY')! }),
 *   deps: [ConfigService],
 * })
 * ```
 */
@NgModule({
  imports: [...PIPE_EXPORTS],
  exports: [...PIPE_EXPORTS],
})
export class UniRateModule {
  static forRoot(config: UniRateConfig): ModuleWithProviders<UniRateModule> {
    const configProvider: ValueProvider = { provide: UNIRATE_CONFIG, useValue: config };
    return {
      ngModule: UniRateModule,
      providers: [configProvider, ...SERVICE_PROVIDERS],
    };
  }

  static forRootAsync(options: UniRateModuleAsyncOptions): ModuleWithProviders<UniRateModule> {
    const configProvider: FactoryProvider = {
      provide: UNIRATE_CONFIG,
      useFactory: options.useFactory,
      deps: (options.deps ?? []) as unknown[],
    };
    return {
      ngModule: UniRateModule,
      providers: [configProvider, ...SERVICE_PROVIDERS],
    };
  }
}
