# Razorpay Route Payments — Implementation Audit

Audit target: `.cursor/plans/razorpay_route_payments.plan.md`

This document checks whether the codebase matches the plan’s requirements and lists gaps / risks.

## High-level status

**Mostly implemented** (schema + modules + endpoints exist), but there are several **blocking gaps** where the implemented behavior diverges from the plan’s acceptance criteria / business rules.

### Biggest blockers (must-fix)

1. **Razorpay webhook signature verification will fail in production** because **raw body is not configured**.
   - `apps/backend/src/payments/razorpay-webhook.controller.ts` expects `req.rawBody`.
   - `apps/backend/src/main.ts` only uses `json()` / `urlencoded()` parsers; request stream is consumed, so raw body will not be available.

2. **Discount redemption is never persisted**, so:
   - `maxRedemptions` is effectively unenforced.
   - `maxPerUser` is effectively unenforced.
   - `HackathonDiscountRedemptionEntity` exists in Prisma but is not created anywhere.

3. **Plan says “registration submission is only created after payment requirement is satisfied (Option 1: draft → pay → submit)”.**
   - New draft flow exists (`/hackathons/:slug/teams/draft` + `/hackathons/:slug/registrations/submit`).
   - However, legacy endpoints still exist and **still create registration submissions immediately**:
     - `POST /hackathons/create-team`
     - `POST /hackathons/join-team`
   - For **paid hackathons**, these endpoints allow bypassing payment gating if the frontend (or a client) uses them.

4. **Draft-team leader cannot submit registration** with current logic.
   - `RegistrationSubmitService` requires a `TeamMemberEntity` record for the submitting user.
   - `DraftTeamService.createDraftTeam()` creates a `TeamEntity` but **does not create a `TeamMemberEntity` for the leader**.
   - Result: the leader is not found by `teamMemberEntity.findFirst`, so they hit:
     - “You must join a team before submitting registration”

---

## What matches the plan (implemented)

### Prisma / data model

Plan-required enums/models appear implemented in `packages/database/prisma/schema.prisma`:

- ✅ `HackathonChargeMode` enum added
- ✅ `RazorpayRouteStatus` enum added
- ✅ `HackathonPaymentScope`, `HackathonPaymentStatus`, `HackathonPaymentOrderStatus`
- ✅ `RefundStatus`, `DiscountCodeType`
- ✅ Models:
  - `RazorpayRouteAccountEntity`
  - `HackathonPaymentEntity`
  - `HackathonDiscountCodeEntity`
  - `HackathonDiscountRedemptionEntity`
  - `RazorpayWebhookEventEntity`
- ✅ Relations on `UserEntity`, `HackathonEntity`, `TeamEntity`

### Order creation (Route transfers + hold-until)

Implemented in:

- `apps/backend/src/payments/hackathon-checkout.service.ts`
- `apps/backend/src/payments/razorpay.service.ts`

Observed behavior:

- ✅ `payment_capture: 1` (auto-capture) is passed at order creation.
- ✅ Transfer includes:
  - `on_hold: true`
  - `on_hold_until: Math.floor(registrationDeadline.getTime() / 1000)`
- ✅ Organizer transfer uses organizer’s Route account ID.
- ✅ Platform fee calculation is 2% of gross amount.

### Organizer onboarding (Route)

Implemented in:

- `apps/backend/src/payments/payments-route.controller.ts`
- `apps/backend/src/payments/payments-route.service.ts`
- `apps/backend/src/payments/razorpay.service.ts`

Endpoints present:

- ✅ `POST /payments/route/onboard`
- ✅ `GET /payments/route/status`
- ✅ plus additional helpers like `refresh-status`, `update-settlements`

### Draft team + gated registration submit endpoint

Implemented in:

- `apps/backend/src/payments/draft-team.controller.ts`
- `apps/backend/src/payments/draft-team.service.ts`
- `apps/backend/src/payments/registration-submit.service.ts`

Endpoints present:

- ✅ `POST /hackathons/:slug/teams/draft`
- ✅ `POST /hackathons/:slug/teams/draft/join`
- ✅ `POST /hackathons/:slug/registrations/submit`

Payment gating at submit:

- ✅ PER_TEAM: requires captured TEAM payment for the team
- ✅ PER_USER: requires captured USER payment for the user

### Refund endpoint exists

Implemented in:

- `apps/backend/src/payments/refund.controller.ts`
- `apps/backend/src/payments/refund.service.ts`

Endpoint present:

- ✅ `POST /hackathons/:slug/refunds`

Authorization:

- ✅ organizer (hackathon owner) OR admin can refund

---

## Gaps / mismatches vs plan

### 1) Webhook raw body/signature verification not wired (BLOCKER)

**Plan requirement**:

- Webhook endpoint must verify signature using raw body.

**Current code**:

- `apps/backend/src/payments/razorpay-webhook.controller.ts` reads:
  - `(req as { rawBody?: Buffer }).rawBody`
  - returns 400 if missing.
- `apps/backend/src/main.ts` only does:
  - `app.use(json(...))`
  - `app.use(urlencoded(...))`

**Impact**:

- In real deployments the webhook route will not have raw body and will always fail verification.

**Recommendation**:

- Add route-specific `express.raw({ type: 'application/json' })` middleware for `/webhooks/razorpay` BEFORE global json parsing.

---

### 2) Discount redemption is not persisted (BLOCKER)

**Plan requirement**:

- Discount codes work in both modes and redemption limits are enforced.

**Current code**:

- Discount codes CRUD exists (`DiscountCodeController` / `DiscountCodeService`).
- Checkout applies discount via `HackathonCheckoutService.applyDiscountCode()`:
  - checks `HackathonDiscountRedemptionEntity.count()` for `maxRedemptions`
  - checks `HackathonDiscountRedemptionEntity.findFirst()` for user usage
- **But no code creates `HackathonDiscountRedemptionEntity`** on success.

**Impact**:

- `maxRedemptions`: always sees 0 redemptions → code can be used unlimited times.
- per-user usage: always sees no redemption → user can reuse a code indefinitely.

**Recommendation**:

- Create a redemption record on `payment.captured` (or `order.paid`) webhook:
  - Find the `HackathonPaymentEntity` by `razorpayOrderId`
  - If it has `discountCodeId`, insert `HackathonDiscountRedemptionEntity` with `{ discountCodeId, userId: payerUserId, paymentId }`
  - Ensure idempotency (unique constraints already exist).

---

### 3) Old registration endpoints bypass payment gating (BLOCKER)

**Plan requirement**:

- For paid hackathons, registration submissions are created only after payment is satisfied.

**Current code**:

- New “draft → pay → submit” flow exists.
- But legacy team endpoints still create submissions immediately:
  - `apps/backend/src/team/team.service.ts`
    - `createTeam()` creates:
      - `TeamEntity`
      - `HackathonRegistrationSubmissionEntity`
      - increments `hackathon.registrationCount`
    - `joinTeam()` also creates submissions / increments.

**Impact**:

- A client can register without paying by calling legacy endpoints.

**Recommendation**:

- Either:
  1. Block `createTeam/joinTeam` on paid hackathons (require `hackathon.isFree === true`), or
  2. Modify them to behave like draft endpoints for paid hackathons, or
  3. Deprecate/remove those endpoints and ensure frontend no longer calls them.

---

### 4) Draft leader is not considered “in a team” (BLOCKER)

**Plan requirement**:

- Draft team creation grants the leader a draft membership; later leader can submit after payment.

**Current code**:

- `DraftTeamService.createDraftTeam()` creates a `TeamEntity` only.
- `RegistrationSubmitService.submitRegistration()` requires `TeamMemberEntity` membership:
  - `teamMemberEntity.findFirst({ where: { userId, team: { hackathonId } } })`

**Impact**:

- The leader cannot submit registration and will be blocked.

**Recommendation**:

- Either:
  1. Create a `TeamMemberEntity` for leader at draft-team creation time, or
  2. Update registration-submit logic to accept leader membership via `TeamEntity.leaderId` (not only TeamMemberEntity).

---

### 5) Pricing lock condition differs from plan (MEDIUM)

**Plan requirement**:

- Lock if any team, payment, or submission exists.

**Current implementation**:

- `apps/backend/src/hackathon/hackathon.service.ts` blocks pricing changes if any **team** exists.

**Impact**:

- If a payment exists without a team (possible in PER_USER order creation), pricing may still be changeable.

**Recommendation**:

- Extend the lock check to include `HackathonPaymentEntity` and/or `HackathonRegistrationSubmissionEntity` as the plan specified.

---

### 6) Paid hackathon validation: missing registrationDeadline enforcement on create/update (MEDIUM)

**Plan acceptance**:

- Paid hackathon requires `registrationDeadline`.

**Current code observed**:

- Hackathon checkout blocks payment order creation unless `registrationDeadline` is present.
- Hackathon create/update validation only enforces `entryFeeAmount` when `isFree=false`.

**Impact**:

- You can create a “paid” hackathon without a `registrationDeadline`; payment flow will later fail.

**Recommendation**:

- Add validation in hackathon create/update: if `isFree === false` then require both `entryFeeAmount` and `registrationDeadline`.

---

### 7) Webhook event bookkeeping: processedAt not updated (LOW)

**Plan**:

- Webhook event table includes `processedAt`.

**Current code**:

- Events are inserted (idempotency works), but `processedAt` is never set.

**Impact**:

- Harder operational debugging / observability when reviewing webhook processing.

**Recommendation**:

- After `processEvent()` succeeds, update the event row to set `processedAt = now()`.

---

### 8) Discount code feature completeness gaps (MEDIUM)

Differences from the plan/model:

- `HackathonDiscountCodeEntity` has `validFrom` / `validUntil` fields, but controller/service do not expose or enforce them.
- Checkout discount logic doesn’t respect `maxPerUser > 1` (it blocks any second usage rather than counting).

---

## Summary / verdict

- ✅ Core payment schema, Route onboarding, order creation with transfer hold-until, checkout verification, registration submit gating, and refund endpoints exist.
- ❌ The implementation is **not “correct” per plan** because several key parts don’t work end-to-end:
  - webhook signature verification is not wired (raw body)
  - discount redemption tracking is missing
  - old endpoints still allow non-gated submission creation
  - draft leader cannot submit

If you want, I can follow up with a fix plan (or PR) for the blockers in the smallest possible set of changes.
