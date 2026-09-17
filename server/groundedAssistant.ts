import { detectIntent } from './assistantSearch';
import { normalizeSiteTerminology } from '../src/lib/siteTerminology';

type Row = Record<string, any>;
export interface AssistantRecords {
  state: Row;
  vessels: Row[];
  visits: { visit: Row; vessel: Row }[];
  berths: Row[];
  forecasts: Record<string, Row>;
  checkedAt: string;
}
export async function loadAssistantRecords(): Promise<AssistantRecords> {
  const base = (process.env.OPERATIONS_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/+$/, '');
  async function read(path: string) {
    const response = await fetch(base + path, { signal: AbortSignal.timeout(10000), redirect: 'error' });
    if (!response.ok) throw new Error('Operational records unavailable');
    return response.json();
  }
  async function all(path: string) {
    const rows: Row[] = [];
    for (let offset = 0; ; offset += 100) {
      const page = await read(`${path}?limit=100&offset=${offset}`);
      if (!Array.isArray(page)) throw new Error('Invalid record list');
      rows.push(...page);
      if (page.length < 100) return rows;
    }
  }
  const [saved, vessels, visits, berths, forecasts] = await Promise.all([
    read('/operations/state'), all('/vessels'), read('/integration/visits'),
    all('/berths'), read('/integration/predictions'),
  ]);
  return normalizeSiteTerminology({ state: saved.state ?? {}, vessels, visits, berths, forecasts, checkedAt: new Date().toISOString() });
}

const normalize = (value: string) => value.toLowerCase().replace(/\bmv\b/g, '')
  .replace(/([a-z])(\d)/g, '$1 $2').replace(/[^a-z0-9]+/g, ' ')
  .replace(/\b0+(\d)/g, '$1').trim();
const date = (value?: string) => value && Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleString('en-GB', { timeZone: 'Africa/Dar_es_Salaam', dateStyle: 'medium', timeStyle: 'short' }) + ' EAT' : null;
const recent = (rows: Row[]) => [...rows].sort((a, b) => (Date.parse(b.updated_at || b.updatedAt || b.created_at || b.createdAt) || 0) - (Date.parse(a.updated_at || a.updatedAt || a.created_at || a.createdAt) || 0));

export function fleetFrom(records: AssistantRecords): Row[] {
  const fleet: Row[] = (records.state.vessels ?? []).map((v: Row) => ({ ...v }));
  for (const v of records.vessels) {
    const existing = fleet.find(x => x.id === v.id || (x.imo && x.imo === v.imo_reference) || normalize(x.name) === normalize(v.name));
    if (existing) existing.databaseId = v.id;
    else fleet.push({ ...v, databaseId: v.id });
  }
  return fleet;
}

export async function answerFromRecords(prompt: string, history: { role: string; content: string }[], records: AssistantRecords) {
  const fleet = fleetFrom(records);
  const classified = await detectIntent(prompt);
  let intent = classified.intent;
  const findMention = (text: string) => fleet.filter(v => {
    const query = normalize(text);
    return (' ' + query + ' ').includes(' ' + normalize(v.name) + ' ') || (v.imo && (' ' + query + ' ').includes(' ' + normalize(v.imo) + ' '));
  });
  let matches = findMention(prompt);
  // Resolve pronouns from previous user questions only; never trust chat as data.
  if (!matches.length && /\b(it|she|her|that vessel|this vessel|its)\b/i.test(prompt)) {
    for (const item of [...history].reverse()) {
      if (item.role !== 'user') continue;
      matches = findMention(item.content);
      if (matches.length) break;
    }
  }
  const actions: { label: string; page: string; vesselId?: string }[] = [];
  let answer = '';
  let basis = 'Saved system records';
  const link = (label: string, page: string, vesselId?: string) => actions.push({ label, page, ...(vesselId ? { vesselId } : {}) });
  const vessel = matches.length === 1 ? matches[0] : undefined;
  if (matches.length > 1 && intent !== 'fleet') {
    answer = `Which vessel do you mean: ${matches.map(v => v.name).join(', ')}?`;
    matches.forEach(v => link(`View ${v.name}`, 'vessel-detail', v.id));
  } else if (intent === 'fleet') {
    const selected = /\binactive\b/i.test(prompt) ? fleet.filter(v => v.active === false)
      : /\bactive\b/i.test(prompt) ? fleet.filter(v => v.active === true) : fleet;
    answer = `The system has ${selected.length} ${/\binactive\b/i.test(prompt) ? 'inactive ' : /\bactive\b/i.test(prompt) ? 'active ' : ''}vessel${selected.length === 1 ? '' : 's'} recorded${selected.length ? ': ' + selected.map(v => v.name).join(', ') : ''}.`;
    link('View all vessels', 'vessels');
    selected.slice(0, 10).forEach(v => link(`View ${v.name}`, 'vessel-detail', v.id));
  } else if (vessel && ['location', 'forecast', 'unknown'].includes(intent)) {
    const visits = records.visits.filter(p => p.visit.vessel_id === (vessel.databaseId || vessel.id));
    const activeVisits = recent(visits.map(p => p.visit).filter(v => ['ARRIVED', 'BERTHED', 'UNLOADING', 'DELAYED', 'COMPLETED'].includes(v.status)));
    const visit = activeVisits[0];
    const voyage = recent((records.state.voyages ?? []).filter((v: Row) => v.vesselId === vessel.id && v.status === 'ACTIVE'))[0];
    const stage = visit?.status || voyage?.currentStage;
    const berthId = visit?.berth_id || voyage?.assignedBerthId;
    const berth = [...records.berths, ...(records.state.berths ?? [])].find(b => b.id === berthId);
    const place = berth ? `${berth.location ? berth.location + ', ' : ''}${berth.name}` : 'its assigned berth';
    basis = visit ? 'Recorded database visit' : 'Saved voyage status';
    if (activeVisits.length > 1) {
      answer = `${vessel.name} has more than one open visit. Please review the visits before treating a location or finish time as current.`;
    } else if (intent === 'forecast') {
      const forecast = records.forecasts[visit?.id || voyage?.id];
      answer = forecast?.estimated_unload_finish
        ? `${vessel.name} is estimated to finish unloading on ${date(forecast.estimated_unload_finish)}.${forecast.expected_berth_release ? ' Expected berth release: ' + date(forecast.expected_berth_release) + '.' : ''}${forecast.remaining_t != null ? ' Remaining cargo: ' + Number(forecast.remaining_t).toLocaleString('en-GB') + ' tonnes.' : ''}`
        : `There is no valid current unloading forecast for ${vessel.name}. A linked database visit and usable recent readings are needed.`;
    } else {
      const statuses: Record<string, string> = {
        UNLOADING: `at ${place}, unloading`, BERTHED: `at ${place}, berthed`, BERTHED_AT_VIGOR: `at ${place}, berthed`,
        ARRIVED: 'recorded as arrived; berthing has not yet been confirmed',
        DELAYED: `delayed during its visit at ${place}`, UNLOADING_DELAYED: `at ${place}, with unloading delayed`,
        COMPLETED: `at the end of unloading at ${place}; departure is not confirmed`,
        UNLOADING_COMPLETE: `finished unloading at ${place}`,
        SAILING_TO_MANUFACTURER: `sailing to ${voyage?.manufacturerName || 'the manufacturer'}`,
        RETURNING_TO_VIGOR: 'returning to VIGOR', SAILING_TO_VIGOR: 'sailing to VIGOR',
        APPROACHING_VIGOR: 'approaching VIGOR', WAITING_FOR_VIGOR_BERTH: 'waiting for a VIGOR berth',
        LOADING: `loading at ${voyage?.manufacturerName || 'the manufacturer'}`,
        WAITING_AT_MANUFACTURER: `waiting at ${voyage?.manufacturerName || 'the manufacturer'}`,
        WAITING_FOR_FUEL: 'waiting for fuel', FUEL_IN_PROGRESS: 'being fuelled',
        MAINTENANCE: 'under maintenance', OUT_OF_SERVICE: 'out of service',
      };
      answer = statuses[stage] ? `${vessel.name} is ${statuses[stage]}, according to the latest recorded status.`
        : `${vessel.name} is registered, but its current operational location is not confirmed in the available records.`;
    }
    const updated = date(visit?.updated_at || voyage?.updatedAt);
    if (updated) answer += ` Record updated: ${updated}.`;
    link(`View ${vessel.name}`, 'vessel-detail', vessel.id);
    if (berth) link('View berth details', 'berths');
  } else if (intent === 'berths') {
    const berths = records.state.berths?.length ? records.state.berths : records.berths;
    answer = berths.length ? berths.map((b: Row) => `${b.name}: ${String(b.status || 'status not recorded').toLowerCase().replaceAll('_', ' ')}`).join('; ') + '.' : 'No berths are recorded.';
    link('View berths', 'berths');
  } else if (intent === 'delays') {
    const delays = (records.state.delayEvents ?? []).filter((d: Row) => !d.resolved && (!vessel || d.vesselId === vessel.id));
    answer = delays.length ? `${delays.length} unresolved delay${delays.length === 1 ? '' : 's'} recorded: ` + delays.map((d: Row) => d.description || d.category).join('; ') + '.'
      : `No unresolved delays are recorded${vessel ? ' for ' + vessel.name : ' in the saved operations data'}. I cannot infer an unrecorded cause.`;
    link('View operational alerts', 'alerts');
    if (vessel) link(`View ${vessel.name}`, 'vessel-detail', vessel.id);
  } else if (intent === 'fuel') {
    const fuel = (records.state.fuelOperations ?? []).filter((f: Row) => !vessel || f.vesselId === vessel.id);
    answer = fuel.length ? fuel.map((f: Row) => `${fleet.find(v => v.id === f.vesselId)?.name || 'Recorded vessel'}: ${String(f.status).toLowerCase().replaceAll('_', ' ')}${f.quantity != null ? ', ' + f.quantity + ' ' + (f.unit || 'units') : ''}`).join('; ') + '.' : 'No matching fuel operations are recorded.';
    link('View fuel operations', 'fuel');
  } else if (intent === 'payments') {
    const accounts = (records.state.paymentAccounts ?? []).filter((a: Row) => !vessel || a.vesselId === vessel.id);
    answer = accounts.length ? accounts.map((a: Row) => {
      const paid = (records.state.paymentTransactions ?? []).filter((t: Row) => t.paymentAccountId === a.id).reduce((sum: number, t: Row) => sum + Number(t.amount || 0), 0);
      return `${a.counterpartyName || a.invoiceNumber}: ${a.currency} ${Math.max(0, Number(a.requiredAmount) - paid).toLocaleString('en-GB')} outstanding`;
    }).join('; ') + '.' : 'No matching payment accounts are recorded.';
    link('View payments', 'payments');
  } else {
    answer = ['location', 'forecast'].includes(intent)
      ? 'Which vessel do you mean? Please use a vessel name from the register.'
      : 'I can answer questions about registered vessels, their recorded status, unloading forecasts, berths, delays, fuel and payments. Please name a vessel or ask, “How many vessels do we have?”';
    link('View vessel register', 'vessels');
  }
  return { answer, severity: 'info', statusBadge: basis, actions, relatedRoute: actions[0]?.page, routeLabel: actions[0]?.label,
    vesselId: actions[0]?.vesselId, checkedAt: records.checkedAt, retrieval: classified.method };
}
