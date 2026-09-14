import React, { useState } from 'react';
import { useAppData } from '../hooks/useAppData';
import { PageHeader, KpiCard, Modal } from '../components/ui/KpiCard';
import { StatusBadge, OperationsHealthBadge } from '../components/ui/StatusBadge';
import { formatTonnage, formatDateTime } from '../lib/format';
import { Ship, Plus, Search, ArrowRight, Anchor, Navigation } from 'lucide-react';
import { Vessel } from '../types';

interface VesselsProps {
  onSelectVessel: (vesselId: string) => void;
}

export function Vessels({ onSelectVessel }: VesselsProps) {
  const { vessels, voyages, api } = useAppData();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states for new vessel
  const [newName, setNewName] = useState('');
  const [newImo, setNewImo] = useState('');
  const [newMmsi, setNewMmsi] = useState('');
  const [newRef, setNewRef] = useState('VG-V0');
  const [newCapacity, setNewCapacity] = useState('10000');
  const [newNotes, setNewNotes] = useState('');

  const filteredVessels = vessels.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.reference.toLowerCase().includes(search.toLowerCase()) ||
      v.imo?.includes(search)
  );

  const totalCapacity = vessels.reduce((acc, v) => acc + (v.capacityT || 0), 0);

  const handleAddVessel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    api.addVessel({
      name: newName.trim(),
      imo: newImo.trim() || undefined,
      mmsi: newMmsi.trim() || undefined,
      reference: newRef.trim() || `VG-V0${vessels.length + 1}`,
      active: true,
      capacityT: Number(newCapacity) || 10000,
      notes: newNotes.trim() || undefined,
    });

    setIsAddModalOpen(false);
    setNewName('');
    setNewImo('');
    setNewMmsi('');
    setNewNotes('');
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="FLEET MANAGEMENT"
        title="Vessels"
        description="VIGOR pneumatic bulk cement carriers assigned to continuous Zanzibar-mainland rotation cycles."
      >
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0C9349] hover:bg-[#0A7A3D] text-white flex items-center gap-1.5 transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Vessel Visit / Fleet Vessel
        </button>
      </PageHeader>

      {/* Fleet KPI overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Fleet Vessels"
          value={vessels.length}
          subtext="Active pneumatic carriers"
          icon={<Ship className="w-5 h-5" />}
          variant="success"
        />
        <KpiCard
          label="Total DWT Capacity"
          value={formatTonnage(totalCapacity)}
          subtext="Dry bulk cement rating"
          icon={<Anchor className="w-5 h-5" />}
          variant="teal"
        />
        <KpiCard
          label="Active Cycles"
          value={voyages.filter((v) => v.status === 'ACTIVE').length}
          subtext="Voyages in rotation"
          icon={<Navigation className="w-5 h-5" />}
        />
        <KpiCard
          label="Fleet Readiness"
          value="100%"
          subtext="No vessels in maintenance"
          variant="success"
        />
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-xl border border-[#E1DED4]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#3F4A47]" />
          <input
            type="text"
            placeholder="Search vessels by name, IMO, or reference ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F7F5F0] border border-[#E1DED4] rounded-lg focus:outline-none focus:border-[#0C9349] font-medium"
          />
        </div>
        <span className="text-xs text-[#3F4A47] font-mono">
          Showing {filteredVessels.length} of {vessels.length}
        </span>
      </div>

      {/* Vessels Table / Grid */}
      <div className="bg-white border border-[#E1DED4] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E1DED4] bg-[#F7F5F0] text-[#3F4A47] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Vessel & Reference</th>
                <th className="py-3 px-4">IMO / MMSI</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Current Cycle</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Health</th>
                <th className="py-3 px-4">Berth / ETA</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1DED4]">
              {filteredVessels.map((vessel) => {
                const voyage = voyages.find((v) => v.vesselId === vessel.id && v.status === 'ACTIVE');

                return (
                  <tr
                    key={vessel.id}
                    onClick={() => onSelectVessel(vessel.id)}
                    className="hover:bg-[#F7F5F0]/80 transition cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Ship className="w-4 h-4 text-[#0C9349]" />
                        <div>
                          <div className="font-bold text-[#14181A]">{vessel.name}</div>
                          <div className="text-[10px] font-mono text-[#3F4A47]">{vessel.reference}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#3F4A47]">
                      <div>IMO {vessel.imo || 'N/A'}</div>
                      <div className="text-[10px]">MMSI {vessel.mmsi || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#14181A]">
                      {formatTonnage(vessel.capacityT)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#3F4A47]">
                      {voyage ? (
                        <div>
                          <span className="font-bold text-[#14181A]">{voyage.voyageNumber}</span>
                          <div className="text-[10px] truncate max-w-[140px]">
                            {voyage.origin} → {voyage.destination}
                          </div>
                        </div>
                      ) : (
                        'No active cycle'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {voyage ? <StatusBadge stage={voyage.currentStage} /> : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {voyage ? <OperationsHealthBadge health={voyage.health} /> : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#3F4A47]">
                      {voyage ? (
                        <div>
                          <span className="font-bold text-[#14181A]">
                            {voyage.assignedBerthId || 'Berth B01'}
                          </span>
                          <div className="text-[10px] text-[#0E7C86]">
                            ETA: {formatDateTime(voyage.returnEtaForecast)}
                          </div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[#0A7A3D] font-semibold hover:underline">
                        Details <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vessel Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Vessel to Fleet"
        subtitle="Register a new bulk carrier into the VIGOR smart port operational fleet."
      >
        <form onSubmit={handleAddVessel} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#14181A] mb-1">Vessel Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. MV VIGOR 04"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg focus:outline-none focus:border-[#0C9349]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#14181A] mb-1">Fleet Reference ID</label>
              <input
                type="text"
                placeholder="VG-V04"
                value={newRef}
                onChange={(e) => setNewRef(e.target.value)}
                className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg focus:outline-none focus:border-[#0C9349] font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#14181A] mb-1">Capacity (Tonnes)</label>
              <input
                type="number"
                placeholder="10000"
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg focus:outline-none focus:border-[#0C9349] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#14181A] mb-1">IMO Number</label>
              <input
                type="text"
                placeholder="e.g. 9621045"
                value={newImo}
                onChange={(e) => setNewImo(e.target.value)}
                className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg focus:outline-none focus:border-[#0C9349] font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#14181A] mb-1">MMSI</label>
              <input
                type="text"
                placeholder="e.g. 677041205"
                value={newMmsi}
                onChange={(e) => setNewMmsi(e.target.value)}
                className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg focus:outline-none focus:border-[#0C9349] font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#14181A] mb-1">Operational Notes</label>
            <textarea
              rows={3}
              placeholder="Technical specs, pneumatic discharge equipment, compressor manifold details..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg focus:outline-none focus:border-[#0C9349]"
            />
          </div>

          <div className="pt-3 border-t border-[#E1DED4] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-white border border-[#E1DED4] text-[#3F4A47] font-semibold hover:bg-[#F7F5F0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#0C9349] hover:bg-[#0A7A3D] text-white font-semibold shadow-xs"
            >
              Save Vessel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
