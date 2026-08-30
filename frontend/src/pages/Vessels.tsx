import { useState } from "react";
import { Plus, Search } from "lucide-react";
import type { AppData } from "../hooks/useAppData";
import type { OperationalModel } from "../hooks/useOperationalModel";
import type { Page } from "../App";
import type { VesselStatus } from "../types";
import { fmtPct, fmtTime } from "../lib/format";
import { PERIOD_LABEL, isWithinPeriod, type PeriodKey } from "../lib/periods";
import { Card, PageHeader } from "../components/ui/Layout";
import { EmptyState } from "../components/ui/States";
import StatusBadge from "../components/ui/StatusBadge";
import { RiskBadge } from "../components/ui/RiskBadge";

const STATUSES: (VesselStatus | "All")[] = ["All", "Planned", "Arrived", "Berthed", "Unloading", "Delayed", "Completed", "Cancelled"];
const PERIODS: PeriodKey[] = ["all", "today", "week", "month", "lastMonth", "year"];

export default function Vessels({
  data,
  model,
  now,
  go,
  openVessel,
}: {
  data: AppData;
  model: OperationalModel;
  now: Date;
  go: (p: Page) => void;
  openVessel: (id: number) => void;
}) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<VesselStatus | "All">("All");
  const [period, setPeriod] = useState<PeriodKey>("all");
  const { vessels } = data;
  const { predictions, risks } = model;

  const filtered = vessels.filter((v) => {
    const matchesQ = !q || v.name.toLowerCase().includes(q.toLowerCase()) || v.reference.toLowerCase().includes(q.toLowerCase());
    const matchesStatus = statusFilter === "All" || v.status === statusFilter;
    const matchesPeriod = isWithinPeriod(v.registeredAt, period, now);
    return matchesQ && matchesStatus && matchesPeriod;
  });

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Vessel visits"
        action={
          <button onClick={() => go("vessel-new")} className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white bg-brand-green hover:bg-brand-green-deep transition-colors">
            <Plus size={15} /> New vessel visit
          </button>
        }
      />
      <Card className="p-3 mb-4 space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by vessel name or reference…"
              className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none bg-paper border border-line text-ink"
            />
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodKey)}
            className="rounded-lg px-3 py-2 text-sm outline-none bg-paper border border-line text-ink-soft font-medium"
          >
            {PERIODS.map((p) => (
              <option key={p} value={p}>
                {PERIOD_LABEL[p]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border ${
                statusFilter === s ? "bg-ink text-white border-ink" : "bg-paper text-ink-soft border-line"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No vessel visits found" body="Try a different search, status, or period, or create a new vessel visit." actionLabel="New vessel visit" onAction={() => go("vessel-new")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 border-b border-line">
                  <th className="px-4 py-3">Vessel</th>
                  <th className="px-4 py-3">Cargo</th>
                  <th className="px-4 py-3">Berth</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Arrival</th>
                  <th className="px-4 py-3 text-right">Progress</th>
                  <th className="px-4 py-3 text-right">ETA</th>
                  <th className="px-4 py-3">Risk</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const pred = predictions[v.id];
                  const risk = risks[v.id];
                  return (
                    <tr key={v.id} onClick={() => openVessel(v.id)} className="cursor-pointer hover:bg-black/[0.02] transition-colors border-b border-line">
                      <td className="px-4 py-3 font-semibold text-ink">
                        {v.name}
                        <div className="text-[11px] font-normal text-gray-500">{v.reference}</div>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{v.cargo}</td>
                      <td className="px-4 py-3 text-ink-soft">{v.berthId}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={v.status} />
                      </td>
                      <td className="px-4 py-3 tabular-nums text-ink-soft">
                        {v.actualArrival ? fmtTime(v.actualArrival) : v.plannedArrival ? `${fmtTime(v.plannedArrival)} (planned)` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-ink">
                        {v.status === "Unloading" || v.status === "Berthed" ? fmtPct(pred.progressPct) : v.status === "Completed" ? "100.0%" : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-ink">{pred?.etaAvailable ? fmtTime(pred.eta) : "—"}</td>
                      <td className="px-4 py-3">{risk ? <RiskBadge risk={risk} compact /> : <span className="text-xs text-gray-500">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
