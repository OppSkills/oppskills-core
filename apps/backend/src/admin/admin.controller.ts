import { Controller, Post, Body, UseGuards, Get, Query, Put, Res } from '@nestjs/common';
import { AdminAuthService } from './auth/auth.service';
import { AdminAccountsService } from './accounts/accounts.service';
import type { AdminUserDTO } from './admin.types';
import { AdminGuard } from './admin.guard';
import { Public } from './public.decorator';
import express from 'express';
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
    constructor(
        private readonly adminAuthService: AdminAuthService,
        private readonly adminAccountsService: AdminAccountsService
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

        // 🚫 Don't send token in body
        return result.user;
    }

    @Get("admin")
    async listAllAdmins(@Query('search') search?: string) {
        return this.adminAccountsService.listAllAdmin(search);
    }

    @Post("admin")
    async handleCreateAdminUser(@Body() body: AdminUserDTO) {
        return this.adminAccountsService.createAdminUser(body);
    }

    @Put("admin")
    async handleAdminUpdate(@Body() body: { password: string }) {
        return this.adminAccountsService.updateAdminUser(body);
    }

    @Get('me')
    async getMe() {
        return this.adminAuthService.getMe();
    }

}
