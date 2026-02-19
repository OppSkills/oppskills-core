import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

import { getApiErrorMessage } from "../utils";

/**
 * Normalizes the UI's API base URL so we can reliably target specific resources.
 *
 * Why: Older code sometimes set `NEXT_PUBLIC_API_URL` to `/hackathons`, which
 * makes it impossible to call `/festivals`. We normalize to the *API root* and
 * then append the resource path (e.g. `/hackathons`, `/festivals`) ourselves.
 */
export function getApiRootUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (typeof raw !== "string" || raw.trim().length === 0) {
    /**
     * Local dev fallback:
     * - Backend defaults to `http://localhost:3001` (see `apps/backend/src/main.ts`).
     * - In production, you should always set `NEXT_PUBLIC_API_URL`.
     */
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "NEXT_PUBLIC_API_URL is not set. Please set it to your backend base URL (e.g. https://api.example.com).",
      );
    }
    return "http://localhost:3001/admin";
  }

  // Trim whitespace and trailing slashes.
  const trimmed = raw.trim().replace(/\/+$/g, "");

  // Backwards-compat: if env mistakenly ends with a resource path, strip it.
  const knownResourceSuffixes = [
    "/hackathons",
    "/festivals",
    "/events",
    "/user-accounts",
    "/colleges",
    "/media",
  ] as const;
  const matched = knownResourceSuffixes.find((suffix) =>
    trimmed.endsWith(suffix),
  );

  return matched ? trimmed.slice(0, -matched.length) : trimmed;
}

/**
 * Creates an Axios client for a resource, e.g. `createApiClient("/hackathons")`.
 * Adds an `Authorization` header per-request (we don't store tokens globally).
 */
export function createApiClient(resourcePath: string): AxiosInstance {
  const root = getApiRootUrl();
  const path = normalizeResourcePath(resourcePath);
  const baseURL = `${root}${path}`;
  const client = axios.create({ baseURL, withCredentials: true });

  /**
   * IMPORTANT: Always treat request URLs as resource-relative.
   *
   * Why: many callsites use `API.get("/me")`, `API.get("/my")`, `API.put(\`/${id}\`)`, etc.
   * In Node/server contexts, a leading `/` can be interpreted as "absolute from host root"
   * which would drop the resource prefix from `baseURL` and hit `/me` instead of
   * `/user-accounts/me`, causing a 404.
   *
   * This interceptor makes the behavior unambiguous by stripping leading slashes.
   */
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const url = config.url;
    if (typeof url === "string" && url.startsWith("/")) {
      config.url = url.replace(/^\/+/, "");
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (error instanceof Error) {
        error.message = getApiErrorMessage(error, error.message);
      }
      return Promise.reject(error);
    },
  );

  return client;
}

/**
 * Builds auth headers for backend requests.
 */
export function buildAuthHeaders(token: string): { Authorization: string } {
  const safeToken = token.trim();
  if (safeToken.length === 0) {
    throw new Error("Auth token is empty.");
  }
  return { Authorization: `Bearer ${safeToken}` };
}

/**
 * Ensures a resource path:
 * - starts with exactly one `/`
 * - does not end with `/`
 */
function normalizeResourcePath(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error("Resource path is required.");
  }
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeading.replace(/\/+$/g, "");
}
