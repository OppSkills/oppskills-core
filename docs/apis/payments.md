# Payments and Ticketing API

API reference for managing payments, ticket tiers, hackathon checkouts, refunds, and payouts via Razorpay.

---

## 1. Ticket Tiers
- **Event Tickets**: `GET`, `POST` `/events/:slug/tickets` | `PATCH`, `DELETE` `/events/:slug/tickets/:tierId`
- **Hackathon Tickets**: `GET`, `POST` `/hackathons/:slug/tickets` | `PATCH`, `DELETE` `/hackathons/:slug/tickets/:tierId`

## 2. Discount Codes
- **Manage Codes**: `GET`, `POST` `/hackathons/:slug/discount-codes` | `PATCH`, `DELETE` `/hackathons/:slug/discount-codes/:codeId`

## 3. Checkout and Payment Processing
Handles the full Razorpay payment sequence for hackathon registrations.
- **Create Checkout Draft**: `POST /hackathons/:slug/registration/checkout-draft`
- **Create Razorpay Order**: `POST /hackathons/:slug/payment/order`
- **Verify Payment Signature**: `POST /hackathons/:slug/payment/verify`
- **Check Payment Status**: `GET /hackathons/:slug/payment/:paymentId/status`
- **Free/Basic Submission**: `POST /hackathons/:slug/registrations/submit`
- **Registration Status**: `GET /hackathons/:slug/registrations/status`

## 4. Webhooks and Refunds
- **Razorpay Webhook**: `POST /webhooks/razorpay` (Handles asynchronous payment capture events).
- **Issue Refund**: `POST /hackathons/:slug/refunds`
- **Refund Status**: `GET /hackathons/:slug/refunds/:paymentId/status`

## 5. Organizer Payouts and Earnings
- **Earnings Summary**: `GET /hackathons/:slug/earnings`
- **List Payments Received**: `GET /hackathons/:slug/payments`
- **Payout Details (Bank Info)**: `GET /payments/payout-details`, `PUT /payments/payout-details`

### Razorpay Route Onboarding
- **Onboard Organizer**: `POST /payments/route/onboard`
- **Check Route Status**: `GET /payments/route/status`
- **Refresh Status**: `POST /payments/route/refresh-status`
- **Update Settlements**: `POST /payments/route/update-settlements`

### Admin Payouts Processing
- **List Eligible Payouts**: `GET /admin/payouts/eligible`
- **Process Payout**: `POST /admin/payouts/pay`
