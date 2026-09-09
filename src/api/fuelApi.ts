/**
 * Fuel API Service for VIGOR Smart Port Operations
 * Manages bunkering schedules, costs, and fueling statuses
 */

import { FuelOperation } from '../types';
import { apiFetch, USE_MOCK_API } from './client';

export interface UpdateFuelScheduleDto {
  scheduledStart: string;
  scheduledEnd: string;
  status?: FuelOperation['status'];
}

export async function getFuelOperations(): Promise<FuelOperation[]> {
  if (USE_MOCK_API) {
    return [];
  }
  // Currently served via client storage / future endpoint
  return [];
}
