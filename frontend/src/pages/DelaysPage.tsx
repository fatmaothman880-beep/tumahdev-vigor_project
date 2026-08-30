import { OctagonAlert, AlertTriangle } from "lucide-react";
import type { AppData } from "../hooks/useAppData";
import type { OperationalModel } from "../hooks/useOperationalModel";
import type { DelayEvent, VesselVisit } from "../types";
import { fmtDuration, fmtTime, minutesBetween } from "../lib/format";
import { Card, PageHeader, SectionHeader } from "../components/ui/Layout";
import { EmptyState } from "../components/ui/States";
import { RiskBadge } from "../components/ui/RiskBadge";
import { AlertsFeed } from "../components/ui/Alerts";

export default function DelaysPage({
  data,
  model,
  openVessel,
}: {
  data: AppData;
  model: OperationalModel;
  openVessel: (id: number) => void;
}) {
  const { vessels, delays } = data;
  const { risks, alerts } = model;

  const confirmed: (DelayEvent & { vessel?: VesselVisit })[] = [];
  Object.entries(delays).forEach(([vid, list]) => {
    const v = vessels.find((x) => x.id === Number(vid));
    list.forEach((d) => confirmed.push({ ...d, vessel: v }));
  });
  confirmed.sort((a, b) => b.start.getTime() - a.start.getTime());

  const atRiskVessels = vessels.filter((v) => {
    const r = risks[v.id];
    return r && (r.level === "at-risk" || r.level === "overdue");
  });

  return (
    <div>
      <PageHeader eyebrow="Monitoring" title="Delays & Alerts" />

      <SectionHeader title="At risk" sub="Automatically predicted — not yet confirmed by an operator" />
      {atRiskVessels.length === 0 ? (
        <Card className="mb-6 p-6 text-center text-sm text-gray-500">No vessels are currently forecast to fall behind plan.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {atRiskVessels.map((v) => {
            const risk = risks[v.id];
            return (
              <button key={v.id} onClick={() => openVessel(v.id)} className="text-left">
                <Card className="p-4 hover:border-line-strong transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="font-semibold text-sm text-ink">{v.name}</div>
                    <RiskBadge risk={risk} compact />
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {v.cargo} · Berth {v.berthId}
                  </div>
                  {risk.reason && <div className="text-xs text-ink-soft">{risk.reason}</div>}
                  {risk.projectedDelayMin !== null && (
                    <div className="text-xs font-semibold mt-1.5 text-amber flex items-center gap-1">
                      <AlertTriangle size={12} />
                      {risk.level === "overdue" ? "Overdue by" : "Projected delay"}: {fmtDuration(risk.projectedDelayMin)}
                    </div>
                  )}
                </Card>
              </button>
            );
          })}
        </div>
      )}

      <SectionHeader title="Confirmed delays" sub="Actual events recorded by an operator" />
      <Card className="mb-6">
        {confirmed.length === 0 ? (
          <EmptyState title="No confirmed delays" body="Delays confirmed against vessel visits will appear here." Icon={OctagonAlert} />
        ) : (
          <div className="divide-y divide-line">
            {confirmed.map((d) => (
              <button key={d.id} onClick={() => d.vessel && openVessel(d.vessel.id)} className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-black/[0.02]">
                <div>
                  <div className="font-semibold text-sm text-ink">
                    {d.vessel?.name} — {d.category}
                    {d.area ? ` · ${d.area}` : ""}
                  </div>
                  <div className="text-xs mt-0.5 text-gray-500">{d.description}</div>
                </div>
                <div className="text-xs text-right shrink-0 tabular-nums text-ink-soft">
                  {fmtTime(d.start)}–{fmtTime(d.end)}
                  <br />
                  {minutesBetween(d.start, d.end)} min
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      <SectionHeader title="Operational alerts" sub="Arrivals, berth availability, and rate changes worth noting" />
      <AlertsFeed alerts={alerts} onSelectVessel={openVessel} />
    </div>
  );
}
