import { Injectable } from '@nestjs/common';
import { prisma } from '@oppskills/db';
import { Logger } from 'src/_utils/logger';
import { AdminLogsService } from '../admin-log/Logs.service';

@Injectable()
export class AdminPaymentsService {
  private logger = new Logger('AdminPaymentsService');

  constructor(private adminLogsService: AdminLogsService) {}

  async getPayments({
    page = 1,
    limit = 50,
  }: {
    page?: number;
    limit?: number;
  }) {
    const skip = (page - 1) * limit;

    // Fetching both hackathon and event payments
    // In a real scenario, you might want a centralized transaction table
    // But for now, we'll combine them or offer a way to toggle between them.
    // Let's combine them for a "Global" view as requested.

    const [hackathonPayments, eventPayments] = await Promise.all([
      prisma.hackathonPaymentEntity.findMany({
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          payerUser: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          hackathon: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.eventPaymentEntity.findMany({
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          payerUser: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          event: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      }),
    ]);

    // Combine and map to a common format
    const combined = [
      ...hackathonPayments.map((p) => ({
        id: p.id,
        user:
          `${p.payerUser.firstName} ${p.payerUser.lastName}`.trim() ||
          p.payerUser.email,
        userEmail: p.payerUser.email,
        amount: `₹${Number(p.grossAmount).toLocaleString()}`,
        date: p.createdAt.toLocaleDateString(),
        status: p.paymentStatus,
        type: 'Hackathon',
        itemName: p.hackathon.name,
        itemSlug: p.hackathon.slug,
        razorpayOrderId: p.razorpayOrderId,
        razorpayPaymentId: p.razorpayPaymentId,
      })),
      ...eventPayments.map((p) => ({
        id: p.id,
        user:
          `${p.payerUser.firstName} ${p.payerUser.lastName}`.trim() ||
          p.payerUser.email,
        userEmail: p.payerUser.email,
        amount: `₹${Number(p.grossAmount).toLocaleString()}`,
        date: p.createdAt.toLocaleDateString(),
        status: p.paymentStatus,
        type: 'Event',
        itemName: p.event.name,
        itemSlug: p.event.slug,
        razorpayOrderId: p.razorpayOrderId,
        razorpayPaymentId: p.razorpayPaymentId,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      data: combined.slice(0, limit),
      further:
        combined.length > limit ||
        hackathonPayments.length === limit ||
        eventPayments.length === limit,
    };
  }
}
