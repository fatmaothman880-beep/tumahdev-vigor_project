import { useState, type FormEvent } from "react";
import { Anchor, CloudRain, HelpCircle, PackageX, Ship, Users, Wrench } from "lucide-react";
import type { DelayCategory } from "../../types";
import type { AddDelayInput } from "../../mock/mockServices";
import Field, { inputCls } from "./Field";
import { toDateTimeLocal } from "../../lib/format";

const CATEGORIES: { v: DelayCategory; Icon: typeof Wrench }[] = [
  { v: "Equipment", Icon: Wrench },
  { v: "Weather", Icon: CloudRain },
  { v: "Labour", Icon: Users },
  { v: "Berth", Icon: Anchor },
  { v: "Vessel", Icon: Ship },
  { v: "Material", Icon: PackageX },
  { v: "Other", Icon: HelpCircle },
];

/**
 * "Confirm" wording is deliberate: this form records an ACTUAL delay that
 * already happened, which the risk engine (lib/riskEngine.ts) treats as
 * authoritative over any automatic at-risk forecast. It is distinct from
 * the automatic "At risk" state, which needs no operator input at all.
 */
export default function DelayForm({ onCancel, onSave }: { onCancel: () => void; onSave: (data: AddDelayInput) => void }) {
  const now = new Date();
  const [form, setForm] = useState({
    start: toDateTimeLocal(new Date(now.getTime() - 30 * 60000)),
    end: toDateTimeLocal(now),
    category: "Equipment" as DelayCategory,
    area: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.start) e.start = "Start time is required.";
    if (!form.end) e.end = "End time is required.";
    if (form.start && form.end && form.end <= form.start) e.end = "End time must be after start time.";
    if (!form.description.trim()) e.description = "Add a short description of the delay.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    onSave({ start: new Date(form.start), end: new Date(form.end), category: form.category, area: form.area, description: form.description });
  };

  return (
    <form onSubmit={submit}>
      <div className="grid sm:grid-cols-2 gap-x-4">
        <Field label="Start" required error={errors.start}>
          <input type="datetime-local" className={inputCls(errors.start)} value={form.start} onChange={(e) => set("start", e.target.value)} />
        </Field>
        <Field label="End" required error={errors.end}>
          <input type="datetime-local" className={inputCls(errors.end)} value={form.end} onChange={(e) => set("end", e.target.value)} />
        </Field>
      </div>
      <Field label="Category" required>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(({ v, Icon }) => (
            <button
              type="button"
              key={v}
              onClick={() => set("category", v)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${
                form.category === v ? "bg-ink text-white border-ink" : "bg-paper text-ink-soft border-line"
              }`}
            >
              <Icon size={13} /> {v}
            </button>
          ))}
        </div>
        <div className="text-[11px] mt-1.5 text-gray-500">Demo/example categories for this prototype.</div>
      </Field>
      <Field label="Equipment / responsible area" hint="Optional">
        <input className={inputCls()} value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. Conveyor 2" />
      </Field>
      <Field label="Description / reason" required error={errors.description}>
        <textarea rows={2} className={inputCls(errors.description)} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Briefly describe the cause of the delay" />
      </Field>
      <div className="flex gap-2 pt-3 border-t border-line">
        <button type="submit" className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-danger hover:opacity-90 transition-opacity">
          Confirm delay
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-semibold border border-line-strong text-ink bg-paper hover:bg-line/40 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
