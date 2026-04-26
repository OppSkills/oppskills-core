/**
 * Utility to safely retrieve a Clerk token, handling potential expiration
 * and handshake failures by forcing a cache bypass when necessary.
 */
export async function getSafeToken(
  getToken: (options?: { skipCache?: boolean }) => Promise<string | null>,
): Promise<string | null> {
  try {
    const token = await getToken();
    if (!token) return null;

    // Local check for expiration to avoid sending a dead token to the backend
    if (isTokenExpired(token)) {
      console.warn("[getSafeToken] Token expired locally, forcing refresh...");
      return await getToken({ skipCache: true });
    }

    return token;
  } catch (err: any) {
    // Handle "Handshake failed" or "invalid_handshake" errors from Clerk SDK
    const isHandshakeError =
      err?.message?.includes("Handshake failed") ||
      err?.code === "invalid_handshake" ||
      err?.long_message?.includes("timestamp check failed");

    if (isHandshakeError) {
      console.error("[getSafeToken] Clerk handshake failed, attempting forced refresh...");
      try {
        return await getToken({ skipCache: true });
      } catch (retryErr) {
        console.error("[getSafeToken] Forced refresh also failed.", retryErr);
        throw retryErr;
      }
    }

    throw err;
  }
}

/**
 * Checks if a JWT token is expired or close to expiring (within 10 seconds).
 */
function isTokenExpired(token: string): boolean {
  try {
    // JWTs are [header].[payload].[signature]
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    // Standard atob() may fail if the string is not correctly padded
    const padding = base64.length % 4;
    const paddedBase64 = padding ? base64 + "=".repeat(4 - padding) : base64;

    const payload = JSON.parse(atob(paddedBase64));
    const now = Math.floor(Date.now() / 1000);

    // If 'exp' is missing or in the past (with a 10s buffer), it's expired.
    return typeof payload.exp !== "number" || payload.exp < now + 10;
  } catch (e) {
    // If we can't parse it, assume it's invalid/expired
    return true;
  }
}
