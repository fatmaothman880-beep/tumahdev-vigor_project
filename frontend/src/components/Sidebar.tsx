import { Anchor, Bell, History as HistoryIcon, LayoutDashboard, Ship, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Page } from "../App";

const NAV: { key: Page; label: string; group: string; Icon: LucideIcon }[] = [
  { key: "dashboard", label: "Operations Dashboard", group: "Overview", Icon: LayoutDashboard },
  { key: "vessels", label: "Vessels", group: "Operations", Icon: Ship },
  { key: "berths", label: "Berths", group: "Operations", Icon: Anchor },
  { key: "delays", label: "Delays & Alerts", group: "Monitoring", Icon: Bell },
  { key: "history", label: "History", group: "Records", Icon: HistoryIcon },
];

const GROUPS = ["Overview", "Operations", "Monitoring", "Records"];

export default function Sidebar({
  page,
  go,
  mobileOpen,
  setMobileOpen,
  alertCount = 0,
}: {
  page: Page;
  go: (p: Page) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  alertCount?: number;
}) {
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside
        className={`fixed lg:static z-40 top-0 left-0 h-screen w-[260px] shrink-0 flex flex-col bg-ink text-white transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Company branding: matted on a light card so the logo's dark
            wordmark stays fully legible against the dark sidebar. */}
        <div className="px-4 pt-4 pb-3 border-b border-white/10 relative">
          <div className="rounded-lg bg-white/[0.97] px-3 py-2.5 flex items-center justify-center">
            <img src="/assets/vigor-logo.png" alt="Vigor Cement Works" className="h-9 w-auto object-contain" />
          </div>
          <button className="absolute top-4 right-4 lg:hidden text-white/70" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pt-4 pb-3">
          <div className="font-bold text-[14px] tracking-wide text-white">SMART PORT OPERATIONS</div>
          <div className="text-[10px] uppercase tracking-widest text-[#9fb8ab] mt-0.5">Vigor Cement Works · Zanzibar</div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {GROUPS.map((g) => (
            <div key={g} className="mb-3">
              <div className="px-5 text-[10px] font-bold uppercase tracking-widest mb-1.5 text-[#7C8B84]">{g}</div>
              {NAV.filter((n) => n.group === g).map((n) => {
                const active = page === n.key;
                const showBadge = n.key === "delays" && alertCount > 0;
                return (
                  <button
                    key={n.key}
                    onClick={() => {
                      go(n.key);
                      setMobileOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-5 py-2 text-sm font-medium transition-colors border-l-[3px] ${
                      active ? "bg-white/[0.08] text-white border-brand-green" : "text-[#C7D2CC] border-transparent hover:bg-white/[0.04]"
                    }`}
                  >
                    <n.Icon size={16} className={active ? "text-brand-green" : "text-[#8FA098]"} />
                    <span className="flex-1 text-left">{n.label}</span>
                    {showBadge && (
                      <span className="h-4 min-w-[16px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                        {alertCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/10 text-[11px] text-[#8FA098] flex items-center gap-2">
          <img src="/assets/vigor-emblem.png" alt="" className="h-5 w-5 object-contain shrink-0" />
          <span>
            VIGOR CEMENT WORKS
            <br />
            Turky&rsquo;s Group of Companies
          </span>
        </div>
      </aside>
    </>
  );
}
