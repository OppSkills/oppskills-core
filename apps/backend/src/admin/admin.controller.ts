import { Controller, Post, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import type { AdminUserDTO } from './admin.types';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Post('login')
    async handleAdminLogin(@Body() body: { email: string, password: string }) {
        return this.adminService.handleAdminLogin(body.email, body.password);
    }

    @Post('create')
    async handleCreateAdminUser(@Body() body: AdminUserDTO) {
        return this.adminService.createAdminUser(body);
    }
}
