import { buildAuthHeaders, createApiClient, isRecord, requireString } from "./apiClient";

const API = createApiClient("/media");

export type PresignImageUploadPurpose =
  | "HACKATHON_BANNER"
  | "EVENT_BANNER"
  | "COMMUNITY_COVER"
  | "COMMUNITY_AVATAR"
  | "COMMUNITY_POST_IMAGE"
  | "COMMUNITY_BANNER"
  | "COMMUNITY_LOGO"
  | "CHAT_ATTACHMENT";

export type PresignImageUploadRequest = Readonly<{
  purpose: PresignImageUploadPurpose;
  mimeType: string;
}>;

export type PresignImageUploadResponse = Readonly<{
  uploadUrl: string;
  fields: Readonly<Record<string, string>>;
  key: string;
  publicUrl: string;
  maxBytes: number;
}>;

export type PresignDocumentUploadPurpose =
  | "EVENT_ATTACHMENT"
  | "OPPORTUNITY_ATTACHMENT"
  | "CHAT_ATTACHMENT"
  | "COMMUNITY_THREAD_ATTACHMENT";

export type PresignDocumentUploadRequest = Readonly<{
  purpose: PresignDocumentUploadPurpose;
  mimeType: string;
  fileName: string;
}>;

export type PresignDocumentUploadResponse = Readonly<{
  uploadUrl: string;
  fields: Readonly<Record<string, string>>;
  key: string;
  publicUrl: string;
  maxBytes: number;
}>;



function requireNumber(obj: Record<string, unknown>, key: string): number {
  const value = obj[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid response: missing "${key}"`);
  }
  return value;
}

function requireStringRecord(
  obj: Record<string, unknown>,
  key: string,
): Readonly<Record<string, string>> {
  const value = obj[key];
  if (!isRecord(value)) {
    throw new Error(`Invalid response: missing "${key}"`);
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) {
    if (typeof v !== "string") continue;
    out[k] = v;
  }
  if (Object.keys(out).length === 0) {
    throw new Error(`Invalid response: empty "${key}"`);
  }
  return out;
}

export async function presignImageUpload(
  token: string,
  data: PresignImageUploadRequest,
): Promise<PresignImageUploadResponse> {
  const res = await API.post("/presign-image", data, {
    headers: buildAuthHeaders(token),
  });

  const raw = res.data as unknown;
  if (!isRecord(raw)) {
    throw new Error("Invalid response: expected object.");
  }

  return {
    uploadUrl: requireString(raw, "uploadUrl"),
    fields: requireStringRecord(raw, "fields"),
    key: requireString(raw, "key"),
    publicUrl: requireString(raw, "publicUrl"),
    maxBytes: requireNumber(raw, "maxBytes"),
  };
}

/**
 * Requests a presigned POST for document upload (PDF, DOC, etc.)
 */
export async function presignDocumentUpload(
  token: string,
  data: PresignDocumentUploadRequest,
): Promise<PresignDocumentUploadResponse> {
  const res = await API.post("/presign-document", data, {
    headers: buildAuthHeaders(token),
  });

  const raw = res.data as unknown;
  if (!isRecord(raw)) {
    throw new Error("Invalid response: expected object.");
  }

  return {
    uploadUrl: requireString(raw, "uploadUrl"),
    fields: requireStringRecord(raw, "fields"),
    key: requireString(raw, "key"),
    publicUrl: requireString(raw, "publicUrl"),
    maxBytes: requireNumber(raw, "maxBytes"),
  };
}
