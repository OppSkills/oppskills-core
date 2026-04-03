# Registration incident — production debugging (ops runbook)

Use this during investigations when **payments are CAPTURED** but **registration answers** are missing in `hackathon_registration_answer` / `event_registration_answer`.

## 1. Time-based pattern (bad deploy hypothesis)

Run in PostgreSQL (`oppskills` schema). Replace `:festival_id` with your festival id.

See [registration-incident-queries.sql](./registration-incident-queries.sql) section **1**.

**Interpretation:** Spikes on specific calendar days suggest a broken frontend/backend deploy during that window.

## 2. Log patterns (application logs)

Search your log aggregator (CloudWatch, Datadog, etc.):

```text
"verifyPayment: no registration answers for hackathon"
"Event verifyPayment: no registration answers for order"
"Bundled registration: no teamName"
"team context missing"
"Could not complete registration: team context missing"
"Incomplete registration reminder"
"Hackathon payment already captured (pre-check)"
```

Correlate timestamps with affected `razorpay_order_id` from DB.

## 3. Razorpay dashboard

- Payments → filter by date range when incident spiked.
- Check **method** (UPI, card, netbanking). High **redirect-heavy** methods + mobile users align with `callback_url` / handler-not-running scenarios.
- Open a sample payment → **Notes** should contain `hackathonId`, `slug`, `payerUserId`, team context for PER_USER/PER_TEAM.

## 4. Incomplete registration reminder cron

- Cron schedule: every **15 minutes** (`*/15 * * * *`) — see `apps/backend/src/email/incomplete-registration-reminder.cron.ts`.
- **Observability:** `GET /health/incomplete-registration-reminder` returns `lastRunFinishedAt`, `lastRunResult` (attempted/sent counts), and `lastRunError` if the last cron run threw.

Confirm the worker process is running (no stuck deploy, no disabled `ScheduleModule`).

## 5. Affected users / outreach

Use SQL in [registration-incident-queries.sql](./registration-incident-queries.sql) sections **2** and **3**.

Organizers can trigger reminder emails via existing email endpoints where documented in `apps/backend/src/email/email.controller.ts`.

## 6. Client recovery limitations

- **Unified `RegistrationModal`** writes pending answers to `localStorage` before Razorpay opens (`pendingHackathonRegistration.ts`). Recovery TTL is **7 days**.
- **`CreateTeamForm` / `JoinTeamList`** now also persist pending answers when opening Razorpay (same module).

Users who paid but never returned to the listing page with valid `localStorage` may still need email nudges or manual support.

## 7. Server-side answer escrow (DB)

Registration answers can be stored in `oppskills.payment_registration_escrow` when **`POST .../payment/order`** includes `answers` (frontend sends them at order creation). **`verifyPayment`** and the **Razorpay webhook** read this escrow when the client body is empty, so mobile redirect flows can still persist answers without relying on `handler()` or `localStorage`.
