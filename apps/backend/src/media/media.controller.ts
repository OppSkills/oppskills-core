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
import { PresignImageUploadDto } from "./media.dto";

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
  @ApiOperation({ summary: "Generate presigned POST for image upload" })
  @ApiBody({ type: PresignImageUploadDto })
  @ApiResponse({ status: 201, description: "Presigned upload created" })
  @ApiResponse({ status: 400, description: "Invalid request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
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
}


