import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TaskPriority,
  TaskStatus,
  TaskThreadMessageType,
} from '@prisma/client';

export class TaskThreadMessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  taskId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  userName: string;

  @ApiPropertyOptional()
  userAvatar?: string;

  @ApiProperty({ enum: TaskThreadMessageType })
  type: TaskThreadMessageType;

  @ApiProperty()
  content: string;

  @ApiPropertyOptional()
  fileName?: string;

  @ApiPropertyOptional()
  fileSize?: number;

  @ApiPropertyOptional()
  mimeType?: string;

  @ApiProperty()
  createdAt: string;
}

export class TaskResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  communityId: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  dueDate?: string;

  @ApiProperty()
  toUserId: string;

  @ApiProperty()
  toUserName: string;

  @ApiPropertyOptional()
  toUserAvatar?: string;

  @ApiProperty()
  byUserId: string;

  @ApiProperty()
  byUserName: string;

  @ApiPropertyOptional()
  byUserAvatar?: string;

  @ApiProperty({ enum: TaskPriority })
  priority: TaskPriority;

  @ApiProperty({ enum: TaskStatus })
  status: TaskStatus;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty()
  optForMail: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty({ type: [TaskThreadMessageResponseDto] })
  messages?: TaskThreadMessageResponseDto[];
}
