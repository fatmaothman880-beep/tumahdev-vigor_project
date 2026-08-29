import { Anchor, History as HistoryIcon, LayoutDashboard, Ship, Wrench, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Page } from "../App";

const NAV: { key: Page; label: string; group: string; Icon: LucideIcon }[] = [
  { key: "dashboard", label: "Operations Dashboard", group: "Overview", Icon: LayoutDashboard },
  { key: "vessels", label: "Vessels", group: "Operations", Icon: Ship },
  { key: "berths", label: "Berths", group: "Operations", Icon: Anchor },
  { key: "delays", label: "Delays & Downtime", group: "Monitoring", Icon: Wrench },
  { key: "history", label: "History", group: "Records", Icon: HistoryIcon },
];

const GROUPS = ["Overview", "Operations", "Monitoring", "Records"];

export default function Sidebar({
  page,
  go,
  mobileOpen,
  setMobileOpen,
}: {
  page: Page;
  go: (p: Page) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside
        className={`fixed lg:static z-40 top-0 left-0 h-full w-[248px] shrink-0 flex flex-col bg-ink text-white transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
          <img src="/assets/vigor-emblem.png" alt="Vigor Cement Works" className="h-9 w-9 object-contain" />
          <div className="leading-tight">
            <div className="font-bold text-[13px] tracking-wide">SMART PORT</div>
            <div className="text-[10px] uppercase tracking-widest text-[#9fb8ab]">Operations</div>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {GROUPS.map((g) => (
            <div key={g} className="mb-3">
              <div className="px-5 text-[10px] font-bold uppercase tracking-widest mb-1.5 text-[#7C8B84]">{g}</div>
              {NAV.filter((n) => n.group === g).map((n) => {
                const active = page === n.key;
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
                    {n.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10 text-[11px] text-[#8FA098]">
          VIGOR CEMENT WORKS
          <br />
          Turky&rsquo;s Group of Companies — Zanzibar
        </div>
      </aside>
    </>
  );
}
