import { ConflictException, Inject, Injectable, Scope, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { prisma, UserCategory } from '@oppskills/db';
import * as jwt from "jsonwebtoken"
import * as bcrypt from 'bcryptjs';
import type { AdminUserDTO } from './admin.types';

@Injectable({ scope: Scope.REQUEST })
export class AdminService {
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
        const email = this.request.user?.email;
        if (!email) {
            throw new UnauthorizedException('User not found in request context');
        }
        return prisma.adminEntity.findUnique({
            where: {
                email,
            },
        });
    }

    async handleAdminLogin(email: string, password: string) {
        const admin = await prisma.adminEntity.findUnique({
            where: {
                email,
            },
        });
        if (!admin) {
            throw new UnauthorizedException('Admin not found');
        }
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid password');
        }
        const signedData = await this.signJWT(admin.id, admin.email, admin.immutable)
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

    async createAdminUser(admin: AdminUserDTO) {
        const currentUser = this.request.user;
        console.log("current user", currentUser)
        if (!currentUser || !currentUser.immutable) {
            throw new UnauthorizedException('Only immutable admins can create new admins');
        }

        const existingAdmin = await prisma.adminEntity.findUnique({
            where: {
                email: admin.email,
            },
        });
        if (existingAdmin) {
            throw new ConflictException('Admin already exists');
        }
        const hashedPassword = await bcrypt.hash(admin.password, 10);
        const createdAdmin = await prisma.adminEntity.create({
            data: {
                name: admin.name,
                email: admin.email,
                password: hashedPassword,
                immutable: admin.immutable === true,
            },
        });
        return createdAdmin;
    }



    async listAllAdmin() {
        return prisma.adminEntity.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                immutable: true,
                createdAt: true,
                updatedAt: true,
            }
        });
    }

    async updateAdminUser() { }

    async listAllFestivals() { }

    async listAllHackathons() { }

    async listAllEvents() { }

    async listAllUserAccounts() { }

    async listAllColleges() { }

    async listAllMedia() { }

    async searchFestivals() { }

    async searchHackathons() { }

    async searchEvents() { }

    async searchUserAccounts() { }

    async searchColleges() { }



}
