import type { Voyage } from '../types';

export interface BackendForecast {
  estimated_unload_finish: string | null;
  expected_berth_release: string | null;
  effective_rate_tph: number | string | null;
  unloaded_t?: number | string;
}

// Empty strings are the existing UI's representation of an unavailable date.
// Never substitute a plan or a browser-generated estimate for a backend result.
export function applyBackendForecast(voyage: Voyage, forecast?: BackendForecast): void {
  voyage.forecastUnloadEnd = forecast?.estimated_unload_finish ?? '';
  voyage.expectedBerthRelease = forecast?.expected_berth_release ?? '';
  if (forecast) {
    voyage.unloadingRateTph = Number(forecast.effective_rate_tph ?? 0);
    if (forecast.unloaded_t !== undefined) voyage.unloadedTonnes = Number(forecast.unloaded_t);
  }
}
