import { IsEmail, IsEnum, IsNotEmpty } from "class-validator";

/**
 * Possible roles for event team members.
 */
export const EventUserRoleValues = ["MANAGER", "EVALUATOR"] as const;
export type EventUserRoleValue = (typeof EventUserRoleValues)[number];

/**
 * DTO for adding a role to an event.
 */
export class AddEventRoleDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsEnum(EventUserRoleValues)
  role: EventUserRoleValue;
}

/**
 * DTO for removing a role from an event.
 */
export class RemoveEventRoleDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsEnum(EventUserRoleValues)
  role: EventUserRoleValue;
}

/**
 * Represents a user with their role (for API responses).
 */
export interface EventRoleUserResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  role: EventUserRoleValue;
  assignedAt: string; // ISO date string
}

/**
 * Represents the owner of an event (for API responses).
 */
export interface EventOwnerResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

/**
 * Response for GET /events/:id/roles
 */
export interface EventRolesResponse {
  owner: EventOwnerResponse;
  managers: EventRoleUserResponse[];
  evaluators: EventRoleUserResponse[];
}
