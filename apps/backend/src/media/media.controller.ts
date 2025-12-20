import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { ClerkAuthGuard } from "../common/clerk-auth.guard";
import { MediaService } from "./media.service";
import { PresignImageUploadDto, PresignDocumentUploadDto } from "./media.dto";

@ApiTags("Media")
@ApiBearerAuth("clerk-auth")
@Controller("media")
@UseGuards(ClerkAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * Creates a presigned POST policy for uploading an image directly to S3.
   * The client uploads the image to S3, then stores the returned `publicUrl`
   * in the hackathon record (e.g., `bannerImageUrl`).
   */
  @Post("presign-image")
  @ApiOperation({ 
    summary: "Generate presigned POST for image upload", 
    description: "Creates a presigned POST policy for uploading an image directly to S3. The client uploads the image to S3, then stores the returned publicUrl in the hackathon record (e.g., bannerImageUrl)."
  })
  @ApiBody({ type: PresignImageUploadDto })
  @ApiResponse({ 
    status: 201, 
    description: "Presigned upload created",
    schema: {
      type: 'object',
      properties: {
        uploadUrl: { type: 'string', format: 'uri', example: 'https://oppskills-media.s3.amazonaws.com' },
        fields: { 
          type: 'object',
          example: {
            key: 'hackathons/2025/banner-image.jpg',
            'Content-Type': 'image/jpeg',
            policy: 'eyJleHBpcmF0aW9uIj...',
            'x-amz-signature': '1234567890abcdef...'
          }
        },
        key: { type: 'string', example: 'hackathons/2025/banner-image.jpg' },
        publicUrl: { type: 'string', format: 'uri', example: 'https://cdn.oppskills.com/hackathons/2025/banner-image.jpg' },
        maxBytes: { type: 'number', example: 5242880 }
      }
    }
  })
  @ApiResponse({ status: 400, description: "Invalid request - Unsupported MIME type or invalid purpose" })
  @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing JWT token" })
  async presignImage(@Body() dto: PresignImageUploadDto, @Req() req: Request) {
    const userId = req.user?.id;
    if (typeof userId !== "string" || userId.trim().length === 0) {
      throw new UnauthorizedException("User not found.");
    }

    return this.mediaService.presignImageUpload({
      userId,
      purpose: dto.purpose,
      mimeType: dto.mimeType,
    });
  }

  /**
   * Creates a presigned POST policy for uploading documents (PDF, DOC, etc.) to S3.
   * Supports attachments for events and opportunities.
   */
  @Post("presign-document")
  @ApiOperation({ 
    summary: "Generate presigned POST for document upload", 
    description: "Creates a presigned POST policy for uploading documents (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX) directly to S3. The client uploads the document to S3, then stores the returned publicUrl."
  })
  @ApiBody({ type: PresignDocumentUploadDto })
  @ApiResponse({ 
    status: 201, 
    description: "Presigned upload created",
    schema: {
      type: "object",
      properties: {
        uploadUrl: { type: "string", format: "uri", example: "https://oppskills-media.s3.amazonaws.com" },
        fields: { 
          type: "object",
          example: {
            key: "attachments/events/2025/document.pdf",
            "Content-Type": "application/pdf",
            policy: "eyJleHBpcmF0aW9uIj...",
            "x-amz-signature": "1234567890abcdef..."
          }
        },
        key: { type: "string", example: "attachments/events/2025/document.pdf" },
        publicUrl: { type: "string", format: "uri", example: "https://cdn.oppskills.com/attachments/events/2025/document.pdf" },
        maxBytes: { type: "number", example: 10485760 }
      }
    }
  })
  @ApiResponse({ status: 400, description: "Invalid request - Unsupported MIME type or invalid purpose" })
  @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing JWT token" })
  async presignDocument(@Body() dto: PresignDocumentUploadDto, @Req() req: Request) {
    const userId = req.user?.id;
    if (typeof userId !== "string" || userId.trim().length === 0) {
      throw new UnauthorizedException("User not found.");
    }

    return this.mediaService.presignDocumentUpload({
      userId,
      purpose: dto.purpose,
      mimeType: dto.mimeType,
      fileName: dto.fileName,
    });
  }
}


