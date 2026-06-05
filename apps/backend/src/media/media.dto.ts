import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

/**
 * Allowed upload purposes. We keep this explicit so we control S3 key prefixes.
 */
const MEDIA_UPLOAD_PURPOSE_VALUES = [
  'HACKATHON_BANNER',
  'EVENT_BANNER',
  'COMMUNITY_COVER',
  'COMMUNITY_AVATAR',
  'EVENT_ATTACHMENT',
  'OPPORTUNITY_ATTACHMENT',
  'COMMUNITY_BANNER',
  'COMMUNITY_LOGO',
  'COMMUNITY_THREAD_ATTACHMENT',
  'CHAT_ATTACHMENT',
] as const;
export type MediaUploadPurposeValue =
  (typeof MEDIA_UPLOAD_PURPOSE_VALUES)[number];

export class PresignImageUploadDto {
  /**
   * What this image is used for. Controls the S3 prefix and later validation.
   */
  @ApiProperty({
    enum: MEDIA_UPLOAD_PURPOSE_VALUES,
    description: 'Upload purpose (controls S3 key prefix)',
    example: 'HACKATHON_BANNER',
  })
  @IsString()
  @IsIn(MEDIA_UPLOAD_PURPOSE_VALUES)
  purpose: MediaUploadPurposeValue;

  /**
   * MIME type as detected by the browser, e.g. image/png.
   * We validate it against an allowlist.
   */
  @ApiProperty({
    description: 'Image MIME type',
    example: 'image/png',
  })
  @IsString()
  mimeType: string;
}

export type PresignImageUploadResponse = Readonly<{
  uploadUrl: string;
  fields: Readonly<Record<string, string>>;
  key: string;
  publicUrl: string;
  maxBytes: number;
}>;

/**
 * DTO for requesting a presigned URL for document upload (attachments)
 */
export class PresignDocumentUploadDto {
  /**
   * What this document is used for. Controls the S3 prefix.
   */
  @ApiProperty({
    enum: [
      'EVENT_ATTACHMENT',
      'OPPORTUNITY_ATTACHMENT',
      'COMMUNITY_THREAD_ATTACHMENT',
      'CHAT_ATTACHMENT',
    ],
    description: 'Upload purpose (controls S3 key prefix)',
    example: 'EVENT_ATTACHMENT',
  })
  @IsString()
  @IsIn([
    'EVENT_ATTACHMENT',
    'OPPORTUNITY_ATTACHMENT',
    'COMMUNITY_THREAD_ATTACHMENT',
  ])
  purpose:
    | 'EVENT_ATTACHMENT'
    | 'OPPORTUNITY_ATTACHMENT'
    | 'COMMUNITY_THREAD_ATTACHMENT';

  /**
   * MIME type as detected by the browser.
   */
  @ApiProperty({
    description: 'Document MIME type',
    example: 'application/pdf',
  })
  @IsString()
  mimeType: string;

  /**
   * Original filename for reference
   */
  @ApiProperty({
    description: 'Original filename',
    example: 'event-rules.pdf',
  })
  @IsString()
  fileName: string;
}

export type PresignDocumentUploadResponse = Readonly<{
  uploadUrl: string;
  fields: Readonly<Record<string, string>>;
  key: string;
  publicUrl: string;
  maxBytes: number;
}>;
