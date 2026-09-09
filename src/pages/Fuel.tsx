import React, { useState } from 'react';
import { useAppData } from '../hooks/useAppData';
import { PageHeader, KpiCard, Modal } from '../components/ui/KpiCard';
import {
  formatCurrency,
  formatDateTime,
  formatTime,
} from '../lib/format';
import {
  Fuel as FuelIcon,
  CheckCircle2,
  Clock,
  CreditCard,
  Plus,
  Ship,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { FuelOperation } from '../types';

interface FuelProps {
  onSelectVessel: (vesselId: string) => void;
  onNavigateToPayments: () => void;
}

export function Fuel({ onSelectVessel, onNavigateToPayments }: FuelProps) {
  const { fuelOperations, vessels, voyages, api } = useAppData();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Fuel Form
  const [vesselId, setVesselId] = useState('v-02');
  const [fuelType, setFuelType] = useState<'MGO' | 'VLSFO' | 'LSMGO'>('MGO');
  const [quantity, setQuantity] = useState('120');
  const [supplier, setSupplier] = useState('TotalEnergies Marine Fuels');
  const [cost, setCost] = useState('110000');
  const [location, setLocation] = useState<'ALONGSIDE_BERTH' | 'ANCHORAGE_BARGE' | 'SUPPLIER_TERMINAL'>('ALONGSIDE_BERTH');

  const totalFuelCostUsd = fuelOperations.reduce((acc, f) => acc + f.estimatedCost, 0);

  const handleScheduleFuel = (e: React.FormEvent) => {
    e.preventDefault();
    const selVoyage = voyages.find((v) => v.vesselId === vesselId && v.status === 'ACTIVE');

    const now = new Date();
    const start = new Date(now.getTime() + 18 * 3600000).toISOString();
    const end = new Date(now.getTime() + 21 * 3600000).toISOString();

    api.addFuelOperation({
      vesselId,
      voyageId: selVoyage?.id,
      fuelType,
      quantity: Number(quantity) || 100,
      supplierName: supplier,
      estimatedCost: Number(cost) || 100000,
      currency: 'USD',
      invoiceNumber: `FO-INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      paymentStatus: 'PAID',
      scheduledStart: start,
      scheduledEnd: end,
      deliveryLocation: location,
      status: 'SCHEDULED',
      requiredBeforeDeparture: true,
      notes: 'Scheduled alongside delivery via bunker barge.',
    });

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="BUNKERING LOGISTICS"
        title="Fuel & Lubricants Operations"
        description="Coordinates bunker fuel procurement, supplier barge appointments, and post-discharge departure readiness."
      >
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0C9349] hover:bg-[#0A7A3D] text-white flex items-center gap-1.5 transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Schedule Bunkering Operation
        </button>
      </PageHeader>

      {/* Fuel KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Bunkering Ops"
          value={fuelOperations.length}
          subtext="V01 alongside, V03 scheduled"
          icon={<FuelIcon className="w-5 h-5" />}
          variant="teal"
        />
        <KpiCard
          label="Total Committed Cost"
          value={formatCurrency(totalFuelCostUsd, 'USD')}
          subtext="MGO 0.1% max sulfur & VLSFO"
          icon={<CreditCard className="w-5 h-5" />}
        />
        <KpiCard
          label="Preferred Delivery"
          value="Alongside B01"
          subtext="Bunkering while line purge runs"
          icon={<Ship className="w-5 h-5" />}
          variant="success"
        />
        <KpiCard
          label="Supplier Readiness"
          value="100% On-Time"
          subtext="TotalEnergies & Puma Energy"
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="success"
        />
      </div>

      {/* Fuel Operations Table */}
      <div className="bg-white border border-[#E1DED4] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#E1DED4] flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#14181A]">
            Bunker Delivery Schedules
          </h3>
          <span className="text-xs font-mono text-[#3F4A47]">Zanzibar Port Anchorage & B01</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F5F0] border-b border-[#E1DED4] text-[#3F4A47] font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Vessel</th>
                <th className="py-3 px-4">Fuel Type & Quantity</th>
                <th className="py-3 px-4">Supplier & Invoice</th>
                <th className="py-3 px-4">Scheduled Window</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4">Operation Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1DED4]">
              {fuelOperations.map((f) => {
                const vessel = vessels.find((v) => v.id === f.vesselId);
                return (
                  <tr key={f.id} className="hover:bg-[#F7F5F0]/60 transition">
                    <td className="py-3 px-4 font-bold text-[#14181A]">
                      <div className="flex items-center gap-1.5">
                        <Ship className="w-3.5 h-3.5 text-[#0C9349]" />
                        {vessel?.name || f.vesselId}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-[#14181A]">{f.quantity} Tonnes</span>{' '}
                      <span className="text-[#3F4A47]">({f.fuelType})</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#14181A]">{f.supplierName}</div>
                      <div className="text-[10px] font-mono text-[#3F4A47]">
                        Inv: {f.invoiceNumber} · {formatCurrency(f.estimatedCost, 'USD')}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div>{formatDateTime(f.scheduledStart)}</div>
                      <div className="text-[#3F4A47]">to {formatTime(f.scheduledEnd)}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium">
                      {f.deliveryLocation === 'ALONGSIDE_BERTH' ? (
                        <span className="text-[#0A7A3D]">Alongside Berth B01</span>
                      ) : (
                        <span className="text-[#0E7C86]">Anchorage Barge</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          f.paymentStatus === 'PAID'
                            ? 'bg-[#E7F4EB] text-[#0A7A3D]'
                            : 'bg-[#FBF0DD] text-[#B5760F]'
                        }`}
                      >
                        {f.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          f.status === 'COMPLETED'
                            ? 'bg-[#E7F4EB] text-[#0A7A3D]'
                            : f.status === 'SCHEDULED'
                            ? 'bg-[#E4F1F2] text-[#0E7C86]'
                            : 'bg-[#F8E7E3] text-[#AE3B2E]'
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectVessel(f.vesselId)}
                        className="text-xs font-semibold text-[#0A7A3D] hover:underline"
                      >
                        Vessel →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Bunkering Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule Fuel Bunkering Operation"
        subtitle="Book bunkering window and supplier barge delivery."
      >
        <form onSubmit={handleScheduleFuel} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#14181A] mb-1">Target Fleet Vessel *</label>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#14181A] mb-1">Fuel Grade *</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as any)}
                className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg font-mono"
              >
                <option value="MGO">MGO (0.1% Marine Gas Oil)</option>
                <option value="VLSFO">VLSFO (Very Low Sulfur Fuel Oil)</option>
                <option value="LSMGO">LSMGO (Low Sulfur MGO)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#14181A] mb-1">Quantity (Tonnes) *</label>
              <input
                type="number"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#14181A] mb-1">Supplier</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#14181A] mb-1">Estimated Cost (USD)</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#14181A] mb-1">Delivery Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value as any)}
              className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg"
            >
              <option value="ALONGSIDE_BERTH">Alongside Berth B01 (Post-Discharge Window)</option>
              <option value="ANCHORAGE_BARGE">Zanzibar Outer Anchorage (Barge)</option>
              <option value="SUPPLIER_TERMINAL">Supplier Terminal Wharf</option>
            </select>
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
              Confirm Bunkering Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
