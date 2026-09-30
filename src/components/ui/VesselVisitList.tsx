import React, { useEffect, useRef, useState } from 'react';
import { getVisitList, updateVisit, type VisitListItem } from '../../api/visitApi';
import { useAuth } from '../../auth/AuthContext';
import { canEditOperations } from '../../../shared/roles';
import { EditVesselOperation } from './EditVesselOperation';
import { formatTonnage } from '../../lib/format';

function formatVisitDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Dar_es_Salaam', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value));
}

export function VesselVisitList({ savedVisit }: { savedVisit: VisitListItem | null }) {
  const { user } = useAuth();
  const canEdit = canEditOperations(user?.role);
  const pending = useRef(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<VisitListItem | null>(null);
  const [message, setMessage] = useState('');
  const [visits, setVisits] = useState<VisitListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getVisitList().then(data => { if (active) setVisits(data); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Unable to load vessel visits. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [savedVisit, refresh]);

  // Keep the confirmed save visible even while refreshing or if the list request fails.
  const rows = savedVisit && !visits.some(row => row.visit.id === savedVisit.visit.id)
    ? [savedVisit, ...visits] : visits;

  const advanceVisit = async (row: VisitListItem) => {
    if (!canEdit || pending.current || loading) return;
    const status = row.visit.status === 'PLANNED' ? 'ARRIVED'
      : row.visit.status === 'ARRIVED' ? 'BERTHED'
      : row.visit.status === 'BERTHED' ? 'UNLOADING' : null;
    if (!status) return;
    pending.current = true;
    setSavingId(row.visit.id);
    setError('');
    setMessage('');
    const now = new Date().toISOString();
    try {
      const visit = await updateVisit(row.visit.id, {
        status,
        ...(status === 'ARRIVED' ? { actual_arrival: row.visit.actual_arrival || now } : {}),
        ...(status === 'UNLOADING' ? { unload_start: row.visit.unload_start || now } : {}),
      });
      setVisits(current => current.some(item => item.visit.id === visit.id)
        ? current.map(item => item.visit.id === visit.id ? { ...item, visit } : item)
        : [{ ...row, visit }, ...current]);
      setMessage(`${row.vessel.name}: ${status === 'ARRIVED' ? 'arrival recorded' : status === 'BERTHED' ? 'berthing recorded' : 'unloading started'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update the visit. Please try again.');
    } finally {
      pending.current = false;
      setSavingId(null);
    }
  };

  return <section className="bg-white border border-[#E1DED4] rounded-xl overflow-hidden shadow-xs" aria-label="Vessel visits">
    <div className="p-4 flex items-center justify-between gap-3">
      <div><h2 className="text-sm font-bold text-[#14181A]">Vessel Visits</h2><p className="text-xs text-[#3F4A47]">Planned, active, and past port visits.</p></div>
      <button type="button" onClick={() => setRefresh(value => value + 1)} disabled={loading || savingId !== null} className="text-xs font-semibold text-[#0A7A3D] disabled:opacity-50">{loading ? 'Refreshing…' : 'Refresh visits'}</button>
    </div>
    {error && <p role="alert" className="px-4 pb-3 text-xs text-[#AE3B2E]">{error}</p>}
    {message && <p role="status" className="px-4 pb-3 text-xs text-[#0A7A3D]">{message}</p>}
    {canEdit && <p className="px-4 pb-3 text-xs text-[#3F4A47]">Record each step when it happens. Arrival and unloading start use the current time.</p>}
    {!loading && !error && rows.length === 0 && <p className="px-4 pb-4 text-xs text-[#3F4A47]">No vessel visits have been recorded yet.</p>}
    {rows.length > 0 && <div className="overflow-x-auto"><table className="w-full text-left text-xs">
      <thead className="bg-[#F7F5F0] text-[#3F4A47]"><tr>{['Vessel', 'Status', 'Cargo', 'Planned arrival (EAT)', 'Actual arrival (EAT)', 'Unloading started (EAT)', 'Recorded (EAT)', ...(canEdit ? ['Actions'] : [])].map(label => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead>
      <tbody className="divide-y divide-[#E1DED4]">{rows.map(({ visit, vessel }) => <tr key={visit.id} className={visit.id === savedVisit?.visit.id ? 'bg-[#E7F4EB]/50' : ''}>
        <td className="px-4 py-3 font-semibold">{vessel.name}</td>
        <td className="px-4 py-3"><span className="rounded bg-[#F7F5F0] px-2 py-1">{visit.status.replaceAll('_', ' ')}</span></td>
        <td className="px-4 py-3">{visit.cargo_type}<div className="text-[#3F4A47]">{visit.cargo_total_t == null ? 'Not recorded' : formatTonnage(Number(visit.cargo_total_t))}</div></td>
        <td className="px-4 py-3">{visit.planned_arrival ? formatVisitDate(visit.planned_arrival) : 'Not scheduled'}</td>
        <td className="px-4 py-3">{visit.actual_arrival ? formatVisitDate(visit.actual_arrival) : 'Not recorded'}</td>
        <td className="px-4 py-3">{visit.unload_start ? formatVisitDate(visit.unload_start) : 'Not started'}</td>
        <td className="px-4 py-3">{formatVisitDate(visit.created_at)}</td>
        {canEdit && <td className="px-4 py-3">
          <button type="button" disabled={loading || savingId !== null} onClick={() => setEditing({ visit, vessel })} className="block mb-2 text-[#0A7A3D] font-semibold whitespace-nowrap">Edit operation</button>
          {['PLANNED', 'ARRIVED', 'BERTHED'].includes(visit.status) ? <button
            type="button"
            onClick={() => advanceVisit({ visit, vessel })}
            disabled={loading || savingId !== null}
            aria-label={`${visit.status === 'PLANNED' ? 'Record arrival' : visit.status === 'ARRIVED' ? 'Record berthing' : 'Start unloading'} for ${vessel.name}`}
            className="px-3 py-2 rounded-lg bg-[#0C9349] text-white font-semibold whitespace-nowrap disabled:opacity-50"
          >{savingId === visit.id ? 'Saving…' : visit.status === 'PLANNED' ? 'Record arrival' : visit.status === 'ARRIVED' ? 'Record berthing' : 'Start unloading'}</button> : '—'}
        </td>}
      </tr>)}</tbody>
    </table></div>}
    {editing && <EditVesselOperation row={editing} onClose={() => setEditing(null)} onSaved={saved => {
      setVisits(current => {
        const updated = current.map(item => item.visit.id === saved.visit.id ? saved : item.visit.vessel_id === saved.visit.vessel_id ? { ...item, vessel: saved.vessel } : item);
        return updated.some(item => item.visit.id === saved.visit.id) ? updated : [saved, ...updated];
      });
    }} />}
  </section>;
}
