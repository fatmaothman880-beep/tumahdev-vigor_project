import { useState, type FormEvent } from "react";
import type { Berth, VesselStatus } from "../../types";
import type { CreateVesselVisitInput } from "../../mock/mockServices";
import Field, { inputCls } from "./Field";
import { Card } from "./Layout";
import { EAT_LABEL } from "../../lib/format";

export default function VesselForm({
  berths,
  onCancel,
  onSave,
}: {
  berths: Berth[];
  onCancel: () => void;
  onSave: (data: CreateVesselVisitInput) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    reference: "",
    cargo: "Cement (bulk)",
    cargoTotalT: "",
    berthId: berths[0]?.id || "",
    plannedArrival: "",
    status: "Planned" as VesselStatus,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Vessel name is required.";
    if (!form.cargoTotalT || Number(form.cargoTotalT) <= 0) e.cargoTotalT = "Enter a total cargo quantity greater than zero.";
    if (!form.berthId) e.berthId = "Select a berth.";
    if (!form.plannedArrival) e.plannedArrival = "Planned arrival is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    onSave({ ...form, cargoTotalT: Number(form.cargoTotalT) });
  };

  return (
    <form onSubmit={submit}>
      <Card className="p-5 max-w-2xl">
        <div className="grid sm:grid-cols-2 gap-x-4">
          <Field label="Vessel name" required error={errors.name}>
            <input className={inputCls(errors.name)} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. MV Ocean Star" />
          </Field>
          <Field label="Reference / IMO" hint="Optional identifier">
            <input className={inputCls()} value={form.reference} onChange={(e) => set("reference", e.target.value)} placeholder="e.g. IMO 9812345" />
          </Field>
          <Field label="Cargo type" required>
            <select className={inputCls()} value={form.cargo} onChange={(e) => set("cargo", e.target.value)}>
              <option>Cement (bulk)</option>
              <option>Clinker (bulk)</option>
              <option>Gypsum</option>
              <option>General cargo</option>
            </select>
          </Field>
          <Field label="Total cargo" required hint="In metric tons (t)" error={errors.cargoTotalT}>
            <input type="number" min={0} className={inputCls(errors.cargoTotalT)} value={form.cargoTotalT} onChange={(e) => set("cargoTotalT", e.target.value)} placeholder="e.g. 12000" />
          </Field>
          <Field label="Berth" required error={errors.berthId}>
            <select className={inputCls(errors.berthId)} value={form.berthId} onChange={(e) => set("berthId", e.target.value)}>
              {berths.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status" required>
            <select className={inputCls()} value={form.status} onChange={(e) => set("status", e.target.value as VesselStatus)}>
              {(["Planned", "Arrived", "Berthed", "Unloading"] as VesselStatus[]).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Planned arrival" required hint={`Time in ${EAT_LABEL}`} error={errors.plannedArrival}>
            <input type="time" className={inputCls(errors.plannedArrival)} value={form.plannedArrival} onChange={(e) => set("plannedArrival", e.target.value)} />
          </Field>
        </div>
        <div className="flex gap-2 mt-2 pt-4 border-t border-line">
          <button type="submit" className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-brand-green hover:bg-brand-green-deep transition-colors">
            Create vessel visit
          </button>
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-semibold border border-line-strong text-ink bg-paper hover:bg-line/40 transition-colors">
            Cancel
          </button>
        </div>
      </Card>
    </form>
  );
}
