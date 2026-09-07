/**
 * Lightweight mock alert generation. No infrastructure here on purpose —
 * this simply re-derives a short list of notification-style messages from
 * the same vessel/berth/prediction state already in memory, every time the
 * live clock ticks. A real backend would likely push these; in mock mode
 * we regenerate them deterministically from current state instead of
 * maintaining a separate mutable notification store.
 */
import type { OperationalAlert, VesselVisit, Berth, PredictionData, OperationalRisk } from "../types";
import { minutesBetween } from "./format";
import { berthRiskFor } from "./prediction";

const ARRIVAL_SOON_WINDOW_MIN = 60;
const BERTH_AVAILABLE_SOON_WINDOW_MIN = 45;
const RATE_DROP_THRESHOLD = 0.3;

let alertIdSeq = 1;

export function generateAlerts(params: {
  vessels: VesselVisit[];
  berths: Berth[];
  predictions: Record<string | number, PredictionData>;
  risks: Record<string | number, OperationalRisk>;
  now: Date;
}): OperationalAlert[] {
  const { vessels, berths, predictions, risks, now } = params;
  const alerts: OperationalAlert[] = [];
  alertIdSeq = 1;

  for (const v of vessels) {
    const pred = predictions[v.id];
    const risk = risks[v.id];

    // Arriving soon
    if ((v.status === "Planned" || v.status === "Arrived") && !v.actualArrival) {
      const expected = v.etaOverride || v.plannedArrival;
      if (expected) {
        const diff = minutesBetween(now, expected);
        if (diff > 0 && diff <= ARRIVAL_SOON_WINDOW_MIN) {
          alerts.push({
            id: alertIdSeq++,
            time: now,
            severity: "info",
            kind: "arrival",
            message: `${v.name} expected to arrive in ${diff} min.`,
            vesselId: v.id,
          });
        }
      }
    }

    // Arrival overdue
    if (risk?.level === "overdue") {
      alerts.push({
        id: alertIdSeq++,
        time: now,
        severity: "warning",
        kind: "overdue",
        message: `${v.name} arrival is overdue.`,
        vesselId: v.id,
      });
    }

    // Completion forecast shifted materially (at-risk / delayed)
    if ((risk?.level === "at-risk" || risk?.level === "delayed") && risk.projectedDelayMin) {
      alerts.push({
        id: alertIdSeq++,
        time: now,
        severity: risk.level === "delayed" ? "critical" : "warning",
        kind: "completion-shift",
        message: risk.level === "delayed"
          ? `${v.name}: ${risk.reason || "Confirmed operational delay"}.`
          : `${v.name} completion forecast has moved ${risk.projectedDelayMin} min later than planned.`,
        vesselId: v.id,
      });
    }

    // Rate drop vs plan
    if (v.plannedRateTph && pred && pred.effectiveRateTph > 0) {
      const dropPct = 1 - pred.effectiveRateTph / v.plannedRateTph;
      if (dropPct >= RATE_DROP_THRESHOLD) {
        alerts.push({
          id: alertIdSeq++,
          time: now,
          severity: "warning",
          kind: "rate-drop",
          message: `${v.name} unloading rate has fallen ${Math.round(dropPct * 100)}% below planned rate.`,
          vesselId: v.id,
        });
      }
    }

    // Berth conflict
    if ((v.status === "Unloading" || v.status === "Berthed") && pred) {
      const risk2 = berthRiskFor(v, pred, vessels);
      if (risk2.risk === "conflict") {
        alerts.push({
          id: alertIdSeq++,
          time: now,
          severity: "critical",
          kind: "berth-conflict",
          message: `${berths.find(b => b.id === v.berthId)?.name || v.berthId}: conflict detected between ${v.name} and ${risk2.nextVessel?.name}.`,
          vesselId: v.id,
        });
      } else if (pred.berthReleaseAvailable && pred.berthRelease) {
        const diff = minutesBetween(now, pred.berthRelease);
        if (diff > 0 && diff <= BERTH_AVAILABLE_SOON_WINDOW_MIN) {
          alerts.push({
            id: alertIdSeq++,
            time: now,
            severity: "info",
            kind: "berth-available",
            message: `${berths.find(b => b.id === v.berthId)?.name || v.berthId} becomes available in approximately ${diff} min.`,
            vesselId: v.id,
          });
        }
      }
    }
  }

  const order: Record<OperationalAlert["severity"], number> = { critical: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
}
