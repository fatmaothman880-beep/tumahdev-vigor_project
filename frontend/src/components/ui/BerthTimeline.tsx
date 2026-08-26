import { AlertTriangle } from "lucide-react";
import type { BerthRiskInfo, PredictionData, VesselVisit } from "../../types";
import { fmtTime, pad2 } from "../../lib/format";
import { Card, SectionHeader } from "./Layout";

export default function BerthTimeline({
  vessel,
  prediction,
  riskInfo,
}: {
  vessel: VesselVisit;
  prediction: PredictionData;
  riskInfo: BerthRiskInfo;
}) {
  const startHour = vessel.unloadStart ? vessel.unloadStart.getHours() : 6;
  const lastMoment =
    riskInfo.nextEta && prediction.berthRelease
      ? new Date(Math.max(riskInfo.nextEta.getTime(), prediction.berthRelease.getTime()))
      : prediction.berthRelease || new Date(new Date().setHours(startHour + 4, 0, 0, 0));
  const windowEndHour = Math.min(23, lastMoment.getHours() + 2);
  const hours: number[] = [];
  for (let h = startHour; h <= windowEndHour; h++) hours.push(h);
  const totalMin = (windowEndHour - startHour) * 60 || 1;

  const pctOf = (d: Date) => {
    const min = (d.getHours() - startHour) * 60 + d.getMinutes();
    return Math.max(0, Math.min(100, (min / totalMin) * 100));
  };

  const unloadStartPct = pctOf(vessel.unloadStart || new Date());
  const releasePct = prediction.berthReleaseAvailable && prediction.berthRelease ? pctOf(prediction.berthRelease) : null;
  const nextEtaPct = riskInfo.nextEta ? pctOf(riskInfo.nextEta) : null;

  return (
    <Card className="p-4">
      <SectionHeader title="Berth timeline" sub={`${vessel.berthId} scheduling view`} />
      <div className="relative pt-1">
        <div className="flex justify-between text-[10px] font-medium mb-1 text-gray-500">
          {hours.map((h) => (
            <span key={h}>{pad2(h)}:00</span>
          ))}
        </div>
        <div className="relative h-9 rounded-md overflow-visible bg-paper border border-line">
          {releasePct !== null && (
            <div className="absolute top-0 h-full rounded-l-md bg-brand-green-tint" style={{ left: 0, width: `${releasePct}%` }} />
          )}
          <div
            className="absolute top-1.5 h-6 rounded-sm bg-brand-green"
            style={{ left: `${unloadStartPct}%`, width: `${Math.max(2, (releasePct ?? 60) - unloadStartPct)}%` }}
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
