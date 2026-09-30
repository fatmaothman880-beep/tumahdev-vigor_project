import { VisitStatusBadge } from './StatusBadge';
import { Feedback } from './Feedback';
import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../api/client';
import { getVisitList, type VisitListItem } from '../../api/visitApi';
import { controlTowerRows, timelineRange, type VisitForecast } from '../../lib/controlTower';
import { PageHeader } from './KpiCard';
import { EditVesselOperation } from './EditVesselOperation';

const date = (value?: string | null) => value && Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleString('en-GB', { timeZone: 'Africa/Dar_es_Salaam', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
  : 'Not available';

export function LiveControlTower({ children }: { children?: React.ReactNode }) {
  const [visits, setVisits] = useState<VisitListItem[]>([]);
  const [forecasts, setForecasts] = useState<Record<string, VisitForecast>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [days, setDays] = useState<7 | 14 | 30>(7);
  const [selected, setSelected] = useState<VisitListItem | null>(null);
  useEffect(() => {
    let active = true;
    let busy = false;
    const load = async () => {
      if (busy) return;
      busy = true;
      setLoading(true);
      try {
        const [visitResult, forecastResult] = await Promise.allSettled([
          getVisitList(), apiFetch<Record<string, VisitForecast>>('/integration/predictions'),
        ]);
        if (!active) return;
        if (visitResult.status === 'rejected') throw visitResult.reason;
        setVisits(visitResult.value);
        setForecasts(forecastResult.status === 'fulfilled' ? forecastResult.value : {});
        setError(forecastResult.status === 'rejected' ? 'Unable to refresh forecasts. Visit plans are available; retry to load current estimates.' : '');
        setUpdated(new Date().toISOString());
      } catch (err) {
        if (active) {
          setForecasts({});
          setError(err instanceof Error ? err.message : 'Unable to load saved visits.');
        }
      } finally {
        busy = false;
        if (active) setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [refresh]);
  const rows = controlTowerRows(visits, forecasts);
  const now = Date.now();
  return <div className="space-y-6 pb-12">
    <PageHeader eyebrow="LIVE PORT VISITS" title="Operations Control Tower" description="Saved arrivals, unloading forecasts and expected berth release. All times are East Africa Time (EAT).">
      <button disabled={loading} onClick={() => setRefresh(n => n + 1)} className="button-secondary">{loading ? 'Refreshing…' : 'Refresh'}</button>
    </PageHeader>
    {error && <p role="alert" className="text-sm text-danger">{error}{updated ? ' Visit list last loaded ' + date(updated) + ' EAT.' : ''}</p>}
    {updated && !error && <p className="text-xs text-muted">Updated {date(updated)} EAT · Refreshes every 30 seconds</p>}
    {loading && !updated && <Feedback kind="loading" title="Loading saved vessel visits" />}
    <section className="bg-surface border border-line rounded-xl p-5 space-y-4" aria-label="Live visit timeline">
      <div className="flex flex-wrap justify-between gap-3">
        <h2 className="font-bold">Arrivals & unloading horizon</h2>
        <div className="flex gap-2">{([7, 14, 30] as const).map(value => <button key={value} aria-pressed={days === value} onClick={() => setDays(value)} className={`px-3 py-1 text-xs rounded border ${days === value ? 'bg-shell text-white' : ''}`}>{value} DAYS</button>)}</div>
      </div>
      <p className="text-xs text-muted">Green: backend unloading estimate · Blue: planned unloading window. Missing estimates do not imply an available berth.</p>
      <div className="flex justify-between text-xs font-mono"><span>{date(new Date(now).toISOString())}</span><span>{date(new Date(now + days * 86400000).toISOString())} EAT</span></div>
      {!loading && !error && rows.length === 0 && <p>No active or planned vessel visits. Add a visit from the Vessels page.</p>}
      {rows.map(({ visit, vessel, forecast, explanation }) => {
        const estimated = forecast?.estimated_unload_finish;
        const range = estimated
          ? timelineRange(visit.unload_start || visit.planned_unload_start || visit.actual_arrival, estimated, now, days)
          : visit.status === 'PLANNED' ? timelineRange(visit.planned_unload_start, visit.planned_completion, now, days) : null;
        return <article key={visit.id} className="border-t border-line pt-4 space-y-2">
          <div className="flex flex-wrap justify-between gap-2">
            <button className="text-sm font-semibold text-foreground hover:text-info" onClick={() => setSelected({ visit, vessel })}>{vessel.name}</button><VisitStatusBadge status={visit.status} />
            <span className="text-xs">{visit.cargo_type} · {Number(visit.cargo_total_t || 0).toLocaleString()} t</span>
          </div>
          <div className="relative h-8 bg-canvas rounded overflow-hidden" aria-label={`Timeline for ${vessel.name}`}>
            {range ? <div style={range} className={`absolute h-full rounded ${estimated ? 'bg-brand' : 'bg-info-strong'}`} title={`${estimated ? 'Backend estimate' : 'Planned unloading'}: ${date(estimated || visit.planned_completion)} EAT`} />
              : <span className="px-2 text-xs leading-8">{estimated ? 'Estimate outside this horizon or unloading start not recorded' : 'No unloading window to plot'}</span>}
          </div>
          <dl className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            <div><dt>Planned arrival</dt><dd>{date(visit.planned_arrival)}</dd></div>
            <div><dt>Actual arrival</dt><dd>{date(visit.actual_arrival)}</dd></div>
            <div><dt>Forecast unloading finish</dt><dd className="font-semibold">{date(estimated)}</dd></div>
            <div><dt>Expected berth release</dt><dd className="font-semibold">{date(forecast?.expected_berth_release)}</dd></div>
          </dl>
          {forecast && <p className="text-xs">Recorded progress: {Number(forecast.unloaded_t).toLocaleString()} t unloaded · {Number(forecast.remaining_t).toLocaleString()} t remaining · Rate: {forecast.effective_rate_tph == null ? 'Not available' : `${Number(forecast.effective_rate_tph).toLocaleString()} t/h`}</p>}
          {explanation && <p className="text-xs text-warning">{explanation}</p>}
        </article>;
      })}
    </section>
    {children}
    {selected && <EditVesselOperation row={selected} onClose={() => { setSelected(null); setRefresh(n => n + 1); }} onSaved={() => setRefresh(n => n + 1)} />}
  </div>;
}
