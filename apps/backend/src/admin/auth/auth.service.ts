import { Inject, Injectable, Scope, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { prisma } from '@oppskills/db';
import * as jwt from "jsonwebtoken";
import * as bcrypt from 'bcryptjs';
import { Logger } from '../../_utils/logger';

@Injectable({ scope: Scope.REQUEST })
export class AdminAuthService {
    private logger = new Logger('AdminAuthService');

    constructor(@Inject(REQUEST) private request: any) { }

    async signJWT(id: string, email: string, immutable: boolean) {
        const signedData = await jwt.sign({
            id,
            email,
            role: "admin",
            immutable
        }, process.env.JWT_SECRET, {
            expiresIn: "1d"
        })
        return signedData
    }

    async verifyJWT(token: string) {
        return jwt.verify(token, process.env.JWT_SECRET)
    }

    async getMe() {
        this.logger.log('Fetching current admin user');
        const email = this.request.user?.email;
        if (!email) {
            this.logger.warn('User not found in request context during getMe');
            throw new UnauthorizedException('User not found in request context');
        }
        return prisma.adminEntity.findUnique({
            where: {
                email,
            },
            select: {
                id: true,
                email: true,
                name: true,
                immutable: true,
                isFirstLogin: true,
            }
        });
    }

    async handleAdminLogin(email: string, password: string) {
        this.logger.log(`Attempting login for email: ${email}`);
        const admin = await prisma.adminEntity.findUnique({
            where: {
                email,
            },
        });
        if (!admin) {
            this.logger.warn(`Admin not found for email: ${email}`);
            throw new UnauthorizedException('Admin not found');
        }
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            this.logger.warn(`Invalid password for email: ${email}`);
            throw new UnauthorizedException('Invalid password');
        }
        const signedData = await this.signJWT(admin.id, admin.email, admin.immutable)
        this.logger.log(`Login successful for email: ${email}`);
        return {
            token: signedData,
            user: {
                id: admin.id,
                email: admin.email,
                role: "admin",
                immutable: admin.immutable
            }
        }
    }
}
