/**
 * Optional entry for frontend apps that need a **small runtime** surface (enums,
 * a few exported constants like role lists) without going through main `index.js`,
 * which eagerly re-exports the whole `dtos/` tree (`require("./dtos")`).
 *
 * For DTO/class shapes used only in TypeScript, prefer:
 *
 * ```ts
 * import type { SomeDto } from "@oppskills/types";
 * ```
 *
 * Value imports (`import { Enum }`) for enums-only should use **`@oppskills/types/enums`**
 * so bundles do not load every DTO module.
 *
 * This file forwards enums and re-exports selected DTOs as **`export type`** (erased from JS)
 * plus a few explicit value exports (HackathonUserRoleValues, DiscountType, etc.).
 */

// Re-export all enums (no heavy dependencies)
export * from "./enums/index";

// =====================
// Account DTOs (type-only)
// =====================
export type {
  CreateOnboardingDto,
  UpdateOnboardingDto,
  OnboardingProfileResponseDto,
  MeResponseDto,
} from "./dtos/backend/account/onboarding.dto";

export type {
  UpdateProfileDto,
  UpdateEducationDto,
} from "./dtos/backend/account/user-account-profile.dto";

export type { CollegeSearchResultDto } from "./dtos/backend/account/college.dto";

// =====================
// Hackathon DTOs (type-only)
// =====================
export type {
  // Value types
  HackathonModeValue,
  VisibilityValue,
  HackathonTypeValue,
  ParticipantTypeValue,
  LocationTypeValue,
  RegistrationFieldTypeValue,
  HackathonLifecycleStatusValue,
  HackathonAttendeeEligibilityValue,
  HackathonRoundTypeValue,
  // Nested DTOs
  HackathonLocationDto,
  PrizeBreakdownDto,
  HackathonContactDto,
  HackathonAttachmentDto,
  HackathonAdditionalInfoDto,
  RegistrationFieldDto,
  RegistrationFormDto,
  RoundSubmissionConfigDto,
  RoundDto,
  // Main DTOs
  CreateHackathonDto,
  UpdateHackathonDto,
  UpdateHackathonRoundsDto,
  UpdateHackathonAdditionalInfoDto,
} from "./dtos/backend/hackathon/create-hackathon.dto";

export type {
  HackathonUserRoleValue,
  AddHackathonRoleDto,
  RemoveHackathonRoleDto,
  HackathonRoleUserResponse,
  HackathonOwnerResponse,
  HackathonRolesResponse,
} from "./dtos/backend/hackathon/hackathon-roles.dto";

export type { SendTeamEmailDto } from "./dtos/backend/hackathon/send-team-email.dto";

// Also export the value constant (it's just an array, no NestJS deps)
export { HackathonUserRoleValues } from "./dtos/backend/hackathon/hackathon-roles.dto";

// =====================
// Festival DTOs (type-only)
// =====================
export type {
  FestivalLocationTypeValue,
  FestivalLifecycleStatusValue,
  FestivalLocationDto,
  CreateFestivalDto,
  UpdateFestivalDto,
  UpdateFestivalStatusDto,
} from "./dtos/backend/festival/create-festival.dto";

// =====================
// Team DTOs (type-only)
// =====================
export type { CreateTeamDto } from "./dtos/backend/team/team.dto";

export type {
  TeamInvitePreviewResponse,
  TeamInvitePreviewClosedReason,
} from "./dtos/backend/team/team-invite-preview.dto";

// =====================
// Event DTOs (type-only)
// =====================
export type {
  // Value types
  EventLocationTypeValue,
  EventLifecycleStatusValue,
  EventVisibilityValue,
  EventTypeValue,
  EventAttendeeEligibilityValue,
  EventRegistrationFieldTypeValue,
  ApprovalStatusValue,
  // Nested DTOs
  EventLocationDto,
  EventPrizeBreakdownDto,
  EventContactDto,
  EventAttachmentDto,
  EventAdditionalInfoDto,
  EventRegistrationFieldDto,
  EventRegistrationFormDto,
  // Main DTOs
  CreateEventDto,
  UpdateEventDto,
  UpdateEventStatusDto,
  UpdateEventAdditionalInfoDto,
  UpdateEventRegistrationFormDto,
  UpdateEventPrizeBreakdownDto,
  UpdateEventMaxUsersDto,
  // Approval DTOs
  SubmitForApprovalDto,
  UpdateApprovalStatusDto,
  UpdateEventRegistrationPausedDto,
  // Registration DTOs
  EventRegistrationAnswerDto,
  JoinEventDto,
} from "./dtos/backend/event/create-event.dto";

export type {
  EventUserRoleValue,
  AddEventRoleDto,
  RemoveEventRoleDto,
  EventRoleUserResponse,
  EventOwnerResponse,
  EventRolesResponse,
} from "./dtos/backend/event/event-roles.dto";

// Also export the value constant (it's just an array, no NestJS deps)
export { EventUserRoleValues } from "./dtos/backend/event/event-roles.dto";

export type {
  EventPassDto,
  ScanEventPassDto,
  ScanResultDto,
} from "./dtos/backend/event/event-pass.dto";

// =====================
// Payment DTOs (type-only)
// =====================
export type { MarkPayoutPaidDto } from "./dtos/backend/payments/admin-payout.dto";

export type {
  CreateDiscountCodeDto,
  UpdateDiscountCodeDto,
} from "./dtos/backend/payments/discount-code.dto";
export { DiscountType } from "./dtos/backend/payments/discount-code.dto";

export type {
  CreateDraftTeamDto,
  JoinDraftTeamDto,
  LeaveDraftTeamDto,
} from "./dtos/backend/payments/draft-team.dto";

export type {
  CreateOrderDto,
  SaveHackathonRegistrationCheckoutDraftDto,
  VerifyPaymentDto,
} from "./dtos/backend/payments/hackathon-checkout.dto";

export type {
  OnboardRouteDto,
  UpdateSettlementsDto,
} from "./dtos/backend/payments/payments-route.dto";
export { BusinessType } from "./dtos/backend/payments/payments-route.dto";

export type { UpsertPayoutDetailsDto } from "./dtos/backend/payments/payout-details.dto";

export type { CreateRefundDto } from "./dtos/backend/payments/refund.dto";

export type { SubmitRegistrationDto } from "./dtos/backend/payments/registration-submit.dto";

export type {
  CreateTicketTierDto,
  UpdateTicketTierDto,
} from "./dtos/backend/payments/ticket-tier.dto";

// =====================
// Notifications
// =====================
export type { CreateNotificationDto } from "./dtos/backend/notification/schedule-notification.dto";
export {
  ScheduleType,
  NotificationStatus,
} from "./dtos/backend/notification/schedule-notification.dto";

// =====================
// Community (type-only)
// =====================
export type {
  CommunityMember,
  CommunityTask,
  CommunityMeet,
} from "./dtos/backend/community/manage-community.dto";

// Community industry enums are re-exported via ./enums/index (use @oppskills/types/enums for value imports)
