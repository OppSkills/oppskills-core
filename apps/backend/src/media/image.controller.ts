import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import sharp from 'sharp';

@ApiTags('Image')
@Controller('image')
export class ImageController {
  @Get('serve')
  @ApiOperation({ summary: 'Serve resized and compressed image for OG tags' })
  @ApiResponse({ status: 200, description: 'Image served successfully' })
  async serve(@Query('url') url: string, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'https://oppskills.com';
    const fallbackUrl = `${frontendUrl}/og_poster.png`;

    if (!url) {
      return res.redirect(fallbackUrl);
    }

    try {
      const parsedUrl = new URL(url);
      if (
        parsedUrl.hostname !== 'assets.oppskills.com' ||
        parsedUrl.protocol !== 'https:'
      ) {
        console.warn(`[ImageServe] Blocked invalid URL: ${url}`);
        return res.redirect(fallbackUrl);
      }
    } catch (e) {
      console.warn(`[ImageServe] Invalid URL format: ${url}`);
      return res.redirect(fallbackUrl);
    }

    try {
      console.log(`[ImageServe] Fetching URL: ${url}`);
      const response = await fetch(url, {
        redirect: 'error',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      if (!response.ok) {
        console.error(
          `[ImageServe] Fetch failed: ${response.status} ${response.statusText}`,
        );
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log(`[ImageServe] Image fetched, size: ${buffer.length}`);

      const outputBuffer = await sharp(buffer)
        .resize({
          width: 1200,
          height: 630,
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      console.log(
        `[ImageServe] Processing success, output size: ${outputBuffer.length}`,
      );

      res.set('Content-Type', 'image/jpeg');
      // Cache for 1 day
      res.set('Cache-Control', 'public, max-age=86400');
      res.send(outputBuffer);
    } catch (error) {
      console.error('[ImageServe] Error processing image:', error);
      res.redirect(fallbackUrl);
    }
  }
}
