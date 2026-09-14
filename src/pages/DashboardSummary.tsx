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
        className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-[#E8E6DF]"
      >
        <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-[#14181A]">
            Dashboard Summary
          </h1>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#AE3B2E]" />
            <span className="text-xs font-bold text-[#AE3B2E] tracking-wider uppercase">
              ATTENTION REQUIRED
            </span>
            <span className="text-xs text-[#7C8884]">· 3 priority issues</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-[#5A6764]">
          <span className="text-[#14181A] font-semibold">{dateFormatted}</span>
          <span className="text-[#C9C4B6]">·</span>
          <span className="text-[#0A7A3D] font-semibold">{shiftLabel}</span>
          <span className="text-[#C9C4B6]">·</span>
          <span>Updated {updatedTimeFormatted}</span>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. ONE HORIZONTAL KPI STRIP (Separated by subtle vertical dividers)   */}
      {/* ===================================================================== */}
      <section
        id="executive-kpi-strip"
        className="bg-white rounded-xl border border-[#E8E6DF] py-4 px-6 shadow-2xs"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#F0EFEB] gap-y-4 lg:gap-y-0">
          {/* KPI 1: PRODUCTION */}
          <div
            id="kpi-production"
            onClick={onNavigateToControlTower}
            className="cursor-pointer group lg:pr-6"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7C8884] block">
              Production
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-bold tracking-tight text-[#14181A] group-hover:text-[#0A7A3D] transition-colors">
                2,450
              </span>
              <span className="text-base font-normal text-[#7C8884]">T</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-[#5A6764]">82% of target</span>
              <span className="text-[#D1CFC7]">·</span>
              <span className="font-semibold text-[#B5760F]">↓ 18%</span>
            </div>
          </div>

          {/* KPI 2: DISPATCH */}
          <div
            id="kpi-dispatch"
            onClick={onNavigateToControlTower}
            className="cursor-pointer group lg:px-6 pt-3 lg:pt-0"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7C8884] block">
              Dispatch
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-bold tracking-tight text-[#14181A] group-hover:text-[#0A7A3D] transition-colors">
                1,850
              </span>
              <span className="text-base font-normal text-[#7C8884]">T</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-[#5A6764]">42 trucks</span>
              <span className="text-[#D1CFC7]">·</span>
              <span className="font-semibold text-[#0A7A3D]">✓ Normal</span>
            </div>
          </div>

          {/* KPI 3: FUEL (THE CRITICAL MATERIAL EXCEPTION) */}
          <div
            id="kpi-fuel"
            onClick={onNavigateToAlerts}
            className="cursor-pointer group lg:px-6 pt-3 lg:pt-0"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7C8884] block">
              Fuel
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-bold tracking-tight text-[#B5760F]">
                28%
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-[#5A6764]">Reserve</span>
              <span className="text-[#D1CFC7]">·</span>
              <span className="font-semibold text-[#B5760F]">⚠ Low</span>
            </div>
          </div>

          {/* KPI 4: BERTH */}
          <div
            id="kpi-berth"
            onClick={onNavigateToBerths}
            className="cursor-pointer group lg:pl-6 pt-3 lg:pt-0"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7C8884] block">
              Berth
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-bold tracking-tight text-[#14181A] group-hover:text-[#0E7C86] transition-colors">
                B01
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-[#5A6764]">Occupied</span>
              <span className="text-[#D1CFC7]">·</span>
              <span className="font-semibold text-[#14181A]">Until {v01DepartureTime}</span>
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
          className="lg:col-span-8 bg-white rounded-xl border border-[#E8E6DF] p-5 shadow-2xs flex flex-col justify-between"
        >
          <div>
            {/* Section Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEB]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5A6764]">
                Vessel & Berth Situation
              </span>
              <button
                onClick={onNavigateToBerths}
                className="text-xs font-semibold text-[#0E7C86] hover:text-[#14181A] inline-flex items-center gap-1 transition-colors"
              >
                Berth Planning <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Current vs Next Vessel Summary */}
            <div className="grid grid-cols-2 gap-6 pt-4 pb-5">
              {/* CURRENT VESSEL */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C8884]">
                  Current Vessel
                </span>
                <div className="text-lg font-bold text-[#14181A] mt-0.5">
                  MV VIGOR 01
                </div>
                <div className="text-xs font-medium text-[#0A7A3D] mt-0.5">
                  Berth B01 · Discharging
                </div>
                <div className="text-xs text-[#5A6764] mt-2.5">
                  Expected Departure:
                  <span className="font-bold text-[#14181A] ml-1">
                    {v01DepartureTime}
                  </span>
                </div>
              </div>

              {/* NEXT VESSEL */}
              <div className="border-l border-[#F0EFEB] pl-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C8884]">
                  Next Vessel
                </span>
                <div className="text-lg font-bold text-[#14181A] mt-0.5">
                  MV VIGOR 03
                </div>
                <div className="text-xs font-medium text-[#AE3B2E] mt-0.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Inbound from Tanga
                </div>
                <div className="text-xs text-[#5A6764] mt-2.5">
                  ETA:
                  <span className="font-bold text-[#AE3B2E] ml-1">
                    {v03EtaTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Schedule Conflict Timeline */}
            <div className="bg-[#FAF9F6] rounded-lg p-4 border border-[#E8E6DF]">
              <div className="flex items-center justify-between mb-3 text-[11px] font-mono text-[#7C8884]">
                <span>00:00</span>
                <span className="font-sans font-semibold text-[#AE3B2E]">01:31 (VIGOR 03 ETA)</span>
                <span className="font-sans font-semibold text-[#14181A]">04:09 (VIGOR 01 Dep)</span>
                <span>06:00</span>
              </div>

              {/* Timeline graphic */}
              <div className="space-y-2.5">
                {/* Row 1: Current Vessel (VIGOR 01) */}
                <div className="relative flex items-center">
                  <span className="w-24 text-[11px] font-semibold text-[#14181A] shrink-0">
                    MV VIGOR 01
                  </span>
                  <div className="flex-1 h-6 bg-[#E8E6DF] rounded relative overflow-hidden flex items-center px-2">
                    {/* Occupancy bar from 00:00 to 04:09 (~70% width) */}
                    <div className="absolute left-0 top-0 bottom-0 w-[70%] bg-[#0A7A3D] rounded flex items-center justify-between px-2.5 text-white text-[10px] font-semibold">
                      <span>Berth B01 Occupied</span>
                      <span>● Dep 04:09</span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Next Vessel (VIGOR 03) */}
                <div className="relative flex items-center">
                  <span className="w-24 text-[11px] font-semibold text-[#14181A] shrink-0">
                    MV VIGOR 03
                  </span>
                  <div className="flex-1 h-6 bg-[#E8E6DF] rounded relative overflow-hidden">
                    {/* Arrives at 01:31 (25% left position) */}
                    <div className="absolute left-[25%] top-0 bottom-0 w-[45%] bg-[#FDF2F0] border-l-2 border-[#AE3B2E] flex items-center justify-center text-[10px] font-bold text-[#AE3B2E] px-1">
                      <span>⚠ ~2h 38m Anchorage Hold</span>
                    </div>
                    {/* Can only berth after 04:09 */}
                    <div className="absolute left-[70%] top-0 bottom-0 right-0 bg-[#0E7C86]/20 border-l border-[#0E7C86] flex items-center px-2 text-[10px] font-semibold text-[#0E7C86]">
                      <span>B01 Available</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overlap Callout */}
              <div className="mt-3 pt-2.5 border-t border-[#E8E6DF] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#AE3B2E]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>BERTH CONFLICT: ~2h 38m SCHEDULE OVERLAP</span>
                </div>
                <span className="text-[#5A6764] text-[11px]">
                  VIGOR 03 arrives before B01 clearance · Slow steam or anchorage hold required
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-[#F0EFEB] flex items-center justify-between text-xs text-[#5A6764]">
            <span>Berth B01 Turnaround Window</span>
            <span className="font-semibold text-[#14181A]">36h Operational Target</span>
          </div>
        </section>

        {/* =================================================================== */}
        {/* RIGHT: PRIORITY ISSUES (35% -> 4 columns)                           */}
        {/* =================================================================== */}
        <section
          id="section-priority-issues"
          className="lg:col-span-4 bg-white rounded-xl border border-[#E8E6DF] p-5 shadow-2xs flex flex-col justify-between"
        >
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEB]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5A6764]">
                Priority Issues
              </span>
              <span className="text-xs font-bold text-[#AE3B2E]">
                3 Active
              </span>
            </div>

            {/* Three Simple Rows (No cards inside cards, clean separators) */}
            <div className="divide-y divide-[#F0EFEB]">
              {/* Issue 1: Berth Conflict */}
              <div
                id="issue-berth-conflict"
                onClick={onNavigateToBerths}
                className="py-3.5 cursor-pointer hover:bg-[#FAF9F6] -mx-2 px-2 rounded transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#AE3B2E] shrink-0" />
                  <span className="text-xs font-bold tracking-tight text-[#AE3B2E]">
                    BERTH CONFLICT
                  </span>
                </div>
                <div className="text-xs font-semibold text-[#14181A] mt-1 group-hover:text-[#0E7C86] transition-colors">
                  MV VIGOR 03 arrives before B01 clears
                </div>
                <div className="text-xs text-[#7C8884] mt-0.5">
                  ~2h 30m overlap at anchorage
                </div>
              </div>

              {/* Issue 2: Fuel Reserve */}
              <div
                id="issue-fuel-reserve"
                onClick={onNavigateToAlerts}
                className="py-3.5 cursor-pointer hover:bg-[#FAF9F6] -mx-2 px-2 rounded transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#B5760F] shrink-0" />
                  <span className="text-xs font-bold tracking-tight text-[#B5760F]">
                    FUEL RESERVE
                  </span>
                </div>
                <div className="text-xs font-semibold text-[#14181A] mt-1 group-hover:text-[#0E7C86] transition-colors">
                  28% remaining
                </div>
                <div className="text-xs text-[#7C8884] mt-0.5">
                  Below operating buffer (30% threshold)
                </div>
              </div>

              {/* Issue 3: Production Pace */}
              <div
                id="issue-production-pace"
                onClick={onNavigateToControlTower}
                className="py-3.5 cursor-pointer hover:bg-[#FAF9F6] -mx-2 px-2 rounded transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#B5760F] shrink-0" />
                  <span className="text-xs font-bold tracking-tight text-[#B5760F]">
                    PRODUCTION
                  </span>
                </div>
                <div className="text-xs font-semibold text-[#14181A] mt-1 group-hover:text-[#0E7C86] transition-colors">
                  18% behind today's target
                </div>
                <div className="text-xs text-[#7C8884] mt-0.5">
                  2,450 T packed of 3,000 T plan
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0EFEB] text-xs text-[#7C8884] flex items-center justify-between">
            <span>Click any issue to open operational view</span>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DashboardSummary;
