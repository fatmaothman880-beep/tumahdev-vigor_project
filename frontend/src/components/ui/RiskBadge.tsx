import { AlertTriangle, CircleCheck, Clock, HelpCircle, OctagonAlert } from "lucide-react";
import type { OperationalRisk } from "../../types";
import { RISK_LABEL } from "../../lib/riskEngine";
import { fmtDuration } from "../../lib/format";

const STYLE: Record<OperationalRisk["level"], { bg: string; fg: string; dot: string; Icon: typeof CircleCheck }> = {
  "on-track": { bg: "bg-brand-green-tint", fg: "text-brand-green-deep", dot: "bg-brand-green", Icon: CircleCheck },
  "at-risk": { bg: "bg-amber-tint", fg: "text-amber", dot: "bg-amber", Icon: AlertTriangle },
  delayed: { bg: "bg-danger-tint", fg: "text-danger", dot: "bg-danger", Icon: OctagonAlert },
  overdue: { bg: "bg-danger-tint", fg: "text-danger", dot: "bg-danger", Icon: Clock },
  unknown: { bg: "bg-gray-100", fg: "text-ink-soft", dot: "bg-gray-400", Icon: HelpCircle },
};

export function RiskBadge({ risk, compact = false }: { risk: OperationalRisk; compact?: boolean }) {
  const s = STYLE[risk.level];
  const { Icon } = s;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wide ${s.bg} ${s.fg} ${compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"}`}>
      <Icon size={compact ? 11 : 13} strokeWidth={2.3} />
      {RISK_LABEL[risk.level]}
    </span>
  );
}

/** Fuller panel used on the vessel detail page and dashboard — badge plus reason and projected delay. */
export function RiskPanel({ risk }: { risk: OperationalRisk }) {
  const s = STYLE[risk.level];
  if (risk.level === "on-track" || risk.level === "unknown") {
    return (
      <div className={`rounded-lg p-3 flex items-start gap-2.5 ${s.bg}`}>
        <s.Icon size={17} className={`${s.fg} mt-0.5 shrink-0`} />
        <div>
          <div className={`font-bold text-sm ${s.fg}`}>{RISK_LABEL[risk.level]}</div>
          {risk.reason && <div className="text-xs mt-0.5 text-ink-soft">{risk.reason}</div>}
        </div>
      </div>
    );
  }
  return (
    <div className={`rounded-lg p-3 flex items-start gap-2.5 ${s.bg} border border-current/10`}>
      <s.Icon size={17} className={`${s.fg} mt-0.5 shrink-0`} />
      <div>
        <div className={`font-bold text-sm ${s.fg}`}>{RISK_LABEL[risk.level]}</div>
        {risk.reason && <div className="text-xs mt-0.5 text-ink-soft">{risk.reason}</div>}
        {risk.projectedDelayMin !== null && (
          <div className={`text-xs mt-1 font-semibold ${s.fg}`}>
            {risk.level === "overdue" ? "Overdue by" : "Projected delay"}: {fmtDuration(risk.projectedDelayMin)}
          </div>
        )}
      </div>
    </div>
  );
}
