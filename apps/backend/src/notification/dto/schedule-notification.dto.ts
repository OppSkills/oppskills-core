import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ScheduleType {
  IMMEDIATELY = 'IMMEDIATELY',
  CUSTOM = 'CUSTOM',
}

export enum NotificationStatus {
  DRAFT = 'DRAFT',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export class CreateNotificationDto {
  @ApiProperty({ required: false, description: 'Target Event ID' })
  @IsString()
  @IsOptional()
  eventId?: string;

  @ApiProperty({ required: false, description: 'Target Hackathon ID' })
  @IsString()
  @IsOptional()
  hackathonId?: string;

  @ApiProperty({ description: 'The content message for the notification' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ enum: ScheduleType, default: ScheduleType.IMMEDIATELY })
  @IsEnum(ScheduleType)
  scheduleType: ScheduleType;

  @ApiProperty({ required: false, description: 'Target date-time string if type is CUSTOM' })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiProperty({ required: false, enum: NotificationStatus, default: NotificationStatus.QUEUED })
  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;
}
