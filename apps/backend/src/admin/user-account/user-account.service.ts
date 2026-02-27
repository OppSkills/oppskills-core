import { Injectable } from '@nestjs/common';
import { prisma } from '@oppskills/db';
import { Logger } from 'src/_utils/logger';
import { AdminLogsService } from '../admin-log/Logs.service';

@Injectable()
export class UserAccountService {
    private logger = new Logger('UserAccountService');

    constructor(private adminLogsService: AdminLogsService) { }

    async getUsers({
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
                        email: {
                            contains: search,
                            mode: "insensitive" as const,
                        },
                    },
                    {
                        firstName: {
                            contains: search,
                            mode: "insensitive" as const,
                        },
                    },
                    {
                        lastName: {
                            contains: search,
                            mode: "insensitive" as const,
                        },
                    },
                ],
            }
            : {};

        const users = await prisma.userEntity.findMany({
            where,
            skip,
            take: take + 1,
            orderBy: {
                createdAt: "desc",
            },
        });

        return {
            data: users.slice(0, take),
            further: users.length > take,
        };
    }

    async deleteUserById(userId: string, adminId: string, adminEmail: string) {
        try {
            const user = await prisma.userEntity.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw new Error('User not found');
            }

            await prisma.userEntity.delete({
                where: { id: userId },
            });

            await this.adminLogsService.createAdminLog({
                adminId,
                action: `${adminEmail} deleted ${user.email}`,
                type: 'USER_DELETION',
            });

            return { status: 'success', message: 'User deleted successfully' };
        } catch (error) {
            this.logger.error(`Failed to delete user by ID: ${userId}`, error);
            throw error;
        }
    }

    async deleteUserByEmail(email: string, adminId: string, adminEmail: string) {
        try {
            const user = await prisma.userEntity.findUnique({
                where: { email },
            });

            if (!user) {
                throw new Error('User not found');
            }

            await prisma.userEntity.delete({
                where: { email },
            });

            await this.adminLogsService.createAdminLog({
                adminId,
                action: `${adminEmail} deleted ${user.email}`,
                type: 'USER_DELETION',
            });

            return { status: 'success', message: 'User deleted successfully' };
        } catch (error) {
            this.logger.error(`Failed to delete user by email: ${email}`, error);
            throw error;
        }
    }
}
