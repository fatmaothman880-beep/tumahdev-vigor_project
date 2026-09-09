import React from 'react';
import { useAppData } from '../hooks/useAppData';
import { PageHeader } from '../components/ui/KpiCard';
import { ControlTowerTimeline } from '../components/ui/ControlTowerTimeline';
import {
  formatDateTime,
  formatTime,
  formatCurrency,
  formatHoursAndMinutes,
} from '../lib/format';
import {
  Activity,
  Anchor,
  Clock,
  Fuel,
  CreditCard,
  Factory,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';

interface ControlTowerProps {
  onSelectVessel: (vesselId: string) => void;
  onNavigateToBerths: () => void;
  onNavigateToPayments: () => void;
}

export function ControlTower({
  onSelectVessel,
  onNavigateToBerths,
  onNavigateToPayments,
}: ControlTowerProps) {
  const {
    vessels,
    voyages,
    paymentAccounts,
    fuelOperations,
  } = useAppData();

  // Find active berth release
  const v1Voyage = voyages.find((v) => v.vesselId === 'v-01');
  const v3Voyage = voyages.find((v) => v.vesselId === 'v-03');

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="MULTI-VESSEL CONTROL CENTER"
        title="Operations Control Tower"
        description="Unified horizon scheduling across all VIGOR cement vessels. Tracks downstream dependencies: unloading pace dictates fuel timing, which controls departure, manufacturer arrival, queue eligibility, and subsequent return berthing."
      />

      {/* Main Interactive Gantt Horizon Timeline */}
      <ControlTowerTimeline
        vessels={vessels}
        voyages={voyages}
        payments={paymentAccounts}
        fuelOperations={fuelOperations}
        onSelectVessel={onSelectVessel}
      />

      {/* Grid of Key Operational Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. VIGOR Berth Allocation Stream */}
        <div className="bg-white border border-[#E1DED4] rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E1DED4] mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#14181A] flex items-center gap-2">
              <Anchor className="w-4 h-4 text-[#0C9349]" />
              VIGOR Berth B01 Allocation
            </h3>
            <span className="text-[10px] font-mono font-bold bg-[#E7F4EB] text-[#0A7A3D] px-2 py-0.5 rounded">
              ACTIVE
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#F7F5F0] rounded-lg border border-[#E1DED4]">
              <div className="text-[10px] text-[#3F4A47] uppercase font-bold">Current Occupant</div>
              <div className="text-sm font-bold text-[#14181A] mt-0.5">MV VIGOR 01</div>
              <div className="mt-1 text-[#3F4A47]">
                Pneumatic discharge: <strong>72% unloaded</strong> (605 t/h)
              </div>
              <div className="mt-1 flex justify-between font-mono text-[11px] pt-1 border-t border-[#E1DED4]">
                <span>Forecast Unload Finish:</span>
                <span className="font-bold text-[#14181A]">{formatTime(v1Voyage?.forecastUnloadEnd)}</span>
              </div>
              <div className="flex justify-between font-mono text-[11px] text-[#0A7A3D]">
                <span>Expected Berth Release:</span>
                <span className="font-bold">{formatTime(v1Voyage?.expectedBerthRelease)}</span>
              </div>
            </div>

            <div className="p-3 bg-[#F8E7E3]/60 rounded-lg border border-[#AE3B2E]/40">
              <div className="text-[10px] text-[#AE3B2E] uppercase font-bold flex items-center justify-between">
                <span>Next Returning Vessel</span>
                <span className="bg-[#AE3B2E] text-white px-1.5 py-0.2 rounded font-mono">CONFLICT</span>
              </div>
              <div className="text-sm font-bold text-[#14181A] mt-0.5">MV VIGOR 03</div>
              <div className="mt-1 text-[#3F4A47]">
                Forecast Arrival:{' '}
                <strong className="font-mono text-[#14181A]">{formatDateTime(v3Voyage?.returnEtaForecast)}</strong>
              </div>
              <div className="mt-2 text-xs text-[#AE3B2E] font-medium leading-relaxed">
                Arrives before Berth B01 is cleared. Expected anchorage wait:{' '}
                <strong>{formatHoursAndMinutes(v3Voyage?.predictedAnchorageWaitHours || 2.7)}</strong>.
              </div>
            </div>
          </div>
        </div>

        {/* 2. Fuel / Bunkering Window Stream */}
        <div className="bg-white border border-[#E1DED4] rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E1DED4] mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#14181A] flex items-center gap-2">
              <Fuel className="w-4 h-4 text-[#C99A5B]" />
              Bunkering Schedules
            </h3>
            <span className="text-[10px] font-mono font-bold bg-[#F4EBDB] text-[#B5760F] px-2 py-0.5 rounded">
              2 PLANNED
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {fuelOperations.map((fuel) => (
              <div key={fuel.id} className="p-3 bg-[#F7F5F0] rounded-lg border border-[#E1DED4] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#14181A]">
                    {fuel.vesselId === 'v-01' ? 'MV VIGOR 01' : 'MV VIGOR 03'}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      fuel.status === 'SCHEDULED'
                        ? 'bg-[#E7F4EB] text-[#0A7A3D]'
                        : 'bg-[#FBF0DD] text-[#B5760F]'
                    }`}
                  >
                    {fuel.status}
                  </span>
                </div>
                <div className="text-[#3F4A47]">
                  Supplier: <strong>{fuel.supplierName}</strong> ({fuel.quantity}T {fuel.fuelType})
                </div>
                <div className="flex justify-between font-mono text-[11px] pt-1 border-t border-[#E1DED4]">
                  <span>Window:</span>
                  <span className="font-medium text-[#14181A]">
                    {formatTime(fuel.scheduledStart)} - {formatTime(fuel.scheduledEnd)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Decision-Support Recommendations (Part 54) */}
        <div className="bg-white border border-[#E1DED4] rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E1DED4] mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#14181A] flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#B5760F]" />
              Decision-Support Options
            </h3>
            <span className="text-[10px] font-mono text-[#3F4A47]">ADVISORY ONLY</span>
          </div>

          <div className="space-y-2.5 text-xs text-[#3F4A47]">
            <div className="p-2.5 bg-[#FBF0DD]/70 rounded-lg border border-[#B5760F]/30">
              <div className="font-bold text-[#B5760F] flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Option A: Speed Reduction (Eco-Steaming)
              </div>
              <p className="leading-relaxed">
                Instruct MV VIGOR 03 to slow from 11.2 knots to 8.5 knots. This conserves ~1.8T bunker fuel and shifts arrival to synchronize directly with Berth B01 release, eliminating anchorage idle time.
              </p>
            </div>

            <div className="p-2.5 bg-[#F7F5F0] rounded-lg border border-[#E1DED4]">
              <div className="font-bold text-[#14181A] mb-1">
                Option B: Unloading Boost at B01
              </div>
              <p className="leading-relaxed">
                Engage secondary compressor booster on Silo Line 2 to raise discharge rate from 605 t/h to 660 t/h. Could advance berth release by 35 minutes.
              </p>
            </div>

            <div className="p-2.5 bg-[#F7F5F0] rounded-lg border border-[#E1DED4]">
              <div className="font-bold text-[#14181A] mb-1">
                Option C: Designated Anchorage Charlie
              </div>
              <p className="leading-relaxed">
                Hold MV VIGOR 03 at safe anchorage coordinates (06°05'S, 039°11'E) for approximately 2.7 hours until pilot boards for B01 berthing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
