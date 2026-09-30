import { VisitStatusBadge } from './StatusBadge';
import { Feedback } from './Feedback';
import { SectionHeader } from './KpiCard';
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

export function LiveVisitDashboard({ title, summary = false }: { title: string; summary?: boolean }) {
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
  const totalRemaining = unloading.reduce((sum, row) => sum + Number(predictions[row.visit.id]?.remaining_t || 0), 0);
  const checklistValues = Object.values<ChecklistResponse>(checklists);
  const unassigned = checklistValues.reduce((sum, list) => sum + list.unassigned_count, 0);
  const overdue = checklistValues.reduce((sum, list) => sum + list.overdue_count, 0);
  const renderVisit = (row: VisitListItem) => {
    const { visit, vessel } = row;
    const prediction = predictions[visit.id];
    const checklist = checklists[visit.id];
    return <article key={visit.id} className="panel p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><h3 className="font-semibold text-base">{vessel.name}</h3><p className="text-xs text-muted mt-1">{visit.cargo_type} · {tonnes(visit.cargo_total_t)}</p></div>
        <VisitStatusBadge status={visit.status} />
      </div>
      {prediction && <div className="space-y-1.5"><div className="flex justify-between text-xs"><span className="text-muted">Unloaded</span><span className="tabular-nums">{tonnes(prediction.unloaded_t)} <span className="text-muted">/ {Number(prediction.progress_pct).toFixed(1)}%</span></span></div><progress aria-label={`Unloading progress for ${vessel.name}`} max={100} value={Math.min(100, Math.max(0, Number(prediction.progress_pct)))} className="w-full" /></div>}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div><dt className="data-label">Remaining cargo</dt><dd className="data-value mt-1">{tonnes(prediction?.remaining_t)}</dd></div>
        <div><dt className="data-label">Estimated finish · EAT</dt><dd className="data-value mt-1">{prediction?.estimated_unload_finish ? date(prediction.estimated_unload_finish) : 'Not available'}</dd></div>
      </dl>
      <details className="text-xs text-muted border-t border-line pt-3"><summary>Arrival & reading details</summary><dl className="grid grid-cols-2 gap-3 mt-3"><div><dt>Planned arrival · EAT</dt><dd className="text-foreground mt-1">{date(visit.planned_arrival)}</dd></div><div><dt>Actual arrival · EAT</dt><dd className="text-foreground mt-1">{date(visit.actual_arrival)}</dd></div><div><dt>Measured rate</dt><dd className="text-foreground mt-1">{prediction?.effective_rate_tph == null ? 'Not available' : `${Number(prediction.effective_rate_tph).toLocaleString()} t/h`}</dd></div><div><dt>Data quality</dt><dd className="text-foreground mt-1">{prediction?.data_quality.toLowerCase() || 'Unavailable'}</dd></div></dl></details>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <div className="text-xs text-muted">{checklist ? <><p>{checklist.tasks.filter(task => task.status === 'COMPLETED').length}/{checklist.tasks.length} checklist tasks complete</p>{!!(checklist.overdue_count || checklist.unassigned_count || checklist.unscheduled_count) && <p className="text-warning mt-1">{checklist.overdue_count} overdue · {checklist.unassigned_count} unassigned · {checklist.unscheduled_count} unscheduled</p>}</> : 'Checklist summary unavailable'}</div>
        <button onClick={() => setSelected(row)} className="button-secondary">{canEdit ? 'Manage operation' : 'View operation'}</button>
      </div>
    </article>;
  };
  const visitTable = (list: VisitListItem[], upcomingTable = false) => <div className="panel overflow-x-auto"><table className="w-full text-left whitespace-nowrap">
    <thead className="bg-raised/40"><tr><th className="px-5 py-3">Vessel</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">{upcomingTable ? 'Cargo' : 'Remaining'}</th><th className="px-4 py-3">{upcomingTable ? 'Planned arrival · EAT' : 'Estimated finish · EAT'}</th><th className="px-5 py-3">Checklist</th></tr></thead>
    <tbody className="divide-y divide-line">{list.map(row => {
      const prediction = predictions[row.visit.id]; const checklist = checklists[row.visit.id];
      return <tr key={row.visit.id}><td className="px-5 py-4"><button className="font-medium text-foreground hover:text-info text-left" onClick={() => setSelected(row)}>{row.vessel.name}</button><p className="text-[11px] text-muted mt-1">{row.visit.cargo_type}</p></td><td className="px-4 py-4"><VisitStatusBadge status={row.visit.status} /></td><td className="px-4 py-4 text-right tabular-nums">{tonnes(upcomingTable ? row.visit.cargo_total_t : prediction?.remaining_t)}</td><td className="px-4 py-4">{upcomingTable ? date(row.visit.planned_arrival) : prediction?.estimated_unload_finish ? date(prediction.estimated_unload_finish) : 'Not available'}{!upcomingTable && prediction?.data_quality !== 'VALID' && <p className="text-[11px] text-warning mt-1">{prediction?.data_quality === 'STALE' ? 'Reading needs updating' : 'Awaiting usable readings'}</p>}</td><td className="px-5 py-4 text-muted">{checklist ? `${checklist.tasks.filter(task => task.status === 'COMPLETED').length}/${checklist.tasks.length} complete` : 'Unavailable'}{checklist && checklist.overdue_count > 0 && <p className="text-danger text-[11px] mt-1">{checklist.overdue_count} overdue</p>}</td></tr>;
    })}</tbody>
  </table></div>;
  return <div className="space-y-7 pb-6">
    <PageHeader title={title} eyebrow={summary ? 'TERMINAL OVERVIEW' : 'VESSEL OPERATIONS'} description={summary ? 'Port activity, cargo progress and the work requiring attention.' : 'Manage active visits, review readings and complete operational checklists.'}>
      <div className="flex items-center gap-3">{updated && <span className="text-[11px] text-muted hidden sm:inline">Updated {date(updated)} EAT</span>}<button onClick={() => void load()} disabled={loading} className="button-secondary">{loading ? 'Refreshing…' : 'Refresh dashboard'}</button></div>
    </PageHeader>
    {error && <Feedback kind="error" title="Unable to refresh vessel visits">{error}{updated ? ' Showing the last successful update.' : ''}</Feedback>}
    {warning && <p role="status" className="text-xs text-warning border-l-2 border-warning pl-3">{warning}</p>}
    {loading && !updated && <Feedback kind="loading" title="Loading port activity">Retrieving saved visits and operational checklists.</Feedback>}
    {updated && <>
      {summary && <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Active visits" value={active.length} subtext={`${unloading.length} unloading · ${berthed.length} berthed · ${arrived.length} arrived · ${delayed.length} delayed`} />
        <KpiCard label="Upcoming arrivals" value={upcoming.length} subtext="Planned port visits" />
        <KpiCard label="Cargo remaining" value={unloading.every(row => predictions[row.visit.id]) ? tonnes(totalRemaining) : '—'} subtext="Across unloading visits" />
        <KpiCard label="Unassigned tasks" value={checklistValues.length === active.length + upcoming.length ? unassigned : '—'} subtext={`${overdue} overdue in available checklists`} variant={unassigned || overdue ? 'warning' : 'default'} />
      </div>}
      <section><SectionHeader title={summary ? 'Active operations' : `Active operations (${active.length})`} description={summary ? 'Select a vessel to review its operation and checklist.' : undefined} />{active.length ? summary ? visitTable(active) : <div className="grid lg:grid-cols-2 gap-4">{active.map(renderVisit)}</div> : <Feedback kind="empty" title="No active port visits">Record arrival from Vessels → Vessel Visits when the vessel arrives.</Feedback>}</section>
      <section><SectionHeader title={summary ? 'Upcoming arrivals' : `Upcoming arrivals (${upcoming.length})`} />{upcoming.length ? visitTable(upcoming, true) : <Feedback kind="empty" title="No planned visits">Add a vessel visit from the Vessels page.</Feedback>}</section>
    </>}
    {selected && <EditVesselOperation row={selected} onClose={() => { setSelected(null); void load(); }} onSaved={() => { void load(); }} />}
  </div>;
}
