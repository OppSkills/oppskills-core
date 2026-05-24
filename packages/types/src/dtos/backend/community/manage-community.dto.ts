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

export interface CommunityMeet {
  id: string;
  title: string;
  date: string;
  time: string;
  attendees: number;
  link: string;
  description?: string;
  targetGroup?: string;
  type?: "Urgent" | "Recurring" | "Feedback" | "Important";
  attendance?: "Present" | "Absent" | "Scheduled";
}
