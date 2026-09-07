export const API_BASE_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");
export const USE_MOCK_API = (import.meta.env.VITE_USE_MOCK_API ?? "false") === "true";
export class ApiError extends Error {
  constructor(message: string, public status?: number) { super(message); }
}
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options, headers: { "Content-Type": "application/json", ...options.headers },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const details = body?.error?.details || body?.detail;
    const message = Array.isArray(details)
      ? details.map((d: {loc?: string[]; msg?: string}) => `${d.loc?.join(".") || "Input"}: ${d.msg}`).join("; ")
      : typeof details === "string" ? details : body?.error?.message;
    throw new ApiError(message || `Request failed (${res.status})`, res.status);
  }
  return body as T;
}
export async function apiList<T>(path: string): Promise<T[]> {
  const all: T[] = [];
  for (let offset = 0; ; offset += 100) {
    const rows = await apiFetch<T[]>(`${path}${path.includes("?") ? "&" : "?"}offset=${offset}&limit=100`);
    all.push(...rows);
    if (rows.length < 100) return all;
  }
}
