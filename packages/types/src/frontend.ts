/**
 * Frontend-safe exports.
 * This file only exports types that don't depend on NestJS or other backend-only packages.
 * Use this in frontend applications to avoid bundling backend dependencies.
 * 
 * IMPORTANT: Only export TypeScript TYPES (interfaces, type aliases) here,
 * NOT classes with decorators which would pull in NestJS dependencies.
 */

// Re-export all enums (no dependencies)
export * from './enums/index';

// =====================
// Account DTOs (type-only)
// =====================
export type {
  CreateOnboardingDto,
  UpdateOnboardingDto,
  OnboardingProfileResponseDto,
  MeResponseDto,
} from './dtos/backend/account/onboarding.dto';

export type {
  CollegeSearchResultDto,
} from './dtos/backend/account/college.dto';

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
} from './dtos/backend/hackathon/create-hackathon.dto';

export type {
  HackathonUserRoleValue,
  AddHackathonRoleDto,
  RemoveHackathonRoleDto,
  HackathonRoleUserResponse,
  HackathonOwnerResponse,
  HackathonRolesResponse,
} from './dtos/backend/hackathon/hackathon-roles.dto';

// Also export the value constant (it's just an array, no NestJS deps)
export { HackathonUserRoleValues } from './dtos/backend/hackathon/hackathon-roles.dto';

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
} from './dtos/backend/festival/create-festival.dto';

// =====================
// Team DTOs (type-only)
// =====================
export type {
  CreateTeamDto,
} from './dtos/backend/team/team.dto';

