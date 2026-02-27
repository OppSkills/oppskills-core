import { Injectable } from '@nestjs/common';
import { prisma } from '@oppskills/db';
import { Logger } from 'src/_utils/logger';

export interface AdminLogsDto {
    adminId: string;
    action: string;
    type: string;
}

@Injectable()
export class AdminLogsService {
    private logger = new Logger('AdminLogsService');

    constructor() { }
    async createAdminLog({ adminId, action, type = "other" }: AdminLogsDto) {
        try {
            const log = await prisma.adminLog.create({
                data: {
                    adminId,
                    action,
                    type,
                },
            });
            console.log(log);
            this.logger.info("Admin Creation Logged Successfully")
        } catch (error) {
            this.logger.error("Admin Creation failed to log")
        }

        return { status: "success", action }
    }

    async getAdminLogs({
        page = 1,
        search,
    }: {
        page?: number;
        search?: string;
    }) {
        const take = 50;
        const skip = (page - 1) * take;

        const where = search
            ? {
                OR: [
                    {
                        action: {
                            contains: search,
                            mode: "insensitive" as const,
                        },
                    },
                    {
                        type: {
                            contains: search,
                            mode: "insensitive" as const,
                        },
                    },
                ],
            }
            : {};

        const logs = await prisma.adminLog.findMany({
            where,
            skip,
            take: take + 1,
            orderBy: {
                createdAt: "desc",
            },
        })

        return {
            data: logs.slice(0, take),
            further: logs.length > take,
        };
    }

}