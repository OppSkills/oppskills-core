export const MEET_KIND_VALUES = ["INSTANT", "OPEN_LINK", "SCHEDULED"] as const;
export type MeetKind = (typeof MEET_KIND_VALUES)[number];

export const MEET_AUDIENCE_SCOPE_VALUES = ["ALL", "MEMBER_TYPES"] as const;
export type MeetAudienceScope = (typeof MEET_AUDIENCE_SCOPE_VALUES)[number];

export const MEET_STATUS_VALUES = ["ACTIVE", "SCHEDULED", "ENDED"] as const;
export type MeetStatus = (typeof MEET_STATUS_VALUES)[number];

export interface CreateCommunityMeetDto {
  kind: MeetKind;
  title: string;
  description?: string;
  scheduledStartAt?: string;
  audienceScope?: MeetAudienceScope;
}

export interface CommunityMeetResponse {
  id: string;
  communityId: string;
  inviteCode: string;
  kind: MeetKind;
  title: string;
  description: string | null;
  scheduledStartAt: string | null;
  audienceScope: MeetAudienceScope;
  hostUserId: string;
  hostName: string;
  status: MeetStatus;
  meetUrl: string;
  createdAt: string;
}

export interface MeetPreviewResponse {
  inviteCode: string;
  title: string;
  description: string | null;
  kind: MeetKind;
  status: MeetStatus;
  scheduledStartAt: string | null;
  communityName: string;
  hostName: string;
  hostUserId: string;
  audienceScope: MeetAudienceScope;
}

export interface MeetJoinTokenResponse {
  token: string;
  livekitUrl: string;
  roomName: string;
  participantName: string;
  participantIdentity: string;
}
