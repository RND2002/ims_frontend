/**
 * Centralized API client for the IMS backend.
 *
 * Automatically injects:
 *   - Authorization: Bearer <accessToken>
 *   - X-Store-ID: <activeStore.id>   (when available)
 *   - Content-Type: application/json (for non-GET requests)
 *
 * transparently handles 401 Unauthorized responses by attempting
 * to refresh the session via /api/auth/refresh, then retries the request.
 */

import type { RootState } from "@/lib/store";

interface ApiClientOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
}

// Share active refresh request promise to prevent duplicate concurrent /refresh calls
let activeRefreshPromise: Promise<string> | null = null;

async function getRefreshedToken(): Promise<string> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  // Dynamically import to avoid circular dependencies during store/slice initialization
  const { refreshSession } = await import("@/lib/features/auth/authSlice");
  const { store } = await import("@/lib/store");

  activeRefreshPromise = store
    .dispatch(refreshSession())
    .unwrap()
    .then((res) => {
      activeRefreshPromise = null;
      return res.access_token;
    })
    .catch((err) => {
      activeRefreshPromise = null;
      throw err;
    });

  return activeRefreshPromise;
}

function buildHeaders(
  getState: () => RootState,
  extra: Record<string, string> = {},
  includeContentType = true
): Record<string, string> {
  const state = getState();
  const token = state.auth.accessToken;
  const storeId = state.stores.activeStore?.id;

  const headers: Record<string, string> = {
    ...extra,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (storeId) {
    headers["X-Store-ID"] = storeId;
  }
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.detail;
    let message: string;
    if (!detail) {
      message = `Request failed (${res.status})`;
    } else if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail) && detail.length > 0) {
      message = typeof detail[0]?.msg === "string" ? detail[0].msg : "Validation error";
    } else {
      message = `Request failed (${res.status})`;
    }
    throw new Error(message);
  }
  return data as T;
}

async function request<T>(
  getState: () => RootState,
  method: string,
  url: string,
  body?: unknown,
  options: ApiClientOptions = {}
): Promise<T> {
  const includeContentType = method !== "GET" && method !== "DELETE" && body !== undefined;

  const performFetch = async (tokenOverride?: string) => {
    const headers = buildHeaders(getState, options.headers, includeContentType);
    if (tokenOverride) {
      headers["Authorization"] = `Bearer ${tokenOverride}`;
    }
    return fetch(url, {
      ...options,
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res = await performFetch();

  if (res.status === 401) {
    try {
      const newAccessToken = await getRefreshedToken();
      // Retry request with the fresh token
      res = await performFetch(newAccessToken);
    } catch {
      // Refresh failed, redirect to login page
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please log in again.");
    }
  }

  return handleResponse<T>(res);
}

export function createApiClient(getState: () => RootState) {
  return {
    async get<T>(url: string, options: ApiClientOptions = {}): Promise<T> {
      return request<T>(getState, "GET", url, undefined, options);
    },

    async post<T>(url: string, body?: unknown, options: ApiClientOptions = {}): Promise<T> {
      return request<T>(getState, "POST", url, body, options);
    },

    async put<T>(url: string, body?: unknown, options: ApiClientOptions = {}): Promise<T> {
      return request<T>(getState, "PUT", url, body, options);
    },

    async patch<T>(url: string, body?: unknown, options: ApiClientOptions = {}): Promise<T> {
      return request<T>(getState, "PATCH", url, body, options);
    },

    async delete<T>(url: string, options: ApiClientOptions = {}): Promise<T> {
      return request<T>(getState, "DELETE", url, undefined, options);
    },
  };
}
