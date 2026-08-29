import { apiFetch, USE_MOCK_API } from "./client";
import * as mock from "../mock/mockServices";
import type { Berth } from "../types";

interface BackendBerth {
  id: string;
  name: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  created_at: string;
  updated_at: string;
}

export async function getBerths(): Promise<Berth[]> {
  if (USE_MOCK_API) {
    return mock.getBerths();
  }

  const berths = await apiFetch<BackendBerth[]>("/berths");

  return berths.map((berth) => ({
    id: berth.id,
    name: berth.name,
    lengthM: 0,
    notes:
      berth.status === "MAINTENANCE"
        ? "Currently under maintenance"
        : berth.status === "OCCUPIED"
          ? "Currently occupied"
          : "Available",
  }));
}