import { ConflictException, Inject, Injectable, Scope, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { prisma } from '@oppskills/db';
import * as bcrypt from 'bcryptjs';
import { Logger } from '../../_utils/logger';
import type { AdminUserDTO } from '../admin.types';
import { randomBytes } from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EMAIL_EVENTS } from 'src/email';
import { AdminLogsService } from '../admin-log/Logs.service';

@Injectable({ scope: Scope.REQUEST })
export class AdminAccountsService {
    private logger = new Logger('AdminAccountsService');

    constructor(
        @Inject(REQUEST) private request: any,
        private readonly eventEmitter: EventEmitter2,
        private readonly adminLogsService: AdminLogsService,
    ) { }

    async createAdminUser(admin: AdminUserDTO) {
        this.logger.log(`Attempting to create admin user: ${admin.email}`);
        const currentUser = this.request.user;
        // console.log("current user", currentUser)
        if (!currentUser || !currentUser.immutable) {
            this.logger.warn(`Unauthorized attempt to create admin by: ${currentUser?.email}`);
            throw new UnauthorizedException('Only immutable admins can create new admins');
        }

        const existingAdmin = await prisma.adminEntity.findUnique({
            where: {
                email: admin.email,
            },
        });
        if (existingAdmin) {
            this.logger.warn(`Admin already exists: ${admin.email}`);
            throw new ConflictException('Admin already exists');
        }
        const randomPassword = randomBytes(12).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        const createdAdmin = await prisma.adminEntity.create({
            data: {
                name: admin.name,
                email: admin.email,
                password: hashedPassword,
                immutable: admin.immutable === true,
            },
        });
        this.adminLogsService.createAdminLog({ adminId: createdAdmin.id, action: `${currentUser.email} created ${createdAdmin.name} ${createdAdmin.immutable ? "with Immutable role" : ""}`, type: 'CREATE' });
        this.eventEmitter.emit(EMAIL_EVENTS.ADMIN_CREATED, { ...createdAdmin, password: randomPassword });
        this.logger.log(`Admin created successfully: ${createdAdmin.email}`);
        createdAdmin.password = "";
        return { ...createdAdmin };
    }

    async listAllAdmin(search?: string) {
        this.logger.log(`Listing all admins with search: ${search || 'none'}`);
        return prisma.adminEntity.findMany({
            where: search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ]
            } : undefined,
            select: {
                id: true,
                name: true,
                email: true,
                immutable: true,
                isFirstLogin: true,
                createdAt: true,
                updatedAt: true,
            }
        });
    }

    async updateAdminUser(data: { password: string }) {
        const currentUser = this.request.user;
        if (!currentUser) {
            this.logger.warn(`Unauthorized attempt to update`);
            throw new UnauthorizedException('Unauthorized');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const updatedAdmin = await prisma.adminEntity.update({
            where: {
                id: currentUser.id,
            },
            data: {
                password: hashedPassword,
                isFirstLogin: false,
            },
        });
        this.logger.log(`Admin updated successfully: ${updatedAdmin.email}`);
        this.adminLogsService.createAdminLog({ adminId: updatedAdmin.id, action: `${updatedAdmin.name} onboarded successfully!`, type: 'UPDATE' });
        return updatedAdmin;
    }

    async deleteAdminUser(id: string) {
        const currentUser = this.request.user;
        if (!currentUser || !currentUser.immutable || currentUser.id === id) {
            this.logger.warn(`Unauthorized attempt to delete`);
            throw new UnauthorizedException('Unauthorized');
        }
        const deletedAdmin = await prisma.adminEntity.delete({
            where: {
                id,
            },
        });
        this.logger.log(`Admin deleted successfully: ${deletedAdmin.email}`);
        this.adminLogsService.createAdminLog({ adminId: currentUser.id, action: `${currentUser.email} deleted ${deletedAdmin.name}!`, type: 'DELETE' });
        return deletedAdmin;
    }
}
