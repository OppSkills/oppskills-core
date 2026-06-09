import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum ScheduleType {
  IMMEDIATELY = "IMMEDIATELY",
  CUSTOM = "CUSTOM",
}

export enum NotificationStatus {
  DRAFT = "DRAFT",
  QUEUED = "QUEUED",
  PROCESSING = "PROCESSING",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export class CreateNotificationDto {
  @ApiPropertyOptional({ description: "Target Event ID" })
  @IsString()
  @IsOptional()
  eventId?: string;

  @ApiPropertyOptional({ description: "Target Event Slug" })
  @IsString()
  @IsOptional()
  eventSlug?: string;

  @ApiPropertyOptional({ description: "Target Hackathon ID" })
  @IsString()
  @IsOptional()
  hackathonId?: string;

  @ApiPropertyOptional({ description: "Target Hackathon Slug" })
  @IsString()
  @IsOptional()
  hackathonSlug?: string;

  @ApiPropertyOptional({ description: "Target Community ID" })
  @IsString()
  @IsOptional()
  communityId?: string;

  @ApiPropertyOptional({
    description:
      "Community mail audience: Community Roster, Followers, Internal Members, or a custom member role",
  })
  @IsString()
  @IsOptional()
  communityAudience?: string;

  @ApiProperty({ description: "The content message for the notification" })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ enum: ScheduleType, default: ScheduleType.IMMEDIATELY })
  @IsEnum(ScheduleType)
  scheduleType: ScheduleType;

  @ApiPropertyOptional({
    description: "Target date-time string if type is CUSTOM",
  })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional({
    enum: NotificationStatus,
    default: NotificationStatus.QUEUED,
  })
  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;
}
