import { useMemo } from "react";
import type { AppData } from "./useAppData";
import type { OperationalAlert, OperationalRisk, PredictionData, TimeProgress } from "../types";
import { computePrediction } from "../lib/prediction";
import { computeOperationalRisk } from "../lib/riskEngine";
import { computeTimeProgress } from "../lib/timeProgress";
import { generateAlerts } from "../lib/alerts";
import { USE_MOCK_API } from "../api/client";

export interface OperationalModel {
  predictions: Record<string | number, PredictionData>;
  risks: Record<string | number, OperationalRisk>;
  timeProgress: Record<string | number, TimeProgress>;
  alerts: OperationalAlert[];
}

/**
 * Every vessel-facing page reads from this instead of calling
 * lib/prediction.ts / lib/riskEngine.ts / lib/timeProgress.ts directly, so
 * the (mock-mode-only) calculation logic stays in one place and recomputes
 * consistently every time the live clock ticks (see hooks/useLiveClock.ts).
 */
export function useOperationalModel(data: AppData | null, now: Date): OperationalModel {
  return useMemo(() => {
    if (!data) return { predictions: {}, risks: {}, timeProgress: {}, alerts: [] };

    const predictions: Record<string | number, PredictionData> = {};
    const risks: Record<string | number, OperationalRisk> = {};
    const timeProgress: Record<string | number, TimeProgress> = {};

    for (const v of data.vessels) {
      const source = USE_MOCK_API ? computePrediction(v, data.readings, now) : data.predictions?.[v.id];
      if (!source) continue;
      const list = data.readings[v.id] || [];
      const pred = {...source, lastReading: list[list.length - 1] || null};
      predictions[v.id] = pred;
      risks[v.id] = computeOperationalRisk(v, pred, data.delays[v.id] || [], now);
      timeProgress[v.id] = computeTimeProgress(v, now);
    }

    const alerts = generateAlerts({ vessels: data.vessels, berths: data.berths, predictions, risks, now });

    return { predictions, risks, timeProgress, alerts };
  }, [data, now]);
}
