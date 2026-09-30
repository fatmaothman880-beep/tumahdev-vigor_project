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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [simulationMode, setSimulationMode] = useState<'SINGLE_BERTH' | 'DUAL_BERTH'>('SINGLE_BERTH');

  // Add Berth Form State
  const [berthId, setBerthId] = useState('B03');
  const [berthName, setBerthName] = useState('VIGOR Bulk Berth 03');
  const [berthLocation, setBerthLocation] = useState('Zanzibar Port · Malindi North Pier');
  const [berthLength, setBerthLength] = useState('220');
  const [berthRate, setBerthRate] = useState('800');
  const [berthNotes, setBerthNotes] = useState('');

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

  const handleAddBerth = (e: React.FormEvent) => {
    e.preventDefault();
    api.addBerth({
      id: berthId.trim(),
      name: berthName.trim(),
      location: berthLocation.trim(),
      type: 'Bulk Cement Dedicated',
      lengthM: Number(berthLength) || 200,
      defaultUnloadingRate: Number(berthRate) || 700,
      operationalHours: '24/7 Operations',
      status: 'PLANNED',
      availableFrom: '2027-12-01T00:00:00Z',
      notes: berthNotes.trim() || 'Future terminal quay expansion',
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="PORT INFRASTRUCTURE"
        title="Mangapwani Berth Operations"
        description="Pneumatic bulk cement discharge quay at Mangapwani terminal. Monitors single-berth bottleneck, dynamic vessel sequencing, and anchorage waiting forecasts."
      >
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-surface border border-line hover:border-line text-foreground flex items-center gap-1.5 transition shadow-xs"
        >
          <Plus className="w-4 h-4 text-positive" />
          Configure Future Berth
        </button>
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
      <div className="bg-surface border-2 border-positive/40 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">Berth B01 · VIGOR Cement Berth</h2>
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-positive-soft text-positive rounded border border-positive/30">
                ACTIVE · SINGLE DEDICATED BERTH
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Zanzibar Port · Malindi Wharf Section B · 180m Length · 9.8m Max Draft · 45,000T Silo Manifold
            </p>
          </div>
          {currentOccupant && (
            <button
              onClick={() => onSelectVessel(currentOccupant.vesselId)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-shell hover:bg-raised text-white transition flex items-center gap-1.5 shrink-0"
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
                  <span className="text-[10px] text-muted uppercase font-bold">Currently Moored Alongside</span>
                  <h3 className="text-base font-bold text-foreground">{currentOccupant.vesselName}</h3>
                  <p className="text-xs text-muted">
                    Discharging {formatTonnage(currentOccupant.actualCargoT || 9600)} Bulk Portland Cement CEM I
                  </p>
                </div>
                <span className="text-xs font-mono text-positive font-bold bg-positive-soft px-2.5 py-1 rounded">
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
                <div className="p-2.5 bg-canvas rounded-lg border border-line">
                  <span className="text-[10px] text-muted uppercase font-bold block">Berthing Time</span>
                  <span className="font-mono font-bold text-foreground">
                    {formatTime(currentOccupant.actualUnloadStart || currentOccupant.plannedUnloadStart)}
                  </span>
                </div>
                <div className="p-2.5 bg-canvas rounded-lg border border-line">
                  <span className="text-[10px] text-muted uppercase font-bold block">Forecast Unload</span>
                  <span className="font-mono font-bold text-positive">
                    {formatTime(currentOccupant.forecastUnloadEnd)}
                  </span>
                </div>
                <div className="p-2.5 bg-canvas rounded-lg border border-line">
                  <span className="text-[10px] text-muted uppercase font-bold block">Purge Buffer</span>
                  <span className="font-mono font-bold text-foreground">
                    {currentOccupant.postUnloadBufferHours} hours
                  </span>
                </div>
                <div className="p-2.5 bg-canvas rounded-lg border border-line">
                  <span className="text-[10px] text-muted uppercase font-bold block">Berth Cleared</span>
                  <span className="font-mono font-bold text-info">
                    {formatTime(currentOccupant.expectedBerthRelease)}
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Next Arrival Conflict Analysis */}
            <div className="p-4 bg-canvas rounded-xl border border-line flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-muted">Next Arriving Rotation</span>
                  {nextVessel?.berthConflict ? (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-critical text-white rounded">
                      CONFLICT
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-brand text-white rounded">
                      CLEAR
                    </span>
                  )}
                </div>

                {nextVessel ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-foreground">{nextVessel.vesselName}</h4>
                    <p className="text-xs text-muted">
                      Returning from {nextVessel.manufacturerName || nextVessel.origin} with {formatTonnage(nextVessel.actualCargoT || 9400)} cement.
                    </p>

                    <div className="p-3 bg-surface rounded-lg border border-line space-y-1 text-xs">
                      <div className="flex justify-between font-mono">
                        <span className="text-muted">Return ETA:</span>
                        <span className="font-bold text-foreground">{formatDateTime(nextVessel.returnEtaForecast)}</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-muted">B01 Free At:</span>
                        <span className="font-bold text-positive">{formatTime(currentOccupant.expectedBerthRelease)}</span>
                      </div>
                      {nextVessel.berthConflict && (
                        <div className="pt-2 border-t border-line flex justify-between font-mono font-bold text-danger">
                          <span>Wait At Anchorage:</span>
                          <span>{formatHoursAndMinutes(nextVessel.predictedAnchorageWaitHours)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted">No immediate subsequent arrival queued.</div>
                )}
              </div>

              {nextVessel?.berthConflict && (
                <div className="mt-3 p-2 bg-danger-soft rounded text-[11px] text-danger">
                  <strong>Operational impact:</strong> Vessel must hold in Zanzibar anchorage zone Charlie until MV VIGOR 01 casts off.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-muted">
            Berth B01 is currently unoccupied and ready to accept incoming vessels.
          </div>
        )}
      </div>

      {/* 1-Berth vs 2-Berth Scenario Comparison Simulation (Part 99) */}
      <div className="bg-surface border border-line rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line mb-5">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-positive" />
              <h3 className="text-base font-bold text-foreground uppercase tracking-wide">
                1-Berth Current Reality vs. 2-Berth Expansion Scenario
              </h3>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Illustrative planning comparison for a future second berth. Scenario figures are assumptions, not measured results.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-canvas p-1 rounded-lg border border-line">
            <button
              onClick={() => setSimulationMode('SINGLE_BERTH')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition ${
                simulationMode === 'SINGLE_BERTH'
                  ? 'bg-shell text-white shadow-xs'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Current: 1 Active Berth
            </button>
            <button
              onClick={() => setSimulationMode('DUAL_BERTH')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition ${
                simulationMode === 'DUAL_BERTH'
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Scenario: 2 Active Berths
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-canvas rounded-xl border border-line">
            <span className="text-[10px] uppercase font-bold text-muted block mb-1">Berth Conflicts (Next 7D)</span>
            <div className="text-2xl font-mono font-bold">
              {simulationMode === 'SINGLE_BERTH' ? (
                <span className="text-danger">1 Conflict</span>
              ) : (
                <span className="text-positive">0 Conflicts</span>
              )}
            </div>
            <p className="text-[11px] text-muted mt-1">
              {simulationMode === 'SINGLE_BERTH'
                ? 'MV VIGOR 03 holds at anchorage'
                : 'Simultaneous discharge on B01 & B02'}
            </p>
          </div>

          <div className="p-4 bg-canvas rounded-xl border border-line">
            <span className="text-[10px] uppercase font-bold text-muted block mb-1">Total Anchorage Idle Time</span>
            <div className="text-2xl font-mono font-bold">
              {simulationMode === 'SINGLE_BERTH' ? (
                <span className="text-danger">2.7 Hours</span>
              ) : (
                <span className="text-positive">0.0 Hours</span>
              )}
            </div>
            <p className="text-[11px] text-muted mt-1">
              {simulationMode === 'SINGLE_BERTH'
                ? 'Auxiliary engine fuel burn: ~$1,400'
                : 'Direct berthing on arrival'}
            </p>
          </div>

          <div className="p-4 bg-canvas rounded-xl border border-line">
            <span className="text-[10px] uppercase font-bold text-muted block mb-1">Monthly Fleet Throughput</span>
            <div className="text-2xl font-mono font-bold text-foreground">
              {simulationMode === 'SINGLE_BERTH' ? '76,800 T' : '124,000 T'}
            </div>
            <p className="text-[11px] text-muted mt-1">
              {simulationMode === 'SINGLE_BERTH' ? 'Constrained by B01 clearance' : '+61% cargo throughput capacity'}
            </p>
          </div>

          <div className="p-4 bg-canvas rounded-xl border border-line">
            <span className="text-[10px] uppercase font-bold text-muted block mb-1">Average Turnaround Time</span>
            <div className="text-2xl font-mono font-bold text-info">
              {simulationMode === 'SINGLE_BERTH' ? '18.5 Hours' : '15.2 Hours'}
            </div>
            <p className="text-[11px] text-muted mt-1">
              Port stay efficiency improvement: 3.3h
            </p>
          </div>
        </div>
      </div>

      {/* Configured Berths List (Showing B01 and planned B02) */}
      <div className="bg-surface border border-line rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
          All Port Berths & Future Quay Expansions ({berths.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {berths.map((b) => (
            <div
              key={b.id}
              className={`p-4 rounded-xl border ${
                b.status === 'ACTIVE'
                  ? 'bg-surface border-positive/40'
                  : 'bg-canvas border-line opacity-85'
              } flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Anchor className="w-4 h-4 text-positive" />
                    <h4 className="text-sm font-bold text-foreground">{b.name}</h4>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      b.status === 'ACTIVE'
                        ? 'bg-positive-soft text-positive border border-positive/30'
                        : 'bg-raised text-muted'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
                <p className="text-xs text-muted mb-3">{b.location}</p>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 bg-surface rounded border border-line">
                    <span className="text-muted text-[10px] uppercase block">Length</span>
                    <span className="font-bold text-foreground">{b.lengthM}m</span>
                  </div>
                  <div className="p-2 bg-surface rounded border border-line">
                    <span className="text-muted text-[10px] uppercase block">Unload Rating</span>
                    <span className="font-bold text-foreground">{b.defaultUnloadingRate} t/h</span>
                  </div>
                </div>

                {b.notes && (
                  <p className="text-[11px] text-muted mt-3 leading-relaxed">
                    {b.notes}
                  </p>
                )}
              </div>

              {b.status === 'PLANNED' && b.availableFrom && (
                <div className="mt-3 pt-2 border-t border-line text-[11px] font-mono text-warning flex items-center justify-between">
                  <span>Planned Commissioning:</span>
                  <span className="font-bold">{formatDateTime(b.availableFrom).slice(0, 11)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Berth Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Configure Future Berth Expansion"
        subtitle="Add a planned berth to simulate dual-quay operations and infrastructure planning."
      >
        <form onSubmit={handleAddBerth} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">Berth ID *</label>
              <input
                type="text"
                required
                value={berthId}
                onChange={(e) => setBerthId(e.target.value)}
                className="w-full p-2 bg-canvas border border-line rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-foreground mb-1">Quay Length (meters) *</label>
              <input
                type="number"
                required
                value={berthLength}
                onChange={(e) => setBerthLength(e.target.value)}
                className="w-full p-2 bg-canvas border border-line rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Berth Name *</label>
            <input
              type="text"
              required
              value={berthName}
              onChange={(e) => setBerthName(e.target.value)}
              className="w-full p-2 bg-canvas border border-line rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Location Details</label>
            <input
              type="text"
              value={berthLocation}
              onChange={(e) => setBerthLocation(e.target.value)}
              className="w-full p-2 bg-canvas border border-line rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Default Unloading Rate (t/h)</label>
            <input
              type="number"
              value={berthRate}
              onChange={(e) => setBerthRate(e.target.value)}
              className="w-full p-2 bg-canvas border border-line rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Masterplan Expansion Notes</label>
            <textarea
              rows={2}
              value={berthNotes}
              onChange={(e) => setBerthNotes(e.target.value)}
              className="w-full p-2 bg-canvas border border-line rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-line flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-surface border border-line text-muted font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white font-semibold shadow-xs"
            >
              Save Planned Berth
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
