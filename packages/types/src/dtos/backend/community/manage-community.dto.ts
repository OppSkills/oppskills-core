export interface CommunityMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
  lastAssignedDate: string;
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
  status: MeetStatus;
  hostName?: string;
}

export interface CommunityStatsResponse {
  totalMembers: number;
  newMembers30Days: number;
  pageImpressions: number;
  postImpressions: number;
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

