import React, { useEffect, useState } from 'react';
import { Modal } from './KpiCard';
import { OperationalChecklist } from './OperationalChecklist';
import { api, apiFetch } from '../../api/client';
import { getVessel, updateVessel } from '../../api/vesselApi';
import { getBerths } from '../../api/berthApi';
import { getVisit, type VisitListItem } from '../../api/visitApi';
import type { BackendBerth, BackendVessel, BackendVisit } from '../../api/adapters';
import { useAuth } from '../../auth/AuthContext';
import { canEditOperations } from '../../../shared/roles';

const eatInput = (value?: string | null) => value ? new Date(new Date(value).getTime() + 3 * 3600000).toISOString().slice(0, 16) : '';
const iso = (value: string) => value ? new Date(`${value}:00+03:00`).toISOString() : null;
const inputClass = 'mt-1 w-full p-2 border rounded-lg bg-white';

export function EditVesselOperation({ row, onClose, onSaved }: {
  row: VisitListItem; onClose: () => void; onSaved: (row: VisitListItem) => void;
}) {
  const { user } = useAuth();
  const allowed = canEditOperations(user?.role);
  const [record, setRecord] = useState<BackendVessel | null>(null);
  const [visit, setVisit] = useState<BackendVisit | null>(null);
  const [berths, setBerths] = useState<BackendBerth[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [identity, setIdentity] = useState({ name: '', reference: '', capacity: '', agent: '', phone: '' });
  const [plan, setPlan] = useState({ cargo: '', tonnes: '', berth: '', status: 'PLANNED', arrival: '', start: '', finish: '', rate: '', notes: '' });
  useEffect(() => {
    let active = true;
    Promise.all([getVessel(row.visit.vessel_id), getVisit(row.visit.id), getBerths(0, 100)]).then(([vessel, current, available]) => {
      if (!active) return;
      setRecord(vessel); setVisit(current); setBerths(available);
      setIdentity({ name: vessel.name, reference: vessel.imo_reference || '', capacity: vessel.capacity_t == null ? '' : String(vessel.capacity_t), agent: vessel.agent_name || '', phone: vessel.agent_phone || '' });
      setPlan({ cargo: current.cargo_type, tonnes: String(current.cargo_total_t ?? ''), berth: current.berth_id, status: current.status, arrival: eatInput(current.planned_arrival), start: eatInput(current.planned_unload_start), finish: eatInput(current.planned_completion), rate: String(current.planned_rate_tph ?? ''), notes: current.notes || '' });
    }).catch(err => { if (active) setError(err instanceof Error ? err.message : 'Unable to load operation.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [row.visit.id, row.visit.vessel_id]);
  const closed = !!visit && ['COMPLETED', 'CANCELLED', 'DEPARTED'].includes(visit.status);
  const saveIdentity = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!allowed || !record || saving) return;
    if (!identity.name.trim()) { setError('Enter a vessel name.'); return; }
    setSaving(true); setError(''); setMessage('');
    try {
      const saved = await updateVessel(record.id, { name: identity.name.trim(), imo_reference: identity.reference.trim() || null,
        capacity_t: identity.capacity ? Number(identity.capacity) : null, agent_name: identity.agent.trim() || null, agent_phone: identity.phone.trim() || null });
      setRecord(saved);
      onSaved({ visit: visit || row.visit, vessel: saved });
      setMessage('Vessel details saved.');
      void api.syncFromBackend();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save vessel.'); }
    finally { setSaving(false); }
  };
  const savePlan = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!allowed || !record || !visit || saving || closed) return;
    setSaving(true); setError(''); setMessage('');
    try {
      const saved = await apiFetch<VisitListItem>(`/integration/visits/${visit.id}`, { method: 'PUT', body: JSON.stringify({
        vesselId: record.id, name: record.name, reference: record.imo_reference || '',
        cargo: plan.cargo.trim(), cargoTotalT: Number(plan.tonnes), berthId: plan.berth, status: plan.status,
        plannedArrival: iso(plan.arrival), plannedUnloadStart: iso(plan.start), plannedCompletion: iso(plan.finish),
        plannedRateTph: plan.rate ? Number(plan.rate) : null, notes: plan.notes.trim(),
      }) });
      setVisit(saved.visit); onSaved(saved); setMessage('Operation saved. You can update its checklist below.');
      void api.syncFromBackend();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save operation.'); }
    finally { setSaving(false); }
  };
  return <Modal isOpen onClose={() => { if (!saving) onClose(); }} title={`Edit operation — ${record?.name || row.vessel.name}`} subtitle="Prepare vessel details, the visit plan and its operational checklist.">
    {loading && <p>Loading operation…</p>}
    {error && <p role="alert" className="mb-3 text-sm text-[#AE3B2E]">{error}</p>}
    {message && <p role="status" className="mb-3 text-sm text-[#0A7A3D]">{message}</p>}
    {!loading && record && visit && <div className="space-y-6">
      <form onSubmit={saveIdentity} className="space-y-3 text-xs">
        <h3 className="font-bold text-sm">Vessel details</h3>
        <fieldset disabled={!allowed || saving} className="grid sm:grid-cols-2 gap-3">
          <label>Vessel name *<input required maxLength={150} value={identity.name} onChange={e => setIdentity({ ...identity, name: e.target.value })} className={inputClass} /></label>
          <label>IMO / reference<input maxLength={20} value={identity.reference} onChange={e => setIdentity({ ...identity, reference: e.target.value })} className={inputClass} /></label>
          <label>Verified capacity (tonnes)<input type="number" min="0.01" step="0.01" value={identity.capacity} onChange={e => setIdentity({ ...identity, capacity: e.target.value })} className={inputClass} /><span>Leave blank if not verified.</span></label>
          <label>Agent name<input maxLength={150} value={identity.agent} onChange={e => setIdentity({ ...identity, agent: e.target.value })} className={inputClass} /></label>
          <label>Agent phone<input type="tel" maxLength={30} value={identity.phone} onChange={e => setIdentity({ ...identity, phone: e.target.value })} className={inputClass} /></label>
        </fieldset>
        {allowed && <button disabled={saving} className="px-3 py-2 rounded-lg bg-[#0C9349] text-white disabled:opacity-50">Save vessel details</button>}
      </form>
      <form onSubmit={savePlan} className="space-y-3 text-xs">
        <h3 className="font-bold text-sm">Visit plan and progress</h3>
        {closed && <p>This visit is closed. Create a new visit for the next operation.</p>}
        <fieldset disabled={!allowed || saving || closed} className="grid sm:grid-cols-2 gap-3">
          <label>Cargo type *<input required maxLength={100} value={plan.cargo} onChange={e => setPlan({ ...plan, cargo: e.target.value })} className={inputClass} /></label>
          <label>Visit cargo (tonnes) *<input required type="number" min="0.01" step="0.01" value={plan.tonnes} onChange={e => setPlan({ ...plan, tonnes: e.target.value })} className={inputClass} /></label>
          <label>Berth *<select required value={plan.berth} onChange={e => setPlan({ ...plan, berth: e.target.value })} className={inputClass}>{!berths.some(b => b.id === plan.berth) && <option value={plan.berth}>Current berth</option>}{berths.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
          <label>Operation status<select value={plan.status} onChange={e => setPlan({ ...plan, status: e.target.value })} className={inputClass}>{Array.from(new Set([plan.status, 'PLANNED', 'ARRIVED', 'BERTHED', 'UNLOADING', 'DELAYED'])).map(status => <option key={status} value={status}>{status === 'UNLOADING' ? 'UNLOADING — in progress' : status}</option>)}</select></label>
          <label>Planned arrival (EAT) *<input required type="datetime-local" value={plan.arrival} onChange={e => setPlan({ ...plan, arrival: e.target.value })} className={inputClass} /></label>
          <label>Planned unloading start (EAT)<input type="datetime-local" min={plan.arrival || undefined} value={plan.start} onChange={e => setPlan({ ...plan, start: e.target.value })} className={inputClass} /></label>
          <label>Planned completion (EAT)<input type="datetime-local" min={plan.start || plan.arrival || undefined} value={plan.finish} onChange={e => setPlan({ ...plan, finish: e.target.value })} className={inputClass} /></label>
          <label>Planned unloading rate (tonnes/hour)<input type="number" min="0.01" step="0.01" value={plan.rate} onChange={e => setPlan({ ...plan, rate: e.target.value })} className={inputClass} /></label>
          <label className="sm:col-span-2">Operational notes<textarea value={plan.notes} onChange={e => setPlan({ ...plan, notes: e.target.value })} className={inputClass} /></label>
        </fieldset>
        <p>Select the status that reflects the actual operation. Arrival and unloading start are recorded automatically when first entering those stages.</p>
        {allowed && !closed && <button disabled={saving} className="px-3 py-2 rounded-lg bg-[#0C9349] text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save operation'}</button>}
      </form>
      <OperationalChecklist vesselId={record.id} visitId={visit.id} readOnly={!allowed || closed} />
    </div>}
    <button type="button" disabled={saving} onClick={onClose} className="mt-4 px-3 py-2 border rounded-lg text-xs">Close</button>
  </Modal>;
}
