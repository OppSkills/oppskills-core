import { BadRequestException, Injectable } from '@nestjs/common';
import { prisma, Prisma } from '@oppskills/db';

type PaymentRow = {
  id: string;
  user: string;
  userEmail: string;
  amount: string;
  date: string;
  status: string;
  type: 'Hackathon' | 'Event';
  itemName: string;
  itemSlug: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
};

@Injectable()
export class AdminPaymentsService {
  async getPayments({
    page = 1,
    limit = 50,
    eventId,
    hackathonId,
  }: {
    page?: number;
    limit?: number;
    eventId?: string;
    hackathonId?: string;
  }) {
    if (eventId && hackathonId) {
      throw new BadRequestException(
        'Pass only one of eventId or hackathonId, not both.',
      );
    }

    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;

    if (hackathonId) {
      return this.getHackathonPaymentsPage(hackathonId, skip, safeLimit);
    }

    if (eventId) {
      return this.getEventPaymentsPage(eventId, skip, safeLimit);
    }

    return this.getCombinedPaymentsPage(skip, safeLimit);
  }

  private mapHackathonPayment(p: {
    id: string;
    grossAmount: Prisma.Decimal;
    paymentStatus: string;
    createdAt: Date;
    razorpayOrderId: string;
    razorpayPaymentId: string | null;
    payerUser: {
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
    hackathon: { name: string; slug: string };
  }): PaymentRow {
    return {
      id: p.id,
      user:
        `${p.payerUser.firstName ?? ''} ${p.payerUser.lastName ?? ''}`.trim() ||
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
    };
  }

  private mapEventPayment(p: {
    id: string;
    grossAmount: Prisma.Decimal;
    paymentStatus: string;
    createdAt: Date;
    razorpayOrderId: string;
    razorpayPaymentId: string | null;
    payerUser: {
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
    event: { name: string; slug: string };
  }): PaymentRow {
    return {
      id: p.id,
      user:
        `${p.payerUser.firstName ?? ''} ${p.payerUser.lastName ?? ''}`.trim() ||
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
    };
  }

  private async getHackathonPaymentsPage(
    hackathonId: string,
    skip: number,
    limit: number,
  ) {
    const where = { hackathonId };

    const total = await prisma.hackathonPaymentEntity.count({ where });
    const hackathonPayments = await prisma.hackathonPaymentEntity.findMany({
      where,
      skip,
      take: limit,
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
    });

    const data = hackathonPayments.map((p) => this.mapHackathonPayment(p));
    const further = skip + data.length < total;

    return { data, further };
  }

  private async getEventPaymentsPage(
    eventId: string,
    skip: number,
    limit: number,
  ) {
    const where = { eventId };

    const total = await prisma.eventPaymentEntity.count({ where });
    const eventPayments = await prisma.eventPaymentEntity.findMany({
      where,
      skip,
      take: limit,
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
    });

    const data = eventPayments.map((p) => this.mapEventPayment(p));
    const further = skip + data.length < total;

    return { data, further };
  }

  private async getCombinedPaymentsPage(skip: number, limit: number) {
    const [countRow] = await prisma.$queryRaw<[{ count: bigint }]>(
      Prisma.sql`
        SELECT COUNT(*)::bigint AS count
        FROM (
          SELECT id FROM payments.hackathon_payment
          UNION ALL
          SELECT id FROM payments.event_payment
        ) t
      `,
    );

    const total = Number(countRow?.count ?? 0);

    const idRows = await prisma.$queryRaw<
      Array<{ id: string; kind: string; created_at: Date }>
    >(
      Prisma.sql`
        SELECT id, kind, created_at
        FROM (
          SELECT id, created_at, 'Hackathon' AS kind
          FROM payments.hackathon_payment
          UNION ALL
          SELECT id, created_at, 'Event' AS kind
          FROM payments.event_payment
        ) sub
        ORDER BY sub.created_at DESC
        LIMIT ${limit} OFFSET ${skip}
      `,
    );

    if (idRows.length === 0) {
      return { data: [] as PaymentRow[], further: false };
    }

    const hackathonIds = idRows
      .filter((r) => r.kind === 'Hackathon')
      .map((r) => r.id);
    const eventIds = idRows.filter((r) => r.kind === 'Event').map((r) => r.id);

    const hackathonPayments =
      hackathonIds.length > 0
        ? await prisma.hackathonPaymentEntity.findMany({
            where: { id: { in: hackathonIds } },
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
          })
        : [];

    const eventPayments =
      eventIds.length > 0
        ? await prisma.eventPaymentEntity.findMany({
            where: { id: { in: eventIds } },
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
          })
        : [];

    const hMap = new Map<string, any>(hackathonPayments.map((p) => [p.id, p]));
    const eMap = new Map<string, any>(eventPayments.map((p) => [p.id, p]));

    const data: PaymentRow[] = [];
    for (const row of idRows) {
      if (row.kind === 'Hackathon') {
        const p = hMap.get(row.id);
        if (p) data.push(this.mapHackathonPayment(p));
      } else {
        const p = eMap.get(row.id);
        if (p) data.push(this.mapEventPayment(p));
      }
    }

    const further = skip + data.length < total;
    return { data, further };
  }
}
