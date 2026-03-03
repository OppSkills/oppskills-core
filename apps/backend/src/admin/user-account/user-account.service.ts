import { Inject, Injectable } from '@nestjs/common';
import { prisma } from '@oppskills/db';
import { Logger } from 'src/_utils/logger';
import { AdminLogsService } from '../admin-log/Logs.service';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class UserAccountService {
    private logger = new Logger('UserAccountService');

    constructor(
        private adminLogsService: AdminLogsService,
        @Inject(REQUEST) private request: any,
    ) { }

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
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                imageUrl: true,
                accessLevel: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return {
            data: users.slice(0, take),
            further: users.length > take,
        };
    }

    async getUserDetail(userId: string) {
        try {
            const user = await prisma.userEntity.findUnique({
                where: { id: userId },
                include: {
                    onboardingProfile: {
                        include: {
                            college: true,
                        }
                    },
                    eventParticipations: {
                        include: {
                            event: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                    startDate: true,
                                }
                            }
                        },
                        orderBy: {
                            joinedAt: 'desc'
                        }
                    },
                    hackathonRegistrationSubmissions: {
                        include: {
                            hackathon: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                    startDate: true,
                                }
                            }
                        },
                        orderBy: {
                            submittedAt: 'desc'
                        }
                    },
                    paymentsAsPayer: {
                        where: {
                            paymentStatus: 'CAPTURED'
                        },
                        select: {
                            grossAmount: true,
                        }
                    },
                    eventPaymentsAsPayer: {
                        where: {
                            paymentStatus: 'CAPTURED'
                        },
                        select: {
                            grossAmount: true,
                        }
                    }
                }
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Calculate total spending
            const totalHackathonSpending = user.paymentsAsPayer.reduce((sum, p) => sum + Number(p.grossAmount), 0);
            const totalEventSpending = user.eventPaymentsAsPayer.reduce((sum, p) => sum + Number(p.grossAmount), 0);
            const totalSpent = totalHackathonSpending + totalEventSpending;

            // Activity History for Graph (Monthly aggregation)
            const activity: Record<string, number> = {};

            user.eventParticipations.forEach(p => {
                const month = p.joinedAt.toISOString().substring(0, 7); // YYYY-MM
                activity[month] = (activity[month] || 0) + 1;
            });

            user.hackathonRegistrationSubmissions.forEach(s => {
                const month = s.submittedAt.toISOString().substring(0, 7); // YYYY-MM
                activity[month] = (activity[month] || 0) + 1;
            });

            const graphData = Object.entries(activity)
                .map(([month, count]) => ({ month, count }))
                .sort((a, b) => a.month.localeCompare(b.month));

            this.adminLogsService.createAdminLog({
                action: `${this.request.user.name || this.request.user.email} viewed profile of ${user.firstName} ${user.lastName} [${user.email}]`,
                adminId: this.request.user.id,
                type: "user"
            })

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    imageUrl: user.imageUrl,
                    accessLevel: user.accessLevel,
                    onboarded: user.onboarded,
                    createdAt: user.createdAt,
                    onboardingProfile: user.onboardingProfile,
                },
                stats: {
                    totalSpent,
                    eventCount: user.eventParticipations.length,
                    hackathonCount: user.hackathonRegistrationSubmissions.length,
                },
                events: user.eventParticipations.map(p => ({
                    id: p.event.id,
                    name: p.event.name,
                    slug: p.event.slug,
                    joinedAt: p.joinedAt,
                    startDate: p.event.startDate,
                })),
                hackathons: user.hackathonRegistrationSubmissions.map(s => ({
                    id: s.hackathon.id,
                    name: s.hackathon.name,
                    slug: s.hackathon.slug,
                    joinedAt: s.submittedAt,
                    startDate: s.hackathon.startDate,
                })),
                graphData,
            };
        } catch (error) {
            this.logger.error(`Failed to get user detail: ${userId}`, error);
            throw error;
        }
    }
}
