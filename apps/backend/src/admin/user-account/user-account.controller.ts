import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { UserAccountService } from './user-account.service';
import { AdminGuard } from '../admin.guard';

@Controller('admin/users')
@UseGuards(AdminGuard)
export class UserAccountController {
  constructor(private readonly userAccountService: UserAccountService) {}

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

  @Get(':id')
  async getUserDetail(@Param('id') id: string) {
    return this.userAccountService.getUserDetail(id);
  }
}
