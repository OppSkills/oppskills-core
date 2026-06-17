// src/shared/api/apiClient.ts
// Centralized HTTP client for OppSkills mobile app.
// All API repositories must go through this client — never use fetch() or axios directly in screens/hooks.

import Constants from 'expo-constants';
import { Platform } from 'react-native';

const expoDebuggerHost = typeof Constants.manifest === 'object' ? Constants.manifest?.debuggerHost : null;
const expoLanHost = expoDebuggerHost?.split(':')[0] ?? null;
const expoLanBaseUrl = expoLanHost ? `http://${expoLanHost}:3001` : null;

let API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_BASE_URL ?? expoLanBaseUrl ?? (Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001')).replace(/\/$/, '');

// Candidate fallback hosts to try when the primary base URL fails. Order matters — keep most-likely first.
const FALLBACK_BASE_URLS = [
  'http://192.168.0.178:3001',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://10.0.2.2:3001',
];

// ─── Token Registry ───────────────────────────────────────────────────────────
// The Clerk session hook registers its getToken fn here once on mount.
// Every authenticated request uses this to attach Authorization: Bearer <token>.

type TokenGetter = () => Promise<string | null>;
let _getToken: TokenGetter = async () => null;

export function registerTokenGetter(fn: TokenGetter): void {
  _getToken = fn;
}

// ─── Error Types ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(public readonly attemptedUrl?: string) {
    const base = 'No internet connection. Please check your network and try again.';
    const urlPart = attemptedUrl ? ` Tried: ${attemptedUrl}` : '';
    super(`${base}${urlPart}`);
    this.name = 'NetworkError';
  }
}

// ─── Core Request ─────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    try {
      const token = await _getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // If token fetch fails, send request without auth and let backend return 401
    }
  }

  let response: Response | undefined;
  // Try primary base URL first, then fallbacks if network failure occurs.
  const triedBases: string[] = [];
  const basesToTry = [API_BASE_URL, ...FALLBACK_BASE_URLS].filter((b, i, arr) => b && arr.indexOf(b) === i);

  for (const base of basesToTry) {
    const attempted = `${base}${path}`;
    triedBases.push(attempted);
    try {
      // eslint-disable-next-line no-await-in-loop
      response = await fetch(attempted, {
        ...fetchOptions,
        headers: { ...headers, ...(fetchOptions.headers as Record<string, string> | undefined ?? {}) },
      });

      // If fetch succeeded at network level, but response.ok may be false — handle below.
      // Update global API_BASE_URL to the working base to speed up future requests.
      if (base !== API_BASE_URL) {
        // eslint-disable-next-line no-console
        console.info(`apiClient: switching API_BASE_URL to ${base}`);
        API_BASE_URL = base.replace(/\/$/, '');
      }

      break;
    } catch (err) {
      // Network-level failure for this base — try the next one.
      // eslint-disable-next-line no-console
      console.warn('Network request failed for', attempted, (err as Error)?.message ?? err);
      // continue to next base
    }
  }

  // If we didn't get any response after all attempts, throw NetworkError listing tried URLs.
  if (!response) {
    // eslint-disable-next-line no-console
    console.error('Network request failed (all attempts):', triedBases.join(', '));
    throw new NetworkError(triedBases.join(', '));
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    let bodyJson: unknown;
    try { bodyJson = JSON.parse(bodyText); } catch { bodyJson = bodyText; }

    const message = (() => {
      if (response.status === 401) return 'Your session has expired. Please sign in again.';
      if (response.status === 403) return 'You do not have permission to perform this action.';
      if (response.status === 404) return 'The requested resource was not found.';
      if (response.status >= 500) return 'Something went wrong on our end. Please try again later.';
      
      if (bodyJson && typeof bodyJson === 'object' && 'message' in bodyJson) {
        const backendMessage = (bodyJson as Record<string, unknown>).message;
        if (typeof backendMessage === 'string') return backendMessage;
        if (Array.isArray(backendMessage)) return backendMessage.join(', ');
      }
      
      return `Request failed (${response.status})`;
    })();

    throw new ApiError(response.status, message, bodyJson);
  }

  // 204 No Content
  if (response.status === 204) return undefined as unknown as T;

  return response.json() as Promise<T>;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const apiClient = {
  /** Unauthenticated GET */
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET', auth: false });
  },

  /** Authenticated GET — attaches Bearer token */
  getAuth<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET', auth: true });
  },

  /** Authenticated POST */
  post<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
      auth: true,
    });
  },

  /** Authenticated PUT */
  put<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
      auth: true,
    });
  },

  /** Authenticated PATCH */
  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      auth: true,
    });
  },

  /** Authenticated DELETE */
  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE', auth: true });
  },
};
