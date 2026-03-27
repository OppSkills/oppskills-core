import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@oppskills/db';
import { ApprovalStatus, LifecycleStatus } from '@prisma/client';
import { Logger } from '../../_utils/logger';
import { AdminLogsService } from '../admin-log/Logs.service';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class AdminFeaturesService {
    constructor(
        private readonly adminLogsService: AdminLogsService,
        @Inject(REQUEST) private request: any,
    ) { }

    private logger = new Logger('AdminFeaturesService');

    async listHackathons(limit: number, cursor?: string, filterPending?: boolean) {
        const take = limit + 1;
        const where: any = { isDeleted: false };

        if (filterPending) {
            where.status = LifecycleStatus.PUBLISHED;
            where.approvalStatus = ApprovalStatus.PENDING;
        }

        const hackathons = await prisma.hackathonEntity.findMany({
            take,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                mode: true,
                status: true,
                approvalStatus: true,
                slug: true,
                bannerImageUrl: true,
                owner: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        const hasMore = hackathons.length > limit;
        if (hasMore) {
            hackathons.pop();
        }

        return {
            data: hackathons,
            hasMore,
            nextCursor: hasMore ? hackathons[hackathons.length - 1].id : null
        };
    }

    async listEvents(limit: number, cursor?: string, filterPending?: boolean) {
        const take = limit + 1;
        const where: any = { isDeleted: false };

        if (filterPending) {
            where.status = LifecycleStatus.PUBLISHED;
            where.approvalStatus = ApprovalStatus.PENDING;
        }

        const events = await prisma.eventEntity.findMany({
            take,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                eventType: true,
                status: true,
                approvalStatus: true,
                slug: true,
                bannerImageUrl: true,
                owner: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        const hasMore = events.length > limit;
        if (hasMore) {
            events.pop();
        }

        return {
            data: events,
            hasMore,
            nextCursor: hasMore ? events[events.length - 1].id : null
        };
    }

    async listFestivals(limit: number, cursor?: string, filterPending?: boolean) {
        const take = limit + 1;
        const where: any = {};

        if (filterPending) {
            where.status = LifecycleStatus.PUBLISHED;
            where.approvalStatus = ApprovalStatus.PENDING;
        }

        const festivals = await prisma.festivalEntity.findMany({
            take,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                status: true,
                approvalStatus: true,
                slug: true,
                posterImageUrl: true,
                organizer: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        const hasMore = festivals.length > limit;
        if (hasMore) {
            festivals.pop();
        }

        return {
            data: festivals,
            hasMore,
            nextCursor: hasMore ? festivals[festivals.length - 1].id : null
        };
    }

    async getDetailBySlug(type: 'hackathon' | 'event' | 'festival', slug: string) {
        const currentUser = this.request.user;
        if (!currentUser) throw new NotFoundException('User not found');
        const adminName = currentUser.name || currentUser.email;

        let data: any;
        let name: string = '';

        if (type === 'hackathon') {
            data = await prisma.hackathonEntity.findUnique({
                where: { slug },
                include: {
                    owner: {
                        select: {
                            email: true,
                            firstName: true,
                            lastName: true
                        }
                    },
                    rounds: true,
                    attachments: true,
                    prizeBreakdown: true
                }
            });
            name = data?.name;
        } else if (type === 'event') {
            data = await prisma.eventEntity.findUnique({
                where: { slug },
                include: {
                    owner: {
                        select: {
                            email: true,
                            firstName: true,
                            lastName: true
                        }
                    },
                    attachments: true,
                    prizeBreakdown: true
                }
            });
            name = data?.name;
        } else if (type === 'festival') {
            data = await prisma.festivalEntity.findUnique({
                where: { slug },
                include: {
                    organizer: {
                        select: {
                            email: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });
            name = data?.name;
        }

        if (!data) throw new NotFoundException(`${type} not found`);

        await this.adminLogsService.createAdminLog({
            adminId: currentUser.id,
            action: `${adminName} viewed ${type} ${name || slug}`,
            type: 'VIEW'
        });

        return data;
    }

    async updateDetail(type: 'hackathon' | 'event' | 'festival', id: string, data: any) {
        const currentUser = this.request.user;
        if (!currentUser) throw new NotFoundException('User not found');
        const adminName = currentUser.name || currentUser.email;

        // Also in update everything can be updated except id
        const { id: _, ...updateData } = data;

        let updatedItem: any;

        if (type === 'hackathon') {
            updatedItem = await prisma.hackathonEntity.update({
                where: { id },
                data: updateData
            });
        } else if (type === 'event') {
            updatedItem = await prisma.eventEntity.update({
                where: { id },
                data: updateData
            });
        } else if (type === 'festival') {
            updatedItem = await prisma.festivalEntity.update({
                where: { id },
                data: updateData
            });
        }

        if (!updatedItem) throw new NotFoundException(`${type} not found`);

        await this.adminLogsService.createAdminLog({
            adminId: currentUser.id,
            action: `${adminName} updated ${type} ${updatedItem.name}`,
            type: 'UPDATE'
        });

        return updatedItem;
    }

    async toggleApproval(type: 'hackathon' | 'event' | 'festival', id: string, status: ApprovalStatus) {
        const currentUser = this.request.user;
        if (!currentUser) throw new NotFoundException('User not found');
        const adminName = currentUser.name || currentUser.email;
        const actionText = status === ApprovalStatus.APPROVED ? 'approved' : 'rejected';

        if (type === 'hackathon') {
            const hackathon = await prisma.hackathonEntity.findUnique({ where: { id } });
            if (!hackathon) throw new NotFoundException('Hackathon not found');
            if (hackathon.status !== LifecycleStatus.PUBLISHED) {
                throw new Error('Cannot approve hackathon that is not in PUBLISHED status');
            }
            await prisma.hackathonEntity.update({
                where: { id },
                data: {
                    approvalStatus: status,
                    approvalApprovedAt: status === ApprovalStatus.APPROVED ? new Date() : null,
                    approvalRejectedAt: status === ApprovalStatus.REJECTED ? new Date() : null,
                }
            });
            await this.adminLogsService.createAdminLog({
                adminId: currentUser.id,
                action: `${adminName} ${actionText} hackathon ${hackathon.name}`,
                type: 'APPROVAL'
            });
            return { success: true };
        } else if (type === 'event') {
            const event = await prisma.eventEntity.findUnique({ where: { id } });
            if (!event) throw new NotFoundException('Event not found');
            if (event.status !== LifecycleStatus.PUBLISHED) {
                throw new Error('Cannot approve event that is not in PUBLISHED status');
            }
            await prisma.eventEntity.update({
                where: { id },
                data: {
                    approvalStatus: status,
                    approvalApprovedAt: status === ApprovalStatus.APPROVED ? new Date() : null,
                    approvalRejectedAt: status === ApprovalStatus.REJECTED ? new Date() : null,
                }
            });
            await this.adminLogsService.createAdminLog({
                adminId: currentUser.id,
                action: `${adminName} ${actionText} event ${event.name}`,
                type: 'APPROVAL'
            });
            return { success: true };
        } else if (type === 'festival') {
            const festival = await prisma.festivalEntity.findUnique({ where: { id } });
            if (!festival) throw new NotFoundException('Festival not found');
            if (festival.status !== LifecycleStatus.PUBLISHED) {
                throw new Error('Cannot approve festival that is not in PUBLISHED status');
            }
            await prisma.festivalEntity.update({
                where: { id },
                data: {
                    approvalStatus: status,
                    approvalApprovedAt: status === ApprovalStatus.APPROVED ? new Date() : null,
                    approvalRejectedAt: status === ApprovalStatus.REJECTED ? new Date() : null,
                }
            });
            await this.adminLogsService.createAdminLog({
                adminId: currentUser.id,
                action: `${adminName} ${actionText} festival ${festival.name}`,
                type: 'APPROVAL'
            });
            return { success: true };
        }
        throw new NotFoundException('Invalid type');
    }
}
