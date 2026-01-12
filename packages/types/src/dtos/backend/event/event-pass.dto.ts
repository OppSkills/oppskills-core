import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export interface EventPassDto {
  id: string;
  ticketId: string;
  token: string;
  userId: string;
  eventId: string;
  participantId: string;
  isUsed: boolean;
  scannedAt?: string;
  scannedBy?: {
    id: string;
    name: string;
  };
  createdAt: string;

  // Populated data
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    imageUrl?: string;
    collegeName?: string;
  };
  event: {
    id: string;
    name: string;
    slug: string;
    startDate: string;
  };
}

export class ScanEventPassDto {
  @ApiProperty({
    description: 'Token from QR code to validate and scan',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export interface ScanResultDto {
  success: boolean;
  pass: EventPassDto;
  message: string;
  wasAlreadyUsed: boolean;
}

/**
 * Public pass lookup response - limited info for security
 * Does NOT include token, internal IDs, or sensitive data
 */
export interface PublicPassLookupDto {
  ticketId: string;
  eventId: string;
  eventSlug: string;
  isUsed: boolean;
  scannedAt?: string;
  scannedByName?: string;
  participant: {
    name: string;
    email: string;
    imageUrl?: string;
    collegeName?: string;
  };
  event: {
    name: string;
    startDate: string;
  };
}

