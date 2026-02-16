import { ConflictException, Inject, Injectable, Scope, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { prisma, UserCategory } from '@oppskills/db';
import * as jwt from "jsonwebtoken"
import * as bcrypt from 'bcryptjs';
import type { AdminUserDTO } from './admin.types';

@Injectable({ scope: Scope.REQUEST })
export class AdminService {
    constructor(@Inject(REQUEST) private request: any) { }

    async signJWT(id: string, email: string) {
        const signedData = await jwt.sign({
            id,
            email,
            role: "admin"
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
        const signedData = await this.signJWT(admin.id, admin.email)
        return {
            token: signedData,
            user: {
                id: admin.id,
                email: admin.email,
                role: "admin"
            }
        }
    }

    async createAdminUser(admin: AdminUserDTO) {
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
            },
        });
        return createdAdmin;
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
