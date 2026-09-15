import React, { useEffect, useState } from 'react';
import { Modal } from './KpiCard';
import { getSiteCatalogue, SiteCatalogue } from '../../api/workflowApi';
import { createVisit } from '../../api/visitApi';
import { getVessels } from '../../api/vesselApi';
import { getBerths } from '../../api/berthApi';

export function AddVesselVisit({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [site, setSite] = useState<SiteCatalogue | null>(null);
  const [vesselId, setVesselId] = useState('');
  const [berthId, setBerthId] = useState('');
  const [berths, setBerths] = useState<{id: string; name: string}[]>([]);
  const [cargo, setCargo] = useState('');
  const [cargoType, setCargoType] = useState('Bulk Cement');
  const [arrival, setArrival] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getSiteCatalogue().then(async data => {
      if (!active) return;
      if (data.configured && data.berth_id) {
        setSite(data);
        setBerthId(data.berth_id);
      } else {
        const [registered, availableBerths] = await Promise.all([getVessels(0, 100), getBerths()]);
        if (!active) return;
        setSite({ ...data, vessels: registered.map(v => ({ vessel_id: v.id, name: v.name, reference: v.imo_reference || '', reported_cargo_t: null, temporary_label: false, notes: '' })) });
        setBerths(availableBerths);
      }
    }).catch(err => { if (active) setError(err instanceof Error ? err.message : 'Unable to load registered vessels.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const selectVessel = (id: string) => {
    setVesselId(id);
    const vessel = site?.vessels.find(v => v.vessel_id === id);
    setCargo(vessel?.reported_cargo_t == null ? '' : String(vessel.reported_cargo_t));
    setCargoType(vessel?.name.toLowerCase().includes('lpg') ? 'LPG' : 'Bulk Cement');
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!berthId || !site?.vessels.some(v => v.vessel_id === vesselId) || saving) return;
    setSaving(true); setError('');
    try {
      await createVisit({ vessel_id: vesselId, berth_id: berthId, cargo_type: cargoType.trim(), cargo_total_t: Number(cargo),
        planned_arrival: arrival ? new Date(`${arrival}:00+03:00`).toISOString() : null, status: 'PLANNED' });
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save vessel visit.'); }
    finally { setSaving(false); }
  };

  return <Modal isOpen onClose={() => { if (!saving) onClose(); }} title="Add Vessel Visit" subtitle="Create a planned visit for a registered database vessel.">
    <form onSubmit={save} className="space-y-4 text-xs">
      {loading && <p>Loading registered vessels…</p>}
      {error && <p role="alert" className="text-[#AE3B2E]">{error}</p>}
      <label className="block font-semibold">Registered vessel *
        <select required value={vesselId} onChange={e => selectVessel(e.target.value)} disabled={loading || saving} className="w-full p-2 mt-1 border rounded-lg bg-white">
          <option value="">Select a registered vessel</option>
          {site?.vessels.map(v => <option key={v.vessel_id} value={v.vessel_id}>{v.name}{v.reported_cargo_t == null ? '' : ` — Reported cargo: ${Number(v.reported_cargo_t).toLocaleString()} t`}</option>)}
        </select>
      </label>
      {site?.configured ? <p><strong>Berth:</strong> {site.berth_label || 'Configured site berth'}</p> : (
        <label className="block font-semibold">Registered berth *
          <select required value={berthId} onChange={e => setBerthId(e.target.value)} className="w-full p-2 mt-1 border rounded-lg">
            <option value="">Select a database berth</option>
            {berths.map(berth => <option key={berth.id} value={berth.id}>{berth.name}</option>)}
          </select>
        </label>
      )}
      <label className="block font-semibold">Cargo type *<input required maxLength={100} value={cargoType} onChange={e => setCargoType(e.target.value)} className="w-full p-2 mt-1 border rounded-lg" /></label>
      <label className="block font-semibold">Visit cargo (tonnes) *<input required type="number" min="0.01" step="0.01" value={cargo} onChange={e => setCargo(e.target.value)} className="w-full p-2 mt-1 border rounded-lg" /></label>
      <p className="text-[#3F4A47]">Reported cargo is a starting value for this visit, not verified vessel capacity. Adjust it to match this shipment.</p>
      <label className="block font-semibold">Planned arrival (EAT)<input type="datetime-local" value={arrival} onChange={e => setArrival(e.target.value)} className="w-full p-2 mt-1 border rounded-lg" /></label>
      <div className="flex justify-end gap-3"><button type="button" disabled={saving} onClick={onClose}>Cancel</button><button type="submit" disabled={loading || saving || !berthId || !vesselId} className="px-4 py-2 rounded-lg bg-[#0C9349] text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save Visit'}</button></div>
    </form>
  </Modal>;
}
