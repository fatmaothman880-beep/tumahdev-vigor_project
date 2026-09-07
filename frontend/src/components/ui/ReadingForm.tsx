import { useState, type FormEvent } from "react";
import type { RateUnit, VesselVisit } from "../../types";
import type { AddReadingInput } from "../../mock/mockServices";
import Field, { inputCls } from "./Field";
import { fmtDateTime, fmtT, EAT_LABEL } from "../../lib/format";
import { RateUnitToggle } from "./RateValue";
import { convertToTph, convertFromTph } from "../../lib/units";

export default function ReadingForm({
  vessel,
  onCancel,
  onSave,
}: {
  vessel: VesselVisit;
  onCancel: () => void;
  onSave: (data: AddReadingInput) => void | Promise<void>;
}) {
  const [rateUnit, setRateUnit] = useState<RateUnit>("tph");
  const [form, setForm] = useState({ unloadedT: "", remainingT: "", observedRate: "", source: "Manual" as AddReadingInput["source"], notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const autofillRemaining = (unloaded: string) => {
    set("unloadedT", unloaded);
    if (unloaded !== "") set("remainingT", String(Math.max(0, vessel.cargoTotalT - Number(unloaded))));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    const u = Number(form.unloadedT);
    const r = Number(form.remainingT);
    const rate = Number(form.observedRate);
    if (form.unloadedT === "" || u < 0) e.unloadedT = "Enter a valid non-negative quantity.";
    if (form.remainingT === "" || r < 0) e.remainingT = "Enter a valid non-negative quantity.";
    if (form.unloadedT !== "" && form.remainingT !== "" && u + r !== vessel.cargoTotalT) {
      e.remainingT = e.remainingT || `Unloaded + remaining should equal total cargo (${fmtT(vessel.cargoTotalT)}).`;
    }
    if (form.observedRate !== "" && rate < 0) e.observedRate = "Rate cannot be negative.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (saving || !validate()) return;
    setSaving(true);
    try { await onSave({
      unloadedT: Number(form.unloadedT),
      remainingT: Number(form.remainingT),
      observedRateTph: form.observedRate === "" ? 0 : Math.round(convertToTph(Number(form.observedRate), rateUnit) * 100) / 100,
      source: form.source,
      notes: form.notes || undefined,
    }); } catch (e) { setErrors({submit: e instanceof Error ? e.message : "Unable to save"}); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit}>
      <Field label="Unloaded cargo" required hint="In tons (t)" error={errors.unloadedT}>
        <input type="number" min={0} className={inputCls(errors.unloadedT)} value={form.unloadedT} onChange={(e) => autofillRemaining(e.target.value)} />
      </Field>
      <Field label="Remaining cargo" required hint="Calculated automatically from total cargo — adjust if needed" error={errors.remainingT}>
        <input type="number" min={0} className={inputCls(errors.remainingT)} value={form.remainingT} onChange={(e) => set("remainingT", e.target.value)} />
      </Field>
      <Field label="Observed unloading rate" hint="Leave blank or 0 if temporarily stopped" error={errors.observedRate}>
        <div className="flex gap-2 items-center">
          <input type="number" min={0} step="any" className={inputCls(errors.observedRate)} value={form.observedRate} onChange={(e) => set("observedRate", e.target.value)} placeholder={rateUnit === "tph" ? "e.g. 410" : "e.g. 6.8"} />
          <RateUnitToggle unit={rateUnit} onChange={(unit) => {
            if (form.observedRate !== "") set("observedRate", String(convertFromTph(convertToTph(Number(form.observedRate), rateUnit), unit)));
            setRateUnit(unit);
          }} />
        </div>
      </Field>
      <Field label="Source" required>
        <select className={inputCls()} value={form.source} onChange={(e) => set("source", e.target.value as AddReadingInput["source"])}>
          <option>Manual</option>
          <option>Spreadsheet import</option>
          <option>Calculated</option>
        </select>
      </Field>
      <Field label="Notes" hint="Optional">
        <input className={inputCls()} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any context for this reading" />
      </Field>
      <div className="text-[11px] mb-3 text-gray-500">
        Timestamp: {fmtDateTime(new Date())} · {EAT_LABEL} (recorded automatically)
      </div>
      {errors.submit && <p role="alert" className="text-sm text-danger">{errors.submit}</p>}
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
