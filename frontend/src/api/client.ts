export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"
).replace(/\/+$/, "");

export const USE_MOCK_API =
  (import.meta.env.VITE_USE_MOCK_API ?? "false") === "true";

interface BackendErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  detail?: string | unknown;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let body: BackendErrorBody | T | null = null;

  if (text) {
    try {
      body = JSON.parse(text) as BackendErrorBody | T;
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const errorBody = body as BackendErrorBody | null;
    const detail =
      typeof errorBody?.detail === "string"
        ? errorBody.detail
        : undefined;

    throw new ApiError(
      errorBody?.error?.message ||
        detail ||
        `Request failed with status ${response.status}`,
      response.status,
      errorBody?.error?.code,
      errorBody?.error?.details ?? errorBody?.detail,
    );
  }

  return body as T;
}