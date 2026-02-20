import { Controller, Post, Body, UseGuards, Get, Res } from '@nestjs/common';
import { AdminAuthService } from './auth.service';
import { AdminGuard } from '../admin.guard';
import { Public } from '../public.decorator';
import express from 'express';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminAuthController {
    constructor(
        private readonly adminAuthService: AdminAuthService,
    ) { }

    @Public()
    @Post('login')
    async handleAdminLogin(
        @Body() body: { email: string; password: string },
        @Res({ passthrough: true }) res: express.Response,
    ) {
        const result = await this.adminAuthService.handleAdminLogin(
            body.email,
            body.password,
        );

        // 🔐 Set HTTP-only cookie
        res.cookie('admin_token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24, // 1 day
        });

        return result.user;
    }

    @Public()
    @Post('logout')
    async logout(@Res({ passthrough: true }) res: express.Response) {
        res.clearCookie('admin_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });
        return { message: 'Logged out successfully' };
    }

    @Get('me')
    async getMe() {
        return this.adminAuthService.getMe();
    }
}
