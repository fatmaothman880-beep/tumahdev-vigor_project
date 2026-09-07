import type { RateUnit } from "../../types";
import { formatRatePrimary, formatRateSecondary } from "../../lib/units";

/** Compact t/h ⇄ t/min segmented toggle. t/h is always the default/primary unit. */
export function RateUnitToggle({ unit, onChange }: { unit: RateUnit; onChange: (u: RateUnit) => void }) {
  return (
    <div className="inline-flex rounded-md border border-line overflow-hidden text-[11px] font-semibold">
      {(["tph", "tpm"] as RateUnit[]).map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
          className={`px-2 py-1 transition-colors ${unit === u ? "bg-ink text-white" : "bg-paper text-ink-soft hover:bg-line/40"}`}
        >
          {u === "tph" ? "t/h" : "t/min"}
        </button>
      ))}
    </div>
  );
}

/** Rate value with the selected unit primary and the other unit shown as a small "≈" conversion underneath. */
export function RateValue({ rateTph, unit, size = "md" }: { rateTph: number; unit: RateUnit; size?: "sm" | "md" | "lg" }) {
  if (!rateTph || rateTph <= 0) return <span className="text-ink">—</span>;
  const primaryCls = size === "lg" ? "text-xl font-bold" : size === "sm" ? "text-sm font-semibold" : "font-bold";
  return (
    <span className="inline-flex flex-col leading-tight">
      <span className={`tabular-nums text-ink ${primaryCls}`}>{formatRatePrimary(rateTph, unit)}</span>
      <span className="text-[11px] tabular-nums text-gray-500">{formatRateSecondary(rateTph, unit)}</span>
    </span>
  );
}
