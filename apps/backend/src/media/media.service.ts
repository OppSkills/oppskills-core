import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import type { PresignedPost } from "@aws-sdk/s3-presigned-post";
import type {
  MediaUploadPurposeValue,
  PresignImageUploadResponse,
} from "./media.dto";
import crypto from "crypto";

/**
 * MediaService
 * - Generates S3 presigned POSTs for direct browser uploads.
 * - Returns CloudFront-backed public URLs for persisted references.
 */
@Injectable()
export class MediaService {
  private readonly s3: S3Client;

  constructor(private readonly configService: ConfigService) {
    /**
     * Credentials are resolved by the AWS SDK default provider chain:
     * - EC2 instance profile role (recommended for prod)
     * - env vars (fallback)
     */
    this.s3 = new S3Client({
      region: this.configService.get<string>("AWS_REGION") ?? "us-east-1",
    });
  }

  /**
   * Generates a presigned POST policy for uploading a single image.
   */
  async presignImageUpload(input: {
    userId: string;
    purpose: MediaUploadPurposeValue;
    mimeType: string;
  }): Promise<PresignImageUploadResponse> {
    const bucket = this.getRequiredEnv("MEDIA_S3_BUCKET");
    const cloudfrontBaseUrl = this.normalizeBaseUrl(
      this.getRequiredEnv("MEDIA_CLOUDFRONT_BASE_URL")
    );

    const maxBytes = this.getMaxUploadBytes();
    const allowedMimeTypes = this.getAllowedImageMimeTypes();

    const mimeType = input.mimeType.trim().toLowerCase();
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        `Unsupported image type "${mimeType}". Allowed: ${allowedMimeTypes.join(
          ", "
        )}`
      );
    }

    const extension = this.extensionForMimeType(mimeType);
    const key = this.buildObjectKey(input.purpose, input.userId, extension);

    const presigned: PresignedPost = await createPresignedPost(this.s3, {
      Bucket: bucket,
      Key: key,
      Expires: 60, // seconds
      Conditions: [
        ["content-length-range", 1, maxBytes],
        ["eq", "$Content-Type", mimeType],
      ],
      Fields: {
        "Content-Type": mimeType,
        success_action_status: "201",
      },
    });

    return {
      uploadUrl: presigned.url,
      fields: presigned.fields,
      key,
      publicUrl: `${cloudfrontBaseUrl}/${encodeURI(key)}`,
      maxBytes,
    };
  }

  private getRequiredEnv(key: string): string {
    const value = this.configService.get<string>(key);
    if (typeof value !== "string" || value.trim().length === 0) {
      // Misconfiguration is a server-side concern; return 500 to avoid blaming clients.
      throw new InternalServerErrorException(`Missing required env var: ${key}`);
    }
    return value.trim();
  }

  private normalizeBaseUrl(value: string): string {
    // Remove trailing slashes so `${base}/${key}` is correct.
    return value.replace(/\/+$/g, "");
  }

  private getMaxUploadBytes(): number {
    const raw = this.configService.get<string>("MEDIA_MAX_UPLOAD_BYTES");
    if (typeof raw !== "string" || raw.trim().length === 0) {
      // Default: 10MB
      return 10 * 1024 * 1024;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException(
        `Invalid MEDIA_MAX_UPLOAD_BYTES: "${raw}"`
      );
    }
    return parsed;
  }

  private getAllowedImageMimeTypes(): ReadonlyArray<string> {
    const raw = this.configService.get<string>("MEDIA_ALLOWED_IMAGE_MIME_TYPES");
    if (typeof raw !== "string" || raw.trim().length === 0) {
      return ["image/jpeg", "image/png", "image/webp"];
    }
    const list = raw
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter((v) => v.length > 0);
    if (list.length === 0) {
      return ["image/jpeg", "image/png", "image/webp"];
    }
    return list;
  }

  private extensionForMimeType(mimeType: string): string {
    if (mimeType === "image/jpeg") return "jpg";
    if (mimeType === "image/png") return "png";
    if (mimeType === "image/webp") return "webp";
    // Should be unreachable due to allowlist validation.
    throw new BadRequestException(`Unsupported image type "${mimeType}".`);
  }

  private buildObjectKey(
    purpose: MediaUploadPurposeValue,
    userId: string,
    extension: string
  ): string {
    const safeUserId = userId.trim();
    if (safeUserId.length === 0) {
      throw new BadRequestException("Invalid user id for upload key.");
    }

    const uuid = crypto.randomUUID();
    const prefix =
      purpose === "HACKATHON_BANNER" ? "public/hackathon-banners" : "public";
    return `${prefix}/${encodeURIComponent(safeUserId)}/${uuid}.${extension}`;
  }
}


