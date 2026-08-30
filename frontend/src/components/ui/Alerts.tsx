import { useState } from "react";
import { Anchor, Bell, Clock, Info, OctagonAlert, TrendingDown } from "lucide-react";
import type { OperationalAlert } from "../../types";
import { Card } from "./Layout";

const KIND_ICON: Record<OperationalAlert["kind"], typeof Bell> = {
  arrival: Clock,
  "completion-shift": TrendingDown,
  overdue: OctagonAlert,
  "berth-conflict": Anchor,
  "rate-drop": TrendingDown,
  "berth-available": Anchor,
};

const SEVERITY_STYLE: Record<OperationalAlert["severity"], { fg: string; bg: string }> = {
  info: { fg: "text-teal", bg: "bg-teal-tint" },
  warning: { fg: "text-amber", bg: "bg-amber-tint" },
  critical: { fg: "text-danger", bg: "bg-danger-tint" },
};

export function AlertRow({ alert, onClick }: { alert: OperationalAlert; onClick?: () => void }) {
  const Icon = KIND_ICON[alert.kind] || Info;
  const s = SEVERITY_STYLE[alert.severity];
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`w-full text-left px-3.5 py-2.5 flex items-start gap-2.5 rounded-lg transition-colors ${onClick ? "hover:bg-black/[0.02] cursor-pointer" : "cursor-default"}`}
    >
      <div className={`rounded-md p-1.5 shrink-0 ${s.bg}`}>
        <Icon size={13} className={s.fg} strokeWidth={2.3} />
      </div>
      <div className="min-w-0">
        <div className="text-sm text-ink leading-snug">{alert.message}</div>
      </div>
    </button>
  );
}

/** Full alerts feed card, used on the Delays & Alerts page. */
export function AlertsFeed({ alerts, onSelectVessel }: { alerts: OperationalAlert[]; onSelectVessel: (id: number) => void }) {
  if (alerts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-sm text-gray-500">No active operational alerts. All monitored vessels are within expected parameters.</div>
      </Card>
    );
  }
  return (
    <Card className="p-2">
      <div className="divide-y divide-line">
        {alerts.map((a) => (
          <AlertRow key={a.id} alert={a} onClick={a.vesselId ? () => onSelectVessel(a.vesselId!) : undefined} />
        ))}
      </div>
    </Card>
  );
}

/** Header bell with a small popover feed — lightweight, no external notification infrastructure. */
export function NotificationBell({ alerts, onSelectVessel }: { alerts: OperationalAlert[]; onSelectVessel: (id: number) => void }) {
  const [open, setOpen] = useState(false);
  const critical = alerts.filter((a) => a.severity !== "info").length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative h-8 w-8 rounded-full flex items-center justify-center hover:bg-line/50 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={17} className="text-ink-soft" />
        {critical > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
            {critical}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-xl shadow-lg bg-white border border-line z-40">
            <div className="px-4 py-3 border-b border-line font-bold text-sm text-ink flex items-center justify-between">
              Alerts
              <span className="text-[11px] font-normal text-gray-500">{alerts.length} active</span>
            </div>
            {alerts.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-500 text-center">No active alerts.</div>
            ) : (
              <div className="p-1.5">
                {alerts.map((a) => (
                  <AlertRow
                    key={a.id}
                    alert={a}
                    onClick={
                      a.vesselId
                        ? () => {
                            onSelectVessel(a.vesselId!);
                            setOpen(false);
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
