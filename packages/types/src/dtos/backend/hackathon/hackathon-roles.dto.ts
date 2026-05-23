import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
} from "class-validator";

/**
 * Possible roles for hackathon team members.
 */
export const HackathonUserRoleValues = ["MANAGER", "EVALUATOR"] as const;
export type HackathonUserRoleValue = (typeof HackathonUserRoleValues)[number];

/**
 * DTO for adding a role to a hackathon.
 */
export class AddHackathonRoleDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsEnum(HackathonUserRoleValues)
  role: HackathonUserRoleValue;
}

/**
 * DTO for removing a role from a hackathon.
 */
export class RemoveHackathonRoleDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsEnum(HackathonUserRoleValues)
  role: HackathonUserRoleValue;
}

/**
 * Represents a user with their role (for API responses).
 */
export interface HackathonRoleUserResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  role: HackathonUserRoleValue;
  assignedAt: string; // ISO date string
}

/**
 * Represents the owner of a hackathon (for API responses).
 */
export interface HackathonOwnerResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

/**
 * Response for GET /hackathons/:id/roles
 */
export interface HackathonRolesResponse {
  owner: HackathonOwnerResponse;
  managers: HackathonRoleUserResponse[];
  evaluators: HackathonRoleUserResponse[];
}
