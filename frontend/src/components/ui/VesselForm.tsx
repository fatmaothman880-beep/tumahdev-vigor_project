import { useEffect, useState, type FormEvent } from "react";
import {getSite, type SiteCatalogue} from "../../api/workflowApi";
import {USE_MOCK_API} from "../../api/client";
import type { Berth, RateUnit, VesselStatus, VesselVisit } from "../../types";
import type { CreateVesselVisitInput, EditVesselVisitInput } from "../../mock/mockServices";
import Field, { inputCls } from "./Field";
import { Card } from "./Layout";
import { RateUnitToggle } from "./RateValue";
import { convertFromTph, convertToTph } from "../../lib/units";
import { toDateTimeLocal } from "../../lib/format";

export type VesselFormOutput = CreateVesselVisitInput & Partial<Omit<EditVesselVisitInput, 'berthId'>>;

const CREATE_STATUSES: VesselStatus[] = ["Planned", "Arrived", "Berthed", "Unloading"];
const EDIT_STATUSES: VesselStatus[] = ["Planned", "Arrived", "Berthed", "Unloading", "Delayed", "Completed", "Cancelled"];

export default function VesselForm({
  berths,
  mode = "create",
  initial,
  onCancel,
  onSave,
}: {
  berths: Berth[];
  mode?: "create" | "edit";
  initial?: VesselVisit;
  onCancel: () => void;
  onSave: (data: VesselFormOutput) => void | Promise<void>;
}) {
  const [rateUnit, setRateUnit] = useState<RateUnit>("tph");
  const [form, setForm] = useState({
    vesselId: "",
    name: initial?.name || "",
    reference: initial?.reference || "",
    cargo: initial?.cargo || "Cement (bulk)",
    cargoTotalT: initial ? String(initial.cargoTotalT) : "",
    berthId: initial?.berthId || berths[0]?.id || "",
    status: initial?.status || ("Planned" as VesselStatus),
    plannedArrival: toDateTimeLocal(initial?.plannedArrival),
    plannedUnloadStart: toDateTimeLocal(initial?.plannedUnloadStart),
    plannedCompletion: toDateTimeLocal(initial?.plannedCompletion),
    plannedRate: initial?.plannedRateTph ? String(convertFromTph(initial.plannedRateTph, "tph")) : "",
    notes: initial?.notes || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [site, setSite] = useState<SiteCatalogue | null>(null);
  const [siteError, setSiteError] = useState("");
  useEffect(() => {
    if (USE_MOCK_API || mode !== "create") return;
    let active = true;
    getSite().then(s => {
      if (!active) return;
      setSite(s);
      if (s.configured && s.berth_id) setForm(f => ({...f, berthId: s.berth_id!}));
    }).catch(e => {if(active)setSiteError(e instanceof Error ? e.message : "Cannot load vessel register");});
    return () => {active = false;};
  }, [mode]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Vessel name is required.";
    if (!form.cargoTotalT || Number(form.cargoTotalT) <= 0) e.cargoTotalT = "Enter a total cargo quantity greater than zero.";
    if (!form.berthId) e.berthId = "Select a berth.";
    if (!form.plannedArrival) e.plannedArrival = "Planned arrival is required.";
    if (form.plannedUnloadStart && form.plannedArrival && form.plannedUnloadStart < form.plannedArrival) {
      e.plannedUnloadStart = "Planned unload start should not be before planned arrival.";
    }
    if (form.plannedCompletion && form.plannedUnloadStart && form.plannedCompletion <= form.plannedUnloadStart) {
      e.plannedCompletion = "Planned completion should be after planned unload start.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (saving || !validate()) return;
    setSaving(true);
    const plannedRateTph = form.plannedRate === "" ? undefined : Math.round(convertToTph(Number(form.plannedRate), rateUnit) * 100) / 100;
    try { await onSave({
      vesselId: form.vesselId || undefined,
      name: form.name,
      reference: form.reference,
      cargo: form.cargo,
      cargoTotalT: Number(form.cargoTotalT),
      berthId: form.berthId,
      status: form.status,
      plannedArrival: form.plannedArrival,
      plannedUnloadStart: form.plannedUnloadStart,
      plannedCompletion: form.plannedCompletion,
      plannedRateTph,
      notes: form.notes,
    }); } catch (e) { setErrors({submit: e instanceof Error ? e.message : "Unable to save"}); }
    finally { setSaving(false); }
  };

  const statusOptions = mode === "edit" ? EDIT_STATUSES : CREATE_STATUSES;

  return (
    <form onSubmit={submit}>
      <Card className="p-5 max-w-2xl">
        {siteError && <p role="alert" className="text-sm text-danger mb-3">{siteError}</p>}
        {mode === "create" && site?.configured && <Field label="Registered vessel" hint="Reported cargo is a starting value only. Confirm and edit it for this shipment.">
          <select className={inputCls()} value={form.vesselId} onChange={e => {
            const v = site.vessels.find(v => v.vessel_id === e.target.value);
            if (v) setForm(f => ({...f, vesselId:v.vessel_id, name:v.name, reference:v.reference,
              cargoTotalT:v.reported_cargo_t == null ? "" : String(v.reported_cargo_t), cargo:v.temporary_label ? "LPG" : f.cargo}));
            else setForm(f => ({...f,vesselId:"",name:"",reference:"",cargoTotalT:""}));
          }}>
            <option value="">Enter a different vessel</option>
            {site.vessels.map(v => <option key={v.vessel_id} value={v.vessel_id}>{v.name}{v.temporary_label ? " (temporary label)" : ""}</option>)}
          </select>
          <p className="text-xs text-gray-500 mt-1">Site-survey amounts are not verified vessel capacities. No actual arrival is created until you save a visit with an arrived/active status.</p>
        </Field>}
        <div className="grid sm:grid-cols-2 gap-x-4">
          <Field label="Vessel name" required error={errors.name}>
            <input readOnly={!!form.vesselId} className={inputCls(errors.name)} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. MV Ocean Star" />
          </Field>
          <Field label="Reference / IMO" hint="Optional identifier">
            <input readOnly={!!form.vesselId} className={inputCls()} value={form.reference} onChange={(e) => set("reference", e.target.value)} placeholder="e.g. IMO 9812345" />
          </Field>
          <Field label="Cargo type" required>
            <select className={inputCls()} value={form.cargo} onChange={(e) => set("cargo", e.target.value)}>
              <option>Cement (bulk)</option>
              <option>Clinker (bulk)</option>
              <option>Gypsum (bulk)</option>
              <option>General cargo</option>
              <option>LPG</option>
            </select>
          </Field>
          <Field label="Total cargo" required hint="In metric tons (t)" error={errors.cargoTotalT}>
            <input type="number" min={0} className={inputCls(errors.cargoTotalT)} value={form.cargoTotalT} onChange={(e) => set("cargoTotalT", e.target.value)} placeholder="e.g. 12000" />
          </Field>
          <Field label="Berth" required error={errors.berthId}>
            <select className={inputCls(errors.berthId)} value={form.berthId} onChange={(e) => set("berthId", e.target.value)}>
              {berths.filter(b => mode !== "create" || !site?.configured || b.id === site.berth_id).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status" required>
            <select className={inputCls()} value={form.status} onChange={(e) => set("status", e.target.value as VesselStatus)}>
              {statusOptions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="pt-2 mt-2 border-t border-line">
          <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-3">Schedule</div>
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Field label="Planned arrival" required error={errors.plannedArrival}>
              <input type="datetime-local" className={inputCls(errors.plannedArrival)} value={form.plannedArrival} onChange={(e) => set("plannedArrival", e.target.value)} />
            </Field>
            <Field label="Planned unloading start" hint="Optional — used for schedule progress" error={errors.plannedUnloadStart}>
              <input type="datetime-local" className={inputCls(errors.plannedUnloadStart)} value={form.plannedUnloadStart} onChange={(e) => set("plannedUnloadStart", e.target.value)} />
            </Field>
            <Field label="Planned completion" hint="Used to detect at-risk / delayed forecasts" error={errors.plannedCompletion}>
              <input type="datetime-local" className={inputCls(errors.plannedCompletion)} value={form.plannedCompletion} onChange={(e) => set("plannedCompletion", e.target.value)} />
            </Field>
            <Field label="Planned unloading rate" hint="Optional — baseline for at-risk detection">
              <div className="flex gap-2 items-center">
                <input type="number" min={0} className={inputCls()} value={form.plannedRate} onChange={(e) => set("plannedRate", e.target.value)} placeholder={rateUnit === "tph" ? "e.g. 500" : "e.g. 8.3"} />
                <RateUnitToggle unit={rateUnit} onChange={(unit) => {
                  if (form.plannedRate !== "") set("plannedRate", String(convertFromTph(convertToTph(Number(form.plannedRate), rateUnit), unit)));
                  setRateUnit(unit);
                }} />
              </div>
            </Field>
          </div>
        </div>

        <Field label="Operational notes" hint="Optional">
          <textarea rows={2} className={inputCls()} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any planning notes for this visit" />
        </Field>

        {errors.submit && <p role="alert" className="text-sm text-danger">{errors.submit}</p>}
        <div className="flex gap-2 mt-2 pt-4 border-t border-line">
          <button type="submit" className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-brand-green hover:bg-brand-green-deep transition-colors">
            {mode === "edit" ? "Save changes" : "Create vessel visit"}
          </button>
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-semibold border border-line-strong text-ink bg-paper hover:bg-line/40 transition-colors">
            Cancel
          </button>
        </div>
      </Card>
    </form>
  );
}
