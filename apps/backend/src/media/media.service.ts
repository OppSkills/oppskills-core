import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { Readable } from 'stream';

export type ObjectByteRange = {
  start: number;
  end: number;
};
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import type { PresignedPost } from '@aws-sdk/s3-presigned-post';
import type {
  MediaUploadPurposeValue,
  PresignImageUploadResponse,
  PresignDocumentUploadResponse,
} from './media.dto';
import crypto from 'crypto';
import {
  extensionFromFileName,
  isChatDocumentAllowed,
  resolveChatDocumentMime,
} from './chat-attachment-mime';

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
      region: this.configService.get<string>('AWS_REGION') ?? 'us-east-1',
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
    const bucket = this.getRequiredEnv('MEDIA_S3_BUCKET');
    const cloudfrontBaseUrl = this.normalizeBaseUrl(
      this.getRequiredEnv('MEDIA_CLOUDFRONT_BASE_URL'),
    );

    const maxBytes = this.getMaxUploadBytes();
    const allowedMimeTypes = this.getAllowedImageMimeTypes();

    const mimeType = input.mimeType.trim().toLowerCase();
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        `Unsupported image type "${mimeType}". Allowed: ${allowedMimeTypes.join(
          ', ',
        )}`,
      );
    }

    const extension = this.extensionForMimeType(mimeType);
    const key = this.buildObjectKey(input.purpose, input.userId, extension);

    const presigned: PresignedPost = await createPresignedPost(this.s3, {
      Bucket: bucket,
      Key: key,
      Expires: 60, // seconds
      Conditions: [
        ['content-length-range', 1, maxBytes],
        ['eq', '$Content-Type', mimeType],
      ],
      Fields: {
        'Content-Type': mimeType,
        success_action_status: '201',
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

  /**
   * Generates a presigned POST policy for uploading documents (PDF, DOC, etc.)
   */
  async presignDocumentUpload(input: {
    userId: string;
    purpose:
      | 'EVENT_ATTACHMENT'
      | 'OPPORTUNITY_ATTACHMENT'
      | 'COMMUNITY_THREAD_ATTACHMENT'
      | 'CHAT_ATTACHMENT';
    mimeType: string;
    fileName: string;
  }): Promise<PresignDocumentUploadResponse> {
    const bucket = this.getRequiredEnv('MEDIA_S3_BUCKET');
    const cloudfrontBaseUrl = this.normalizeBaseUrl(
      this.getRequiredEnv('MEDIA_CLOUDFRONT_BASE_URL'),
    );

    const maxBytes = this.getMaxDocumentUploadBytes();

    let mimeType: string;
    if (input.purpose === 'CHAT_ATTACHMENT') {
      if (!isChatDocumentAllowed(input.mimeType, input.fileName)) {
        const ext = extensionFromFileName(input.fileName);
        throw new BadRequestException(
          ext
            ? `Unsupported file type ".${ext}" for chat attachments.`
            : `Unsupported file type "${input.mimeType}" for chat attachments.`,
        );
      }
      mimeType = resolveChatDocumentMime(input.mimeType, input.fileName);
    } else {
      const allowedMimeTypes = this.getAllowedDocumentMimeTypes();
      mimeType = input.mimeType.trim().toLowerCase();
      if (!allowedMimeTypes.includes(mimeType)) {
        throw new BadRequestException(
          `Unsupported document type "${mimeType}". Allowed: ${allowedMimeTypes.join(
            ', ',
          )}`,
        );
      }
    }

    const extension = this.extensionForDocumentMimeType(
      mimeType,
      input.fileName,
    );
    const key = this.buildDocumentObjectKey(
      input.purpose,
      input.userId,
      input.fileName,
      extension,
    );

    const presigned: PresignedPost = await createPresignedPost(this.s3, {
      Bucket: bucket,
      Key: key,
      Expires: 60, // seconds
      Conditions: [
        ['content-length-range', 1, maxBytes],
        ['eq', '$Content-Type', mimeType],
      ],
      Fields: {
        'Content-Type': mimeType,
        success_action_status: '201',
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
    if (typeof value !== 'string' || value.trim().length === 0) {
      // Misconfiguration is a server-side concern; return 500 to avoid blaming clients.
      throw new InternalServerErrorException(
        `Missing required env var: ${key}`,
      );
    }
    return value.trim();
  }

  private normalizeBaseUrl(value: string): string {
    let url = value.trim();
    if (!url.includes('://')) {
      url = `https://${url}`;
    }
    // Remove trailing slashes so `${base}/${key}` is correct.
    return url.replace(/\/+$/g, '');
  }

  private getMaxUploadBytes(): number {
    const raw = this.configService.get<string>('MEDIA_MAX_UPLOAD_BYTES');
    if (typeof raw !== 'string' || raw.trim().length === 0) {
      // Default: 10MB
      return 10 * 1024 * 1024;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException(`Invalid MEDIA_MAX_UPLOAD_BYTES: "${raw}"`);
    }
    return parsed;
  }

  private getAllowedImageMimeTypes(): ReadonlyArray<string> {
    const raw = this.configService.get<string>(
      'MEDIA_ALLOWED_IMAGE_MIME_TYPES',
    );
    if (typeof raw !== 'string' || raw.trim().length === 0) {
      return ['image/jpeg', 'image/png', 'image/webp'];
    }
    const list = raw
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter((v) => v.length > 0);
    if (list.length === 0) {
      return ['image/jpeg', 'image/png', 'image/webp'];
    }
    return list;
  }

  private extensionForMimeType(mimeType: string): string {
    if (mimeType === 'image/jpeg') return 'jpg';
    if (mimeType === 'image/png') return 'png';
    if (mimeType === 'image/webp') return 'webp';
    // Should be unreachable due to allowlist validation.
    throw new BadRequestException(`Unsupported image type "${mimeType}".`);
  }

  private buildObjectKey(
    purpose: MediaUploadPurposeValue,
    userId: string,
    extension: string,
  ): string {
    const safeUserId = userId.trim();
    if (safeUserId.length === 0) {
      throw new BadRequestException('Invalid user id for upload key.');
    }

    const uuid = crypto.randomUUID();
    let prefix: string;
    if (purpose === 'HACKATHON_BANNER') {
      prefix = 'public/hackathon-banners';
    } else if (purpose === 'EVENT_BANNER') {
      prefix = 'public/event-banners';
    } else if (purpose === 'COMMUNITY_COVER') {
      prefix = 'public/community-covers';
    } else if (purpose === 'COMMUNITY_AVATAR') {
      prefix = 'public/community-avatars';
    } else if (purpose === 'COMMUNITY_POST_IMAGE') {
      prefix = 'public/community-post-images';
    } else if (purpose === 'COMMUNITY_BANNER') {
      prefix = 'community-banner';
    } else if (purpose === 'COMMUNITY_LOGO') {
      prefix = 'community-logo';
    } else if (purpose === 'CHAT_ATTACHMENT') {
      prefix = 'private/chat-attachments';
    } else {
      prefix = 'public';
    }
    return `${prefix}/${encodeURIComponent(safeUserId)}/${uuid}.${extension}`;
  }

  /**
   * Gets max upload size for documents (default 100MB)
   */
  private getMaxDocumentUploadBytes(): number {
    const raw = this.configService.get<string>(
      'MEDIA_MAX_DOCUMENT_UPLOAD_BYTES',
    );
    if (typeof raw !== 'string' || raw.trim().length === 0) {
      // Default: 100MB
      return 100 * 1024 * 1024;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException(
        `Invalid MEDIA_MAX_DOCUMENT_UPLOAD_BYTES: "${raw}"`,
      );
    }
    return parsed;
  }

  /**
   * Returns allowed document MIME types
   */
  private getAllowedDocumentMimeTypes(): ReadonlyArray<string> {
    const raw = this.configService.get<string>(
      'MEDIA_ALLOWED_DOCUMENT_MIME_TYPES',
    );
    if (typeof raw !== 'string' || raw.trim().length === 0) {
      return [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'image/jpeg',
        'image/png',
      ];
    }
    const list = raw
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter((v) => v.length > 0);
    if (list.length === 0) {
      return [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
    }
    return list;
  }

  /**
   * Determines file extension from MIME type and filename
   */
  private extensionForDocumentMimeType(
    mimeType: string,
    fileName: string,
  ): string {
    // Try to extract from filename first
    const fileExt = fileName.split('.').pop()?.toLowerCase();
    if (fileExt && fileExt.length > 0 && fileExt.length <= 5) {
      return fileExt;
    }

    // Fallback to MIME type mapping
    const mimeMap: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        'xlsx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        'pptx',
      'text/plain': 'txt',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov',
      'application/gzip': 'gz',
      'application/x-gzip': 'gz',
      'application/zip': 'zip',
      'application/x-zip-compressed': 'zip',
      'application/vnd.rar': 'rar',
      'application/x-rar-compressed': 'rar',
      'application/x-7z-compressed': '7z',
      'application/x-tar': 'tar',
      'application/x-bzip2': 'bz2',
      'application/epub+zip': 'epub',
      'application/json': 'json',
      'application/xml': 'xml',
      'text/html': 'html',
      'text/csv': 'csv',
      'application/rtf': 'rtf',
      'application/vnd.android.package-archive': 'apk',
    };

    return mimeMap[mimeType] || 'bin';
  }

  private buildDocumentObjectKey(
    purpose:
      | 'EVENT_ATTACHMENT'
      | 'OPPORTUNITY_ATTACHMENT'
      | 'COMMUNITY_THREAD_ATTACHMENT'
      | 'CHAT_ATTACHMENT',
    userId: string,
    fileName: string,
    extension: string,
  ): string {
    const safeUserId = userId.trim();
    if (safeUserId.length === 0) {
      throw new BadRequestException('Invalid user id for upload key.');
    }

    // Sanitize filename - remove special characters, keep only alphanumeric, dash, underscore
    const safeFileName = fileName
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars with dash
      .substring(0, 50); // Limit length

    const uuid = crypto.randomUUID();
    const prefixMap = {
      EVENT_ATTACHMENT: 'public/event-attachments',
      COMMUNITY_THREAD_ATTACHMENT: 'public/community-thread-attachments',
      CHAT_ATTACHMENT: 'private/chat-attachments',
      OPPORTUNITY_ATTACHMENT: 'public/opportunity-attachments',
    } as const;

    const prefix = prefixMap[purpose] ?? 'public/opportunity-attachments';

    return `${prefix}/${encodeURIComponent(safeUserId)}/${safeFileName}-${uuid}.${extension}`;
  }

  /**
   * Resolves the S3 object key from a persisted CloudFront or S3 URL.
   */
  resolveObjectKeyFromStoredUrl(storedUrl: string): string {
    const cloudfrontBase = this.normalizeBaseUrl(
      this.getRequiredEnv('MEDIA_CLOUDFRONT_BASE_URL'),
    );
    const normalized = storedUrl.trim();

    if (normalized.startsWith(cloudfrontBase)) {
      const path = normalized.slice(cloudfrontBase.length).replace(/^\//, '');
      return decodeURIComponent(path);
    }

    try {
      const parsed = new URL(normalized);
      return decodeURIComponent(parsed.pathname.replace(/^\//, ''));
    } catch {
      throw new BadRequestException('Invalid media URL');
    }
  }

  assertChatAttachmentKey(key: string): void {
    if (!/(?:^|\/)chat-attachments\//.test(key)) {
      throw new BadRequestException('URL is not a chat attachment');
    }
  }

  async getObjectMetadata(key: string): Promise<{
    contentType: string;
    contentLength: number;
  }> {
    const bucket = this.getRequiredEnv('MEDIA_S3_BUCKET');
    const result = await this.s3.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    const contentLength = result.ContentLength ?? 0;
    if (contentLength <= 0) {
      throw new InternalServerErrorException('Empty object from S3');
    }

    return {
      contentType: result.ContentType ?? 'application/octet-stream',
      contentLength,
    };
  }

  async getObjectStream(
    key: string,
    range?: ObjectByteRange,
  ): Promise<{
    body: Readable;
    contentType: string;
    contentLength: number;
    totalSize: number;
    contentRange?: string;
    statusCode: 200 | 206;
  }> {
    const bucket = this.getRequiredEnv('MEDIA_S3_BUCKET');
    const metadata = await this.getObjectMetadata(key);
    const totalSize = metadata.contentLength;

    let rangeHeader: string | undefined;
    let responseLength = totalSize;
    let contentRange: string | undefined;
    let statusCode: 200 | 206 = 200;

    if (range) {
      const start = Math.max(0, range.start);
      const end = Math.min(range.end, totalSize - 1);
      if (start > end || start >= totalSize) {
        throw new BadRequestException('Invalid byte range');
      }
      rangeHeader = `bytes=${start}-${end}`;
      responseLength = end - start + 1;
      contentRange = `bytes ${start}-${end}/${totalSize}`;
      statusCode = 206;
    }

    const result = await this.s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ...(rangeHeader ? { Range: rangeHeader } : {}),
      }),
    );

    if (!result.Body) {
      throw new InternalServerErrorException('Empty object body from S3');
    }

    return {
      body: result.Body as Readable,
      contentType: result.ContentType ?? metadata.contentType,
      contentLength: responseLength,
      totalSize,
      contentRange,
      statusCode,
    };
  }

  async putObjectBuffer(input: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<void> {
    const bucket = this.getRequiredEnv('MEDIA_S3_BUCKET');
    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
  }

  buildPublicUrl(key: string): string {
    const cloudfrontBaseUrl = this.normalizeBaseUrl(
      this.getRequiredEnv('MEDIA_CLOUDFRONT_BASE_URL'),
    );
    return `${cloudfrontBaseUrl}/${encodeURI(key)}`;
  }

  buildChatAttachmentKey(
    userId: string,
    fileName: string,
    extension: string,
  ): string {
    return this.buildDocumentObjectKey(
      'CHAT_ATTACHMENT',
      userId,
      fileName,
      extension,
    );
  }
}
