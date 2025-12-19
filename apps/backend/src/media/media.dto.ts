import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString } from "class-validator";

/**
 * Allowed upload purposes. We keep this explicit so we control S3 key prefixes.
 */
const MEDIA_UPLOAD_PURPOSE_VALUES = ["HACKATHON_BANNER"] as const;
export type MediaUploadPurposeValue =
  (typeof MEDIA_UPLOAD_PURPOSE_VALUES)[number];

export class PresignImageUploadDto {
  /**
   * What this image is used for. Controls the S3 prefix and later validation.
   */
  @ApiProperty({
    enum: MEDIA_UPLOAD_PURPOSE_VALUES,
    description: "Upload purpose (controls S3 key prefix)",
    example: "HACKATHON_BANNER",
  })
  @IsString()
  @IsIn(MEDIA_UPLOAD_PURPOSE_VALUES)
  purpose: MediaUploadPurposeValue;

  /**
   * MIME type as detected by the browser, e.g. image/png.
   * We validate it against an allowlist.
   */
  @ApiProperty({
    description: "Image MIME type",
    example: "image/png",
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


