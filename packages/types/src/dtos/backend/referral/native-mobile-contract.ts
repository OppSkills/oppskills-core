/**
 * ## Native / mobile client contract (no `oppskills_ref` cookie)
 *
 * Web sets a first-party cookie `oppskills_ref=<code>` when the user hits `/r/<code>`.
 * Native apps, embedded WebViews without shared cookie storage, or API-only clients
 * **must** send the same `referralCode` string explicitly on the **same** JSON bodies
 * that the web app already supports (all fields are optional for backward compatibility).
 *
 * ### When to send
 * - After the user opens a referral link, capture `code` from the deep link (or query param)
 *   and keep it until registration or payment completes successfully.
 * - Send on **create order** and **verify** payment calls so Razorpay order notes and
 *   verify fallbacks both receive the code (covers mobile redirect + webhook-only flows).
 *
 * ### Endpoints / body fields (optional string `referralCode`)
 * - `POST /hackathons/:slug/payment/order` — CreateOrderDto
 * - `POST /hackathons/:slug/payment/verify` — VerifyPaymentDto
 * - `POST /hackathons/:slug/teams/draft/join` — JoinDraftTeamDto
 * - `POST /events/:slug/payment/order` — CreateEventPaymentOrderDto
 * - `POST /events/:slug/payment/verify` — VerifyEventPaymentDto
 * - Free registration: `POST /events/:id/join` (JoinEventDto), team create/join DTOs as on web
 *
 * ### Code format
 * Same short code as in the referral link path (`/r/<code>`), e.g. 10 URL-safe characters.
 *
 * ### Security
 * The server validates the code against the target hackathon/event (and festival parent
 * rules); invalid codes are ignored. Referrers cannot self-attribute.
 */

/** Marker type for documentation; optional on all relevant DTOs. */
export type ReferralCodePayload = {
  /** Referral code from `/r/<code>` deep link when cookie is unavailable. */
  referralCode?: string;
};
