import { Controller, Post, Body, UseGuards, Get, Query, Put, Delete } from '@nestjs/common';
import { AdminAccountsService } from './accounts.service';
import type { AdminUserDTO } from '../admin.types';
import { AdminGuard } from '../admin.guard';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminAccountsController {
    constructor(
        private readonly adminAccountsService: AdminAccountsService
    ) { }

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

    @Delete("admin")
    async handleAdminDelete(@Body() body: { id: string }) {
        return this.adminAccountsService.deleteAdminUser(body.id);
    }
}
