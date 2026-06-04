import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { TaskThreadMessageType } from '@prisma/client';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Type of the comment message',
    enum: TaskThreadMessageType,
    example: 'TEXT',
  })
  @IsEnum(TaskThreadMessageType)
  type: TaskThreadMessageType;

  @ApiProperty({
    description: 'Text content of the message or file URL',
    minLength: 1,
    maxLength: 5000,
    example: 'Here is the S3 link for the draft design.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({
    description: 'Name of the attached file',
    example: 'draft_design.pdf',
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({
    description: 'Size of the attached file in bytes',
    example: 1048576,
  })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional({
    description: 'MIME type of the attached file',
    example: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  mimeType?: string;
}
