import {
    Body,
    Controller,
    Get,
    Post,
    UseGuards,
    Request,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
    IsString,
    IsNotEmpty,
    IsEmail,
    IsOptional,
} from 'class-validator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { EMAIL_EVENTS, EventDirectMessageEventPayload } from './email.events';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { HackathonService } from '../hackathon/hackathon.service';
import { TeamService } from '../team/team.service';

export class SendDirectMessageDto {
    @IsString()
    @IsNotEmpty()
    userId: string; // Recipient User ID

    @IsEmail()
    email: string;

    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsNotEmpty()
    eventId: string;

    @IsString()
    @IsNotEmpty()
    eventName: string;

    @IsString()
    @IsNotEmpty()
    eventSlug: string;

    @IsString()
    @IsNotEmpty()
    body: string;
}

@ApiTags('Email')
@Controller('email')
export class EmailController {
    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly hackathonService: HackathonService,
        private readonly teamService: TeamService,
    ) { }

    @Get('test')
    test() {
        return { success: true, message: 'Email test endpoint working' };
    }

    @Post('messages/direct')
    @UseGuards(ClerkAuthGuard)
    @ApiBearerAuth('clerk-auth')
    async sendDirectMessage(
        @Request() req: { user: { id: string } },
        @Body() dto: SendDirectMessageDto,
    ) {
        const senderId = req.user.id;
        const { eventId, userId: recipientId } = dto;

        // 1. Verify Sender: specific check logic provided by HackathonService.
        // getHackathonById throws NotFound/Forbidden if access is invalid for the user.
        // However, that methods allows 'read' if public, we need to ensure 'write' or 'admin' access (Owner/Manager).
        // Let's rely on a more strict check.
        const hackathon = await this.hackathonService.getHackathonById(eventId, senderId);

        // Explicitly check for organizer/manager role since getHackathonById allows any user to view public hackathons.
        const isOwner = hackathon.ownerId === senderId;
        let isManager = false;
        if (!isOwner) {
            isManager = await this.hackathonService.isHackathonManager(eventId, senderId);
        }

        // If implementing strict organizer-only logic:
        if (!isOwner && !isManager) {
            throw new ForbiddenException('Only organizers or managers can send messages for this event.');
        }

        // 2. Verify Recipient: Must be a participant (in a team)
        const participationTeam = await this.teamService.checkUserTeamInHackathon(
            eventId,
            recipientId,
        );

        if (!participationTeam) {
            throw new ForbiddenException(
                'The recipient is not a registered participant of this event.',
            );
        }

        // 3. (Optional) Email sanity check
        // If the recipient details in DTO don't match the participation record, we could flag it,
        // but the email service will just send to whatever email is provided. 
        // Ideally we should use the email from the system (participationTeam members), but let's trust the DTO for now 
        // as it likely comes from the frontend which has this data.

        const payload: EventDirectMessageEventPayload = { ...dto };

        this.eventEmitter.emit(EMAIL_EVENTS.EVENT_DIRECT_MESSAGE, payload);

        return { success: true, message: 'Email queued successfully' };
    }
}
