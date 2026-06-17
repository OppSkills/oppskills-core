import { Injectable } from '@nestjs/common';
import { prisma } from '@oppskills/db';

@Injectable()
export class AdminStatsService {
  async dashboardOverview() {
    const now = new Date();
    const startOfThisYear = new Date(now.getFullYear(), 0, 1);
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
    );

    // --- User Stats ---
    const [
      totalUsers,
      usersThisYear,
      usersLastYear,
      usersThisMonth,
      usersLastMonth,
    ] = await Promise.all([
      prisma.userEntity.count(),
      prisma.userEntity.count({
        where: { createdAt: { gte: startOfThisYear } },
      }),
      prisma.userEntity.count({
        where: { createdAt: { gte: startOfLastYear, lte: endOfLastYear } },
      }),
      prisma.userEntity.count({
        where: { createdAt: { gte: startOfThisMonth } },
      }),
      prisma.userEntity.count({
        where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),
    ]);

    // --- Revenue Stats (Using platformFeeAmount) ---
    // Helper to sum revenue
    const sumRevenue = async (model: any, where: any) => {
      const result = await model.aggregate({
        _sum: { platformFeeAmount: true },
        where: {
          ...where,
        },
      });
      return Number(result._sum.platformFeeAmount || 0);
    };

    const [
      hackathonRevTotal,
      hackathonRevThisYear,
      hackathonRevLastYear,
      eventRevTotal,
      eventRevThisYear,
      eventRevLastYear,
    ] = await Promise.all([
      sumRevenue(prisma.hackathonPaymentEntity, { paymentStatus: 'CAPTURED' }),
      sumRevenue(prisma.hackathonPaymentEntity, {
        paymentStatus: 'CAPTURED',
        createdAt: { gte: startOfThisYear },
      }),
      sumRevenue(prisma.hackathonPaymentEntity, {
        paymentStatus: 'CAPTURED',
        createdAt: { gte: startOfLastYear, lte: endOfLastYear },
      }),
      sumRevenue(prisma.eventPaymentEntity, { paymentStatus: 'CAPTURED' }),
      sumRevenue(prisma.eventPaymentEntity, {
        paymentStatus: 'CAPTURED',
        createdAt: { gte: startOfThisYear },
      }),
      sumRevenue(prisma.eventPaymentEntity, {
        paymentStatus: 'CAPTURED',
        createdAt: { gte: startOfLastYear, lte: endOfLastYear },
      }),
    ]);

    // --- Active Entities (Hackathons & Events) ---
    // Assuming "Active Entities" stats refer to creation counts as per "thisMonth/lastMonth" breakdown
    const [
      hackathonTotal,
      hackathonThisMonth,
      hackathonLastMonth,
      eventTotal,
      eventThisMonth,
      eventLastMonth,
    ] = await Promise.all([
      prisma.hackathonEntity.count(),
      prisma.hackathonEntity.count({
        where: { createdAt: { gte: startOfThisMonth } },
      }),
      prisma.hackathonEntity.count({
        where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),
      prisma.eventEntity.count(),
      prisma.eventEntity.count({
        where: { createdAt: { gte: startOfThisMonth } },
      }),
      prisma.eventEntity.count({
        where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),
    ]);

    return {
      userStats: {
        total: totalUsers,
        thisyear: usersThisYear,
        lastYear: usersLastYear,
      },
      revenue: {
        hackathon: {
          total: hackathonRevTotal,
          thisYear: hackathonRevThisYear,
          lastYear: hackathonRevLastYear,
        },
        event: {
          total: eventRevTotal,
          lastYear: eventRevLastYear,
          thisYear: eventRevThisYear,
        },
      },
      activeEntities: {
        hackathon: {
          total: hackathonTotal,
          lastMonth: hackathonLastMonth,
          thisMonth: hackathonThisMonth,
        },
        event: {
          total: eventTotal,
          lastMonth: eventLastMonth,
          thisMonth: eventThisMonth,
        },
      },
      users: {
        total: totalUsers,
        thisMonth: usersThisMonth,
        lastMonth: usersLastMonth,
      },
    };
  }
}
