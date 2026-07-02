export {
  UniRateError,
  AuthenticationError,
  RateLimitError,
  InvalidCurrencyError,
  InvalidRequestError,
  ProRequiredError,
  UniRateClient,
  type UniRateConfig,
  type VATEntry,
  type VATRatesAll,
  type VATRateOne,
  type HistoricalLimitsResponse,
} from "./client.js";

export { UNIRATE_CONFIG } from "./tokens.js";
export { UniRateService } from "./unirate.service.js";
export { CurrencyRatePipe, CurrencyConvertPipe } from "./unirate.pipe.js";
export { UniRateModule, type UniRateModuleAsyncOptions } from "./unirate.module.js";
export { provideUniRate } from "./providers.js";
