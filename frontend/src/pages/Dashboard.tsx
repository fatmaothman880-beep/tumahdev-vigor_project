import { AlertTriangle, Anchor, ChevronRight, Droplets, Ship } from "lucide-react";
import OverdueTasks from "../components/ui/OverdueTasks";
import type { AppData } from "../hooks/useAppData";
import type { OperationalModel } from "../hooks/useOperationalModel";
import type { Page } from "../App";
import { berthRiskFor } from "../lib/prediction";
import { fmtPct, fmtRelative, fmtT, fmtTime, fmtTph } from "../lib/format";
import { Card, KpiCard, PageHeader, SectionHeader } from "../components/ui/Layout";
import { EmptyState } from "../components/ui/States";
import ProgressBar from "../components/ui/ProgressBar";
import StatusBadge from "../components/ui/StatusBadge";
import DataQualityBadge from "../components/ui/DataQualityBadge";
import { RiskBadge } from "../components/ui/RiskBadge";
import { RateValue } from "../components/ui/RateValue";
import { AlertRow } from "../components/ui/Alerts";
import BerthTimeline from "../components/ui/BerthTimeline";
import type { RateUnit } from "../types";

export default function Dashboard({
  data,
  model,
  rateUnit,
  now,
  go,
  openVessel,
}: {
  data: AppData;
  model: OperationalModel;
  rateUnit: RateUnit;
  now: Date;
  go: (p: Page) => void;
  openVessel: (id: string | number) => void;
}) {
  const { vessels, berths } = data;
  const { predictions, risks, alerts } = model;

  const active = vessels.filter((v) => v.status === "Unloading" || v.status === "Berthed");
  const upcoming = vessels
    .filter((v) => (v.status === "Planned" || v.status === "Arrived") && !v.actualArrival)
    .sort((a, b) => {
      const ea = (a.etaOverride || a.plannedArrival)?.getTime() ?? 0;
      const eb = (b.etaOverride || b.plannedArrival)?.getTime() ?? 0;
      return ea - eb;
    });

  const currentlyUnloading = vessels.filter((v) => v.status === "Unloading").length;
  const rates = vessels.filter((v) => v.status === "Unloading").map((v) => predictions[v.id]?.effectiveRateTph || 0).filter((r) => r > 0);
  const avgRate = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null;

  const conflictCount = active.filter((v) => {
    const p = predictions[v.id];
    return p && berthRiskFor(v, p, vessels).risk === "conflict";
  }).length;

  const attentionCount = vessels.filter((v) => {
    const r = risks[v.id];
    return r && (r.level === "at-risk" || r.level === "delayed" || r.level === "overdue");
  }).length;

  const conflictVessel = active.find((v) => {
    const p = predictions[v.id];
    return p && berthRiskFor(v, p, vessels).risk === "conflict";
  });

  return (
    <div>
      <OverdueTasks openVessel={openVessel} />
      <PageHeader
        eyebrow="Overview"
        title="Operations dashboard"
        action={
          <button
            onClick={() => go("vessels")}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold border border-line-strong text-ink bg-paper hover:bg-line/40 transition-colors"
          >
            View all vessels <ChevronRight size={15} />
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Active vessels" value={String(active.length).padStart(2, "0")} Icon={Ship} tone="ink" sub="Berthed or unloading" />
        <KpiCard label="Currently unloading" value={String(currentlyUnloading).padStart(2, "0")} Icon={Droplets} tone="green" sub={avgRate ? `Avg ${fmtTph(avgRate)}` : "Live operations"} />
        <KpiCard
          label="Needs attention"
          value={String(attentionCount).padStart(2, "0")}
          Icon={AlertTriangle}
          tone={attentionCount > 0 ? "amber" : "green"}
          sub={attentionCount > 0 ? "At risk, delayed, or overdue" : "All within plan"}
        />
        <KpiCard
          label="Berth conflicts"
          value={String(conflictCount).padStart(2, "0")}
          Icon={Anchor}
          tone={conflictCount > 0 ? "red" : "green"}
          sub={conflictCount > 0 ? "Needs scheduling attention" : "None detected"}
        />
      </div>

      {alerts.length > 0 && (
        <Card className="mb-5">
          <div className="px-4 pt-3.5 pb-1 flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Needs attention</div>
            <button onClick={() => go("delays")} className="text-xs font-semibold text-teal">
              View all <ChevronRight size={12} className="inline" />
            </button>
          </div>
          <div className="divide-y divide-line px-1 pb-1">
            {alerts.slice(0, 4).map((a) => (
              <AlertRow key={a.id} alert={a} onClick={a.vesselId ? () => openVessel(a.vesselId!) : undefined} />
            ))}
          </div>
        </Card>
      )}

      <SectionHeader title="Active vessels" sub="Currently berthed or unloading" />
      {active.length === 0 ? (
        <Card className="mb-6">
          <EmptyState title="No active vessel visits" body="Create a vessel visit to begin monitoring port operations." actionLabel="New vessel visit" onAction={() => go("vessel-new")} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
          {active.map((v) => {
            const pred = predictions[v.id];
            const risk = risks[v.id];
            const berth = berths.find((b) => b.id === v.berthId);
            const berthRisk = berthRiskFor(v, pred, vessels);
            return (
              <Card key={v.id} className="p-5">
                <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <button onClick={() => openVessel(v.id)} className="text-lg font-bold hover:underline text-ink text-left">
                      {v.name}
                    </button>
                    <div className="text-sm mt-0.5 text-gray-500">
                      {v.cargo} · {data.berths.find(b => b.id === v.berthId)?.name || v.berthId}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge status={v.status} />
                    <RiskBadge risk={risk} compact />
                  </div>
                </div>

                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs font-semibold text-ink-soft">Cargo progress</span>
                  <span className="text-lg font-bold tabular-nums font-data text-brand-green">{fmtPct(pred.progressPct)}</span>
                </div>
                <ProgressBar pct={pred.progressPct} />
                <div className="flex justify-between text-xs mt-1.5 mb-4 text-gray-500">
                  <span>{fmtT(pred.unloadedT)} unloaded</span>
                  <span>
                    {fmtT(pred.remainingT)} remaining of {fmtT(v.cargoTotalT)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-gray-500">Rate</div>
                    <RateValue rateTph={pred.effectiveRateTph} unit={rateUnit} size="sm" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-gray-500">Est. completion</div>
                    <div className="font-bold mt-0.5 tabular-nums text-ink text-sm">{pred.etaAvailable ? fmtTime(pred.eta) : "Unavailable"}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-gray-500">Data quality</div>
                    <div className="mt-0.5">
                      <DataQualityBadge quality={pred.dataQuality} />
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-gray-500">Berth</div>
                    <div className="font-bold mt-0.5 text-ink text-sm">
                      {berth?.name || v.berthId}
                      {berthRisk.risk === "conflict" && (
                        <span className="ml-1.5 inline-flex items-center gap-1 text-danger text-[11px] font-semibold">
                          <AlertTriangle size={11} /> conflict
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {risk.level === "at-risk" || risk.level === "delayed" ? (
                  <div className="mt-3 text-xs rounded-lg px-3 py-2 bg-amber-tint text-[#7A5309]">{risk.reason}</div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      {conflictVessel && (
        <div className="mb-6">
          <SectionHeader title="Berth conflict detail" sub={`${conflictVessel.name} at Berth ${conflictVessel.berthId}`} />
          <BerthTimeline vessel={conflictVessel} prediction={predictions[conflictVessel.id]} riskInfo={berthRiskFor(conflictVessel, predictions[conflictVessel.id], vessels)} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <SectionHeader title="Upcoming arrivals" sub="Planned vessels not yet berthed" />
          <Card>
            {upcoming.length === 0 ? (
              <div className="text-sm py-8 text-center text-gray-500">No planned arrivals.</div>
            ) : (
              <div className="divide-y divide-line">
                {upcoming.map((v) => {
                  const risk = risks[v.id];
                  const expected = v.etaOverride || v.plannedArrival;
                  return (
                    <button key={v.id} onClick={() => openVessel(v.id)} className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-black/[0.02]">
                      <div>
                        <div className="font-semibold text-sm text-ink">{v.name}</div>
                        <div className="text-xs text-gray-500">
                          {v.cargo} · {data.berths.find(b => b.id === v.berthId)?.name || v.berthId}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {risk.level === "overdue" ? (
                          <RiskBadge risk={risk} compact />
                        ) : (
                          <div className="text-xs font-semibold text-ink-soft">{expected ? fmtRelative(expected, now) : "—"}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div>
          <SectionHeader title="Berths" sub="Occupancy at a glance" />
          <Card className="p-2">
            <div className="divide-y divide-line">
              {berths.map((b) => {
                const occupant = vessels.find((v) => v.berthId === b.id && (v.status === "Unloading" || v.status === "Berthed"));
                const pred = occupant ? predictions[occupant.id] : null;
                const risk = occupant && pred ? berthRiskFor(occupant, pred, vessels) : null;
                return (
                  <button
                    key={b.id}
                    onClick={() => (occupant ? openVessel(occupant.id) : go("berths"))}
                    className="w-full text-left px-3 py-3 flex items-center justify-between gap-3 hover:bg-black/[0.02]"
                  >
                    <div className="flex items-center gap-2">
                      <Anchor size={15} className="text-teal" />
                      <span className="font-semibold text-sm text-ink">{b.name}</span>
                    </div>
                    {occupant ? (
                      <div className="text-right">
                        <div className="text-xs font-semibold text-ink">{occupant.name}</div>
                        {risk?.risk === "conflict" ? (
                          <div className="text-[11px] font-semibold text-danger flex items-center gap-1 justify-end">
                            <AlertTriangle size={10} /> Conflict
                          </div>
                        ) : (
                          <div className="text-[11px] text-gray-500">{pred?.etaAvailable ? `Free ~${fmtTime(pred.berthRelease)}` : "Occupied"}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">Clear</span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
