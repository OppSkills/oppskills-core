import { Body, Controller, Get, Post } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
    IsString,
    IsNotEmpty,
    IsEmail,
    IsOptional,
} from 'class-validator';

import { EMAIL_EVENTS, EventDirectMessageEventPayload } from './email.events';

export class SendDirectMessageDto {
    @IsString()
    @IsNotEmpty()
    userId: string;

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

@Controller('email')
export class EmailController {
    constructor(private readonly eventEmitter: EventEmitter2) { }

    @Get('test')
    test() {
        return { success: true, message: 'Email test endpoint working' };
    }

    @Post('messages/direct')
    async sendDirectMessage(@Body() dto: SendDirectMessageDto) {
        const payload: EventDirectMessageEventPayload = { ...dto };

        this.eventEmitter.emit(
            EMAIL_EVENTS.EVENT_DIRECT_MESSAGE,
            payload,
        );

        return { success: true, message: 'Email queued successfully' };
    }
}
