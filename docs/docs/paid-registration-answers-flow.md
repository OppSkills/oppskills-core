# Paid registration: how form answers get saved (plain English)

This document explains how **paid hackathon and event registration** keeps **form answers** in sync with **successful Razorpay payments**, including the **server-side answer escrow** and **browser backup**. It is written for engineers and operators who need confidence that the design is safe and that common edge cases are handled.

---

## The problem we are solving

Razorpay can mark a payment as successful in two ways that do not always involve the same browser session:

1. The **checkout “success” handler** in JavaScript runs and your app calls **verify payment** with the form answers.
2. Razorpay’s **server webhook** runs and marks the payment **CAPTURED** in the database **without** any form data (webhooks do not include your custom form fields).

If the user is on **mobile**, closes the tab, or the success handler **never runs**, the app used to rely only on **localStorage** and the user **coming back** to the right page. That left gaps where **money was taken** but **answers never reached the database**.

The current design adds a **third, server-side copy** of the answers at **order creation time** (escrow), so **verify** and the **webhook follow-up** can still save answers **without depending on the client** sending them again.

---

## The three places answers can live (before they are “final”)

| Layer | What it is | When it helps |
|--------|------------|----------------|
| **Browser (`localStorage`)** | A backup on the user’s device | Recovery if they return to the hackathon/event page within the TTL and your UI runs the recovery flow. |
| **Server escrow (database)** | A row keyed by **Razorpay order id** with a JSON copy of answers | **Verify** can use it if the request body has no answers; **webhook** can trigger a server submit after capture. |
| **Final registration tables** | Normal submission + answer rows | Source of truth for organizers and exports. |

Nothing here **replaces** paying: escrow only stores answers **after** the user has already started checkout (create order). Charging is still entirely Razorpay + your payment rows.

---

## Normal flow (happy path)

1. User fills the registration form and taps to pay.
2. **Frontend** calls **create payment order** and sends **`answers`** (when the UI has them). The backend creates the Razorpay order and payment row, then **writes or updates escrow** for that order id (only if there is at least one answer).
3. User completes payment in Razorpay.
4. **Either**:
   - **A.** The Razorpay **handler** runs → app calls **verify payment** with signatures and usually **answers** in the body. The backend merges **body answers** with **escrow** if the body is empty, saves registration, then **deletes escrow** on success.
   - **B.** The **webhook** runs first → payment becomes **CAPTURED**; later the handler or a webhook helper runs **submit from escrow** so answers still land if the client never sent them.
5. **localStorage** backup (where implemented) still supports **returning users** who never got a clean verify, as long as they revisit the listing and your recovery UI runs.

---

## What “escrow” means here

Think of escrow as a **short-lived server draft** of the answers, attached to **this Razorpay order id** and **this payer user id**.

- It is **not** a second payment.
- It is **overwritten** if create-order is called again for the same order id pattern (upsert by `razorpay_order_id`).
- It is **removed** after registration answers are saved successfully (or when treating “already submitted” as done for that flow), so it does not linger forever.

---

## Safety: why this should not cause double charges or wrong data

- **Double charging:** Escrow does not create charges. Only Razorpay checkout and your existing payment flows charge the user. Escrow is read-only data used **after** an order exists.
- **Wrong user’s answers:** When loading escrow for verify, the backend checks **`payer_user_id`** on the escrow row matches the **authenticated user** on the request. A mismatch is ignored and logged.
- **Double submission:** Registration submit paths are **idempotent** where designed (e.g. “already submitted” is handled). Escrow is deleted when the server considers registration complete for that path.
- **Stale data:** Escrow rows have an **expiry** (48 hours from last write in code). Expired rows are not used and can be cleaned up when read.
- **Webhook retries:** Razorpay may send the same event more than once. Payment updates are idempotent; **try submit from escrow** is safe to run multiple times—if there is nothing to do (no escrow, already submitted), it exits quietly.

---

## Edge cases (what happens in each case)

### 1. Webhook runs before the client calls verify (“race”)

Payment is **CAPTURED** in the DB first. When verify runs, it sees **already CAPTURED** and still runs the **answer submit** path using **body + escrow** merge. If that succeeds, escrow is cleared. The webhook path also attempts **submit from escrow** so answers are not lost if the client never sends a body.

### 2. Client sends answers in verify; escrow also exists

**Body wins first:** If the verify request includes answers, those are used; escrow is fallback when the body is empty. After a successful save, escrow is deleted so you do not keep duplicate drafts.

### 3. Mobile redirect: Razorpay does not call `handler()`

The browser may load the **return URL** without running the old page’s JavaScript. **localStorage** (if written before opening Razorpay) and **server escrow** (if create-order sent answers) both improve recovery. **Webhook + try submit from escrow** reduces reliance on the client entirely for that gap.

### 4. User cleared site data / private mode / no localStorage

Browser backup may be missing. **Escrow** still allows server-side completion if create-order included answers and the user completes payment within the escrow TTL.

### 5. Create order did not send `answers` (empty array)

No escrow row is written (nothing to store). Behavior matches the previous system: answers must come from **verify body** or **localStorage recovery**, unless you fix the client to always send answers on create-order for paid forms.

### 6. Escrow expired

Load returns null; user may need **support** or **incomplete-registration** emails / manual flows. This is expected for very late verifies.

### 7. PER_USER hackathon: team context missing from order notes

Escrow stores **form field** answers, not a substitute for **team join/create** data that lives on Razorpay **notes**. If team context is missing, you can still see payment **CAPTURED** without a valid team path—that is a **separate** validation issue from escrow.

### 8. Zero-amount or free paths

Orders that never create a normal Razorpay order **do not** use this escrow path the same way; those flows use your **direct registration** APIs instead.

### 9. Event vs hackathon

Both flows have **create order → escrow**, **verify merge + delete**, and **webhook try submit** patterns aligned with each resource type (event vs hackathon tables).

---

## What operators should monitor

- **Incomplete registration reminder cron** (emails for paid-but-not-completed registration): see `GET /health/incomplete-registration-reminder` for last run time and counts.
- **Logs:** Warnings when verify runs **with a form configured** but **no answers** (body + escrow empty)—signals client or escrow gaps.
- **Ops runbook:** [registration-incident-debugging.md](./ops/registration-incident-debugging.md) and SQL helpers in [registration-incident-queries.sql](./ops/registration-incident-queries.sql).

---

## Summary

- **Payments** and **form answers** are intentionally decoupled in time; **escrow** bridges that gap **on the server** using the **Razorpay order id**.
- **localStorage** remains a **client-side** safety net; **escrow** is the **server-side** safety net when create-order sends answers.
- **Races, retries, and mobile** are handled by **merge rules**, **idempotent submits**, **payer checks**, and **TTL**, so the feature is meant to **reduce** missing answers **without** changing who is allowed to pay or how money moves.

If you change registration forms (field ids) or payment flows, treat **escrow + verify + webhook** as one system and test **mobile redirect** and **webhook-first** orderings in staging.
