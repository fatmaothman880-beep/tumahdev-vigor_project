import type { VisitListItem } from '../api/visitApi';

export function groupDashboardVisits(rows: VisitListItem[]) {
  const upcoming = rows.filter(row => row.visit.status === 'PLANNED').sort((a, b) =>
    (a.visit.planned_arrival ? Date.parse(a.visit.planned_arrival) : Infinity) -
    (b.visit.planned_arrival ? Date.parse(b.visit.planned_arrival) : Infinity));
  const active = rows.filter(row => ['ARRIVED', 'BERTHED', 'UNLOADING', 'DELAYED'].includes(row.visit.status));
  return {
    upcoming, active,
    arrived: active.filter(row => row.visit.status === 'ARRIVED'),
    berthed: active.filter(row => row.visit.status === 'BERTHED'),
    unloading: active.filter(row => row.visit.status === 'UNLOADING'),
    delayed: active.filter(row => row.visit.status === 'DELAYED'),
  };
}
