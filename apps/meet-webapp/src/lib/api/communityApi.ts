import { buildAuthHeaders, createApiClient } from "./apiClient";

const API = createApiClient("/communities");

export type CommunityMyRole = "OWNER" | "ADMIN" | "EDITOR" | "MEMBER";

export type MyCommunityListItem = Readonly<{
  id: string;
  name: string;
  handle: string;
  myRole: CommunityMyRole;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requireString(obj: Record<string, unknown>, key: string): string {
  const value = obj[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid response: missing "${key}"`);
  }
  return value;
}

export async function getMyCommunities(
  token: string,
): Promise<ReadonlyArray<MyCommunityListItem>> {
  const res = await API.get("/my", {
    headers: buildAuthHeaders(token),
  });

  const raw = res.data as unknown;
  if (!isRecord(raw)) {
    throw new Error("Invalid response: expected object.");
  }
  const items = raw["items"];
  if (!Array.isArray(items)) {
    throw new Error('Invalid response: missing "items" array.');
  }

  return items.map((entry) => {
    if (!isRecord(entry)) {
      throw new Error("Invalid response: expected community object.");
    }
    return {
      id: requireString(entry, "id"),
      name: requireString(entry, "name"),
      handle: requireString(entry, "handle"),
      myRole: requireString(entry, "myRole") as CommunityMyRole,
    };
  });
}

export function canManageMeets(role: CommunityMyRole): boolean {
  return role === "OWNER" || role === "ADMIN" || role === "EDITOR";
}
