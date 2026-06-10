import { Injectable, Logger } from '@nestjs/common';
import { AttachmentKind, MessageType, prisma } from '@oppskills/db';
import { createWriteStream, promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { randomUUID } from 'crypto';
import { MediaService } from './media.service';

@Injectable()
export class VideoThumbnailService {
  private readonly logger = new Logger(VideoThumbnailService.name);

  constructor(private readonly mediaService: MediaService) {}

  async processMessageVideo(messageId: string): Promise<void> {
    const message = await prisma.messageEntity.findUnique({
      where: { id: messageId },
      include: { attachment: true },
    });

    if (
      !message?.attachment ||
      message.type !== MessageType.VIDEO ||
      message.attachment.kind !== AttachmentKind.VIDEO
    ) {
      return;
    }

    if (
      message.attachment.thumbnailUrl &&
      message.attachment.durationSeconds != null
    ) {
      return;
    }

    try {
      const key = this.mediaService.resolveObjectKeyFromStoredUrl(
        message.attachment.url,
      );
      this.mediaService.assertChatAttachmentKey(key);

      const videoPath = join(tmpdir(), `chat-video-${randomUUID()}.mp4`);
      const thumbDir = tmpdir();
      const thumbFile = `chat-thumb-${randomUUID()}.jpg`;
      const thumbPath = join(thumbDir, thumbFile);

      try {
        const { body } = await this.mediaService.getObjectStream(key);
        await pipeline(body, createWriteStream(videoPath));

        const ffmpeg = await this.loadFfmpeg();
        const durationSeconds = await this.extractDuration(ffmpeg, videoPath);
        await this.extractThumbnail(ffmpeg, videoPath, thumbDir, thumbFile);

        const thumbBuffer = await fs.readFile(thumbPath);
        const thumbKey = this.mediaService.buildChatAttachmentKey(
          message.senderId,
          `thumb-${messageId}`,
          'jpg',
        );
        await this.mediaService.putObjectBuffer({
          key: thumbKey,
          body: thumbBuffer,
          contentType: 'image/jpeg',
        });

        const thumbnailUrl = this.mediaService.buildPublicUrl(thumbKey);
        await prisma.messageAttachmentEntity.update({
          where: { messageId },
          data: {
            thumbnailUrl,
            durationSeconds:
              durationSeconds != null
                ? Math.max(1, Math.round(durationSeconds))
                : null,
          },
        });
      } finally {
        await fs.unlink(videoPath).catch(() => undefined);
        await fs.unlink(thumbPath).catch(() => undefined);
      }
    } catch (error) {
      this.logger.warn(`Video thumbnail generation failed for ${messageId}`, error);
    }
  }

  private async loadFfmpeg(): Promise<typeof import('fluent-ffmpeg')> {
    try {
      const mod = await import('fluent-ffmpeg');
      const ffmpeg = mod.default;

      const ffmpegPath =
        process.env.FFMPEG_PATH ??
        (await import('@ffmpeg-installer/ffmpeg')).path;
      if (ffmpegPath) {
        ffmpeg.setFfmpegPath(ffmpegPath);
      }

      const ffprobePath =
        process.env.FFPROBE_PATH ??
        (await import('@ffprobe-installer/ffprobe')).path;
      if (ffprobePath) {
        ffmpeg.setFfprobePath(ffprobePath);
      }

      return ffmpeg;
    } catch {
      throw new Error('fluent-ffmpeg is not installed');
    }
  }

  private extractDuration(
    ffmpeg: typeof import('fluent-ffmpeg'),
    videoPath: string,
  ): Promise<number | null> {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(videoPath, (error, metadata) => {
        if (error) {
          resolve(null);
          return;
        }
        const duration = metadata.format.duration;
        resolve(typeof duration === 'number' ? duration : null);
      });
    });
  }

  private extractThumbnail(
    ffmpeg: typeof import('fluent-ffmpeg'),
    videoPath: string,
    thumbDir: string,
    thumbFile: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .on('end', () => resolve())
        .on('error', (error) => reject(error))
        .screenshots({
          timestamps: ['0.5'],
          filename: thumbFile,
          folder: thumbDir,
          size: '640x?',
        });
    });
  }
}
