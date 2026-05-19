# Payments & Ticketing API

This guide covers how tickets are created, how the checkout flow works for users (using Razorpay), and how organizers receive their payouts. 

For mobile (React Native) integrations, use the `apiClient.request` and TanStack Query patterns from the `mobile-client-guide.md`.

---

## 1. Ticket Tiers & Discounts

Organizers create ticket tiers to charge users for participating. A hackathon or event can have multiple tiers (e.g., "Early Bird", "General Admission").

### Manage Hackathon Tickets
- **List/Create:** `GET`, `POST /hackathons/:slug/tickets`
- **Update/Delete:** `PATCH`, `DELETE /hackathons/:slug/tickets/:tierId`

### Manage Event Tickets
- **List/Create:** `GET`, `POST /events/:slug/tickets`
- **Update/Delete:** `PATCH`, `DELETE /events/:slug/tickets/:tierId`

### Manage Discount Codes (Hackathons)
- **Usage:** Create codes (like `SAVE20`) that users can apply at checkout.
- **Endpoints:** `GET`, `POST`, `PATCH`, `DELETE` at `/hackathons/:slug/discount-codes`

---

## 2. The Checkout Flow (Razorpay)

When a user registers for a paid hackathon, your frontend must execute the Razorpay flow. This is a multi-step process because the final price must be securely calculated on the backend before asking for payment.

**The 4-Step Checkout Process:**

1. **Calculate Price (Draft Checkout)**
   - **Endpoint:** `POST /hackathons/:slug/registration/checkout-draft`
   - **Usage:** Send the `ticketId` and an optional `discountCode`. The backend calculates the final amount (including taxes and platform fees) and returns it. Display this final price to the user in your UI.

2. **Create Razorpay Order**
   - **Endpoint:** `POST /hackathons/:slug/payment/order`
   - **Usage:** Once the user clicks "Pay", call this. The backend talks to Razorpay and returns a `razorpayOrderId`.

3. **Open Razorpay UI (Frontend)**
   - **Usage:** Use the Razorpay React Native SDK. Pass the `razorpayOrderId` to open the payment sheet. 

4. **Verify Payment**
   - **Endpoint:** `POST /hackathons/:slug/payment/verify`
   - **Usage:** If the user pays successfully, Razorpay gives you a signature on the frontend. Send that signature to this endpoint. The backend verifies it and officially completes the registration!

### React Native Example: Verification Step
```typescript
const verifyPayment = useMutation({
  mutationFn: (razorpaySignatureData) => apiClient.request(`/hackathons/${slug}/payment/verify`, {
    method: 'POST',
    body: JSON.stringify(razorpaySignatureData),
  }),
  onSuccess: () => {
    // Show success screen and refresh registration status
    queryClient.invalidateQueries({ queryKey: ['registration', slug] });
  }
});
```

*(Note: For **Free** registrations, skip all of this and just call `POST /hackathons/:slug/registrations/submit`!)*

---

## 3. Refunds

Sometimes organizers or admins need to refund a user's ticket.
- **Issue Refund:** `POST /hackathons/:slug/refunds` (Refunds the money to the original payment method).
- **Check Status:** `GET /hackathons/:slug/refunds/:paymentId/status`

---

## 4. Organizer Payouts (Razorpay Route)

When a user buys a ticket, the money goes to the platform first. Organizers must set up a "Razorpay Route" account to receive their cut.

### Setting Up Bank Details
- **Add/Update Bank Info:** `PUT /payments/payout-details`
- **View Bank Info:** `GET /payments/payout-details`

### Onboarding to Razorpay Route
- **Start Onboarding:** `POST /payments/route/onboard` (Generates a link for the organizer to complete KYC with Razorpay).
- **Check Status:** `GET /payments/route/status` (Checks if Razorpay approved their account).

### Viewing Earnings
- **Earnings Summary:** `GET /hackathons/:slug/earnings` (Shows total revenue and the organizer's cut).
- **List of Payments:** `GET /hackathons/:slug/payments` (Shows a list of every ticket sold).

### Admin Tools
- Admins manually release payouts using `GET /admin/payouts/eligible` and `POST /admin/payouts/pay`.
