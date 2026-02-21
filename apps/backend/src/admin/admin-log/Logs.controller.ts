import { Controller, Post, Body, UseGuards, Get, Query, Put } from '@nestjs/common';
import { AdminLogsService } from './Logs.service';
import { AdminGuard } from '../admin.guard';

@Controller("admin/logs")
@UseGuards(AdminGuard)
export class AdminLogsController {
    constructor(private readonly adminLogsService: AdminLogsService) { }

    @Get()
    async getAdminLogs(@Query() query: { page?: number; search?: string }) {
        return this.adminLogsService.getAdminLogs(query);
    }
}
