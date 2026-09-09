/**
 * Voyage Full-Cycle API Service for VIGOR Smart Port Operations
 */

import { Voyage } from '../types';
import { USE_MOCK_API } from './client';

export async function getVoyages(): Promise<Voyage[]> {
  if (USE_MOCK_API) return [];
  return [];
}
