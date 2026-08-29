import { useState, type FormEvent } from "react";
import type { VesselVisit } from "../../types";
import type { AddReadingInput } from "../../mock/mockServices";
import Field, { inputCls } from "./Field";
import { fmtDateTime, fmtT, EAT_LABEL } from "../../lib/format";
import { NOW } from "../../mock/mockData";

export default function ReadingForm({
  vessel,
  onCancel,
  onSave,
}: {
  vessel: VesselVisit;
  onCancel: () => void;
  onSave: (data: AddReadingInput) => void;
}) {
  const [form, setForm] = useState({ unloadedT: "", remainingT: "", observedRateTph: "", source: "Manual" as AddReadingInput["source"] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const autofillRemaining = (unloaded: string) => {
    set("unloadedT", unloaded);
    if (unloaded !== "") set("remainingT", String(Math.max(0, vessel.cargoTotalT - Number(unloaded))));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    const u = Number(form.unloadedT);
    const r = Number(form.remainingT);
    const rate = Number(form.observedRateTph);
    if (form.unloadedT === "" || u < 0) e.unloadedT = "Enter a valid non-negative quantity.";
    if (form.remainingT === "" || r < 0) e.remainingT = "Enter a valid non-negative quantity.";
    if (form.unloadedT !== "" && form.remainingT !== "" && u + r !== vessel.cargoTotalT) {
      e.remainingT = e.remainingT || `Unloaded + remaining should equal total cargo (${fmtT(vessel.cargoTotalT)}).`;
    }
    if (form.observedRateTph !== "" && rate < 0) e.observedRateTph = "Rate cannot be negative.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    onSave({
      unloadedT: Number(form.unloadedT),
      remainingT: Number(form.remainingT),
      observedRateTph: form.observedRateTph === "" ? 0 : Number(form.observedRateTph),
      source: form.source,
    });
  };

  return (
    <form onSubmit={submit}>
      <Field label="Unloaded cargo" required hint="In tons (t)" error={errors.unloadedT}>
        <input type="number" min={0} className={inputCls(errors.unloadedT)} value={form.unloadedT} onChange={(e) => autofillRemaining(e.target.value)} />
      </Field>
      <Field label="Remaining cargo" required hint="In tons (t)" error={errors.remainingT}>
        <input type="number" min={0} className={inputCls(errors.remainingT)} value={form.remainingT} onChange={(e) => set("remainingT", e.target.value)} />
      </Field>
      <Field label="Observed unloading rate" hint="In t/h — leave 0 if temporarily stopped" error={errors.observedRateTph}>
        <input type="number" min={0} className={inputCls(errors.observedRateTph)} value={form.observedRateTph} onChange={(e) => set("observedRateTph", e.target.value)} />
      </Field>
      <Field label="Source" required>
        <select className={inputCls()} value={form.source} onChange={(e) => set("source", e.target.value as AddReadingInput["source"])}>
          <option>Manual</option>
          <option>Spreadsheet import</option>
          <option>Calculated</option>
        </select>
      </Field>
      <div className="text-[11px] mb-3 text-gray-500">
        Timestamp: {fmtDateTime(NOW)} · {EAT_LABEL} (recorded automatically)
      </div>
      <div className="flex gap-2 pt-3 border-t border-line">
        <button type="submit" className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-brand-green hover:bg-brand-green-deep transition-colors">
          Save reading
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-semibold border border-line-strong text-ink bg-paper hover:bg-line/40 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
