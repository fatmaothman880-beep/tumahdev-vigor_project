import { rotationInPeriod, RotationPeriod } from '../lib/rotationPeriod';
import React, { useState } from 'react';
import { useAppData } from '../hooks/useAppData';
import { PageHeader, KpiCard, Modal } from '../components/ui/KpiCard';
import { StatusBadge, OperationsHealthBadge } from '../components/ui/StatusBadge';
import {
  formatDateTime,
  formatTime,
  formatTonnage,
  formatRate,
} from '../lib/format';
import { Route, Plus, ArrowRight, Ship, Clock, CheckCircle2 } from 'lucide-react';

interface VoyagesProps {
  onSelectVessel: (vesselId: string) => void;
}

export function Voyages({ onSelectVessel }: VoyagesProps) {
  const { voyages, vessels, manufacturers = [], api } = useAppData();
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [period, setPeriod] = useState<RotationPeriod>('DAY');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [manufacturerId, setManufacturerId] = useState('mtwara');

  // New Voyage form
  const [vesselId, setVesselId] = useState('v-01');
  const [voyageNum, setVoyageNum] = useState('VG-2026-085');
  const [origin, setOrigin] = useState('Mtwara Cement Factory');
  const [destination, setDestination] = useState('Mangapwani Berth');
  const [plannedCargo, setPlannedCargo] = useState('9500');

  const filteredVoyages = voyages.filter((v) => {
    if (!rotationInPeriod(v.cycleStart || v.plannedUnloadStart, period, new Date(), from, to)) return false;
    if (filter === 'ACTIVE') return v.status === 'ACTIVE';
    if (filter === 'COMPLETED') return v.status === 'COMPLETED';
    return true;
  });

  const handleCreateVoyage = (e: React.FormEvent) => {
    e.preventDefault();
    const selVessel = vessels.find((v) => v.id === vesselId);
    if (!selVessel) return;

    const now = new Date();
    const plannedUnload = new Date(now.getTime() + 16 * 3600000).toISOString();
    const mfrEta = new Date(now.getTime() + 32 * 3600000).toISOString();

    api.addVoyage({
      vesselId: selVessel.id,
      vesselName: selVessel.name,
      voyageNumber: voyageNum.trim(),
      status: 'ACTIVE',
      currentStage: 'UNLOADING',
      cargoType: 'Bulk Portland Cement CEM I 42.5R',
      plannedCargoT: Number(plannedCargo) || 9500,
      actualCargoT: Number(plannedCargo) || 9500,
      unloadedTonnes: 0,
      unloadingRateTph: 600,
      plannedUnloadStart: now.toISOString(),
      plannedUnloadEnd: plannedUnload,
      forecastUnloadEnd: plannedUnload,
      postUnloadBufferHours: 1.5,
      expectedBerthRelease: new Date(new Date(plannedUnload).getTime() + 1.5 * 3600000).toISOString(),
      assignedBerthId: 'B01',
      manufacturerId,
      manufacturerName: manufacturers.find(m => m.id === manufacturerId)?.name || 'Mtwara Cement Factory',
      cycleStart: now.toISOString(),
      fuelRequired: false,
      outboundDeparturePlanned: plannedUnload,
      outboundDepartureForecast: plannedUnload,
      manufacturerSlotPlanned: mfrEta,
      manufacturerLoadingEndForecast: new Date(now.getTime() + 60 * 3600000).toISOString(),
      manufacturerDeparturePlanned: new Date(now.getTime() + 62 * 3600000).toISOString(),
      manufacturerDepartureForecast: new Date(now.getTime() + 62 * 3600000).toISOString(),
      returnEtaPlanned: new Date(now.getTime() + 94 * 3600000).toISOString(),
      returnEtaForecast: new Date(now.getTime() + 94 * 3600000).toISOString(),
      blockerDescription: '',
      berthConflict: false,
      predictedAnchorageWaitHours: 0,
      manufacturerEtaPlanned: mfrEta,
      manufacturerEtaForecast: mfrEta,
      manufacturerSlotForecast: new Date(new Date(mfrEta).getTime() + 12 * 3600000).toISOString(),
      origin: origin.trim(),
      destination: destination.trim(),
      health: 'HEALTHY',
      risk: 'LOW',
      currentBlocker: 'NONE',
    });

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="VOYAGE OPERATIONS"
        title="Voyage Rotations"
        description="Comprehensive cycle history across Zanzibar discharge, coastal transit, manufacturer loading, and return logistics."
      >
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0C9349] hover:bg-[#0A7A3D] text-white flex items-center gap-1.5 transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Initiate New Voyage Rotation
        </button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <label>Rotation period <select aria-label="Rotation period" value={period} onChange={e => setPeriod(e.target.value as RotationPeriod)} className="p-2 border rounded-lg bg-white">
          <option value="DAY">Today</option><option value="WEEK">This week</option><option value="MONTH">This month</option><option value="YEAR">This year</option><option value="ALL">All time</option><option value="CUSTOM">Custom dates</option>
        </select></label>
        {period === 'CUSTOM' && <><label>From <input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label><label>To <input type="date" min={from} value={to} onChange={e => setTo(e.target.value)} /></label></>}
        <span>{filteredVoyages.length} rotations · cycle start date · EAT (week starts Monday)</span>
      </div>
      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filter === tab
                ? 'bg-[#14181A] text-white'
                : 'bg-white text-[#3F4A47] border border-[#E1DED4] hover:bg-[#F7F5F0]'
            }`}
          >
            {tab} Rotations
          </button>
        ))}
      </div>

      {/* Voyage Cards List */}
      <div className="space-y-4">
        {filteredVoyages.length === 0 && <p className="p-6 bg-white border rounded-xl text-sm">No rotations match this period and status.</p>}
        {filteredVoyages.map((voyage) => (
          <div
            key={voyage.id}
            onClick={() => onSelectVessel(voyage.vesselId)}
            className="bg-white border border-[#E1DED4] rounded-xl p-5 hover:border-[#3F4A47] transition cursor-pointer shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-[#0C9349] bg-[#E7F4EB] px-2 py-0.5 rounded">
                  {voyage.voyageNumber}
                </span>
                <h3 className="text-base font-bold text-[#14181A] flex items-center gap-1.5">
                  <Ship className="w-4 h-4 text-[#3F4A47]" />
                  {voyage.vesselName}
                </h3>
                <StatusBadge stage={voyage.currentStage} />
                <OperationsHealthBadge health={voyage.health} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-[#3F4A47]">
                <div>
                  <span className="text-[10px] text-[#3F4A47] uppercase block font-sans">Route</span>
                  <span className="font-semibold text-[#14181A]">
                    {voyage.origin} → {voyage.destination}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#3F4A47] uppercase block font-sans">Cargo</span>
                  <span className="font-semibold text-[#14181A]">
                    {formatTonnage(voyage.actualCargoT || voyage.plannedCargoT)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#3F4A47] uppercase block font-sans">Unloaded</span>
                  <span className="font-semibold text-[#0A7A3D]">
                    {voyage.unloadedTonnes.toLocaleString()} T
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#3F4A47] uppercase block font-sans">Mangapwani Berth Release</span>
                  <span className="font-semibold text-[#14181A]">
                    {formatTime(voyage.expectedBerthRelease)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-center">
              <span className="text-xs text-[#0A7A3D] font-semibold flex items-center gap-1">
                View Cycle Console <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Initiate New Voyage */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Initiate New Voyage Rotation"
        subtitle="Schedule a new round-trip cement rotation cycle."
      >
        <form onSubmit={handleCreateVoyage} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#14181A] mb-1">Select Vessel *</label>
            <select
              value={vesselId}
              onChange={(e) => setVesselId(e.target.value)}
              className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg"
            >
              {vessels.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.reference})
                </option>
              ))}
            </select>
          </div>

          <label className="block font-semibold">Manufacturer / Works
            <select value={manufacturerId} onChange={e => { setManufacturerId(e.target.value); setOrigin(manufacturers.find(m => m.id === e.target.value)?.works || ''); }} className="w-full p-2 border rounded-lg">
              {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name} · {m.works}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#14181A] mb-1">Voyage Number *</label>
              <input
                type="text"
                required
                value={voyageNum}
                onChange={(e) => setVoyageNum(e.target.value)}
                className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#14181A] mb-1">Planned Cargo (T) *</label>
              <input
                type="number"
                required
                value={plannedCargo}
                onChange={(e) => setPlannedCargo(e.target.value)}
                className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#14181A] mb-1">Origin Port</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#14181A] mb-1">Destination Port</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#E1DED4] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-white border border-[#E1DED4] text-[#3F4A47] font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#0C9349] hover:bg-[#0A7A3D] text-white font-semibold shadow-xs"
            >
              Start Voyage
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
