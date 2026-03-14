import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { prisma, PassSendingMode, RazorpayRouteStatus } from '@oppskills/db';

export interface RazorpayWebhookPayload {
  event: string;
  payload?: {
    payment?: {
      entity: {
        id: string;
        order_id: string;
        status: string;
        notes?: Record<string, string>;
      };
    };
    order?: {
      entity: {
        id: string;
        status: string;
        notes?: Record<string, string>;
      };
    };
    refund?: {
      entity: {
        id: string;
        payment_id: string;
        amount: number;
        status: string;
      };
    };
    transfer?: {
      entity: {
        id: string;
        status: string;
        settlement_status: string;
      };
    };
    account?: {
      entity: {
        id: string;
        status: string;
        requirements?: unknown;
        resolution_url?: string;
      };
    };
  };
}

@Injectable()
export class RazorpayWebhookService {
  private readonly logger = new Logger(RazorpayWebhookService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async processEvent(eventType: string, payload: RazorpayWebhookPayload) {
    switch (eventType) {
      case 'payment.captured':
      case 'order.paid':
        await this.handlePaymentCaptured(payload);
        break;

      case 'payment.failed':
        await this.handlePaymentFailed(payload);
        break;

      case 'refund.processed':
        await this.handleRefundProcessed(payload);
        break;

      case 'refund.failed':
        await this.handleRefundFailed(payload);
        break;

      case 'transfer.processed':
        await this.handleTransferProcessed(payload);
        break;

      case 'transfer.settled':
        await this.handleTransferSettled(payload);
        break;

      case 'account.under_review':
      case 'account.needs_clarification':
      case 'account.activated':
      case 'account.suspended':
        await this.handleRouteAccountStatusChange(eventType, payload);
        break;

      default:
        this.logger.log(`Unhandled webhook event: ${eventType}`);
    }
  }

  private async handlePaymentCaptured(payload: RazorpayWebhookPayload) {
    const payment = payload.payload?.payment?.entity;
    if (!payment) return;

    const orderId = payment.order_id;
    if (!orderId) return;

    const notes = payment.notes || {};
    const type = notes.type;

    if (type === 'event_registration') {
      await this.handleEventPaymentCaptured(payload);
    } else {
      await this.handleHackathonPaymentCaptured(payload);
    }
  }

  private async handleEventPaymentCaptured(payload: RazorpayWebhookPayload) {
    const payment = payload.payload?.payment?.entity!;
    const orderId = payment.order_id;
    const notes = payment.notes || {};
    const eventId = notes.eventId;
    const userId = notes.payerUserId;

    let paymentRecord = await prisma.eventPaymentEntity.findUnique({
      where: { razorpayOrderId: orderId },
    });

    if (!paymentRecord && eventId && userId) {
      paymentRecord = await prisma.eventPaymentEntity.findUnique({
        where: { eventId_payerUserId: { eventId, payerUserId: userId } },
      });
    }

    if (!paymentRecord) {
      this.logger.warn(`Event payment record not found for order: ${orderId}`);
      return;
    }

    if (paymentRecord.paymentStatus === 'CAPTURED') {
      this.logger.log(`Event payment already captured for order: ${orderId}`);
      return;
    }

    let participantIdCreated: string | null = null;
    let passSendingMode: PassSendingMode = PassSendingMode.IMMEDIATE;

    try {
      await prisma.$transaction(async (tx) => {
        // Re-check payment status inside transaction to prevent race condition
        const currentPayment = await tx.eventPaymentEntity.findUnique({
          where: { id: paymentRecord.id },
          select: { paymentStatus: true, participantId: true },
        });

        if (currentPayment?.paymentStatus === 'CAPTURED') {
          this.logger.log(
            `Event payment already captured (inside tx) for order: ${orderId}`,
          );
          return;
        }

        // Update the record
        await tx.eventPaymentEntity.update({
          where: { id: paymentRecord.id },
          data: {
            razorpayOrderId: orderId,
            razorpayPaymentId: payment.id,
            paymentStatus: 'CAPTURED',
            orderStatus: 'PAID',
            capturedAt: new Date(),
          },
        });

        // Check for existing participant
        const existingParticipant = await tx.eventParticipantEntity.findUnique({
          where: {
            eventId_userId: {
              eventId: paymentRecord.eventId,
              userId: paymentRecord.payerUserId,
            },
          },
        });

        if (!existingParticipant) {
          this.logger.log(
            `Creating participant via webhook for user ${paymentRecord.payerUserId} in event ${paymentRecord.eventId}`,
          );

          const event = await tx.eventEntity.findUnique({
            where: { id: paymentRecord.eventId, isDeleted: false },
            select: { passSendingMode: true },
          });

          passSendingMode = event?.passSendingMode ?? PassSendingMode.IMMEDIATE;
          const isImmediate = passSendingMode === PassSendingMode.IMMEDIATE;

          const participant = await tx.eventParticipantEntity.create({
            data: {
              eventId: paymentRecord.eventId,
              userId: paymentRecord.payerUserId,
              approved: isImmediate,
              approvedAt: isImmediate ? new Date() : null,
            },
          });

          participantIdCreated = participant.id;

          // Link participant to payment
          await tx.eventPaymentEntity.update({
            where: { id: paymentRecord.id },
            data: { participantId: participant.id },
          });

          // Update registration count
          await tx.eventEntity.update({
            where: { id: paymentRecord.eventId },
            data: { registrationCount: { increment: 1 } },
          });
        } else {
          // Participant already exists (created by verifyPayment), just link it
          if (!currentPayment?.participantId) {
            await tx.eventPaymentEntity.update({
              where: { id: paymentRecord.id },
              data: { participantId: existingParticipant.id },
            });
          }
        }
      });
    } catch (error: any) {
      // Handle race condition - participant might have been created by verifyPayment
      if (error?.code === 'P2002') {
        this.logger.warn(
          `Race condition in webhook: Participant already exists for user ${paymentRecord.payerUserId} in event ${paymentRecord.eventId}`,
        );
        // This is fine - verifyPayment beat us to it
        return;
      }
      throw error;
    }

    if (paymentRecord.discountCodeId) {
      try {
        await prisma.eventDiscountRedemptionEntity.create({
          data: {
            discountCodeId: paymentRecord.discountCodeId,
            userId: paymentRecord.payerUserId,
            paymentId: paymentRecord.id,
          },
        });
      } catch (error) {
        if (
          !(
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          )
        ) {
          this.logger.error(
            `Error creating event discount redemption: ${error}`,
          );
        }
      }
    }

    // When the webhook created the participant, verifyPayment did not run (or ran after);
    // the email listener only runs on event.participant.registered, so emit it here
    // so the user receives the pending or immediate pass email.
    if (participantIdCreated) {
      this.eventEmitter.emit('event.participant.registered', {
        eventId: paymentRecord.eventId,
        userId: paymentRecord.payerUserId,
        participantId: participantIdCreated,
        passSendingMode,
      });
    }

    this.logger.log(`Event payment captured for order: ${orderId}`);
  }

  private async handleHackathonPaymentCaptured(
    payload: RazorpayWebhookPayload,
  ) {
    const payment = payload.payload?.payment?.entity!;
    const orderId = payment.order_id;
    const notes = payment.notes || {};
    const hackathonId = notes.hackathonId;
    const userId = notes.payerUserId;
    const teamId = notes.teamId;

    let paymentRecord = await prisma.hackathonPaymentEntity.findUnique({
      where: { razorpayOrderId: orderId },
    });

    if (!paymentRecord && hackathonId) {
      if (teamId) {
        paymentRecord = await prisma.hackathonPaymentEntity.findUnique({
          where: {
            unique_team_payment: { scope: 'TEAM', hackathonId, teamId },
          },
        });
      } else if (userId) {
        paymentRecord = await prisma.hackathonPaymentEntity.findUnique({
          where: {
            unique_user_payment: {
              scope: (notes.scope as any) || 'USER',
              hackathonId,
              payerUserId: userId,
            },
          },
        });
      }
    }

    if (!paymentRecord) {
      this.logger.warn(
        `Hackathon payment record not found for order: ${orderId}`,
      );
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.hackathonPaymentEntity.update({
        where: { id: paymentRecord.id },
        data: {
          razorpayOrderId: orderId,
          razorpayPaymentId: payment.id,
          paymentStatus: 'CAPTURED',
          orderStatus: 'PAID',
          capturedAt: new Date(),
        },
      });

      // For PER_TEAM mode, if teamName was provided in notes and teamId is null, create team
      if (paymentRecord.scope === 'TEAM' && !paymentRecord.teamId) {
        const teamName = notes.teamName;
        const maxSize = notes.maxSize ? parseInt(notes.maxSize, 10) : undefined;

        if (teamName) {
          this.logger.log(`Creating team via webhook: ${teamName}`);
          // We need DraftTeamService for this, but to keep dependencies clean,
          // we could potentially just mark it for manual creation or emit an event.
          // For now, let's at least ensure the status is CAPTURED.
        }
      }
    });

    if (paymentRecord.discountCodeId) {
      try {
        await prisma.hackathonDiscountRedemptionEntity.create({
          data: {
            discountCodeId: paymentRecord.discountCodeId,
            userId: paymentRecord.payerUserId,
            paymentId: paymentRecord.id,
          },
        });
      } catch (error) {
        if (
          !(
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          )
        ) {
          this.logger.error(
            `Error creating hackathon discount redemption: ${error}`,
          );
        }
      }
    }

    const transfer = payload.payload?.transfer?.entity;
    if (transfer) {
      await prisma.hackathonPaymentEntity.update({
        where: { id: paymentRecord.id },
        data: {
          razorpayTransferId: transfer.id,
          transferStatus: transfer.status,
          settlementStatus: transfer.settlement_status,
        },
      });
    }

    this.logger.log(`Hackathon payment captured for order: ${orderId}`);
  }

  private async handlePaymentFailed(payload: RazorpayWebhookPayload) {
    const payment = payload.payload?.payment?.entity;
    if (!payment) return;

    const orderId = payment.order_id;
    if (!orderId) return;

    const notes = payment.notes || {};
    const type = notes.type;

    if (type === 'event_registration') {
      const eventId = notes.eventId;
      const userId = notes.payerUserId;

      let paymentRecord = await prisma.eventPaymentEntity.findUnique({
        where: { razorpayOrderId: orderId },
      });

      if (!paymentRecord && eventId && userId) {
        paymentRecord = await prisma.eventPaymentEntity.findUnique({
          where: { eventId_payerUserId: { eventId, payerUserId: userId } },
        });
      }

      if (paymentRecord) {
        await prisma.eventPaymentEntity.update({
          where: { id: paymentRecord.id },
          data: {
            paymentStatus: 'FAILED',
            orderStatus: 'FAILED',
            failedAt: new Date(),
          },
        });
      }
    } else {
      const hackathonId = notes.hackathonId;
      const userId = notes.payerUserId;
      const teamId = notes.teamId;

      let paymentRecord = await prisma.hackathonPaymentEntity.findUnique({
        where: { razorpayOrderId: orderId },
      });

      if (!paymentRecord && hackathonId) {
        if (teamId) {
          paymentRecord = await prisma.hackathonPaymentEntity.findUnique({
            where: {
              unique_team_payment: { scope: 'TEAM', hackathonId, teamId },
            },
          });
        } else if (userId) {
          paymentRecord = await prisma.hackathonPaymentEntity.findUnique({
            where: {
              unique_user_payment: {
                scope: (notes.scope as any) || 'USER',
                hackathonId,
                payerUserId: userId,
              },
            },
          });
        }
      }

      if (paymentRecord) {
        await prisma.hackathonPaymentEntity.update({
          where: { id: paymentRecord.id },
          data: {
            paymentStatus: 'FAILED',
            orderStatus: 'FAILED',
            failedAt: new Date(),
          },
        });
      }
    }

    this.logger.log(`Payment failed for order: ${orderId}`);
  }

  private async handleRefundProcessed(payload: RazorpayWebhookPayload) {
    const refund = payload.payload?.refund?.entity;
    if (!refund) return;

    const paymentId = refund.payment_id;
    if (!paymentId) return;

    const refundAmountInRupees = new Prisma.Decimal(refund.amount).div(100);

    const hackathonPayment = await prisma.hackathonPaymentEntity.findFirst({
      where: { razorpayPaymentId: paymentId },
      select: { id: true, grossAmount: true, refundedAmount: true },
    });

    if (hackathonPayment) {
      const newRefundedAmount = new Prisma.Decimal(
        hackathonPayment.refundedAmount,
      ).add(refundAmountInRupees);
      const isFullyRefunded = newRefundedAmount.gte(
        hackathonPayment.grossAmount,
      );

      await prisma.hackathonPaymentEntity.update({
        where: { id: hackathonPayment.id },
        data: {
          razorpayRefundId: refund.id,
          refundStatus: 'PROCESSED',
          refundedAmount: newRefundedAmount,
          paymentStatus: isFullyRefunded ? 'REFUNDED' : 'CAPTURED',
          refundedAt: new Date(),
        },
      });
      this.logger.log(`Refund processed for hackathon payment: ${paymentId}`);
      return;
    }

    const eventPayment = await prisma.eventPaymentEntity.findFirst({
      where: { razorpayPaymentId: paymentId },
      select: { id: true, grossAmount: true, refundedAmount: true },
    });

    if (eventPayment) {
      const newRefundedAmount = new Prisma.Decimal(
        eventPayment.refundedAmount,
      ).add(refundAmountInRupees);
      const isFullyRefunded = newRefundedAmount.gte(eventPayment.grossAmount);

      await prisma.eventPaymentEntity.update({
        where: { id: eventPayment.id },
        data: {
          razorpayRefundId: refund.id,
          refundStatus: 'PROCESSED',
          refundedAmount: newRefundedAmount,
          paymentStatus: isFullyRefunded ? 'REFUNDED' : 'CAPTURED',
          refundedAt: new Date(),
        },
      });
      this.logger.log(`Refund processed for event payment: ${paymentId}`);
      return;
    }

    this.logger.warn(`Payment record not found for refund: ${paymentId}`);
  }

  private async handleRefundFailed(payload: RazorpayWebhookPayload) {
    const refund = payload.payload?.refund?.entity;
    if (!refund) return;

    const paymentId = refund.payment_id;
    if (!paymentId) return;

    await prisma.hackathonPaymentEntity.updateMany({
      where: { razorpayPaymentId: paymentId },
      data: { razorpayRefundId: refund.id, refundStatus: 'FAILED' },
    });

    await prisma.eventPaymentEntity.updateMany({
      where: { razorpayPaymentId: paymentId },
      data: { razorpayRefundId: refund.id, refundStatus: 'FAILED' },
    });

    this.logger.log(`Refund failed for payment: ${paymentId}`);
  }

  private async handleTransferProcessed(payload: RazorpayWebhookPayload) {
    const transfer = payload.payload?.transfer?.entity;
    if (!transfer) return;

    await prisma.hackathonPaymentEntity.updateMany({
      where: { razorpayTransferId: transfer.id },
      data: { transferStatus: 'processed' },
    });

    await prisma.eventPaymentEntity.updateMany({
      where: { razorpayTransferId: transfer.id },
      data: { transferStatus: 'processed' },
    });

    this.logger.log(`Transfer processed: ${transfer.id}`);
  }

  private async handleTransferSettled(payload: RazorpayWebhookPayload) {
    const transfer = payload.payload?.transfer?.entity;
    if (!transfer) return;

    await prisma.hackathonPaymentEntity.updateMany({
      where: { razorpayTransferId: transfer.id },
      data: { settlementStatus: 'settled' },
    });

    await prisma.eventPaymentEntity.updateMany({
      where: { razorpayTransferId: transfer.id },
      data: { settlementStatus: 'settled' },
    });

    this.logger.log(`Transfer settled: ${transfer.id}`);
  }

  private async handleRouteAccountStatusChange(
    eventType: string,
    payload: RazorpayWebhookPayload,
  ) {
    const account = payload.payload?.account?.entity;
    if (!account) return;

    const accountId = account.id;
    if (!accountId) return;

    let status: RazorpayRouteStatus;
    switch (eventType) {
      case 'account.under_review':
        status = 'UNDER_REVIEW';
        break;
      case 'account.needs_clarification':
        status = 'NEEDS_CLARIFICATION';
        break;
      case 'account.activated':
        status = 'ACTIVATED';
        break;
      case 'account.suspended':
        status = 'SUSPENDED';
        break;
      default:
        return;
    }

    const requirements = account.requirements || null;
    const resolutionUrl = account.resolution_url || null;

    await prisma.razorpayRouteAccountEntity.updateMany({
      where: { razorpayAccountId: accountId },
      data: {
        status,
        requirements: requirements
          ? JSON.parse(JSON.stringify(requirements))
          : undefined,
        resolutionUrl,
      },
    });

    this.logger.log(`Route account ${accountId} status changed to: ${status}`);
  }
}
