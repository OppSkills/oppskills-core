export interface CommunityMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
  lastAssignedDate?: string | null;
  accessControlRole: string;
  university?: string;
  location?: string;
  tags?: string[];
  registeredDate?: string;
}

export interface CommunityTask {
  id: string;
  text: string;
  description: string;
  tag: string;
  completed: boolean;
  assignedTo?: string;
  dueDate?: string;
  priority?: "High" | "Medium" | "Low";
}

import type {
  MeetAudienceScope,
  MeetKind,
  MeetStatus,
} from "./community-meet.dto";

export interface CommunityMeet {
  id: string;
  title: string;
  date: string;
  time: string;
  inviteCode: string;
  link: string;
  description?: string;
  kind: MeetKind;
  audienceScope: MeetAudienceScope;
  audienceFilter?: string | null;
  status: MeetStatus;
  hostName?: string;
}

export interface CommunityStatsResponse {
  totalMembers: number;
  followerCount: number;
  rosterCount: number;
  newMembers30Days: number;
  pageImpressions: number;
  postImpressions: number;
  postViews: number;
  adminCount: number;
  moderatorCount: number;
}

export interface PaginatedCommunityMembers {
  items: CommunityMember[];
  total: number;
  page: number;
  take: number;
  totalPages: number;
}

export interface CommunityMemberTypesResponse {
  /** All member types (stored labels + roles assigned to members) */
  types: string[];
  /** Labels persisted on the community; these can be deleted when unused */
  storedLabels: string[];
}

export interface PublicCommunityMember {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  skills: string[];
  interests: string[];
  subtitle?: string;
  userCategory?: string;
}

export interface PaginatedPublicCommunityMembers {
  items: PublicCommunityMember[];
  total: number;
  page: number;
  take: number;
  totalPages: number;
}
