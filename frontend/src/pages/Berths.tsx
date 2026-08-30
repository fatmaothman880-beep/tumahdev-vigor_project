import { AlertTriangle, Anchor } from "lucide-react";
import type { AppData } from "../hooks/useAppData";
import type { OperationalModel } from "../hooks/useOperationalModel";
import { berthRiskFor } from "../lib/prediction";
import { fmtPct, fmtTime } from "../lib/format";
import { Card, PageHeader } from "../components/ui/Layout";

export default function Berths({ data, model, openVessel }: { data: AppData; model: OperationalModel; openVessel: (id: number) => void }) {
  const { vessels, berths } = data;
  const { predictions } = model;

  return (
    <div>
      <PageHeader eyebrow="Operations" title="Berths" />
      <div className="grid md:grid-cols-3 gap-4">
        {berths.map((b) => {
          const occupant = vessels.find((v) => v.berthId === b.id && (v.status === "Unloading" || v.status === "Berthed"));
          const pred = occupant ? predictions[occupant.id] : null;
          const risk = occupant && pred ? berthRiskFor(occupant, pred, vessels) : null;
          return (
            <Card key={b.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Anchor size={16} className="text-teal" />
                  <span className="font-bold text-ink">{b.name}</span>
                </div>
                <span className="text-[11px] font-semibold uppercase text-gray-500">{b.lengthM}m</span>
              </div>
              <div className="text-xs mb-3 text-gray-500">{b.notes}</div>
              {occupant && pred && risk ? (
                <button onClick={() => openVessel(occupant.id)} className="w-full text-left rounded-lg p-3 bg-brand-green-tint">
                  <div className="font-semibold text-sm text-brand-green-deep">{occupant.name}</div>
                  <div className="text-xs mt-1 text-ink-soft">
                    {fmtPct(pred.progressPct)} complete · {pred.etaAvailable ? `ETA ${fmtTime(pred.eta)}` : "Estimate unavailable"}
                  </div>
                  {risk.risk === "conflict" && (
                    <div className="text-xs font-semibold mt-1 flex items-center gap-1 text-danger">
                      <AlertTriangle size={12} /> Potential conflict
                    </div>
                  )}
                </button>
              ) : (
                <div className="rounded-lg p-3 text-sm bg-paper text-gray-500">Berth clear — no vessel currently occupying.</div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
