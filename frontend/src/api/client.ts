/**
 * Centralized API client. No component should build a fetch URL directly —
 * everything goes through here, or through the mock service layer in mock
 * mode. See README "How mock mode works" for the switch mechanism.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const USE_MOCK_API = (import.meta.env.VITE_USE_MOCK_API ?? "true") !== "false";

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    throw new ApiError(`Request to ${path} failed (${res.status})`, res.status);
  }
  return res.json() as Promise<T>;
}
