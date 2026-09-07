import { AlertTriangle } from "lucide-react";
import type { BerthRiskInfo, PredictionData, VesselVisit } from "../../types";
import { fmtTime, fmtDateTime } from "../../lib/format";
import { Card, SectionHeader } from "./Layout";

export default function BerthTimeline({
  vessel,
  prediction,
  riskInfo,
  berthName,
}: {
  vessel: VesselVisit;
  prediction: PredictionData;
  riskInfo: BerthRiskInfo;
  berthName?: string;
}) {
  const start = vessel.unloadStart || vessel.plannedUnloadStart || new Date();
  const lastMoment =
    riskInfo.nextEta && prediction.berthRelease
      ? new Date(Math.max(riskInfo.nextEta.getTime(), prediction.berthRelease.getTime()))
      : prediction.berthRelease || new Date(start.getTime() + 4 * 3600000);
  const end = new Date(Math.max(start.getTime() + 4 * 3600000, lastMoment.getTime() + 2 * 3600000));
  const ticks = Array.from({length: 5}, (_, i) => new Date(start.getTime() + (end.getTime() - start.getTime()) * i / 4));

  const pctOf = (d: Date) => {
    return Math.max(0, Math.min(100, (d.getTime() - start.getTime()) / (end.getTime() - start.getTime()) * 100));
  };

  const unloadStartPct = pctOf(vessel.unloadStart || new Date());
  const releasePct = prediction.berthReleaseAvailable && prediction.berthRelease ? pctOf(prediction.berthRelease) : null;
  const nextEtaPct = riskInfo.nextEta ? pctOf(riskInfo.nextEta) : null;

  return (
    <Card className="p-4">
      <SectionHeader title="Berth timeline" sub={`${berthName || vessel.berthId} · ${fmtDateTime(start)} – ${fmtDateTime(end)}`} />
      <div className="relative pt-1">
        <div className="flex justify-between text-[10px] font-medium mb-1 text-gray-500">
          {ticks.map((t) => (
            <span key={t.getTime()}>{fmtTime(t)}</span>
          ))}
        </div>
        <div className="relative h-9 rounded-md overflow-visible bg-paper border border-line">
          {releasePct !== null && (
            <div className="absolute top-0 h-full rounded-l-md bg-brand-green-tint" style={{ left: 0, width: `${releasePct}%` }} />
          )}
          <div
            className="absolute top-1.5 h-6 rounded-sm bg-brand-green"
            style={{ left: `${unloadStartPct}%`, width: `${releasePct === null ? 0 : Math.max(0, releasePct - unloadStartPct)}%` }}
            title={vessel.name}
          />
          {releasePct !== null && (
            <div className="absolute -top-1" style={{ left: `${releasePct}%`, transform: "translateX(-50%)" }}>
              <div className="h-11 w-px bg-ink-soft" />
            </div>
          )}
          {nextEtaPct !== null && (
            <div className="absolute -top-1" style={{ left: `${nextEtaPct}%`, transform: "translateX(-50%)" }}>
              <div className="h-11 w-0 border-l-2 border-dashed border-teal" />
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-xs text-ink-soft">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-brand-green" />
            {vessel.name} (unloading)
          </span>
          {releasePct !== null && prediction.berthRelease && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-0.5 bg-ink-soft" />
              Expected release {fmtTime(prediction.berthRelease)}
            </span>
          )}
          {nextEtaPct !== null && riskInfo.nextEta && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-0.5 border-l-2 border-dashed border-teal" />
              {riskInfo.nextVessel?.name} ETA {fmtTime(riskInfo.nextEta)}
            </span>
          )}
        </div>
        {riskInfo.risk === "conflict" && (
          <div className="mt-2 text-xs font-semibold flex items-center gap-1.5 text-danger">
            <AlertTriangle size={13} /> Potential {riskInfo.overlapMin} min overlap
          </div>
        )}
      </div>
    </Card>
  );
}
