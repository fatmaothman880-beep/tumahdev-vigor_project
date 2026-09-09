import React, { useState } from 'react';
import { useAppData } from '../hooks/useAppData';
import { PageHeader, KpiCard, Modal } from '../components/ui/KpiCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  formatCurrency,
  formatDateTime,
  formatTime,
  formatTonnage,
} from '../lib/format';
import {
  Factory,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Ship,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { calculatePaymentAccountTotals } from '../lib/paymentEngine';

interface ManufacturerQueueProps {
  onSelectVessel: (vesselId: string) => void;
  onNavigateToPayments: () => void;
}

export function ManufacturerQueue({
  onSelectVessel,
  onNavigateToPayments,
}: ManufacturerQueueProps) {
  const {
    manufacturerQueue,
    vessels,
    voyages,
    paymentAccounts,
    paymentTransactions,
    api,
  } = useAppData();

  const [selectedQueueItem, setSelectedQueueItem] = useState<any | null>(null);
  const [confirmedDate, setConfirmedDate] = useState('');
  const [confirmedPos, setConfirmedPos] = useState('1');

  const handleOpenConfirmModal = (item: any) => {
    setSelectedQueueItem(item);
    setConfirmedDate(
      item.confirmedLoadingSlot
        ? new Date(item.confirmedLoadingSlot).toISOString().slice(0, 16)
        : new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 16)
    );
    setConfirmedPos(String(item.confirmedQueuePosition || item.predictedQueuePosition || 1));
  };

  const handleSaveConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQueueItem) return;

    api.updateManufacturerConfirmation(
      selectedQueueItem.id,
      new Date(confirmedDate).toISOString(),
      Number(confirmedPos)
    );

    setSelectedQueueItem(null);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="SUPPLY CHAIN GATES"
        title="Manufacturer Queue & Loading Slots"
        description="Mainland cement manufacturers (Tanga Cement PLC & Mombasa Wharves). Coordinates financial clearance with physical berth allocation."
      >
        <button
          onClick={onNavigateToPayments}
          className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0C9349] hover:bg-[#0A7A3D] text-white flex items-center gap-1.5 transition shadow-xs"
        >
          <CreditCard className="w-4 h-4" />
          Verify Payment Eligibility
        </button>
      </PageHeader>

      {/* Primary Supply Chain Callout */}
      <div className="p-4 bg-[#FBF0DD] rounded-xl border border-[#B5760F]/30 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[#B5760F] shrink-0 mt-0.5" />
        <div className="text-xs text-[#14181A] space-y-1">
          <div className="font-bold text-[#B5760F] uppercase tracking-wide">
            Mandatory Supply Chain Eligibility Rule
          </div>
          <p className="leading-relaxed">
            Mainland cement manufacturers operate strict prepaid allocation policies. Vessels will{' '}
            <strong>not receive a locked loading berth slot</strong> until 100% of the advance commercial invoice is verified cleared by the finance desk. Unpaid vessels are assigned temporary speculative predictions that can be displaced at any time.
          </p>
        </div>
      </div>

      {/* Manufacturer Overview KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Queued Vessels"
          value={manufacturerQueue.length}
          subtext="Scheduled mainland rotations"
          icon={<Factory className="w-5 h-5" />}
          variant="teal"
        />
        <KpiCard
          label="Confirmed Slots"
          value={manufacturerQueue.filter((q) => q.confirmedLoadingSlot).length}
          subtext="Firm terminal appointments"
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="success"
        />
        <KpiCard
          label="Payment Gate Withheld"
          value={manufacturerQueue.filter((q) => !q.paymentEligible).length}
          subtext="Awaiting wire clearing"
          icon={<CreditCard className="w-5 h-5" />}
          variant="warning"
        />
        <KpiCard
          label="Avg. Loading Rate"
          value="450 t/h"
          subtext="Continuous bulk shiploader"
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Queue Table */}
      <div className="bg-white border border-[#E1DED4] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#E1DED4] flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#14181A]">
            Mainland Queue Sequence & Gate Status
          </h3>
          <span className="text-xs font-mono text-[#3F4A47]">
            Tanga Cement Wharf · Mamba Pier
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F5F0] border-b border-[#E1DED4] text-[#3F4A47] font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Vessel & Terminal</th>
                <th className="py-3 px-4">Arrival ETA</th>
                <th className="py-3 px-4">Payment Eligibility Gate</th>
                <th className="py-3 px-4">Queue Pos.</th>
                <th className="py-3 px-4">Loading Slot (Predicted vs Confirmed)</th>
                <th className="py-3 px-4">Loading Rate</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1DED4]">
              {manufacturerQueue.map((item) => {
                const vessel = vessels.find((v) => v.id === item.vesselId);
                const voyage = voyages.find((v) => v.id === item.voyageId);
                const pmt = paymentAccounts.find(
                  (p) => p.vesselId === item.vesselId && p.category === 'MANUFACTURER'
                );
                const pmtTotals = pmt ? calculatePaymentAccountTotals(pmt, paymentTransactions) : null;

                return (
                  <tr key={item.id} className="hover:bg-[#F7F5F0]/60 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#14181A] flex items-center gap-1.5">
                        <Ship className="w-3.5 h-3.5 text-[#0C9349]" />
                        {vessel?.name || item.vesselId}
                      </div>
                      <div className="text-[10px] text-[#3F4A47] mt-0.5">{item.manufacturerName}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[#14181A]">
                      {formatDateTime(item.arrivalEtaForecast)}
                    </td>

                    <td className="py-3 px-4">
                      {item.paymentEligible ? (
                        <div className="flex items-center gap-1.5 text-[#0A7A3D] font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>ELIGIBLE (100% Paid)</span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-[#AE3B2E] font-semibold">
                            <AlertTriangle className="w-4 h-4" />
                            <span>NOT ELIGIBLE</span>
                          </div>
                          <div className="text-[10px] font-mono text-[#3F4A47]">
                            Balance due: {formatCurrency(pmtTotals?.remaining || 200000000)}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-[#14181A]">
                      {item.confirmedQueuePosition ? (
                        <span className="text-[#0A7A3D]">#{item.confirmedQueuePosition} (Firm)</span>
                      ) : (
                        <span className="text-[#B5760F]">#{item.predictedQueuePosition} (Est)</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {item.confirmedLoadingSlot ? (
                        <div>
                          <span className="text-[#0A7A3D] font-bold block">
                            {formatDateTime(item.confirmedLoadingSlot)}
                          </span>
                          <span className="text-[10px] text-[#3F4A47] font-sans">Firm appointment</span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[#14181A] block">
                            {formatDateTime(item.predictedLoadingSlot)}
                          </span>
                          <span className="text-[10px] text-[#B5760F] font-sans">Forecast / Unconfirmed</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-[#3F4A47]">
                      {item.estimatedLoadingRateTph} t/h
                    </td>

                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenConfirmModal(item)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded bg-[#14181A] hover:bg-[#3F4A47] text-white transition"
                      >
                        Confirm Slot
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedQueueItem && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedQueueItem(null)}
          title="Record Manufacturer Confirmed Loading Slot"
          subtitle={`Official Tanga berth appointment for ${vessels.find((v) => v.id === selectedQueueItem.vesselId)?.name || 'Vessel'}.`}
        >
          <form onSubmit={handleSaveConfirmation} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#14181A] mb-1">
                Confirmed Berthing / Loading Start *
              </label>
              <input
                type="datetime-local"
                required
                value={confirmedDate}
                onChange={(e) => setConfirmedDate(e.target.value)}
                className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#14181A] mb-1">
                Confirmed Queue Position
              </label>
              <input
                type="number"
                value={confirmedPos}
                onChange={(e) => setConfirmedPos(e.target.value)}
                className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg font-mono"
              />
            </div>

            <div className="pt-3 border-t border-[#E1DED4] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedQueueItem(null)}
                className="px-4 py-2 rounded-lg bg-white border border-[#E1DED4] text-[#3F4A47] font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#0C9349] hover:bg-[#0A7A3D] text-white font-semibold shadow-xs"
              >
                Lock Confirmed Slot
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
