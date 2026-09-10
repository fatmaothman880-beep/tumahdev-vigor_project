import React, { useCallback, useEffect, useState } from 'react';
import { History, Plus } from 'lucide-react';
import { Modal, SectionHeader } from './KpiCard';
import { USE_MOCK_API } from '../../api/client';
import * as workflow from '../../api/workflowApi';

const label = (value: string) => value.replaceAll('_', ' ').toLowerCase();
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unable to load the operational checklist.';
const displayDate = (value: string | null) =>
  value ? new Date(value).toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' }) : 'Not set';

interface EditorState {
  title: string;
  category: string;
  owner: string;
  due: string;
  completed: string;
  status: workflow.TaskStatus;
  blocksDeparture: boolean;
  reason: string;
  evidence: string;
  performedBy: string;
  changeReason: string;
}

function TaskEditor({
  visitId,
  task,
  initialActor,
  onClose,
  onSaved,
}: {
  visitId: string;
  task?: workflow.OperationalTask;
  initialActor: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const localValue = (value: string | null | undefined) => {
    if (!value) return '';
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
  };
  const [form, setForm] = useState<EditorState>({
    title: task?.title ?? '',
    category: task?.category ?? 'OTHER',
    owner: task?.owner_name ?? '',
    due: localValue(task?.due_at),
    completed: localValue(task?.completed_at),
    status: task?.status ?? 'NOT_STARTED',
    blocksDeparture: task?.blocks_departure ?? false,
    reason: task?.reason ?? '',
    evidence: task?.evidence_reference ?? '',
    performedBy: initialActor,
    changeReason: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof EditorState>(key: K, value: EditorState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await workflow.saveTask(
        visitId,
        {
          performed_by: form.performedBy.trim(),
          title: form.title.trim(),
          category: form.category,
          owner_name: form.owner.trim() || null,
          due_at: form.due ? new Date(form.due).toISOString() : null,
          completed_at:
            form.status === 'COMPLETED' && form.completed
              ? new Date(form.completed).toISOString()
              : null,
          status: form.status,
          blocks_departure: form.blocksDeparture,
          reason: form.reason.trim(),
          evidence_reference: form.evidence.trim(),
        },
        task,
        form.changeReason.trim()
      );
      onSaved();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={task ? 'Update Operational Task' : 'Add Operational Task'}
      subtitle="Record responsibility, timing, status and supporting reference."
    >
      <form onSubmit={submit} className="space-y-4 text-xs">
        <label className="block font-semibold text-[#14181A]">
          Task *
          <input required maxLength={150} value={form.title} onChange={(e) => set('title', e.target.value)} className="mt-1 w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg" />
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block font-semibold text-[#14181A]">
            Category
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className="mt-1 w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg">
              {[...new Set([form.category, 'CARGO_ORDER', 'PRE_ARRIVAL', 'PILOT', 'TUGBOAT', 'FUEL', 'PAYMENT', 'PORT_CLEARANCE', 'DISCHARGE', 'OTHER'])].map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label className="block font-semibold text-[#14181A]">
            Responsible person / organisation
            <input maxLength={150} value={form.owner} onChange={(e) => set('owner', e.target.value)} className="mt-1 w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg" />
          </label>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block font-semibold text-[#14181A]">
            Deadline (local time)
            <input type="datetime-local" value={form.due} onChange={(e) => set('due', e.target.value)} className="mt-1 w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg" />
          </label>
          <label className="block font-semibold text-[#14181A]">
            Status
            <select value={form.status} onChange={(e) => set('status', e.target.value as workflow.TaskStatus)} className="mt-1 w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg">
              {(['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'NOT_APPLICABLE'] as const).map((status) => <option key={status} value={status}>{label(status)}</option>)}
            </select>
          </label>
        </div>
        <p className="text-[#3F4A47]">An unset deadline is unscheduled, not on time. No general 24–48-hour rule is assumed.</p>
        {form.status === 'COMPLETED' && (
          <label className="block font-semibold text-[#14181A]">
            Actual completion (blank means now)
            <input type="datetime-local" value={form.completed} onChange={(e) => set('completed', e.target.value)} className="mt-1 w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg" />
          </label>
        )}
        <label className="flex items-center gap-2 font-semibold text-[#14181A]">
          <input type="checkbox" checked={form.blocksDeparture} onChange={(e) => set('blocksDeparture', e.target.checked)} />
          Required for departure checklist
        </label>
        <label className="block font-semibold text-[#14181A]">
          Reason / operational remarks
          <textarea required={form.status === 'BLOCKED' || form.status === 'NOT_APPLICABLE'} maxLength={4000} rows={3} value={form.reason} onChange={(e) => set('reason', e.target.value)} className="mt-1 w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg" />
        </label>
        <label className="block font-semibold text-[#14181A]">
          Evidence reference
          <input maxLength={500} value={form.evidence} onChange={(e) => set('evidence', e.target.value)} placeholder="Document number or approved-system reference" className="mt-1 w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg" />
        </label>
        <label className="block font-semibold text-[#14181A]">
          Recorded by (your name) *
          <input required maxLength={150} value={form.performedBy} onChange={(e) => set('performedBy', e.target.value)} className="mt-1 w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg" />
        </label>
        {task && (
          <label className="block font-semibold text-[#14181A]">
            Reason for this change *
            <input required maxLength={1000} value={form.changeReason} onChange={(e) => set('changeReason', e.target.value)} className="mt-1 w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg" />
          </label>
        )}
        <p className="text-[#3F4A47]">Recorder names are self-reported and are not authenticated approvals.</p>
        {error && <p role="alert" className="text-[#AE3B2E] font-semibold">{error}</p>}
        <div className="flex justify-end gap-2 pt-3 border-t border-[#E1DED4]">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-[#E1DED4] rounded-lg">Cancel</button>
          <button disabled={saving} className="px-4 py-2 bg-[#0C9349] text-white rounded-lg disabled:opacity-60">{saving ? 'Saving…' : 'Save Task'}</button>
        </div>
      </form>
    </Modal>
  );
}

export function OperationalChecklist({ vesselId, visitId, readOnly = false }: { vesselId: string; visitId?: string; readOnly?: boolean }) {
  const [data, setData] = useState<workflow.ChecklistResponse | null>(null);
  const [actor, setActor] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<workflow.OperationalTask | 'new' | null>(null);
  const [history, setHistory] = useState<workflow.TaskHistoryEntry[] | null>(null);
  const [databaseVisitId, setDatabaseVisitId] = useState<string | null>(null);
  const databaseVisit = databaseVisitId !== null;

  useEffect(() => {
    let active = true;
    setDatabaseVisitId(null);
    if (USE_MOCK_API) return;
    void workflow.findChecklistVisitId(vesselId, visitId)
      .then((id) => { if (active) setDatabaseVisitId(id); })
      .catch((error) => { if (active) setError(errorMessage(error)); });
    return () => { active = false; };
  }, [vesselId, visitId]);

  const load = useCallback(async () => {
    if (!databaseVisit || USE_MOCK_API) return;
    try {
      setData(await workflow.getChecklist(databaseVisitId!));
      setError('');
    } catch (error) {
      setError(errorMessage(error));
    }
  }, [databaseVisit, databaseVisitId]);

  useEffect(() => {
    setData(null);
    setHistory(null);
    void load();
    if (!databaseVisit || USE_MOCK_API) return;
    const timer = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(timer);
  }, [databaseVisit, load]);

  async function addTemplates() {
    if (!actor.trim()) {
      setError('Enter your name before adding suggested tasks.');
      return;
    }
    setBusy(true);
    try {
      setData(await workflow.addSuggestedTasks(databaseVisitId!, actor.trim()));
      setError('');
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-white border border-[#E1DED4] rounded-xl p-5 shadow-xs">
      <SectionHeader title="Operational Checklist" description="Responsibility, deadlines, evidence and recorded changes for this database visit." />
      {!databaseVisit || USE_MOCK_API ? (
        <p className="text-xs text-[#3F4A47]">{USE_MOCK_API ? 'Checklist recording is available in live API mode. No demonstration checklist is presented as an official record.' : 'Create a database visit for this vessel before recording its operational checklist.'}</p>
      ) : (
        <>
          <p className="text-xs text-[#3F4A47] mb-3">Checklist tracking only—it is not official clearance or departure approval.</p>
          {error && <p role="alert" className="mb-3 text-xs font-semibold text-[#AE3B2E]">{error}</p>}
          {data && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs">
                <span className="rounded-lg bg-[#F7F5F0] p-2"><strong>{data.overdue_count}</strong> overdue</span>
                <span className="rounded-lg bg-[#F7F5F0] p-2"><strong>{data.unassigned_count}</strong> unassigned</span>
                <span className="rounded-lg bg-[#F7F5F0] p-2"><strong>{data.unscheduled_count}</strong> unscheduled</span>
                <span className="rounded-lg bg-[#E7F4EB] p-2"><strong>{label(data.checklist_state)}</strong></span>
              </div>
              {!readOnly && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <input aria-label="Your name for checklist changes" value={actor} onChange={(e) => setActor(e.target.value)} placeholder="Your name (self-reported)" maxLength={150} className="px-3 py-2 text-xs border border-[#E1DED4] rounded-lg" />
                  <button disabled={busy} onClick={addTemplates} className="px-3 py-2 text-xs font-semibold border border-[#C9C4B6] rounded-lg disabled:opacity-60">Add Suggested Checklist</button>
                  <button onClick={() => setEditing('new')} className="px-3 py-2 text-xs font-semibold text-white bg-[#0C9349] rounded-lg flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add Task</button>
                </div>
              )}
              {data.tasks.length === 0 ? (
                <p className="text-xs text-[#3F4A47]">No tasks configured. Clearance readiness is not assumed.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead><tr className="border-b border-[#E1DED4] text-[#3F4A47]"><th className="py-2 pr-3">Task / Owner</th><th className="pr-3">Deadline</th><th className="pr-3">Status / Timing</th><th>Actions</th></tr></thead>
                    <tbody>{data.tasks.map((task) => (
                      <tr key={task.id} className="border-b border-[#E1DED4] align-top">
                        <td className="py-3 pr-3"><strong>{task.title}</strong><div className="text-[#3F4A47]">{task.owner_name || 'Unassigned'}{task.blocks_departure ? ' · Departure item' : ''}</div>{task.reason && <div className="mt-1 text-[#3F4A47]">{task.reason}</div>}</td>
                        <td className="py-3 pr-3 font-mono">{displayDate(task.due_at)}{task.completed_at && <div className="text-[#3F4A47]">Completed: {displayDate(task.completed_at)}</div>}</td>
                        <td className={`py-3 pr-3 ${task.timeliness === 'OVERDUE' || task.status === 'BLOCKED' ? 'text-[#AE3B2E]' : ''}`}><span className="font-semibold">{label(task.status)}</span><div>{label(task.timeliness)}{task.delay_minutes > 0 ? ` · ${task.delay_minutes} min late` : ''}</div></td>
                        <td className="py-3 whitespace-nowrap">{!readOnly && <button onClick={() => setEditing(task)} className="text-[#0E7C86] font-semibold mr-3">Update</button>}<button onClick={async () => { try { setHistory(await workflow.getTaskHistory(databaseVisitId!, task.id)); } catch (error) { setError(errorMessage(error)); } }} className="text-[#0E7C86] font-semibold"><History className="inline w-3.5 h-3.5 mr-1" />History</button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </>
          )}
          {!data && !error && <p className="text-xs text-[#3F4A47]">Loading checklist…</p>}
        </>
      )}
      {editing && databaseVisitId && <TaskEditor visitId={databaseVisitId} task={editing === 'new' ? undefined : editing} initialActor={actor} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load(); }} />}
      <Modal isOpen={history !== null} onClose={() => setHistory(null)} title="Recorded Task Changes" subtitle="Self-reported recorder names; not an authenticated approval log.">
        {!history?.length ? <p className="text-xs text-[#3F4A47]">No history entries.</p> : history.map((entry) => (
          <div key={entry.id} className="py-3 border-b border-[#E1DED4] text-xs"><strong>{entry.performed_by}</strong> · {displayDate(entry.occurred_at)}<p className="text-[#3F4A47]">{String(entry.new_value.change_reason || '')}</p><details className="mt-1"><summary className="cursor-pointer text-[#0E7C86]">Show before / after</summary><pre className="mt-2 whitespace-pre-wrap break-words bg-[#F7F5F0] p-2 rounded">{JSON.stringify({ before: entry.old_value, after: entry.new_value }, null, 2)}</pre></details></div>
        ))}
      </Modal>
    </section>
  );
}
