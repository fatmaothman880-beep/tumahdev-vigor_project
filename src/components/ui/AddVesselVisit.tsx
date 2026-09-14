import React, { useEffect, useState } from 'react';
import { Modal } from './KpiCard';
import { getSiteCatalogue, SiteCatalogue } from '../../api/workflowApi';
import { createVisit } from '../../api/visitApi';

export function AddVesselVisit({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [site, setSite] = useState<SiteCatalogue | null>(null);
  const [vesselId, setVesselId] = useState('');
  const [cargo, setCargo] = useState('');
  const [cargoType, setCargoType] = useState('Bulk Cement');
  const [arrival, setArrival] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getSiteCatalogue().then(data => {
      if (!active) return;
      setSite(data);
      if (!data.configured || !data.berth_id) setError('The Mangapwani site registry must be configured before adding a visit.');
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
    if (!site?.berth_id || !site.vessels.some(v => v.vessel_id === vesselId) || saving) return;
    setSaving(true); setError('');
    try {
      await createVisit({ vessel_id: vesselId, berth_id: site.berth_id, cargo_type: cargoType.trim(), cargo_total_t: Number(cargo),
        planned_arrival: arrival ? new Date(`${arrival}:00+03:00`).toISOString() : null, status: 'PLANNED' });
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save vessel visit.'); }
    finally { setSaving(false); }
  };

  return <Modal isOpen onClose={() => { if (!saving) onClose(); }} title="Add Vessel Visit" subtitle="Create a planned visit for a registered vessel at Mangapwani Berth.">
    <form onSubmit={save} className="space-y-4 text-xs">
      {loading && <p>Loading registered vessels…</p>}
      {error && <p role="alert" className="text-[#AE3B2E]">{error}</p>}
      <label className="block font-semibold">Registered vessel *
        <select required value={vesselId} onChange={e => selectVessel(e.target.value)} disabled={loading || saving} className="w-full p-2 mt-1 border rounded-lg bg-white">
          <option value="">Select a registered vessel</option>
          {site?.vessels.map(v => <option key={v.vessel_id} value={v.vessel_id}>{v.name}{v.reported_cargo_t == null ? '' : ` — Reported cargo: ${Number(v.reported_cargo_t).toLocaleString()} t`}</option>)}
        </select>
      </label>
      <p><strong>Berth:</strong> Mangapwani Berth</p>
      <label className="block font-semibold">Cargo type *<input required maxLength={100} value={cargoType} onChange={e => setCargoType(e.target.value)} className="w-full p-2 mt-1 border rounded-lg" /></label>
      <label className="block font-semibold">Visit cargo (tonnes) *<input required type="number" min="0.01" step="0.01" value={cargo} onChange={e => setCargo(e.target.value)} className="w-full p-2 mt-1 border rounded-lg" /></label>
      <p className="text-[#3F4A47]">Reported cargo is a starting value for this visit, not verified vessel capacity. Adjust it to match this shipment.</p>
      <label className="block font-semibold">Planned arrival (EAT)<input type="datetime-local" value={arrival} onChange={e => setArrival(e.target.value)} className="w-full p-2 mt-1 border rounded-lg" /></label>
      <div className="flex justify-end gap-3"><button type="button" disabled={saving} onClick={onClose}>Cancel</button><button type="submit" disabled={loading || saving || !site?.berth_id || !vesselId} className="px-4 py-2 rounded-lg bg-[#0C9349] text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save Visit'}</button></div>
    </form>
  </Modal>;
}
