import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../../api/client';
import { getVisitList, type VisitListItem } from '../../api/visitApi';
import { getChecklist, type ChecklistResponse } from '../../api/workflowApi';
import { useAuth } from '../../auth/AuthContext';
import { canEditOperations } from '../../../shared/roles';
import { PageHeader, KpiCard } from './KpiCard';
import { EditVesselOperation } from './EditVesselOperation';
import { groupDashboardVisits } from '../../lib/visitDashboard';

interface Prediction {
  unloaded_t: number | string;
  remaining_t: number | string;
  progress_pct: number | string;
  effective_rate_tph: number | string | null;
  estimated_unload_finish: string | null;
  expected_berth_release: string | null;
  data_quality: string;
}
const date = (value?: string | null) => value ? new Date(value).toLocaleString('en-GB', { timeZone: 'Africa/Dar_es_Salaam', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }) : 'Not recorded';
const tonnes = (value: string | number | null | undefined) => value == null ? 'Not recorded' : `${Number(value).toLocaleString()} t`;

export function LiveVisitDashboard({ title }: { title: string }) {
  const { user } = useAuth();
  const canEdit = canEditOperations(user?.role);
  const [rows, setRows] = useState<VisitListItem[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [checklists, setChecklists] = useState<Record<string, ChecklistResponse>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [updated, setUpdated] = useState<string | null>(null);
  const [selected, setSelected] = useState<VisitListItem | null>(null);
  const mounted = useRef(false);
  const busy = useRef(false);
  const load = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    try {
      const [visitsResult, predictionResult] = await Promise.allSettled([
        getVisitList(), apiFetch<Record<string, Prediction>>('/integration/predictions'),
      ]);
      if (!mounted.current) return;
      if (visitsResult.status === 'rejected') throw visitsResult.reason;
      const visits = visitsResult.value;
      const { upcoming, active } = groupDashboardVisits(visits);
      const relevant = [...active, ...upcoming];
      const checklistResults = await Promise.allSettled(relevant.map(row => getChecklist(row.visit.id)));
      if (!mounted.current) return;
      const nextChecklists: Record<string, ChecklistResponse> = {};
      checklistResults.forEach((result, i) => { if (result.status === 'fulfilled') nextChecklists[relevant[i].visit.id] = result.value; });
      setRows(visits);
      setPredictions(predictionResult.status === 'fulfilled' ? predictionResult.value : {});
      setChecklists(nextChecklists);
      setWarning([
        predictionResult.status === 'rejected' ? 'Unloading figures are temporarily unavailable.' : '',
        checklistResults.some(result => result.status === 'rejected') ? 'Some checklist summaries are temporarily unavailable.' : '',
      ].filter(Boolean).join(' '));
      setError(''); setUpdated(new Date().toISOString());
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Unable to load vessel visits.');
    } finally {
      busy.current = false;
      if (mounted.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => { mounted.current = false; window.clearInterval(timer); };
  }, [load]);
  const { upcoming, active, unloading, berthed, arrived, delayed } = groupDashboardVisits(rows);
  const renderVisit = (row: VisitListItem) => {
    const { visit, vessel } = row;
    const prediction = predictions[visit.id];
    const checklist = checklists[visit.id];
    return <article key={visit.id} className="bg-white border border-[#E1DED4] rounded-xl p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold">{vessel.name}</h3>
        <span className={`text-xs font-semibold px-2 py-1 rounded ${visit.status === 'DELAYED' ? 'bg-[#F8E7E3] text-[#AE3B2E]' : 'bg-[#E7F4EB] text-[#0A7A3D]'}`}>{visit.status}</span>
      </div>
      <p className="text-sm">{visit.cargo_type} · {tonnes(visit.cargo_total_t)}</p>
      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div><dt>Planned arrival (EAT)</dt><dd className="font-semibold">{date(visit.planned_arrival)}</dd></div>
        <div><dt>Actual arrival (EAT)</dt><dd className="font-semibold">{date(visit.actual_arrival)}</dd></div>
        <div><dt>Unloaded</dt><dd className="font-semibold">{tonnes(prediction?.unloaded_t)}</dd></div>
        <div><dt>Remaining</dt><dd className="font-semibold">{tonnes(prediction?.remaining_t)}</dd></div>
        <div><dt>Measured unloading rate</dt><dd className="font-semibold">{prediction?.effective_rate_tph == null ? 'Not available' : `${Number(prediction.effective_rate_tph).toLocaleString()} t/h`}</dd></div>
        <div><dt>Estimated finish (EAT)</dt><dd className="font-semibold">{prediction?.estimated_unload_finish ? date(prediction.estimated_unload_finish) : 'Not available'}</dd></div>
      </dl>
      {prediction && <div><progress aria-label={`Unloading progress for ${vessel.name}`} max={100} value={Math.min(100, Math.max(0, Number(prediction.progress_pct)))} className="w-full accent-[#0C9349]" /><p className="text-xs">{Number(prediction.progress_pct).toFixed(1)}% unloaded · Data quality: {prediction.data_quality.toLowerCase()}</p></div>}
      <div className="text-xs border-t pt-3">{checklist ? <><p className="font-semibold">Checklist: {checklist.tasks.filter(task => task.status === 'COMPLETED').length}/{checklist.tasks.length} completed</p><p>{checklist.overdue_count} overdue · {checklist.unassigned_count} unassigned · {checklist.unscheduled_count} unscheduled</p></> : 'Checklist summary unavailable'}</div>
      <button type="button" onClick={() => setSelected(row)} className="px-3 py-2 text-xs rounded-lg bg-[#0C9349] text-white">{canEdit ? 'Edit operation & checklist' : 'View operation & checklist'}</button>
    </article>;
  };
  return <div className="space-y-6 pb-12">
    <PageHeader title={title} eyebrow="LIVE VESSEL OPERATIONS" description="Saved port visits, cargo progress and operational checklists.">
      <button onClick={() => void load()} disabled={loading} className="px-3 py-2 rounded-lg border text-xs disabled:opacity-50">{loading ? 'Refreshing…' : 'Refresh dashboard'}</button>
    </PageHeader>
    {error && <p role="alert" className="text-sm text-[#AE3B2E]">{error}{updated ? ' Showing the last successful update.' : ''}</p>}
    {warning && <p role="status" className="text-sm text-[#B5760F]">{warning}</p>}
    {updated && <p className="text-xs text-[#3F4A47]">Updated {date(updated)} EAT · Refreshes every 30 seconds</p>}
    {loading && !updated && <p role="status">Loading saved vessel visits…</p>}
    {updated && <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard label="Upcoming visits" value={upcoming.length} />
        <KpiCard label="Arrived" value={arrived.length} />
        <KpiCard label="Berthed" value={berthed.length} />
        <KpiCard label="Unloading" value={unloading.length} variant="success" />
        <KpiCard label="Delayed" value={delayed.length} />
      </div>
      <section className="space-y-3"><h2 className="text-lg font-bold">Active operations ({active.length})</h2>{active.length ? <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">{active.map(renderVisit)}</div> : <p className="text-sm">No arrived, berthed, delayed or unloading visits. Record arrival from Vessels → Vessel Visits when the vessel arrives.</p>}</section>
      <section className="space-y-3"><h2 className="text-lg font-bold">Upcoming arrivals ({upcoming.length})</h2>{upcoming.length ? <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">{upcoming.map(renderVisit)}</div> : <p className="text-sm">No planned visits. Add a vessel visit from the Vessels page.</p>}</section>
    </>}
    {selected && <EditVesselOperation row={selected} onClose={() => { setSelected(null); void load(); }} onSaved={() => { void load(); }} />}
  </div>;
}
