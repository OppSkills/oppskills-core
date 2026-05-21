/**
 * Public, non-PII response for team invite link preview (unauthenticated).
 */
export type TeamInvitePreviewClosedReason =
  | "HACKATHON_NOT_PUBLIC"
  | "REGISTRATION_PAUSED"
  | "DEADLINE_PASSED";

export interface TeamInvitePreviewResponse {
  teamName: string;
  hackathonName: string;
  hackathonSlug: string;
  registrationOpen: boolean;
  registrationClosedReason?: TeamInvitePreviewClosedReason;
  teamFull: boolean;
  spotsLeft: number;
  requiresPayment: boolean;
}
