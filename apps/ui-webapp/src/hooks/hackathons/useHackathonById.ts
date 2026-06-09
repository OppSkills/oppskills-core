import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { getHackathonById } from "@/lib/api/hackathonApi";

/**
 * Ensures we have a token for authenticated API calls.
 */
function requireToken(token: string | null): string {
  if (typeof token !== "string" || token.trim().length === 0) {
    throw new Error("Not authenticated.");
  }
  return token;
}

/**
 * Ensures we have a usable id.
 */
function normalizeId(id: string | null | undefined): string | null {
  if (typeof id !== "string") return null;
  const trimmed = id.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function useHackathonById(id: string | null | undefined) {
  const { getToken } = useAuth();
  const safeId = normalizeId(id);

  return useQuery({
    queryKey: ["hackathon", safeId],
    enabled: safeId !== null,
    queryFn: async () => {
      if (safeId === null) {
        throw new Error("Hackathon id is required.");
      }
      const token = requireToken(await getToken());
      return getHackathonById(token, safeId);
    },
  });
}
