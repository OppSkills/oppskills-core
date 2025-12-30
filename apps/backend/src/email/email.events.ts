/**
 * Domain events for email triggers.
 * These events are emitted by services and consumed by EmailListener.
 */

export const EMAIL_EVENTS = {
  USER_CREATED: 'user.created',
  USER_ONBOARDED: 'user.onboarded',
  EVENT_JOINED: 'event.joined',
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

