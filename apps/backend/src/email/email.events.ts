/**
 * Domain events for email triggers.
 * These events are emitted by services and consumed by EmailListener.
 */

export const EMAIL_EVENTS = {
  USER_CREATED: 'user.created',
  USER_ONBOARDED: 'user.onboarded',
  EVENT_JOINED: 'event.joined',
  EVENT_DIRECT_MESSAGE: 'event.direct.message',
  EVENT_BULK_EMAIL: 'event.bulk.email',
  ADMIN_CREATED: 'admin.created',
  HACKATHON_JOIN_CONFIRMATION: 'hackathon.join.confirmation',
  HACKATHON_NEW_MEMBER_JOINED: 'hackathon.new.member.joined',
  HACKATHON_BULK_EMAIL: 'hackathon.bulk.email',
} as const;

export type EmailEventType = (typeof EMAIL_EVENTS)[keyof typeof EMAIL_EVENTS];

/**
 * Payload for user.created event
 */
export interface UserCreatedEventPayload {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Payload for user.onboarded event
 */
export interface UserOnboardedEventPayload {
  userId: string;
  email: string;
  firstName?: string;
  userCategory?: string;
  locationCity?: string;
}

/**
 * Payload for event.joined event
 */
export interface EventJoinedEventPayload {
  userId: string;
  email: string;
  firstName?: string;
  eventId: string;
  eventName: string;
  eventSlug: string;
  eventDate: string;
  eventTime?: string;
  eventLocation?: string;
  eventType?: string;
  registrationId: string;
}

export interface EventDirectMessageEventPayload {
  userId: string;
  email: string;
  firstName?: string;
  eventId: string;
  eventName: string;
  eventSlug: string;
  body: string;
}

export interface EventBulkEmailPayload {
  eventId: string;
  organizerEmail: string;
  organizerName: string;
  htmlBody: string;
  eventName: string;
}

export interface HackathonJoinConfirmationPayload {
  email: string;
  userName: string;
  hackathonName: string;
  teamName: string;
}

export interface HackathonNewMemberJoinedPayload {
  leaderEmail: string;
  teamLeaderName: string;
  newMemberName: string;
  teamName: string;
  hackathonName: string;
}

export interface HackathonBulkEmailPayload {
  hackathonId: string;
  organizerEmail: string;
  organizerName: string;
  htmlBody: string;
  hackathonName: string;
}
