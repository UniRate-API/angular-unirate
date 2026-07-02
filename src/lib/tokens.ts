import { InjectionToken } from "@angular/core";
import type { UniRateConfig } from "./client.js";

export const UNIRATE_CONFIG = new InjectionToken<UniRateConfig>("UniRateConfig");
