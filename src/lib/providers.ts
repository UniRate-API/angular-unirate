import { EnvironmentProviders, makeEnvironmentProviders } from "@angular/core";

import type { UniRateConfig } from "./client.js";
import { UNIRATE_CONFIG } from "./tokens.js";
import { UniRateService } from "./unirate.service.js";

/**
 * Provides `UniRateService` for Angular standalone applications.
 *
 * ```ts
 * // app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideUniRate({ apiKey: environment.UNIRATE_API_KEY }),
 *   ],
 * };
 * ```
 *
 * Then inject `UniRateService` anywhere in the app.
 */
export function provideUniRate(config: UniRateConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: UNIRATE_CONFIG, useValue: config },
    UniRateService,
  ]);
}
