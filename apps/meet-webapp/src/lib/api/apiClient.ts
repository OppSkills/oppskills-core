import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

export function getApiRootUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.trim().replace(/\/+$/g, "");
  }
  if (process.env.NODE_ENV === "production") {
    return "https://api.oppskills.com";
  }
  return "http://localhost:3001";
}

export function createApiClient(resourcePath: string): AxiosInstance {
  const root = getApiRootUrl();
  const path = resourcePath.startsWith("/") ? resourcePath : `/${resourcePath}`;
  const client = axios.create({ baseURL: `${root}${path}` });

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const url = config.url;
    if (typeof url === "string" && url.startsWith("/")) {
      config.url = url.replace(/^\/+/, "");
    }
    return config;
  });

  return client;
}

export function buildAuthHeaders(token: string | null): Record<string, string> {
  const safeToken = token?.trim();
  if (!safeToken) return {};
  return { Authorization: `Bearer ${safeToken}` };
}
