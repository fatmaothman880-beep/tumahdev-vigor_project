/**
 * Automatic delay / at-risk intelligence (mock mode only).
 *
 * IMPORTANT: exactly like lib/prediction.ts, the real system will have the
 * FastAPI backend compute this risk assessment from live operational data.
 * This module is a self-contained mock-mode equivalent — isolated so it can
 * be deleted wholesale once the backend owns it. No component should
 * duplicate this logic; they should only read OperationalRisk off it.
 *
 * Distinguishes the states the brief calls out explicitly:
 *   - "on-track"  Normal operation.
 *   - "at-risk"   Automatic/predicted: the forecast completion has slipped
 *                 past the planned completion, but no operator has
 *                 confirmed an actual delay. Any size of predicted
 *                 slippage stays "at-risk" — it is never auto-promoted to
 *                 "delayed" by magnitude alone. Only a human confirming a
 *                 delay does that.
 *   - "delayed"   Confirmed actual delay: an operator-recorded DelayEvent
 *                 that is currently active or ended very recently.
 *   - "overdue"   Specific to vessels that have not yet arrived: the
 *                 expected arrival time has passed.
 *   - "unknown"   Not enough information to assess (e.g. no plan set).
 */
import type { DelayEvent, OperationalRisk, PredictionData, VesselVisit } from "../types";
import { minutesBetween } from "./format";

/** Minutes of forecast slippage past plan before we call it "at-risk" rather than "on-track". */
const AT_RISK_THRESHOLD_MIN = 15;
/** Minutes past an expected arrival before we flag it "overdue" rather than just "not yet arrived". */
const ARRIVAL_GRACE_MIN = 20;
/** A confirmed delay still counts as the current status for this long after it ends (recovery grace period). */
const DELAY_RECOVERY_GRACE_MIN = 30;

export function computeOperationalRisk(
  vessel: VesselVisit,
  prediction: PredictionData,
  delays: DelayEvent[],
  now: Date
): OperationalRisk {
  // A confirmed delay that is currently active, or ended very recently,
  // always takes precedence over a forecast — an operator's confirmed
  // record outranks a prediction while its effects are still current.
  if (vessel.status === "Unloading" || vessel.status === "Berthed" || vessel.status === "Delayed") {
    const current = delays.find((d) => {
      const graceEnd = new Date(d.end.getTime() + DELAY_RECOVERY_GRACE_MIN * 60000);
      return now.getTime() >= d.start.getTime() && now.getTime() <= graceEnd.getTime();
    });
    if (current) {
      return {
        level: "delayed",
        reason: `Confirmed ${current.category.toLowerCase()} delay — ${current.description}`,
        projectedDelayMin: minutesBetween(current.start, current.end),
      };
    }
  }

  // Planned vessels: watch for an overdue arrival.
  if (vessel.status === "Planned" || vessel.status === "Arrived") {
    const expected = vessel.etaOverride || vessel.plannedArrival;
    if (expected && !vessel.actualArrival) {
      const overdueMin = minutesBetween(expected, now);
      if (overdueMin > ARRIVAL_GRACE_MIN) {
        return {
          level: "overdue",
          reason: "Vessel has not arrived within the expected arrival window.",
          projectedDelayMin: overdueMin,
        };
      }
    }
    return { level: "on-track", reason: null, projectedDelayMin: null };
  }

  // Completed / cancelled visits are not evaluated for forward-looking risk.
  if (vessel.status === "Completed" || vessel.status === "Cancelled") {
    return { level: "on-track", reason: null, projectedDelayMin: null };
  }

  // Actively unloading (and not currently in a confirmed-delay window):
  // compare forecast completion against planned completion.
  if (!vessel.plannedCompletion) {
    return { level: "unknown", reason: "No planned completion time set for this vessel visit.", projectedDelayMin: null };
  }

  if (!prediction.etaAvailable || !prediction.eta) {
    return { level: "unknown", reason: "Estimate unavailable — valid unloading rate required.", projectedDelayMin: null };
  }

  const slippageMin = minutesBetween(vessel.plannedCompletion, prediction.eta);

  if (slippageMin <= AT_RISK_THRESHOLD_MIN) {
    return { level: "on-track", reason: null, projectedDelayMin: null };
  }

  let reason = "Forecast completion has slipped past the planned completion time.";
  if (vessel.plannedRateTph && prediction.effectiveRateTph > 0 && prediction.effectiveRateTph < vessel.plannedRateTph) {
    const pctBelow = Math.round((1 - prediction.effectiveRateTph / vessel.plannedRateTph) * 100);
    reason = `Current unloading rate is ${pctBelow}% below the planned rate.`;
  } else if (prediction.effectiveRateTph === 0) {
    reason = "No current unloading rate is available to project completion.";
  }

  // Predicted, not confirmed — stays "at-risk" regardless of how large the
  // projected slippage is. Only a confirmed DelayEvent produces "delayed".
  return { level: "at-risk", reason, projectedDelayMin: slippageMin };
}

export const RISK_LABEL: Record<OperationalRisk["level"], string> = {
  "on-track": "On track",
  "at-risk": "At risk",
  delayed: "Delayed",
  overdue: "Arrival overdue",
  unknown: "Unknown",
};
