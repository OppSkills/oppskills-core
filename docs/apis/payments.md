# Payments API

This guide covers tickets, discounts, the checkout flow, and organizer payouts.

For mobile (React Native) integrations, use the `apiClient.request` and TanStack Query patterns from the `mobile-client-guide.md`.

---

## 1. Tickets and Discounts

Organizers set these up to charge for their events.

- **Manage Tickets:** `GET`, `POST`, `PATCH`, `DELETE` at `/events/:slug/tickets`
- **Manage Discounts:** `GET`, `POST`, `PATCH`, `DELETE` at `/hackathons/:slug/discount-codes`

---

## 2. The Checkout Flow (Razorpay)

When a user buys a ticket, your frontend must execute these steps in order.

1. **Create Draft:** `POST /hackathons/:slug/registration/checkout-draft` (Calculates the final price).
2. **Create Order:** `POST /hackathons/:slug/payment/order` (Creates the Razorpay order ID).
3. **Pay on Frontend:** Open the Razorpay UI using the order ID.
4. **Verify Signature:** `POST /hackathons/:slug/payment/verify` (Send Razorpay's success signature to the backend to confirm).

### Free Registrations
If the event is free, skip Razorpay entirely and just call:
- `POST /hackathons/:slug/registrations/submit`

---

## 3. Organizer Earnings and Payouts

- **View Earnings:** `GET /hackathons/:slug/earnings`
- **Set Bank Info:** `PUT /payments/payout-details`
- **Razorpay Route Onboarding:** `POST /payments/route/onboard` (Links the organizer's bank directly to Razorpay for split payments).

### React Native Example
```typescript
const { data: earnings } = useQuery({
  queryKey: ['earnings', hackathonSlug],
  queryFn: () => apiClient.request(`/hackathons/${hackathonSlug}/earnings`),
});
```
