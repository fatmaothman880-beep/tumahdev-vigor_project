import { Menu } from "lucide-react";
import { fmtTime, EAT_LABEL } from "../lib/format";

export default function TopBar({
  title,
  breadcrumb,
  setMobileOpen,
  now,
}: {
  title: string;
  breadcrumb?: string;
  setMobileOpen: (v: boolean) => void;
  now: Date;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-6 py-3.5 bg-white border-b border-line">
      <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
        <Menu size={20} />
      </button>
      <div className="min-w-0">
        <div className="text-[11px] font-medium truncate text-gray-500">{breadcrumb || "Smart Port Operations"}</div>
        <h1 className="text-base sm:text-lg font-bold truncate text-ink">{title}</h1>
      </div>
      <div className="ml-auto flex items-center gap-2 sm:gap-4 text-xs shrink-0">
        <span className="hidden sm:inline-flex items-center gap-1.5 font-semibold text-brand-green">
          <span className="h-1.5 w-1.5 rounded-full animate-pulse bg-brand-green" />
          Live Operations
        </span>
        <span className="hidden md:inline text-[11px] text-gray-500">
          Last updated {fmtTime(now)} {EAT_LABEL}
        </span>
        <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-sand-tint text-[#8A6224]">
          Demo mode — mock data
        </span>
        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold bg-brand-green-tint text-brand-green-deep">
          OM
        </div>
      </div>
    </header>
  );
}
