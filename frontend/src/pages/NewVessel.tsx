import type { Berth } from "../types";
import type { CreateVesselVisitInput } from "../mock/mockServices";
import { PageHeader } from "../components/ui/Layout";
import VesselForm, { type VesselFormOutput } from "../components/ui/VesselForm";

export default function NewVessel({
  berths,
  onCancel,
  onSave,
}: {
  berths: Berth[];
  onCancel: () => void;
  onSave: (data: CreateVesselVisitInput) => void;
}) {
  const handleSave = (data: VesselFormOutput) => {
    onSave({
      name: data.name,
      reference: data.reference,
      cargo: data.cargo,
      cargoTotalT: data.cargoTotalT,
      berthId: data.berthId,
      status: data.status,
      plannedArrival: data.plannedArrival,
      plannedUnloadStart: data.plannedUnloadStart,
      plannedCompletion: data.plannedCompletion,
      plannedRateTph: data.plannedRateTph,
      notes: data.notes,
    });
  };

  return (
    <div>
      <PageHeader eyebrow="Operations" title="New vessel visit" />
      <VesselForm berths={berths} mode="create" onCancel={onCancel} onSave={handleSave} />
    </div>
  );
}
