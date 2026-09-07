import { apiList, USE_MOCK_API } from "./client";
import * as mock from "../mock/mockServices";
import type { Berth } from "../types";
import {getSite} from "./workflowApi";
export async function getBerths(): Promise<Berth[]> {
  if (USE_MOCK_API) return mock.getBerths();
  const rows = await apiList<{id: string; name: string; status: string}>("/berths");
  const site = await getSite();
  return rows.map(b => ({id: b.id, name: site.configured && b.id === site.berth_id ? site.berth_label || b.name : b.name, lengthM: 0,
    notes: site.configured && b.id !== site.berth_id ? `Outside configured Mangapwani berth · ${b.status}` : b.status}));
}
