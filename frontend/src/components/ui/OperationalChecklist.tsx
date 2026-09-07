import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Card, SectionHeader } from "./Layout";
import { Modal } from "./Feedback";
import { inputCls } from "./Field";
import { fmtFullDateTime, toDateTimeLocal } from "../../lib/format";
import { USE_MOCK_API } from "../../api/client";
import * as api from "../../api/workflowApi";
import type { EntityId } from "../../types";

const label = (s: string) => s.replace(/_/g, " ").toLowerCase();
const message = (e: unknown) => e instanceof Error ? e.message : "Unable to load checklist";
const date = (s: string | null) => s ? fmtFullDateTime(new Date(s)) : "Not set";

function TaskEditor({visitId, task, actor, onClose, onSaved}: {visitId: EntityId; task?: api.Task; actor: string; onClose: () => void; onSaved: () => void}) {
  const [form, setForm] = useState({title:task?.title || "", category:task?.category || "OTHER", owner:task?.owner_name || "",
    due: task?.due_at ? toDateTimeLocal(new Date(task.due_at)) : "", completed: task?.completed_at ? toDateTimeLocal(new Date(task.completed_at)) : "",
    status: task?.status || "NOT_STARTED" as api.TaskStatus, blocks: task?.blocks_departure || false, reason: task?.reason || "",
    evidence: task?.evidence_reference || "", actor, changeReason:""});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const field = (key: string, value: string | boolean) => setForm(f => ({...f, [key]: value}));
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      await api.saveTask(visitId, {performed_by:form.actor, title:form.title, category:form.category, owner_name:form.owner || null,
        due_at:form.due ? new Date(form.due).toISOString() : null,
        completed_at:form.status === "COMPLETED" && form.completed ? new Date(form.completed).toISOString() : null,
        status:form.status, blocks_departure:form.blocks, reason:form.reason, evidence_reference:form.evidence}, task, form.changeReason);
      onSaved();
    } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  return <Modal title={task ? "Update operational task" : "Add operational task"} onClose={onClose}>
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm">Task<input required maxLength={150} className={inputCls()} value={form.title} onChange={e => field("title", e.target.value)} /></label>
      <label className="block text-sm">Category<select className={inputCls()} value={form.category} onChange={e => field("category", e.target.value)}>
        {[...new Set([form.category,"CARGO_ORDER","PRE_ARRIVAL","PILOT","TUGBOAT","FUEL","PAYMENT","PORT_CLEARANCE","DISCHARGE","POWER","WEATHER","OTHER"])].map(s => <option key={s}>{s}</option>)}
      </select></label>
      <label className="block text-sm">Responsible person / organisation<input maxLength={150} className={inputCls()} value={form.owner} onChange={e => field("owner",e.target.value)} placeholder="Assign the actual responsible party" /></label>
      <label className="block text-sm">Deadline (local time)<input type="datetime-local" className={inputCls()} value={form.due} onChange={e => field("due",e.target.value)} /></label>
      <p className="text-xs text-gray-500">No assumed 24–48 hour deadline. Leaving this blank means unscheduled, not on time.</p>
      <label className="block text-sm">Status<select className={inputCls()} value={form.status} onChange={e => field("status",e.target.value)}>
        {["NOT_STARTED","IN_PROGRESS","BLOCKED","COMPLETED","NOT_APPLICABLE"].map(s => <option key={s} value={s}>{label(s)}</option>)}
      </select></label>
      {form.status === "COMPLETED" && <label className="block text-sm">Actual completion (blank = now)<input type="datetime-local" className={inputCls()} value={form.completed} onChange={e => field("completed", e.target.value)} /></label>}
      <label className="block text-sm"><input type="checkbox" checked={form.blocks} onChange={e => field("blocks",e.target.checked)} /> Required for departure checklist</label>
      <label className="block text-sm">Reason / operational remarks<textarea required={form.status === "BLOCKED" || form.status === "NOT_APPLICABLE"} maxLength={4000} className={inputCls()} value={form.reason} onChange={e => field("reason", e.target.value)} /></label>
      <label className="block text-sm">Evidence reference<input maxLength={500} className={inputCls()} value={form.evidence} onChange={e => field("evidence",e.target.value)} placeholder="Document number or approved-system reference" /></label>
      <label className="block text-sm">Recorded by (your name)<input required maxLength={150} className={inputCls()} value={form.actor} onChange={e => field("actor",e.target.value)} /></label>
      {task && <label className="block text-sm">Reason for this change<input required maxLength={1000} className={inputCls()} value={form.changeReason} onChange={e => field("changeReason",e.target.value)} /></label>}
      <p className="text-xs text-gray-500">Names are self-reported. This record does not authenticate the recorder or approve departure.</p>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <button disabled={busy} className="rounded-lg px-4 py-2 text-sm text-white bg-brand-green">{busy ? "Saving…" : "Save task"}</button>
    </form>
  </Modal>;
}

export default function OperationalChecklist({visitId, readOnly = false}: {visitId: EntityId; readOnly?: boolean}) {
  const [data, setData] = useState<api.Checklist | null>(null);
  const [error, setError] = useState("");
  const [actor, setActor] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<api.Task | "new" | null>(null);
  const [history, setHistory] = useState<api.Change[] | null>(null);
  const load = useCallback(async () => {
    try { setData(await api.getTasks(visitId)); setError(""); } catch (e) { setError(message(e)); }
  }, [visitId]);
  useEffect(() => {
    setData(null); setEditing(null); setHistory(null);
    if (USE_MOCK_API) return;
    void load(); const timer = setInterval(() => { void load(); }, 30000);
    return () => clearInterval(timer);
  }, [load]);
  if (USE_MOCK_API) return <Card className="p-5 mt-4"><SectionHeader title="Operational checklist" /><p className="text-sm">Switch to API mode to record real tasks. No demo clearance is presented as real.</p></Card>;
  async function templates() {
    if (!actor.trim()) { setError("Enter your name before adding suggested tasks."); return; }
    setBusy(true);
    try { setData(await api.addTemplates(visitId,actor)); setError(""); } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  return <Card className="p-5 mt-4">
    <SectionHeader title="Operational checklist" sub="What is required, who owns it, and whether it happened on time" />
    <p className="text-xs text-gray-500 mb-3">Checklist tracking only—not official clearance or departure approval. Suggested items must be reviewed for each visit.</p>
    {error && <p role="alert" className="text-sm text-danger mb-2">{error} <button className="underline" onClick={load}>Retry</button></p>}
    {data && <>
      <div className="flex flex-wrap gap-3 text-xs mb-4"><span>{data.overdue_count} overdue</span><span>{data.unassigned_count} unassigned</span><span>{data.unscheduled_count} unscheduled</span><strong>Departure checklist: {label(data.checklist_state)}</strong></div>
      {!readOnly && <div className="flex flex-wrap gap-2 mb-4">
        <input aria-label="Your name for checklist changes" className="border border-line rounded-lg px-3 py-2 text-sm" value={actor} onChange={e => setActor(e.target.value)} placeholder="Your name (self-reported)" maxLength={150} />
        <button disabled={busy} onClick={templates} className="rounded-lg px-3 py-2 text-sm border border-line-strong">Add suggested checklist</button>
        <button onClick={() => setEditing("new")} className="rounded-lg px-3 py-2 text-sm text-white bg-brand-green">Add task</button>
      </div>}
      {!data.tasks.length ? <p className="text-sm text-gray-500">No tasks configured. No clearance readiness is assumed.</p> : <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead><tr className="text-left text-xs text-gray-500 border-b border-line"><th className="py-2">Task / owner</th><th>Deadline</th><th>Status / timing</th><th>Actions</th></tr></thead>
        <tbody>{data.tasks.map(t => <tr key={t.id} className="border-b border-line">
          <td className="py-3 pr-3"><strong>{t.title}</strong><div className="text-xs">{t.owner_name || "Unassigned"}{t.blocks_departure ? " · Departure checklist item" : ""}</div>{t.reason && <div className="text-xs text-gray-500">{t.reason}</div>}</td>
          <td className="pr-3 text-xs">{date(t.due_at)}{t.completed_at && <div>Completed: {date(t.completed_at)}</div>}</td>
          <td className={`pr-3 text-xs ${t.timeliness === "OVERDUE" || t.status === "BLOCKED" ? "text-danger" : "text-ink-soft"}`}>{label(t.status)}<div>{label(t.timeliness)}{t.delay_minutes > 0 ? ` · ${t.delay_minutes} min late` : ""}</div></td>
          <td className="text-xs whitespace-nowrap">{!readOnly && <button className="text-teal mr-3" onClick={() => setEditing(t)}>Update</button>}<button className="text-teal" onClick={async () => { try { setHistory(await api.getHistory(visitId,t)); } catch (e) { setError(message(e)); } }}>History</button></td>
        </tr>)}</tbody>
      </table></div>}
    </>}
    {!data && !error && <p className="text-sm">Loading checklist…</p>}
    {editing && <TaskEditor visitId={visitId} task={editing === "new" ? undefined : editing} actor={actor} onClose={() => setEditing(null)} onSaved={() => {setEditing(null); void load();}} />}
    {history && <Modal title="Recorded task changes" onClose={() => setHistory(null)}>
      <p className="text-xs text-gray-500 mb-3">Self-reported recorder names; not an authenticated approval log.</p>
      {history.map(h => <div key={h.id} className="border-b border-line py-3 text-xs"><strong>{h.performed_by}</strong> · {date(h.occurred_at)}
        <p>{String(h.new_value.change_reason || "")}</p>
        <details><summary className="cursor-pointer text-teal">Show before / after</summary><pre className="whitespace-pre-wrap break-words mt-2">{JSON.stringify({before:h.old_value, after:h.new_value}, null, 2)}</pre></details>
      </div>)}
    </Modal>}
  </Card>;
}
