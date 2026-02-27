import { Controller, Get, Query, Delete, UseGuards, Req, Body } from '@nestjs/common';
import { UserAccountService } from './user-account.service';
import { AdminGuard } from '../admin.guard';

@Controller('admin/users')
@UseGuards(AdminGuard)
export class UserAccountController {
    constructor(private readonly userAccountService: UserAccountService) { }

    @Get()
    async getUsers(
        @Query('page') page?: string,
        @Query('search') search?: string,
    ) {
        return this.userAccountService.getUsers({
            page: page ? parseInt(page) : 1,
            search,
        });
    }

    @Delete('by-id')
    async deleteUserById(
        @Req() req: any,
        @Body() body: { userId: string },
    ) {
        const admin = req.user;
        return this.userAccountService.deleteUserById(body.userId, admin.id, admin.email);
    }

    @Delete('by-email')
    async deleteUserByEmail(
        @Req() req: any,
        @Body() body: { email: string },
    ) {
        const admin = req.user;
        return this.userAccountService.deleteUserByEmail(body.email, admin.id, admin.email);
    }
}
