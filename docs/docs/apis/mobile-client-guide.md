# Mobile API client guide (React Native)

Read this document **before** wiring individual endpoints. It describes how the OppSkills NestJS API expects to be called from a React Native app and how to structure data fetching so it stays fast, consistent, and easy to maintain.

This is the mobile counterpart to the Next.js pattern: **TanStack Query hooks + a thin API layer + Clerk-provided JWTs on every request** (instead of Server Actions, which are web-only).

---

## Mental model

| Concern | Where it lives |
|--------|----------------|
| Sign-in, sign-up, email verification, OAuth, password reset, sessions | **Clerk** (`@clerk/clerk-expo`) |
| User rows, onboarding profile, opportunities, payments | **OppSkills API** (Bearer JWT from Clerk) |

The backend **does not** implement a custom email OTP or password store for end users. Anything that looks like “enter the code we emailed you” in product designs is implemented with **Clerk’s** verification strategies, not `POST /…/otp` on this API.

---

## Recommended stack

- **Expo (React Native)** — standard tooling, OTA updates, deep links for OAuth return URLs.
- **Clerk Expo** — `@clerk/clerk-expo` for session, `getToken()`, and auth UI (or your own UI using Clerk’s hooks).
- **TanStack Query v5** (`@tanstack/react-query`) — caching, deduping, retries, background refresh, mutation lifecycle.
- **Optional: Zod** — share request/response types with runtime validation at API boundaries (same idea as many Next.js codebases).

You can use **Fetch** or **axios**; the important part is a **single API module** that injects auth and normalizes errors.

---

## Base URL and headers

- **Development**: `http://localhost:3001` (or your machine’s LAN IP from a physical device, e.g. `http://192.168.1.10:3001`).
- **Production**: `https://api.oppskills.com` (or the value your team agrees on).

Every authenticated request:

```http
Authorization: Bearer <clerk_jwt>
Content-Type: application/json
Accept: application/json
```

JWTs must be obtained with Clerk’s **`getToken()`** (or equivalent) so Clerk can refresh them. Do not persist long-lived tokens yourself; treat the session as the source of truth.

### Development-only bypass

When the backend is run with auth bypass enabled (see [Authentication API](./auth.md)), non-production environments may accept:

```http
X-User-Id: <dev user id>
X-User-Email: <email>
```

Use this only for simulator/testing — never ship it to production clients.

---

## Single API client (thin layer)

Create one module, e.g. `src/api/oppskillsClient.ts`, that:

1. Accepts a `getToken: () => Promise<string | null>` (from `useAuth()` / Clerk).
2. Builds the full URL from a path + optional query string.
3. Injects `Authorization` when a token exists; **fails fast** with a typed error when a protected route is called signed-out.
4. Parses JSON and normalizes **NestJS errors** (`{ statusCode, message, error }`).

```typescript
// Illustrative — adapt to your app’s env and error types.
type ApiError = { statusCode: number; message: string; error?: string };

export function createOppskillsApi(getToken: () => Promise<string | null>) {
  const base = process.env.EXPO_PUBLIC_API_BASE_URL!;

  async function request<T>(
    path: string,
    init: RequestInit & { auth?: boolean } = {},
  ): Promise<T> {
    const { auth = true, headers, ...rest } = init;
    const h = new Headers(headers);
    h.set('Accept', 'application/json');
    if (rest.body && !h.has('Content-Type')) {
      h.set('Content-Type', 'application/json');
    }
    if (auth) {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      h.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(`${base}${path}`, { ...rest, headers: h });
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const err = body as ApiError;
      throw Object.assign(new Error(err?.message || res.statusText), {
        statusCode: res.status,
        payload: body,
      });
    }
    return body as T;
  }

  return { request };
}
```

**Senior-level conventions:**

- **No secrets** in the client (no Clerk secret keys, no Razorpay secrets). Only publishable keys belong in the app.
- **Timeouts**: use `AbortController` for slow networks; surface retry in UI where it makes sense.
- **Logging**: log correlation-friendly data (status, path), never raw JWTs.

---

## TanStack Query: patterns that match industry usage

### 1. Query key factory

Centralize keys so invalidation stays correct when you add variables (e.g. user id, slug).

```typescript
export const qk = {
  me: ['me'] as const,
  profile: ['user', 'profile'] as const,
  collegeSearch: (q: string) => ['colleges', 'search', q] as const,
};
```

### 2. Reads (`useQuery`)

- **`staleTime`**: user-specific data (`GET /user-accounts/me`, `GET /user-accounts/profile`) — start with **30–120 seconds** so navigations do not refetch constantly.
- **`gcTime`**: default is fine; increase if you want list data to survive longer when screens unmount.
- **`retry`**: retry **idempotent GETs** on network failure; avoid blind retries on `POST`/`PUT` unless the operation is explicitly idempotent.

```typescript
useQuery({
  queryKey: qk.me,
  queryFn: () => api.request('/user-accounts/me'),
  staleTime: 60_000,
});
```

### 3. Writes (`useMutation`) + cache invalidation

After mutations that change server state, **invalidate** (or **update** from response) related queries:

```typescript
const qc = useQueryClient();

const patchEducation = useMutation({
  mutationFn: (body: object) =>
    api.request('/user-accounts/education', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: qk.me });
    qc.invalidateQueries({ queryKey: qk.profile });
  },
});
```

This mirrors how a Next.js app invalidates after a Server Action — same data contract, different transport.

### 4. Prefetch on warm paths

When the user is about to open a screen (e.g. pressing “Continue” on step 2), **`prefetchQuery`** college search results or profile to remove perceived latency.

### 5. App foreground refresh

Mobile users background the app for a long time. On `AppState` → `active`, call:

```typescript
qc.invalidateQueries({ queryKey: qk.me });
```

…or `refetchQueries` for screens that show time-sensitive registration state.

### 6. Online / offline

TanStack Query does not replace a full offline-first store. For OppSkills today, assume **online-first**: queue mutations with a library only if product requires true offline onboarding.

---

## Auth-gated navigation

Typical pattern:

1. **Clerk** decides “signed in or not”.
2. After signed in, call **`GET /user-accounts/me`** once (or from a root layout effect) to read `onboarded` and route to onboarding vs home.
3. Protect API calls: if `getToken()` is null, do not hit protected endpoints — show auth UI instead.

On **`401`** from the API, treat the session as suspect: ask Clerk to refresh the session or sign the user out and return to login. Do not spin-retry forever.

---

## Pagination and search

- **College search** (`GET /colleges/search?q=`) and similar endpoints should use **`enabled: query.length >= 2`** (or your UX threshold) to avoid spamming the API.
- Debounce text input **300–500 ms** before attaching the query to the network layer.

---

## Onboarding and “Skip”

Product designs often include **Skip**. The backend tracks completion mainly via the **`onboarded`** flag on the user (see [Onboarding API](./onboarding.md)). Skipping screens usually means “defer collecting optional fields,” not “call random endpoints out of order.”

Prefer:

- **Draft in React state / MMKV** across steps, then one **`PUT /user-accounts/onboarding`** when the user finishes or skips optional steps, **or**
- Incremental **`PATCH`** calls for profile/education/skills, then a final **`PUT /onboarding`** when all **required** fields for your chosen `userCategory` are satisfied.

Details and payloads: [Onboarding API](./onboarding.md).

---

## Related docs (read order)

1. [Authentication API](./auth.md) — Clerk JWT, Expo snippets, reset password via Clerk.
2. [Onboarding API](./onboarding.md) — accepted request fields and DTOs for onboarding and profile patches.
3. [User Profile API](./user_profile.md) — broader profile, registrations, transactions.

---

## Checklist before shipping

- [ ] `EXPO_PUBLIC_API_BASE_URL` (or your env scheme) set per environment.
- [ ] Clerk publishable key configured for the same Clerk instance as the web app.
- [ ] All protected calls go through the shared client with `Authorization`.
- [ ] Query keys and invalidation cover every mutation that affects `me` / `profile`.
- [ ] 401 and validation errors (`400`) surfaced with actionable copy in the UI.
- [ ] No secret keys or webhook secrets in the mobile bundle.
