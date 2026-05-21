# Referral: native and mobile clients

Browser clients rely on the first-party cookie `oppskills_ref`, set when the user visits `/r/<code>` before landing on the hackathon or event.

**Native apps, WebViews without a shared cookie jar, or headless API clients** do not get that cookie automatically. They must forward the referral **explicitly** using the optional JSON field `referralCode` on the same requests the web app already makes.

## Rules

1. **Source of truth**: The code is the same string as in the public path: `/r/<code>`.
2. **When to send**: Include `referralCode` on payment **order** and **verify** requests so it can be stored in Razorpay order notes and survive redirects and webhooks. For free registration, send it on join/create team/event bodies as in the web app.
3. **Optional everywhere**: Omitted `referralCode` is valid; invalid codes are ignored server-side.
4. **Deep links**: Resolve the app deep link (or universal link) to extract `code`, then pass it on API calls until registration completes.

## Endpoints (non-exhaustive; see `native-mobile-contract.ts` in `@oppskills/types`)

| Method | Path                                 | Body field      |
| ------ | ------------------------------------ | --------------- |
| POST   | `/hackathons/:slug/payment/order`    | `referralCode?` |
| POST   | `/hackathons/:slug/payment/verify`   | `referralCode?` |
| POST   | `/hackathons/:slug/teams/draft/join` | `referralCode?` |
| POST   | `/events/:slug/payment/order`        | `referralCode?` |
| POST   | `/events/:slug/payment/verify`       | `referralCode?` |

Use the same Clerk (or dev) auth headers as other authenticated calls.

## TypeScript

Import `ReferralCodePayload` or read the JSDoc in:

`packages/types/src/dtos/backend/referral/native-mobile-contract.ts`
