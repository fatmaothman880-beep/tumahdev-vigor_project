import { useMemo } from "react";
import type { AppData } from "./useAppData";
import type { OperationalAlert, OperationalRisk, PredictionData, TimeProgress } from "../types";
import { computePrediction } from "../lib/prediction";
import { computeOperationalRisk } from "../lib/riskEngine";
import { computeTimeProgress } from "../lib/timeProgress";
import { generateAlerts } from "../lib/alerts";

export interface OperationalModel {
  predictions: Record<number, PredictionData>;
  risks: Record<number, OperationalRisk>;
  timeProgress: Record<number, TimeProgress>;
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

    const predictions: Record<number, PredictionData> = {};
    const risks: Record<number, OperationalRisk> = {};
    const timeProgress: Record<number, TimeProgress> = {};

    for (const v of data.vessels) {
      const pred = computePrediction(v, data.readings, now);
      predictions[v.id] = pred;
      risks[v.id] = computeOperationalRisk(v, pred, data.delays[v.id] || [], now);
      timeProgress[v.id] = computeTimeProgress(v, now);
    }

    const alerts = generateAlerts({ vessels: data.vessels, berths: data.berths, predictions, risks, now });

    return { predictions, risks, timeProgress, alerts };
  }, [data, now]);
}
