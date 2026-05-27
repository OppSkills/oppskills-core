import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Type guard: checks if a value is a non-null object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Safely extracts a human-friendly error message from a Clerk-like error shape.
 *
 * Clerk errors often look like `{ errors: [{ message: "..." }] }`, but we avoid
 * assuming the exact structure.
 */
export function getClerkErrorMessage(error: unknown, fallback: string): string {
  if (!isRecord(error)) return fallback;

  const errorsValue = error["errors"];
  if (!Array.isArray(errorsValue) || errorsValue.length === 0) return fallback;

  const first = errorsValue[0];
  if (!isRecord(first)) return fallback;

  const longMessage = first["long_message"] || first["longMessage"];
  const message = first["message"];

  const finalMessage =
    typeof longMessage === "string" && longMessage.trim().length > 0
      ? longMessage
      : typeof message === "string" && message.trim().length > 0
        ? message
        : fallback;

  return finalMessage;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  if (error == null) return fallback;

  if (typeof error === "string") {
    return error.trim().length > 0 ? error : fallback;
  }

  if (isRecord(error)) {
    const response = error["response"];
    if (isRecord(response)) {
      const data = response["data"];
      if (isRecord(data)) {
        const message = data["message"];
        if (typeof message === "string" && message.trim().length > 0) {
          return message;
        }
        if (Array.isArray(message)) {
          const joined = message
            .filter((item) => typeof item === "string")
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
            .join("; ");
          if (joined.length > 0) return joined;
        }
        const errorField = data["error"];
        if (typeof errorField === "string" && errorField.trim().length > 0) {
          return errorField;
        }
      }
    }

    const dataDirect = error["data"];
    if (isRecord(dataDirect)) {
      const message = dataDirect["message"];
      if (typeof message === "string" && message.trim().length > 0) {
        return message;
      }
    }

    const message = error["message"];
    if (typeof message === "string" && message.trim().length > 0) {
      if (
        !message.includes("Request failed with status code") &&
        !message.includes("Network Error")
      ) {
        return message;
      }
    }
  }

  return fallback;
}

/**
 * Generates a unique-enough username for Clerk using first/last name and time.
 *
 * We don't store usernames in our DB; this is only for Clerk's username field.
 * Format: `<slug>-<base36TimestampSeconds>`
 *
 * - Slug is lowercased and non-alphanumerics become `-`
 * - If names are empty/unusable, falls back to "user"
 */
export function generateClerkUsername(input: {
  firstName: string;
  lastName?: string;
  nowMs?: number;
}): string {
  const nowMs = typeof input.nowMs === "number" ? input.nowMs : Date.now();
  const timePart = Math.floor(nowMs / 1000).toString(36);
  const randomPart = getShortRandomId();
  const suffix = [timePart, randomPart].join("");

  const baseParts = [input.firstName, input.lastName ?? ""]
    .map((v) => v.trim())
    .filter((v) => v.length > 0);

  const baseRaw = baseParts.join(" ");
  const baseSlug = slugify(baseRaw);

  const safeBase = baseSlug.length > 0 ? baseSlug : "user";
  // Keep username reasonably short; Clerk allows longer but shorter is cleaner.
  const trimmedBase = safeBase.slice(0, 40).replace(/-+$/g, "");

  return [trimmedBase, suffix].filter((p) => p.length > 0).join("-");
}

/**
 * Converts a string into a URL-safe-ish slug (ASCII a-z0-9 + hyphens).
 */
function slugify(value: string): string {
  const normalized = value
    .normalize("NFKD")
    // Strip combining diacritics
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/g, "")
    .replace(/-+$/g, "");

  return normalized;
}

/**
 * Returns a short random ID to reduce username collision risk.
 * Uses Web Crypto when available; falls back to Math.random().
 */
function getShortRandomId(): string {
  const cryptoObj: Crypto | undefined =
    typeof globalThis !== "undefined" && "crypto" in globalThis
      ? (globalThis.crypto as Crypto)
      : undefined;

  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(3);
    cryptoObj.getRandomValues(bytes);
    const n = (bytes[0] << 16) | (bytes[1] << 8) | bytes[2];
    return n.toString(36).padStart(5, "0");
  }

  const n = Math.floor(Math.random() * 36 ** 5);
  return n.toString(36).padStart(5, "0");
}

/**
 * Ensures a URL is absolute by prepending https:// if it lacks a protocol
 * and appears to be a domain-based URL (contains a dot).
 */
export function ensureAbsoluteUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  // If it looks like a domain (contains .), prepend https://
  if (trimmed.includes(".")) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

/**
 * Normalizes a URL by trimming it and ensuring it has a protocol.
 */
export function normalizeUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (trimmed.length === 0) return "";
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  return `https://${trimmed}`;
}

/**
 * Checks if a URL is valid according to our requirements.
 */
export function isValidUrl(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  let url = trimmed;
  if (url.startsWith("//")) {
    url = `https:${url}`;
  } else if (
    !url.startsWith("http://") &&
    !url.startsWith("https://") &&
    !url.startsWith("/")
  ) {
    url = `https://${url}`;
  }
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "localhost" ||
      (parsed.hostname.includes(".") && !parsed.hostname.endsWith("."))
    );
  } catch {
    return false;
  }
}

/**
 * Strips HTML tags and decodes common entities from a string.
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

/**
 * Returns true if the string looks like raw GPS coordinates stored in `lat,lng` or `lat,lng,placeId` format.
 * We never want to render such strings directly to users.
 */
export function isLocationCoords(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  const parts = value.split(",").map((p) => p.trim());
  if (parts.length < 2 || parts.length > 3) return false;
  const latNum = Number(parts[0]);
  const lngNum = Number(parts[1]);
  return !isNaN(latNum) && !isNaN(lngNum);
}

/**
 * Converts a "lat,lng" or "lat,lng,placeId" coordinates string into a Google Maps search URL so the
 * user gets a clickable map link rather than raw numbers.
 *
 * Returns null if the input does not look like coordinates.
 */
export function getGoogleMapsUrl(coords: string | null | undefined): string | null {
  if (!isLocationCoords(coords)) return null;
  const parts = coords!.split(",").map((p) => p.trim());
  const [lat, lng, placeId] = parts;
  if (placeId) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat + "," + lng)}&query_place_id=${encodeURIComponent(placeId)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat + "," + lng)}`;
}
