import type { VesselVisit } from "../types";
import type { AppData } from "../hooks/useAppData";
import type { EditVesselVisitInput } from "../mock/mockServices";
import { PageHeader } from "../components/ui/Layout";
import { ErrorState } from "../components/ui/States";
import VesselForm, { type VesselFormOutput } from "../components/ui/VesselForm";

export default function EditVessel({
  data,
  vessel,
  onCancel,
  onSave,
}: {
  data: AppData;
  vessel: VesselVisit | undefined;
  onCancel: () => void;
  onSave: (id: string | number, input: EditVesselVisitInput) => void | Promise<void>;
}) {
  if (!vessel) return <ErrorState onRetry={onCancel} />;

  const handleSave = (out: VesselFormOutput) => {
    return onSave(vessel.id, {
      name: out.name,
      reference: out.reference,
      cargo: out.cargo,
      cargoTotalT: out.cargoTotalT,
      berthId: out.berthId,
      status: out.status,
      plannedArrival: out.plannedArrival,
      plannedUnloadStart: out.plannedUnloadStart || "",
      plannedCompletion: out.plannedCompletion || "",
      plannedRateTph: out.plannedRateTph,
      notes: out.notes,
    });
  };

  return (
    <div>
      <PageHeader eyebrow="Operations" title={`Edit vessel visit — ${vessel.name}`} />
      <VesselForm berths={data.berths} mode="edit" initial={vessel} onCancel={onCancel} onSave={handleSave} />
    </div>
  );
}
