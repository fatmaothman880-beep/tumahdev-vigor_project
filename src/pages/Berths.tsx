import React, { useState } from 'react';
import { useAppData } from '../hooks/useAppData';
import { PageHeader, KpiCard, Modal } from '../components/ui/KpiCard';
import { StatusBadge, DataQualityBadge } from '../components/ui/StatusBadge';
import { DualProgress } from '../components/ui/DualProgress';
import {
  formatDateTime,
  formatTime,
  formatTonnage,
  formatHoursAndMinutes,
  formatRate,
} from '../lib/format';
import {
  Anchor,
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle2,
  Ship,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Berth } from '../types';

interface BerthsProps {
  onSelectVessel: (vesselId: string) => void;
}

export function Berths({ onSelectVessel }: BerthsProps) {
  const { berths, voyages, vessels, systemSettings, api } = useAppData();
  // Primary active berth
  const b01 = berths.find((b) => b.id === 'B01');
  const currentOccupant = voyages.find(
    (v) => v.assignedBerthId === 'B01' && (v.currentStage === 'UNLOADING' || v.currentStage === 'BERTHED_AT_VIGOR')
  );

  // Upcoming vessel arrivals to VIGOR
  const upcomingArrivals = voyages
    .filter(
      (v) =>
        v.assignedBerthId === 'B01' &&
        v.id !== currentOccupant?.id &&
        v.status === 'ACTIVE'
    )
    .sort(
      (a, b) =>
        new Date(a.returnEtaForecast).getTime() - new Date(b.returnEtaForecast).getTime()
    );

  const nextVessel = upcomingArrivals[0];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="PORT INFRASTRUCTURE"
        title="Mangapwani Berth Operations"
        description="Pneumatic bulk cement discharge quay at Mangapwani terminal. Monitors single-berth bottleneck, dynamic vessel sequencing, and anchorage waiting forecasts."
      >
      </PageHeader>

      {/* Top Berth KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Cement Berths"
          value="1 / 2"
          subtext="Berth B01 100% committed"
          icon={<Anchor className="w-5 h-5" />}
          variant="success"
        />
        <KpiCard
          label="Current Occupant"
          value={currentOccupant ? currentOccupant.vesselName : 'None'}
          subtext={`Unloading ${formatRate(currentOccupant?.unloadingRateTph || 605)}`}
          icon={<Ship className="w-5 h-5" />}
          variant="teal"
          onClick={() => currentOccupant && onSelectVessel(currentOccupant.vesselId)}
        />
        <KpiCard
          label="Berth Release Forecast"
          value={currentOccupant ? formatTime(currentOccupant.expectedBerthRelease) : '--:--'}
          subtext={`+${systemSettings.postUnloadBerthBufferHours}h buffer for manifold purge`}
          icon={<Clock className="w-5 h-5" />}
        />
        <KpiCard
          label="Anchorage Holding Risk"
          value={nextVessel?.berthConflict ? `${nextVessel.predictedAnchorageWaitHours}h wait` : 'None'}
          subtext={nextVessel?.vesselName || 'Next rotation'}
          icon={<AlertTriangle className="w-5 h-5" />}
          variant={nextVessel?.berthConflict ? 'danger' : 'success'}
        />
      </div>

      {/* Primary Berth B01 Live Status Card */}
      <div className="bg-white border-2 border-[#0C9349]/40 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E1DED4] mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#14181A]">Mangapwani Berth</h2>
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[#E7F4EB] text-[#0A7A3D] rounded border border-[#0C9349]/30">
                ACTIVE · SINGLE DEDICATED BERTH
              </span>
            </div>
            <p className="text-xs text-[#3F4A47] mt-0.5">
              Mangapwani, Zanzibar · 180m Length · 9.8m Max Draft · 45,000T Silo Manifold
            </p>
          </div>
          {currentOccupant && (
            <button
              onClick={() => onSelectVessel(currentOccupant.vesselId)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#14181A] hover:bg-[#3F4A47] text-white transition flex items-center gap-1.5 shrink-0"
            >
              Open Vessel Control <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {currentOccupant ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Current Vessel & Progress */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#3F4A47] uppercase font-bold">Currently Moored Alongside</span>
                  <h3 className="text-base font-bold text-[#14181A]">{currentOccupant.vesselName}</h3>
                  <p className="text-xs text-[#3F4A47]">
                    Discharging {formatTonnage(currentOccupant.actualCargoT || 9600)} Bulk Portland Cement CEM I
                  </p>
                </div>
                <span className="text-xs font-mono text-[#0A7A3D] font-bold bg-[#E7F4EB] px-2.5 py-1 rounded">
                  Pneumatics Active (605 t/h)
                </span>
              </div>

              <DualProgress
                cargoProgress={(currentOccupant.unloadedTonnes / (currentOccupant.actualCargoT || 9600)) * 100}
                scheduleProgress={72}
                unloadedT={currentOccupant.unloadedTonnes}
                totalCargoT={currentOccupant.actualCargoT || 9600}
                rateTph={currentOccupant.unloadingRateTph}
                timeRemainingStr={formatHoursAndMinutes(
                  (currentOccupant.actualCargoT - currentOccupant.unloadedTonnes) / currentOccupant.unloadingRateTph
                )}
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div className="p-2.5 bg-[#F7F5F0] rounded-lg border border-[#E1DED4]">
                  <span className="text-[10px] text-[#3F4A47] uppercase font-bold block">Berthing Time</span>
                  <span className="font-mono font-bold text-[#14181A]">
                    {formatTime(currentOccupant.actualUnloadStart || currentOccupant.plannedUnloadStart)}
                  </span>
                </div>
                <div className="p-2.5 bg-[#F7F5F0] rounded-lg border border-[#E1DED4]">
                  <span className="text-[10px] text-[#3F4A47] uppercase font-bold block">Forecast Unload</span>
                  <span className="font-mono font-bold text-[#0A7A3D]">
                    {formatTime(currentOccupant.forecastUnloadEnd)}
                  </span>
                </div>
                <div className="p-2.5 bg-[#F7F5F0] rounded-lg border border-[#E1DED4]">
                  <span className="text-[10px] text-[#3F4A47] uppercase font-bold block">Purge Buffer</span>
                  <span className="font-mono font-bold text-[#14181A]">
                    {currentOccupant.postUnloadBufferHours} hours
                  </span>
                </div>
                <div className="p-2.5 bg-[#F7F5F0] rounded-lg border border-[#E1DED4]">
                  <span className="text-[10px] text-[#3F4A47] uppercase font-bold block">Berth Cleared</span>
                  <span className="font-mono font-bold text-[#0E7C86]">
                    {formatTime(currentOccupant.expectedBerthRelease)}
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Next Arrival Conflict Analysis */}
            <div className="p-4 bg-[#F7F5F0] rounded-xl border border-[#E1DED4] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-[#3F4A47]">Next Arriving Rotation</span>
                  {nextVessel?.berthConflict ? (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#AE3B2E] text-white rounded">
                      CONFLICT
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#0C9349] text-white rounded">
                      CLEAR
                    </span>
                  )}
                </div>

                {nextVessel ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-[#14181A]">{nextVessel.vesselName}</h4>
                    <p className="text-xs text-[#3F4A47]">
                      Returning from Mtwara with {formatTonnage(nextVessel.actualCargoT || 9400)} cement.
                    </p>

                    <div className="p-3 bg-white rounded-lg border border-[#E1DED4] space-y-1 text-xs">
                      <div className="flex justify-between font-mono">
                        <span className="text-[#3F4A47]">Return ETA:</span>
                        <span className="font-bold text-[#14181A]">{formatDateTime(nextVessel.returnEtaForecast)}</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-[#3F4A47]">B01 Free At:</span>
                        <span className="font-bold text-[#0A7A3D]">{formatTime(currentOccupant.expectedBerthRelease)}</span>
                      </div>
                      {nextVessel.berthConflict && (
                        <div className="pt-2 border-t border-[#E1DED4] flex justify-between font-mono font-bold text-[#AE3B2E]">
                          <span>Wait At Anchorage:</span>
                          <span>{formatHoursAndMinutes(nextVessel.predictedAnchorageWaitHours)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-[#3F4A47]">No immediate subsequent arrival queued.</div>
                )}
              </div>

              {nextVessel?.berthConflict && (
                <div className="mt-3 p-2 bg-[#F8E7E3] rounded text-[11px] text-[#AE3B2E]">
                  <strong>Operational impact:</strong> Vessel must hold in Zanzibar anchorage zone Charlie until MV VIGOR 01 casts off.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[#3F4A47]">
            Berth B01 is currently unoccupied and ready to accept incoming vessels.
          </div>
        )}
      </div>

      {/* Configured Mangapwani berth */}
      <div className="bg-white border border-[#E1DED4] rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#14181A] mb-3">
          Mangapwani Berth
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {berths.map((b) => (
            <div
              key={b.id}
              className={`p-4 rounded-xl border ${
                b.status === 'ACTIVE'
                  ? 'bg-white border-[#0C9349]/40'
                  : 'bg-[#F7F5F0] border-[#C9C4B6] opacity-85'
              } flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Anchor className="w-4 h-4 text-[#0C9349]" />
                    <h4 className="text-sm font-bold text-[#14181A]">{b.name}</h4>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      b.status === 'ACTIVE'
                        ? 'bg-[#E7F4EB] text-[#0A7A3D] border border-[#0C9349]/30'
                        : 'bg-[#E1DED4] text-[#3F4A47]'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
                <p className="text-xs text-[#3F4A47] mb-3">{b.location}</p>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 bg-white rounded border border-[#E1DED4]">
                    <span className="text-[#3F4A47] text-[10px] uppercase block">Length</span>
                    <span className="font-bold text-[#14181A]">{b.lengthM}m</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-[#E1DED4]">
                    <span className="text-[#3F4A47] text-[10px] uppercase block">Unload Rating</span>
                    <span className="font-bold text-[#14181A]">{b.defaultUnloadingRate} t/h</span>
                  </div>
                </div>

                {b.notes && (
                  <p className="text-[11px] text-[#3F4A47] mt-3 leading-relaxed">
                    {b.notes}
                  </p>
                )}
              </div>

              {b.status === 'PLANNED' && b.availableFrom && (
                <div className="mt-3 pt-2 border-t border-[#E1DED4] text-[11px] font-mono text-[#B5760F] flex items-center justify-between">
                  <span>Planned Commissioning:</span>
                  <span className="font-bold">{formatDateTime(b.availableFrom).slice(0, 11)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
