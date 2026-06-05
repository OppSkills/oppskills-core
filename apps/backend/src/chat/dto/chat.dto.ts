import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const MESSAGE_TYPES = ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'SYSTEM'] as const;
const ATTACHMENT_KINDS = ['IMAGE', 'VIDEO', 'DOCUMENT'] as const;

export class CreateDirectConversationDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  otherUserId: string;
}

export class CreateGroupConversationDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  handle?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  memberIds: string[];
}

export class SendMessageAttachmentDto {
  @ApiProperty()
  @IsString()
  fileName: string;

  @ApiProperty()
  @IsString()
  mimeType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sizeBytes?: number;

  @ApiProperty()
  @IsUrl()
  url: string;

  @ApiProperty({ enum: ATTACHMENT_KINDS })
  @IsIn(ATTACHMENT_KINDS)
  kind: (typeof ATTACHMENT_KINDS)[number];
}

export class SendChatMessageDto {
  @ApiPropertyOptional({ enum: MESSAGE_TYPES })
  @IsOptional()
  @IsIn(MESSAGE_TYPES)
  type?: (typeof MESSAGE_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  replyToMessageId?: string;

  @ApiPropertyOptional({ type: SendMessageAttachmentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SendMessageAttachmentDto)
  attachment?: SendMessageAttachmentDto;
}

export class AckDeliveredDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  messageIds: string[];
}

export class UpdateGroupConversationDto {
  @ApiProperty()
  @IsUrl()
  imageUrl: string;
}
