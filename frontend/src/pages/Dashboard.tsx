import { AlertTriangle, ChevronRight, Clock, Droplets, Gauge, Ship } from "lucide-react";
import type { AppData } from "../hooks/useAppData";
import type { Page } from "../App";
import { computePrediction, berthRiskFor } from "../lib/prediction";
import { fmtPct, fmtT, fmtTime, fmtTph } from "../lib/format";
import { Card, KpiCard, PageHeader, SectionHeader } from "../components/ui/Layout";
import { EmptyState } from "../components/ui/States";
import ProgressBar from "../components/ui/ProgressBar";
import StatusBadge from "../components/ui/StatusBadge";
import DataQualityBadge from "../components/ui/DataQualityBadge";
import BerthRisk from "../components/ui/BerthRisk";
import BerthTimeline from "../components/ui/BerthTimeline";
import OperationalTimeline from "../components/ui/OperationalTimeline";

export default function Dashboard({
  data,
  go,
  openVessel,
}: {
  data: AppData;
  go: (p: Page) => void;
  openVessel: (id: number) => void;
}) {
  const { vessels, readings, berths, events } = data;
  const now = new Date();
  const active = vessels.filter((v) => v.status === "Unloading" || v.status === "Berthed");
  const primary = active[0] || null;
  const primaryPred = primary ? computePrediction(primary, readings, now) : null;
  const primaryRisk = primary && primaryPred ? berthRiskFor(primary, primaryPred, vessels) : null;
  const berth = primary ? berths.find((b) => b.id === primary.berthId) : null;

  const currentlyUnloading = vessels.filter((v) => v.status === "Unloading").length;
  const rates = vessels
    .filter((v) => v.status === "Unloading")
    .map((v) => computePrediction(v, readings, now).effectiveRateTph)
    .filter((r) => r > 0);
  const avgRate = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null;

  const conflicts = vessels.filter((v) => {
    if (v.status !== "Unloading" && v.status !== "Berthed") return false;
    const p = computePrediction(v, readings, now);
    return berthRiskFor(v, p, vessels).risk === "conflict";
  }).length;

  return (
    <div>
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
        <KpiCard label="Currently unloading" value={String(currentlyUnloading).padStart(2, "0")} Icon={Droplets} tone="green" sub="Live operations" />
        <KpiCard label="Average unloading rate" value={avgRate ? fmtTph(avgRate) : "—"} Icon={Gauge} tone="teal" sub="Across active vessels" />
        <KpiCard
          label="Berth conflicts"
          value={String(conflicts).padStart(2, "0")}
          Icon={AlertTriangle}
          tone={conflicts > 0 ? "red" : "green"}
          sub={conflicts > 0 ? "Needs attention" : "None detected"}
        />
      </div>

      {!primary || !primaryPred || !primaryRisk ? (
        <Card>
          <EmptyState title="No active vessel visits" body="Create a vessel visit to begin monitoring port operations." actionLabel="New vessel visit" onAction={() => go("vessel-new")} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2 p-5">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Primary active vessel</div>
                <button onClick={() => openVessel(primary.id)} className="text-xl font-bold mt-0.5 hover:underline text-ink text-left">
                  {primary.name}
                </button>
                <div className="text-sm mt-0.5 text-gray-500">
                  {primary.cargo} · Berth {primary.berthId}
                </div>
              </div>
              <StatusBadge status={primary.status} />
            </div>

            <div className="mt-5">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm font-semibold text-ink-soft">Unloading progress</span>
                <span className="text-2xl font-bold tabular-nums font-data text-brand-green">{fmtPct(primaryPred.progressPct)}</span>
              </div>
              <ProgressBar pct={primaryPred.progressPct} />
              <div className="flex justify-between text-xs mt-1.5 text-gray-500">
                <span>{fmtT(primaryPred.unloadedT)} unloaded</span>
                <span>
                  {fmtT(primaryPred.remainingT)} remaining of {fmtT(primary.cargoTotalT)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-line">
              <div>
                <div className="text-[11px] font-semibold uppercase text-gray-500">Effective rate</div>
                <div className="font-bold mt-0.5 tabular-nums text-ink">{primaryPred.effectiveRateTph > 0 ? fmtTph(primaryPred.effectiveRateTph) : "—"}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase text-gray-500">Estimated completion</div>
                <div className="font-bold mt-0.5 tabular-nums text-ink">{primaryPred.etaAvailable ? fmtTime(primaryPred.eta) : "Estimate unavailable"}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase text-gray-500">Berth release</div>
                <div className="font-bold mt-0.5 tabular-nums text-ink">{primaryPred.berthReleaseAvailable ? fmtTime(primaryPred.berthRelease) : "—"}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase text-gray-500">Data quality</div>
                <div className="mt-0.5">
                  <DataQualityBadge quality={primaryPred.dataQuality} />
                </div>
              </div>
            </div>
            {!primaryPred.etaAvailable && (
              <div className="mt-3 text-xs rounded-lg px-3 py-2 bg-amber-tint text-[#7A5309]">Estimate unavailable — valid unloading rate required.</div>
            )}
            <div className="mt-4 flex gap-2 flex-wrap items-center">
              <button onClick={() => openVessel(primary.id)} className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white bg-brand-green hover:bg-brand-green-deep transition-colors">
                Open vessel <ChevronRight size={14} />
              </button>
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                <Clock size={13} /> Last reading {primaryPred.lastReading ? fmtTime(primaryPred.lastReading.timestamp) : "—"}
              </span>
            </div>
          </Card>

          <BerthRisk vessel={primary} prediction={primaryPred} riskInfo={primaryRisk} berth={berth} />
        </div>
      )}

      {primary && primaryPred && primaryRisk && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
          <BerthTimeline vessel={primary} prediction={primaryPred} riskInfo={primaryRisk} />
          <OperationalTimeline events={events[primary.id]} />
        </div>
      )}
    </div>
  );
}
