import { canEditOperations } from '../../shared/roles';
import { useAuth } from '../auth/AuthContext';
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
  const { user } = useAuth();
  const canEdit = canEditOperations(user?.role);
  const {
    manufacturers = [],
    manufacturerQueue,
    vessels,
    voyages,
    paymentAccounts,
    paymentTransactions,
    api,
  } = useAppData();

  const [addingManufacturer, setAddingManufacturer] = useState(false);
  const [name, setName] = useState('');
  const [works, setWorks] = useState('');
  const [error, setError] = useState('');
  const [selectedQueueItem, setSelectedQueueItem] = useState<any | null>(null);
  const [confirmedDate, setConfirmedDate] = useState('');
  const [confirmedPos, setConfirmedPos] = useState('1');

  const handleOpenConfirmModal = (item: any) => {
    setSelectedQueueItem(item);
    setConfirmedDate(
      item.confirmedSlot
        ? new Date(item.confirmedSlot).toISOString().slice(0, 16)
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
        description="Mainland cement manufacturers (Mtwara Cement Factory). Coordinates financial clearance with physical berth allocation."
      >
        <button
          onClick={onNavigateToPayments}
          className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-brand hover:bg-brand-hover text-white flex items-center gap-1.5 transition shadow-xs"
        >
          <CreditCard className="w-4 h-4" />
          Verify Payment Eligibility
        </button>
      </PageHeader>

      <section className="bg-surface border border-line rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center gap-3">
          <h2 className="text-sm font-bold">Manufacturers & Works</h2>
          <button disabled={!canEdit} onClick={() => { setError(''); setAddingManufacturer(true); }} className="px-3 py-2 rounded-lg bg-brand text-white text-xs font-semibold">Add Manufacturer / Works</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {manufacturers.map(m => <div key={m.id} className="border rounded-lg p-3 text-xs"><strong>{m.name}</strong><p className="mt-1">{m.works}</p></div>)}
        </div>
      </section>
      <Modal isOpen={addingManufacturer} onClose={() => setAddingManufacturer(false)} title="Add Manufacturer / Works" subtitle="Saved manufacturers and works are available when creating voyage rotations.">
        <form className="space-y-4 text-sm" onSubmit={e => {
          e.preventDefault();
          try { api.addManufacturer(name, works); setName(''); setWorks(''); setAddingManufacturer(false); }
          catch (err) { setError((err as Error).message); }
        }}>
          <label className="block">Manufacturer name<input required value={name} onChange={e => setName(e.target.value)} className="block w-full border rounded-lg p-2 mt-1" /></label>
          <label className="block">Works / Factory<input required value={works} onChange={e => setWorks(e.target.value)} className="block w-full border rounded-lg p-2 mt-1" /></label>
          {error && <p role="alert" className="text-red-700">{error}</p>}
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setAddingManufacturer(false)}>Cancel</button><button type="submit" className="bg-brand text-white rounded-lg px-4 py-2">Save Manufacturer</button></div>
        </form>
      </Modal>
      {/* Primary Supply Chain Callout */}
      <div className="p-4 bg-warning-soft rounded-xl border border-warning/30 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div className="text-xs text-foreground space-y-1">
          <div className="font-bold text-warning uppercase tracking-wide">
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
          value={manufacturerQueue.filter((q) => q.confirmedSlot).length}
          subtext="Firm terminal appointments"
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="success"
        />
        <KpiCard
          label="Payment Gate Withheld"
          value={manufacturerQueue.filter((q) => !q.isEligible).length}
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
      <div className="bg-surface border border-line rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-line flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Mainland Queue Sequence & Gate Status
          </h3>
          <span className="text-xs font-mono text-muted">
            Mtwara Cement Factory
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-canvas border-b border-line text-muted font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Vessel & Terminal</th>
                <th className="py-3 px-4">Arrival ETA</th>
                <th className="py-3 px-4">Payment Eligibility Gate</th>
                <th className="py-3 px-4">Queue Pos.</th>
                <th className="py-3 px-4">Loading Slot (Predicted vs Confirmed)</th>
                <th className="py-3 px-4">Loading Rate</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {manufacturerQueue.map((item) => {
                const vessel = vessels.find((v) => v.id === item.vesselId);
                const voyage = voyages.find((v) => v.id === item.voyageId);
                const pmt = paymentAccounts.find(
                  (p) => p.vesselId === item.vesselId && p.category === 'MANUFACTURER'
                );
                const pmtTotals = pmt ? calculatePaymentAccountTotals(pmt, paymentTransactions) : null;

                return (
                  <tr key={item.id} className="hover:bg-canvas/60 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-foreground flex items-center gap-1.5">
                        <Ship className="w-3.5 h-3.5 text-positive" />
                        {vessel?.name || item.vesselId}
                      </div>
                      <div className="text-[10px] text-muted mt-0.5">{item.manufacturerName}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-foreground">
                      {formatDateTime(item.eta)}
                    </td>

                    <td className="py-3 px-4">
                      {item.isEligible ? (
                        <div className="flex items-center gap-1.5 text-positive font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>ELIGIBLE (100% Paid)</span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-danger font-semibold">
                            <AlertTriangle className="w-4 h-4" />
                            <span>NOT ELIGIBLE</span>
                          </div>
                          <div className="text-[10px] font-mono text-muted">
                            Balance due: {formatCurrency(pmtTotals?.remaining || 200000000)}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      {item.confirmedQueuePosition ? (
                        <span className="text-positive">#{item.confirmedQueuePosition} (Firm)</span>
                      ) : (
                        <span className="text-warning">#{item.predictedQueuePosition} (Est)</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {item.confirmedSlot ? (
                        <div>
                          <span className="text-positive font-bold block">
                            {formatDateTime(item.confirmedSlot)}
                          </span>
                          <span className="text-[10px] text-muted font-sans">Firm appointment</span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-foreground block">
                            {formatDateTime(item.predictedSlot)}
                          </span>
                          <span className="text-[10px] text-warning font-sans">Forecast / Unconfirmed</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-muted">
                      {item.estimatedLoadingRateTph ? `${item.estimatedLoadingRateTph} t/h` : '—'}
                    </td>

                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenConfirmModal(item)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded bg-shell hover:bg-raised text-white transition"
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
          subtitle={`Official manufacturer berth appointment for ${vessels.find((v) => v.id === selectedQueueItem.vesselId)?.name || 'Vessel'}.`}
        >
          <form onSubmit={handleSaveConfirmation} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-foreground mb-1">
                Confirmed Berthing / Loading Start *
              </label>
              <input
                type="datetime-local"
                required
                value={confirmedDate}
                onChange={(e) => setConfirmedDate(e.target.value)}
                className="w-full p-2 bg-canvas border border-line rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">
                Confirmed Queue Position
              </label>
              <input
                type="number"
                value={confirmedPos}
                onChange={(e) => setConfirmedPos(e.target.value)}
                className="w-full p-2 bg-canvas border border-line rounded-lg font-mono"
              />
            </div>

            <div className="pt-3 border-t border-line flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedQueueItem(null)}
                className="px-4 py-2 rounded-lg bg-surface border border-line text-muted font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white font-semibold shadow-xs"
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
