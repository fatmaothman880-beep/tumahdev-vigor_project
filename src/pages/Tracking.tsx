import React, { useState } from 'react';
import { useAppData } from '../hooks/useAppData';
import { PageHeader, KpiCard } from '../components/ui/KpiCard';
import { DataQualityBadge, StatusBadge } from '../components/ui/StatusBadge';
import {
  formatCoordinates,
  formatDateTime,
  formatTime,
} from '../lib/format';
import {
  MapPinned,
  Ship,
  Compass,
  Navigation,
  RefreshCw,
  Anchor,
  Radio,
  Clock,
  Layers,
} from 'lucide-react';

interface TrackingProps {
  onSelectVessel: (vesselId: string) => void;
}

export function Tracking({ onSelectVessel }: TrackingProps) {
  const { vessels, voyages, vesselPositions, api } = useAppData();
  const [selectedVesselId, setSelectedVesselId] = useState<string>('v-02');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedPosition = vesselPositions.find((p) => p.vesselId === selectedVesselId);
  const selectedVessel = vessels.find((v) => v.id === selectedVesselId);
  const selectedVoyage = voyages.find((v) => v.vesselId === selectedVesselId && v.status === 'ACTIVE');

  // Handle simulation ping
  const handleSimulatePing = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Advance positions slightly
      vesselPositions.forEach((p) => {
        if (p.speedKnots > 0) {
          // move slightly
          api.updateVesselPosition(p.vesselId, {
            latitude: p.latitude + (Math.random() * 0.02 - 0.01),
            longitude: p.longitude + (Math.random() * 0.02 - 0.01),
            timestamp: new Date().toISOString(),
            dataQuality: 'CURRENT',
          });
        }
      });
      setIsRefreshing(false);
    }, 400);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="TELEMETRY & AIS"
        title="Live Vessel Tracking"
        description="Real-time coastal positioning across the Zanzibar Channel, Pemba Passage, and Tanga approaches."
      >
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulatePing}
            disabled={isRefreshing}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-[#C9C4B6] hover:border-[#14181A] text-[#14181A] flex items-center gap-2 transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#0C9349] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Poll Telemetry AIS</span>
          </button>
        </div>
      </PageHeader>

      {/* Top Telemetry KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Tracked Vessels"
          value={`${vesselPositions.length} / ${vessels.length}`}
          subtext="AIS transponders active"
          icon={<Ship className="w-5 h-5" />}
          variant="success"
        />
        <KpiCard
          label="Telemetry Integrity"
          value="100%"
          subtext="All feeds current & live"
          icon={<Radio className="w-5 h-5" />}
          variant="teal"
        />
        <KpiCard
          label="Fastest In Transit"
          value="11.2 kts"
          subtext="MV VIGOR 03 · Pemba Channel"
          icon={<Compass className="w-5 h-5" />}
        />
        <KpiCard
          label="Default Source"
          value="AIS + Geo"
          subtext="With dead-reckoning fallback"
          icon={<MapPinned className="w-5 h-5" />}
        />
      </div>

      {/* Main Map & Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coastal Map Viewport */}
        <div className="lg:col-span-2 bg-[#14181A] rounded-xl border border-[#3F4A47] p-5 relative overflow-hidden flex flex-col justify-between min-h-[460px] text-white">
          {/* Map Header Overlay */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2 bg-[#14181A]/80 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-[#3F4A47]/60">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0C9349] animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-wider">
                EAST AFRICA MARITIME CORRIDOR
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#C9C4B6] bg-[#14181A]/80 px-2.5 py-1 rounded border border-[#3F4A47]/60">
              Zanzibar Channel (05°–06°S / 39°E)
            </div>
          </div>

          {/* Stylized Coastal SVG Map */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <svg
              className="w-full h-full text-[#3F4A47]"
              viewBox="0 0 800 500"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              {/* Mainland Tanzania Coastline */}
              <path
                d="M 120 20 Q 150 100 130 180 T 160 300 Q 170 380 140 480"
                stroke="#0C9349"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              <text x="50" y="80" fill="#C9C4B6" fontSize="12" fontFamily="monospace">
                Tanzania Mainland
              </text>
              <text x="60" y="110" fill="#0C9349" fontSize="11" fontWeight="bold">
                ● Tanga Port (Mamba)
              </text>
              <text x="60" y="440" fill="#C9C4B6" fontSize="11">
                ● Dar es Salaam
              </text>

              {/* Pemba Island */}
              <path
                d="M 460 60 Q 500 100 480 150 T 450 170 Z"
                fill="#242C2A"
                stroke="#3F4A47"
              />
              <text x="490" y="110" fill="#C9C4B6" fontSize="11">
                Pemba Island
              </text>

              {/* Zanzibar Island (Unguja) */}
              <path
                d="M 430 240 Q 470 290 460 380 T 420 400 Q 390 350 400 280 Z"
                fill="#242C2A"
                stroke="#3F4A47"
              />
              <text x="480" y="320" fill="#C9C4B6" fontSize="11">
                Zanzibar (Unguja)
              </text>
              <text x="360" y="305" fill="#0C9349" fontSize="11" fontWeight="bold">
                ★ VIGOR Berth B01 (Malindi)
              </text>

              {/* Shipping lanes */}
              <path
                d="M 160 115 Q 300 200 410 300"
                stroke="#0E7C86"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            </svg>
          </div>

          {/* Interactive Vessel Pins on the Map */}
          <div className="relative z-10 w-full h-full flex items-center justify-center my-6">
            {/* Vessel 1 Pin: At Berth B01 */}
            <div
              onClick={() => setSelectedVesselId('v-01')}
              className="absolute left-[47%] top-[60%] cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 bg-[#0C9349] text-white px-2 py-1 rounded-md text-[11px] font-mono font-bold shadow-lg border border-white/20 group-hover:scale-105 transition">
                <Anchor className="w-3 h-3" />
                <span>VIGOR 01 (Berth B01)</span>
              </div>
              <div className="text-[9px] font-mono text-center text-[#C9C4B6] bg-black/80 rounded px-1 mt-0.5">
                0.0 kts · Moored
              </div>
            </div>

            {/* Vessel 2 Pin: Sailing to Tanga */}
            <div
              onClick={() => setSelectedVesselId('v-02')}
              className="absolute left-[38%] top-[34%] cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 bg-[#0E7C86] text-white px-2 py-1 rounded-md text-[11px] font-mono font-bold shadow-lg border border-white/20 group-hover:scale-105 transition">
                <Navigation className="w-3 h-3 rotate-45" />
                <span>VIGOR 02 (Northbound)</span>
              </div>
              <div className="text-[9px] font-mono text-center text-[#C9C4B6] bg-black/80 rounded px-1 mt-0.5">
                10.8 kts · 345° NNW
              </div>
            </div>

            {/* Vessel 3 Pin: Returning to Zanzibar */}
            <div
              onClick={() => setSelectedVesselId('v-03')}
              className="absolute left-[30%] top-[45%] cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 bg-[#AE3B2E] text-white px-2 py-1 rounded-md text-[11px] font-mono font-bold shadow-lg border border-white/20 group-hover:scale-105 transition">
                <Navigation className="w-3 h-3 rotate-[160deg]" />
                <span>VIGOR 03 (Southbound)</span>
              </div>
              <div className="text-[9px] font-mono text-center text-[#C9C4B6] bg-black/80 rounded px-1 mt-0.5">
                11.2 kts · 162° SSE
              </div>
            </div>
          </div>

          {/* Map Footer Legend */}
          <div className="flex items-center justify-between text-[11px] font-mono text-[#C9C4B6] bg-[#14181A]/90 p-2 rounded-lg border border-[#3F4A47]/60 z-10">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0C9349]" /> Unloading (B01)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0E7C86]" /> Northbound (Sailing)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#AE3B2E]" /> Southbound (Returning)
              </span>
            </div>
            <span>Click any marker to inspect telemetry</span>
          </div>
        </div>

        {/* Selected Vessel Telemetry Detail Card */}
        <div className="bg-white border border-[#E1DED4] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E1DED4] mb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#3F4A47]">Selected Vessel</span>
                <h3 className="text-base font-bold text-[#14181A]">{selectedVessel?.name}</h3>
                <span className="text-xs font-mono text-[#3F4A47]">
                  Ref: {selectedVessel?.reference} · IMO {selectedVessel?.imo || 'N/A'}
                </span>
              </div>
              {selectedPosition && <DataQualityBadge quality={selectedPosition.dataQuality} />}
            </div>

            {selectedPosition ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#F7F5F0] rounded-lg border border-[#E1DED4] space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#3F4A47]">GPS Coordinates:</span>
                    <span className="font-bold text-[#14181A]">
                      {formatCoordinates(selectedPosition.latitude, selectedPosition.longitude)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#3F4A47]">Speed Over Ground:</span>
                    <span className="font-bold text-[#0C9349]">
                      {selectedPosition.speedKnots.toFixed(1)} Knots
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#3F4A47]">Heading / Course:</span>
                    <span className="font-bold text-[#14181A]">
                      {selectedPosition.heading}° ({selectedPosition.course})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#3F4A47]">Distance to Port:</span>
                    <span className="font-bold text-[#0E7C86]">
                      {selectedPosition.distanceRemainingNm.toFixed(1)} NM
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#F7F5F0] rounded-lg border border-[#E1DED4] space-y-1 text-xs">
                  <div className="flex justify-between font-mono">
                    <span className="text-[#3F4A47]">Destination ETA:</span>
                    <span className="font-bold text-[#14181A]">
                      {formatDateTime(selectedPosition.etaDestination)}
                    </span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px] text-[#3F4A47]">
                    <span>Last Telemetry Packet:</span>
                    <span>{formatTime(selectedPosition.timestamp)} EAT</span>
                  </div>
                </div>

                {selectedVoyage && (
                  <div className="pt-2 border-t border-[#E1DED4]">
                    <span className="text-[10px] text-[#3F4A47] uppercase font-bold block mb-1">Active Cycle</span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#14181A]">{selectedVoyage.voyageNumber}</span>
                      <StatusBadge stage={selectedVoyage.currentStage} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-[#F7F5F0] rounded-lg text-xs text-[#3F4A47]">
                No position data available for this vessel.
              </div>
            )}
          </div>

          <button
            onClick={() => onSelectVessel(selectedVesselId)}
            className="mt-4 w-full py-2 px-3 text-xs font-semibold rounded-lg bg-[#0C9349] hover:bg-[#0A7A3D] text-white transition text-center shadow-xs"
          >
            Open Single-Vessel Console
          </button>
        </div>
      </div>

      {/* Fleet Telemetry Log Table */}
      <div className="bg-white border border-[#E1DED4] rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#14181A] mb-3">
          Active Fleet Telemetry Stream
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-[#F7F5F0] border-b border-[#E1DED4] text-[#3F4A47] font-semibold text-[11px] uppercase">
                <th className="py-2.5 px-3">Vessel</th>
                <th className="py-2.5 px-3">Coordinates</th>
                <th className="py-2.5 px-3">Speed</th>
                <th className="py-2.5 px-3">Course</th>
                <th className="py-2.5 px-3">Distance Rem.</th>
                <th className="py-2.5 px-3">Quality</th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 px-3">Last Ping</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1DED4]">
              {vesselPositions.map((pos) => {
                const v = vessels.find((ves) => ves.id === pos.vesselId);
                return (
                  <tr
                    key={pos.id}
                    onClick={() => {
                      setSelectedVesselId(pos.vesselId);
                    }}
                    className="hover:bg-[#F7F5F0]/70 cursor-pointer text-[11px]"
                  >
                    <td className="py-2.5 px-3 font-sans font-bold text-[#14181A]">
                      {v?.name || pos.vesselId}
                    </td>
                    <td className="py-2.5 px-3 text-[#14181A]">
                      {formatCoordinates(pos.latitude, pos.longitude)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#0C9349]">
                      {pos.speedKnots.toFixed(1)} kts
                    </td>
                    <td className="py-2.5 px-3">{pos.course}</td>
                    <td className="py-2.5 px-3 text-[#0E7C86] font-semibold">
                      {pos.distanceRemainingNm.toFixed(1)} NM
                    </td>
                    <td className="py-2.5 px-3">
                      <DataQualityBadge quality={pos.dataQuality} />
                    </td>
                    <td className="py-2.5 px-3 text-[#3F4A47]">{pos.source}</td>
                    <td className="py-2.5 px-3 text-[#3F4A47]">{formatTime(pos.timestamp)} EAT</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
