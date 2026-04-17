/**
 * Native / mobile: when `document.cookie` has no `oppskills_ref`, pass `referralCode`
 * explicitly on payment and registration API bodies. See repo doc:
 * `docs/referral-native-mobile.md` and `@oppskills/types` `native-mobile-contract`.
 */
export type { ReferralCodePayload } from "@oppskills/types";
