import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';
import { TaskPriority } from '@prisma/client';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Title of the task',
    minLength: 3,
    maxLength: 100,
    example: 'Build Task Management System',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the task',
    maxLength: 2000,
    example: 'Implement backend services and frontend components.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Due date of the task in ISO format',
    example: '2026-06-30T18:30:00.000Z',
  })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiProperty({
    description: 'ID of the user to assign the task to',
    example: 'user-id-xyz',
  })
  @IsString()
  toUserId: string;

  @ApiProperty({
    description: 'Task priority level',
    enum: TaskPriority,
    example: 'HIGH',
  })
  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @ApiProperty({
    description: 'Tags associated with the task',
    type: [String],
    example: ['Backend', 'Database'],
  })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({
    description: 'Whether to send an email notification to the assignee',
    example: true,
  })
  @IsBoolean()
  optForMail: boolean;
}
