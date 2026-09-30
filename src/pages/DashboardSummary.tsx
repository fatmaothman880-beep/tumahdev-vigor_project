import { USE_MOCK_API } from '../api/client';
import { LiveVisitDashboard } from '../components/ui/LiveVisitDashboard';
import React from 'react';
import { useAppData, useLiveClock } from '../hooks/useAppData';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface DashboardSummaryProps {
  onSelectVessel: (vesselId: string) => void;
  onNavigateToBerths: () => void;
  onNavigateToPayments: () => void;
  onNavigateToAlerts: () => void;
  onNavigateToControlTower: () => void;
}

export function DashboardSummary({
  onNavigateToBerths,
  onNavigateToAlerts,
  onNavigateToControlTower,
}: DashboardSummaryProps) {
  const { voyages } = useAppData();
  const { now, eatTime } = useLiveClock();

  // Shift calculation (East Africa Time)
  const currentHour = now.getHours();
  let shiftLabel = 'Shift 3';
  if (currentHour >= 6 && currentHour < 14) {
    shiftLabel = 'Shift 1';
  } else if (currentHour >= 14 && currentHour < 22) {
    shiftLabel = 'Shift 2';
  }

  const dateFormatted = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const updatedTimeFormatted = eatTime ? eatTime.slice(0, 5) : '23:17';

  // Format executive milestone date
  const formatMilestone = (isoString?: string, fallbackTime = '04:09'): string => {
    if (!isoString) return fallbackTime;
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return fallbackTime;
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const v01Voyage = voyages.find((v) => v.vesselId === 'v-01' || v.vesselName.includes('01')) || voyages[0];
  const v03Voyage = voyages.find((v) => v.vesselId === 'v-03' || v.vesselName.includes('03')) || voyages[2];

  const v01DepartureTime = formatMilestone(v01Voyage?.expectedBerthRelease, '04:09');
  const v03EtaTime = formatMilestone(v03Voyage?.returnEtaForecast, '01:31');

  if (!USE_MOCK_API) return <LiveVisitDashboard title="Dashboard Summary" summary />;

  return (
    <div
      id="executive-dashboard-summary"
      className="w-full flex flex-col gap-4 font-sans select-none"
    >
      {/* ===================================================================== */}
      {/* 1. NEW EXECUTIVE HEADER (Clean, no surrounding card, no thick border) */}
      {/* ===================================================================== */}
      <header
        id="executive-header"
        className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-line"
      >
        <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard Summary
          </h1>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-critical" />
            <span className="text-xs font-bold text-danger tracking-wider uppercase">
              ATTENTION REQUIRED
            </span>
            <span className="text-xs text-muted">· 3 priority issues</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-muted">
          <span className="text-foreground font-semibold">{dateFormatted}</span>
          <span className="text-muted">·</span>
          <span className="text-positive font-semibold">{shiftLabel}</span>
          <span className="text-muted">·</span>
          <span>Updated {updatedTimeFormatted}</span>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. ONE HORIZONTAL KPI STRIP (Separated by subtle vertical dividers)   */}
      {/* ===================================================================== */}
      <section
        id="executive-kpi-strip"
        className="bg-surface rounded-xl border border-line py-4 px-6 shadow-2xs"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-line gap-y-4 lg:gap-y-0">
          {/* KPI 1: PRODUCTION */}
          <div
            id="kpi-production"
            onClick={onNavigateToControlTower}
            className="cursor-pointer group lg:pr-6"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block">
              Production
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-bold tracking-tight text-foreground group-hover:text-positive transition-colors">
                2,450
              </span>
              <span className="text-base font-normal text-muted">T</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-muted">82% of target</span>
              <span className="text-muted">·</span>
              <span className="font-semibold text-warning">↓ 18%</span>
            </div>
          </div>

          {/* KPI 2: DISPATCH */}
          <div
            id="kpi-dispatch"
            onClick={onNavigateToControlTower}
            className="cursor-pointer group lg:px-6 pt-3 lg:pt-0"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block">
              Dispatch
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-bold tracking-tight text-foreground group-hover:text-positive transition-colors">
                1,850
              </span>
              <span className="text-base font-normal text-muted">T</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-muted">42 trucks</span>
              <span className="text-muted">·</span>
              <span className="font-semibold text-positive">✓ Normal</span>
            </div>
          </div>

          {/* KPI 3: FUEL (THE CRITICAL MATERIAL EXCEPTION) */}
          <div
            id="kpi-fuel"
            onClick={onNavigateToAlerts}
            className="cursor-pointer group lg:px-6 pt-3 lg:pt-0"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block">
              Fuel
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-bold tracking-tight text-warning">
                28%
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-muted">Reserve</span>
              <span className="text-muted">·</span>
              <span className="font-semibold text-warning">⚠ Low</span>
            </div>
          </div>

          {/* KPI 4: BERTH */}
          <div
            id="kpi-berth"
            onClick={onNavigateToBerths}
            className="cursor-pointer group lg:pl-6 pt-3 lg:pt-0"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block">
              Berth
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-bold tracking-tight text-foreground group-hover:text-info transition-colors">
                B01
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-muted">Occupied</span>
              <span className="text-muted">·</span>
              <span className="font-semibold text-foreground">Until {v01DepartureTime}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. MAIN AREA — ONLY TWO SECTIONS (65% Left / 35% Right)               */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* =================================================================== */}
        {/* LEFT: VESSEL & BERTH SITUATION (65% -> 8 columns)                   */}
        {/* =================================================================== */}
        <section
          id="section-vessel-berth"
          className="lg:col-span-8 bg-surface rounded-xl border border-line p-5 shadow-2xs flex flex-col justify-between"
        >
          <div>
            {/* Section Header */}
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Vessel & Berth Situation
              </span>
              <button
                onClick={onNavigateToBerths}
                className="text-xs font-semibold text-info hover:text-foreground inline-flex items-center gap-1 transition-colors"
              >
                Berth Planning <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Current vs Next Vessel Summary */}
            <div className="grid grid-cols-2 gap-6 pt-4 pb-5">
              {/* CURRENT VESSEL */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Current Vessel
                </span>
                <div className="text-lg font-bold text-foreground mt-0.5">
                  MV VIGOR 01
                </div>
                <div className="text-xs font-medium text-positive mt-0.5">
                  Berth B01 · Discharging
                </div>
                <div className="text-xs text-muted mt-2.5">
                  Expected Departure:
                  <span className="font-bold text-foreground ml-1">
                    {v01DepartureTime}
                  </span>
                </div>
              </div>

              {/* NEXT VESSEL */}
              <div className="border-l border-line pl-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Next Vessel
                </span>
                <div className="text-lg font-bold text-foreground mt-0.5">
                  MV VIGOR 03
                </div>
                <div className="text-xs font-medium text-danger mt-0.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Inbound from Mtwara
                </div>
                <div className="text-xs text-muted mt-2.5">
                  ETA:
                  <span className="font-bold text-danger ml-1">
                    {v03EtaTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Schedule Conflict Timeline */}
            <div className="bg-surface rounded-lg p-4 border border-line">
              <div className="flex items-center justify-between mb-3 text-[11px] font-mono text-muted">
                <span>00:00</span>
                <span className="font-sans font-semibold text-danger">01:31 (VIGOR 03 ETA)</span>
                <span className="font-sans font-semibold text-foreground">04:09 (VIGOR 01 Dep)</span>
                <span>06:00</span>
              </div>

              {/* Timeline graphic */}
              <div className="space-y-2.5">
                {/* Row 1: Current Vessel (VIGOR 01) */}
                <div className="relative flex items-center">
                  <span className="w-24 text-[11px] font-semibold text-foreground shrink-0">
                    MV VIGOR 01
                  </span>
                  <div className="flex-1 h-6 bg-raised rounded relative overflow-hidden flex items-center px-2">
                    {/* Occupancy bar from 00:00 to 04:09 (~70% width) */}
                    <div className="absolute left-0 top-0 bottom-0 w-[70%] bg-brand-hover rounded flex items-center justify-between px-2.5 text-white text-[10px] font-semibold">
                      <span>Berth B01 Occupied</span>
                      <span>● Dep 04:09</span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Next Vessel (VIGOR 03) */}
                <div className="relative flex items-center">
                  <span className="w-24 text-[11px] font-semibold text-foreground shrink-0">
                    MV VIGOR 03
                  </span>
                  <div className="flex-1 h-6 bg-raised rounded relative overflow-hidden">
                    {/* Arrives at 01:31 (25% left position) */}
                    <div className="absolute left-[25%] top-0 bottom-0 w-[45%] bg-danger-soft border-l-2 border-danger flex items-center justify-center text-[10px] font-bold text-danger px-1">
                      <span>⚠ ~2h 38m Anchorage Hold</span>
                    </div>
                    {/* Can only berth after 04:09 */}
                    <div className="absolute left-[70%] top-0 bottom-0 right-0 bg-info-strong/20 border-l border-info flex items-center px-2 text-[10px] font-semibold text-info">
                      <span>B01 Available</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overlap Callout */}
              <div className="mt-3 pt-2.5 border-t border-line flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-danger">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>BERTH CONFLICT: ~2h 38m SCHEDULE OVERLAP</span>
                </div>
                <span className="text-muted text-[11px]">
                  VIGOR 03 arrives before B01 clearance · Slow steam or anchorage hold required
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-line flex items-center justify-between text-xs text-muted">
            <span>Berth B01 Turnaround Window</span>
            <span className="font-semibold text-foreground">36h Operational Target</span>
          </div>
        </section>

        {/* =================================================================== */}
        {/* RIGHT: PRIORITY ISSUES (35% -> 4 columns)                           */}
        {/* =================================================================== */}
        <section
          id="section-priority-issues"
          className="lg:col-span-4 bg-surface rounded-xl border border-line p-5 shadow-2xs flex flex-col justify-between"
        >
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Priority Issues
              </span>
              <span className="text-xs font-bold text-danger">
                3 Active
              </span>
            </div>

            {/* Three Simple Rows (No cards inside cards, clean separators) */}
            <div className="divide-y divide-line">
              {/* Issue 1: Berth Conflict */}
              <div
                id="issue-berth-conflict"
                onClick={onNavigateToBerths}
                className="py-3.5 cursor-pointer hover:bg-surface -mx-2 px-2 rounded transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-critical shrink-0" />
                  <span className="text-xs font-bold tracking-tight text-danger">
                    BERTH CONFLICT
                  </span>
                </div>
                <div className="text-xs font-semibold text-foreground mt-1 group-hover:text-info transition-colors">
                  MV VIGOR 03 arrives before B01 clears
                </div>
                <div className="text-xs text-muted mt-0.5">
                  ~2h 30m overlap at anchorage
                </div>
              </div>

              {/* Issue 2: Fuel Reserve */}
              <div
                id="issue-fuel-reserve"
                onClick={onNavigateToAlerts}
                className="py-3.5 cursor-pointer hover:bg-surface -mx-2 px-2 rounded transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-warning-strong shrink-0" />
                  <span className="text-xs font-bold tracking-tight text-warning">
                    FUEL RESERVE
                  </span>
                </div>
                <div className="text-xs font-semibold text-foreground mt-1 group-hover:text-info transition-colors">
                  28% remaining
                </div>
                <div className="text-xs text-muted mt-0.5">
                  Below operating buffer (30% threshold)
                </div>
              </div>

              {/* Issue 3: Production Pace */}
              <div
                id="issue-production-pace"
                onClick={onNavigateToControlTower}
                className="py-3.5 cursor-pointer hover:bg-surface -mx-2 px-2 rounded transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-warning-strong shrink-0" />
                  <span className="text-xs font-bold tracking-tight text-warning">
                    PRODUCTION
                  </span>
                </div>
                <div className="text-xs font-semibold text-foreground mt-1 group-hover:text-info transition-colors">
                  18% behind today's target
                </div>
                <div className="text-xs text-muted mt-0.5">
                  2,450 T packed of 3,000 T plan
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-line text-xs text-muted flex items-center justify-between">
            <span>Click any issue to open operational view</span>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DashboardSummary;
