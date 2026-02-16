import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { AdminService } from './admin.service';
import type { AdminUserDTO } from './admin.types';
import { AdminGuard } from './admin.guard';
import { Public } from './public.decorator';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Public()
    @Post('login')
    async handleAdminLogin(@Body() body: { email: string, password: string }) {
        return this.adminService.handleAdminLogin(body.email, body.password);
    }

    @Get("admin")
    async listAllAdmins() {
        return this.adminService.listAllAdmin();
    }

    @Post("admin")
    async handleCreateAdminUser(@Body() body: AdminUserDTO) {
        return this.adminService.createAdminUser(body);
    }

    @Get('me')
    async getMe() {
        return this.adminService.getMe();
    }

}
