import { Injectable } from '@nestjs/common';
import { prisma } from '@oppskills/db';
import { Logger } from 'src/_utils/logger';

export type EscrowAnswer = { fieldId: string; value: string };

const ESCROW_TTL_MS = 48 * 60 * 60 * 1000;

@Injectable()
export class PaymentRegistrationEscrowService {
  private readonly logger = new Logger(PaymentRegistrationEscrowService.name);

  async upsertHackathonEscrow(params: {
    razorpayOrderId: string;
    payerUserId: string;
    hackathonId: string;
    answers: EscrowAnswer[];
  }): Promise<void> {
    if (!params.answers?.length) return;
    const expiresAt = new Date(Date.now() + ESCROW_TTL_MS);
    await prisma.paymentRegistrationEscrowEntity.upsert({
      where: { razorpayOrderId: params.razorpayOrderId },
      create: {
        razorpayOrderId: params.razorpayOrderId,
        payerUserId: params.payerUserId,
        resourceType: 'HACKATHON',
        hackathonId: params.hackathonId,
        eventId: null,
        answers: params.answers as object[],
        expiresAt,
      },
      update: {
        answers: params.answers as object[],
        expiresAt,
        hackathonId: params.hackathonId,
      },
    });
    this.logger.log(
      `Saved registration answer escrow for hackathon order ${params.razorpayOrderId} (${params.answers.length} fields)`,
    );
  }

  async upsertEventEscrow(params: {
    razorpayOrderId: string;
    payerUserId: string;
    eventId: string;
    answers: EscrowAnswer[];
  }): Promise<void> {
    if (!params.answers?.length) return;
    const expiresAt = new Date(Date.now() + ESCROW_TTL_MS);
    await prisma.paymentRegistrationEscrowEntity.upsert({
      where: { razorpayOrderId: params.razorpayOrderId },
      create: {
        razorpayOrderId: params.razorpayOrderId,
        payerUserId: params.payerUserId,
        resourceType: 'EVENT',
        hackathonId: null,
        eventId: params.eventId,
        answers: params.answers as object[],
        expiresAt,
      },
      update: {
        answers: params.answers as object[],
        expiresAt,
        eventId: params.eventId,
      },
    });
    this.logger.log(
      `Saved registration answer escrow for event order ${params.razorpayOrderId} (${params.answers.length} fields)`,
    );
  }

  /**
   * Load escrowed answers for verifyPayment when the client sends an empty body.
   * Does not delete — caller deletes after successful registration submit.
   */
  async loadAnswersForVerify(
    razorpayOrderId: string,
    payerUserId: string,
  ): Promise<EscrowAnswer[] | null> {
    const row = await prisma.paymentRegistrationEscrowEntity.findUnique({
      where: { razorpayOrderId },
    });
    if (!row) return null;
    if (row.payerUserId !== payerUserId) {
      this.logger.warn(
        `Escrow payer mismatch for order ${razorpayOrderId} — ignoring`,
      );
      return null;
    }
    if (row.expiresAt.getTime() < Date.now()) {
      await prisma.paymentRegistrationEscrowEntity
        .delete({ where: { id: row.id } })
        .catch(() => undefined);
      this.logger.warn(`Escrow expired for order ${razorpayOrderId}`);
      return null;
    }
    const raw = row.answers as unknown;
    if (!Array.isArray(raw)) return null;
    const out: EscrowAnswer[] = [];
    for (const item of raw) {
      if (
        item &&
        typeof item === 'object' &&
        'fieldId' in item &&
        'value' in item &&
        typeof (item as EscrowAnswer).fieldId === 'string' &&
        typeof (item as EscrowAnswer).value === 'string'
      ) {
        out.push({
          fieldId: (item as EscrowAnswer).fieldId,
          value: (item as EscrowAnswer).value,
        });
      }
    }
    return out.length > 0 ? out : null;
  }

  async deleteByRazorpayOrderId(razorpayOrderId: string): Promise<void> {
    await prisma.paymentRegistrationEscrowEntity
      .deleteMany({ where: { razorpayOrderId } })
      .catch(() => undefined);
  }
}
