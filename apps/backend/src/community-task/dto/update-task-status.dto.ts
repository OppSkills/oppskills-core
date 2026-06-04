import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class UpdateTaskStatusDto {
  @ApiProperty({
    description: 'Updated status of the task',
    enum: TaskStatus,
    example: 'IN_PROGRESS',
  })
  @IsEnum(TaskStatus)
  status: TaskStatus;
}
