import { Controller, Post, Body, UseGuards, Get, Query, Put } from '@nestjs/common';
import { AdminAuthService } from './auth/auth.service';
import { AdminAccountsService } from './accounts/accounts.service';
import type { AdminUserDTO } from './admin.types';
import { AdminGuard } from './admin.guard';
import { Public } from './public.decorator';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
    constructor(
        private readonly adminAuthService: AdminAuthService,
        private readonly adminAccountsService: AdminAccountsService
    ) { }

    @Public()
    @Post('login')
    async handleAdminLogin(@Body() body: { email: string, password: string }) {
        return this.adminAuthService.handleAdminLogin(body.email, body.password);
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
