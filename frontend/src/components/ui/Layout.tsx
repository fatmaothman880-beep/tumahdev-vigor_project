import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl bg-white border border-line ${className}`}>{children}</div>;
}

export function KpiCard({
  label,
  value,
  sub,
  Icon,
  tone = "ink",
}: {
  label: string;
  value: string;
  sub?: string;
  Icon?: LucideIcon;
  tone?: "ink" | "green" | "amber" | "red" | "teal";
}) {
  const toneClass = {
    ink: "text-ink bg-ink/10",
    green: "text-brand-green bg-brand-green/10",
    amber: "text-amber bg-amber/10",
    red: "text-danger bg-danger/10",
    teal: "text-teal bg-teal/10",
  }[tone];
  return (
    <Card className="p-4 flex items-start justify-between">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</div>
        <div className="text-2xl font-bold mt-1 tabular-nums font-data text-ink">{value}</div>
        {sub && <div className="text-xs mt-1 text-gray-500">{sub}</div>}
      </div>
      {Icon && (
        <div className={`rounded-lg p-2 ${toneClass}`}>
          <Icon size={18} strokeWidth={2.1} />
        </div>
      )}
    </Card>
  );
}

export function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        <h3 className="text-[15px] font-bold text-ink">{title}</h3>
        {sub && <p className="text-xs mt-0.5 text-gray-500">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-start sm:items-center justify-between gap-3 mb-5 flex-wrap">
      <div>
        {eyebrow && <div className="text-[11px] font-bold uppercase tracking-widest mb-1 text-teal">{eyebrow}</div>}
        <h2 className="text-xl font-bold text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}
