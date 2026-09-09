/**
 * Manufacturer Queue API Service for VIGOR Smart Port Operations
 * Manages loading slots, queue positions, and supplier confirmations
 */

import { ManufacturerQueueEntry } from '../types';
import { USE_MOCK_API } from './client';

export async function getManufacturerQueue(): Promise<ManufacturerQueueEntry[]> {
  if (USE_MOCK_API) return [];
  return [];
}
