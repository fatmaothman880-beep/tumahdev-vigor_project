import type { Berth } from "../types";
import type { CreateVesselVisitInput } from "../mock/mockServices";
import { PageHeader } from "../components/ui/Layout";
import VesselForm from "../components/ui/VesselForm";

export default function NewVessel({
  berths,
  onCancel,
  onSave,
}: {
  berths: Berth[];
  onCancel: () => void;
  onSave: (data: CreateVesselVisitInput) => void;
}) {
  return (
    <div>
      <PageHeader eyebrow="Operations" title="New vessel visit" />
      <VesselForm berths={berths} onCancel={onCancel} onSave={onSave} />
    </div>
  );
}
