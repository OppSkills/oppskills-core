# Referrals API

API reference for the OppSkills referral system, enabling users to refer peers, track performance, and earn rewards or discounts.

## Overview

The Referral API tracks link generation, clicks, and successful conversions (registrations via a referral link).

---

## 1. Public Resolvers

These endpoints are called by the frontend when a user lands on the platform via a referral link.

### Resolve Referral Code (`GET /referrals/public/resolve/:code`)
**Method**: `GET`
**Description**: Validates a referral code and returns details about the referrer and the target opportunity (if applicable).

### Track Click (`POST /referrals/public/track-click`)
**Method**: `POST`
**Description**: Logs a click event for analytics, useful to calculate the conversion rate of a referral campaign.

---

## 2. User Referral Dashboard

Endpoints for a user to track their own referral performance.

### Create a Referral (`POST /referrals`)
**Method**: `POST`
**Description**: Generates a new unique referral link for a specific campaign or opportunity.

### Get My Performance (`GET /referrals/my/performance`)
**Method**: `GET`
**Description**: Returns aggregate metrics: total clicks, total successful registrations, and rewards earned.

### Get My Referred Users (`GET /referrals/my/referred-users`)
**Method**: `GET`
**Description**: Lists the users who have successfully signed up or registered using the authenticated user's referral links.

---

## 3. Admin & Lookup

Endpoints for administrative tasks and analytics.

- **Get All Referrals**: `GET /referrals`
- **Get Referral by ID**: `GET /referrals/:id`
- **Analytics**: `GET /referrals/analytics` (Platform-wide or campaign-specific metrics)
- **User Lookup**: `GET /referrals/user-lookup` (Find referrals associated with a specific user)
- **Referrer Details**: `GET /referrals/:id/referrer-details`
- **Referral Activity**: `GET /referrals/:id/registrations`
- **Delete Referral**: `DELETE /referrals/:id`
