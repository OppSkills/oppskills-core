export interface CommunityMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
  lastAssignedDate: string;
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
