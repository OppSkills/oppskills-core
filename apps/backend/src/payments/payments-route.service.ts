import { Injectable, Logger } from '@nestjs/common';
import { prisma, RazorpayRouteStatus } from '@oppskills/db';
import { RazorpayService } from './razorpay.service';

export interface OnboardRouteInput {
  email: string;
  phone: string;
  legalBusinessName: string;
  businessType:
    | 'individual'
    | 'partnership'
    | 'proprietorship'
    | 'private_limited'
    | 'public_limited'
    | 'trust'
    | 'society'
    | 'ngo'
    | 'llp';
  contactName: string;
  profile: {
    category: string;
    subcategory: string;
    address: {
      street1: string;
      street2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  legalInfo?: {
    pan?: string;
    gst?: string;
  };
  stakeholder: {
    name: string;
    email: string;
    phone?: {
      primary: string;
      secondary?: string;
    };
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    kyc: {
      pan: string;
    };
    notes?: Record<string, string>;
  };
  settlements: {
    accountNumber: string;
    ifscCode: string;
    beneficiaryName: string;
  };
}

export interface RouteStatusResult {
  exists: boolean;
  razorpayAccountId: string | null;
  routeProductId: string | null;
  status: RazorpayRouteStatus | null;
  requirements: unknown;
  resolutionUrl: string | null;
}

@Injectable()
export class PaymentsRouteService {
  private readonly logger = new Logger(PaymentsRouteService.name);

  constructor(private readonly razorpay: RazorpayService) {}

  async getRouteStatus(userId: string): Promise<RouteStatusResult> {
    const account = await this.getRouteAccountByUserId(userId);

    if (!account) {
      return {
        exists: false,
        razorpayAccountId: null,
        routeProductId: null,
        status: null,
        requirements: null,
        resolutionUrl: null,
      };
    }

    return {
      exists: true,
      razorpayAccountId: account.razorpayAccountId,
      routeProductId: account.routeProductId,
      status: account.status,
      requirements: account.requirements,
      resolutionUrl: account.resolutionUrl,
    };
  }

  async getRouteAccountByUserId(userId: string) {
    return prisma.razorpayRouteAccountEntity.findUnique({
      where: { userId },
    });
  }

  async onboardOrganizer(
    userId: string,
    input: OnboardRouteInput,
  ): Promise<RouteStatusResult> {
    let account = await prisma.razorpayRouteAccountEntity.findUnique({
      where: { userId },
    });

    let razorpayAccountId: string;
    let routeProductId: string | null = null;

    if (!account) {
      const linkedAccountResponse = await this.razorpay.createLinkedAccount({
        email: input.email,
        phone: input.phone,
        legalBusinessName: input.legalBusinessName,
        businessType: input.businessType,
        contactName: input.contactName,
        profile: input.profile,
        legalInfo: input.legalInfo,
      });

      razorpayAccountId = linkedAccountResponse.id;

      account = await prisma.razorpayRouteAccountEntity.create({
        data: {
          userId,
          razorpayAccountId,
          status: 'CREATED',
        },
      });

      this.logger.log(
        `Created linked account ${razorpayAccountId} for user ${userId}`,
      );
    } else {
      razorpayAccountId = account.razorpayAccountId;
      routeProductId = account.routeProductId;
    }

    try {
      const stakeholderAddress =
        input.stakeholder.address?.street &&
        input.stakeholder.address?.city &&
        input.stakeholder.address?.state &&
        input.stakeholder.address?.postalCode &&
        input.stakeholder.address?.country
          ? {
              street: input.stakeholder.address.street,
              city: input.stakeholder.address.city,
              state: input.stakeholder.address.state,
              postalCode: input.stakeholder.address.postalCode,
              country: input.stakeholder.address.country,
            }
          : undefined;

      await this.razorpay.createStakeholder(razorpayAccountId, {
        name: input.stakeholder.name,
        email: input.stakeholder.email,
        phone: input.stakeholder.phone,
        address: stakeholderAddress,
        kyc: input.stakeholder.kyc,
        notes: input.stakeholder.notes,
      });
      this.logger.log(`Created stakeholder for account ${razorpayAccountId}`);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (
        !errMsg.includes('already exists') &&
        !errMsg.includes('BAD_REQUEST_ERROR')
      ) {
        throw error;
      }
      this.logger.log(
        `Stakeholder already exists for account ${razorpayAccountId}`,
      );
    }

    if (!routeProductId) {
      try {
        const productResponse = await this.razorpay.requestRouteProduct(
          razorpayAccountId,
          true,
        );
        routeProductId = productResponse.id;

        await prisma.razorpayRouteAccountEntity.update({
          where: { userId },
          data: { routeProductId },
        });

        this.logger.log(
          `Requested route product ${routeProductId} for account ${razorpayAccountId}`,
        );
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        if (
          !errMsg.includes('already exists') &&
          !errMsg.includes('BAD_REQUEST_ERROR')
        ) {
          throw error;
        }
        const accounts = await prisma.razorpayRouteAccountEntity.findUnique({
          where: { razorpayAccountId },
          select: { routeProductId: true },
        });
        if (accounts?.routeProductId) {
          routeProductId = accounts.routeProductId;
        }
      }
    }

    if (!routeProductId) {
      return this.getRouteStatus(userId);
    }

    const updateResponse = await this.razorpay.updateRouteProductSettlements(
      razorpayAccountId,
      routeProductId,
      input.settlements,
    );

    const newStatus = this.mapActivationStatus(
      updateResponse.activation_status,
    );
    const requirements = updateResponse.requirements ?? null;

    await prisma.razorpayRouteAccountEntity.update({
      where: { userId },
      data: {
        status: newStatus,
        requirements: requirements as object,
      },
    });

    return this.getRouteStatus(userId);
  }

  async completeOnboarding(
    userId: string,
    razorpayAccountId: string,
    stakeholder: {
      name: string;
      email: string;
      phone?: string;
      address?: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
      };
      kyc?: { pan: string };
    },
    settlements: {
      accountNumber: string;
      ifscCode: string;
      beneficiaryName: string;
    },
  ): Promise<RouteStatusResult> {
    const account = await prisma.razorpayRouteAccountEntity.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new Error('Route account not found');
    }

    try {
      await this.razorpay.createStakeholder(razorpayAccountId, {
        name: stakeholder.name,
        email: stakeholder.email,
        phone: stakeholder.phone ? { primary: stakeholder.phone } : undefined,
        address: stakeholder.address,
        kyc: stakeholder.kyc,
      });
      this.logger.log(`Created stakeholder for account ${razorpayAccountId}`);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (
        !errMsg.includes('already exists') &&
        !errMsg.includes('BAD_REQUEST_ERROR')
      ) {
        throw error;
      }
    }

    let routeProductId = account.routeProductId;

    if (!routeProductId) {
      try {
        const productResponse = await this.razorpay.requestRouteProduct(
          razorpayAccountId,
          true,
        );
        routeProductId = productResponse.id;

        await prisma.razorpayRouteAccountEntity.update({
          where: { userId },
          data: { routeProductId },
        });
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        if (
          !errMsg.includes('already exists') &&
          !errMsg.includes('BAD_REQUEST_ERROR')
        ) {
          throw error;
        }
      }
    }

    if (!routeProductId) {
      return this.getRouteStatus(userId);
    }

    const updateResponse = await this.razorpay.updateRouteProductSettlements(
      razorpayAccountId,
      routeProductId,
      settlements,
    );

    const newStatus = this.mapActivationStatus(
      updateResponse.activation_status,
    );

    await prisma.razorpayRouteAccountEntity.update({
      where: { userId },
      data: {
        status: newStatus,
        requirements: (updateResponse.requirements ?? null) as object,
      },
    });

    return this.getRouteStatus(userId);
  }

  async createFullOnboarding(
    userId: string,
    accountInfo: {
      email: string;
      phone: string;
      legalBusinessName: string;
      businessType: string;
      contactName: string;
      profile: {
        category: string;
        subcategory: string;
        address: {
          street1: string;
          street2?: string;
          city: string;
          state: string;
          postalCode: string;
          country: string;
        };
      };
      legalInfo?: { pan?: string; gst?: string };
    },
    stakeholder: {
      name: string;
      email: string;
      phone?: string;
      address?: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
      };
      kyc?: { pan: string };
    },
    settlements: {
      accountNumber: string;
      ifscCode: string;
      beneficiaryName: string;
    },
  ): Promise<RouteStatusResult> {
    const linkedAccountResponse = await this.razorpay.createLinkedAccount({
      email: accountInfo.email,
      phone: accountInfo.phone,
      legalBusinessName: accountInfo.legalBusinessName,
      businessType: accountInfo.businessType as
        | 'individual'
        | 'partnership'
        | 'proprietorship'
        | 'private_limited'
        | 'public_limited'
        | 'trust'
        | 'society'
        | 'ngo'
        | 'llp',
      contactName: accountInfo.contactName,
      profile: accountInfo.profile,
      legalInfo: accountInfo.legalInfo,
    });

    const razorpayAccountId = linkedAccountResponse.id;

    await prisma.razorpayRouteAccountEntity.create({
      data: {
        userId,
        razorpayAccountId,
        status: 'CREATED',
      },
    });

    this.logger.log(
      `Created linked account ${razorpayAccountId} for user ${userId}`,
    );

    return this.completeOnboarding(
      userId,
      razorpayAccountId,
      stakeholder,
      settlements,
    );
  }

  async refreshProductStatus(
    userId: string,
    razorpayAccountId: string,
    routeProductId: string,
  ): Promise<RouteStatusResult> {
    const productConfig = await this.razorpay.fetchRouteProduct(
      razorpayAccountId,
      routeProductId,
    );

    const newStatus = this.mapActivationStatus(productConfig.activation_status);

    await prisma.razorpayRouteAccountEntity.update({
      where: { userId },
      data: {
        status: newStatus,
        requirements: (productConfig.requirements ?? null) as object,
      },
    });

    return this.getRouteStatus(userId);
  }

  async updateSettlements(
    userId: string,
    razorpayAccountId: string,
    routeProductId: string,
    settlements: {
      accountNumber: string;
      ifscCode: string;
      beneficiaryName: string;
    },
  ): Promise<RouteStatusResult> {
    const updateResponse = await this.razorpay.updateRouteProductSettlements(
      razorpayAccountId,
      routeProductId,
      settlements,
    );

    const newStatus = this.mapActivationStatus(
      updateResponse.activation_status,
    );

    await prisma.razorpayRouteAccountEntity.update({
      where: { userId },
      data: {
        status: newStatus,
        requirements: (updateResponse.requirements ?? null) as object,
      },
    });

    return this.getRouteStatus(userId);
  }

  async isOrganizerActivated(userId: string): Promise<boolean> {
    const account = await prisma.razorpayRouteAccountEntity.findUnique({
      where: { userId },
      select: { status: true },
    });

    return account?.status === 'ACTIVATED';
  }

  async getOrganizerAccountId(userId: string): Promise<string | null> {
    const account = await prisma.razorpayRouteAccountEntity.findUnique({
      where: { userId },
      select: { razorpayAccountId: true, status: true },
    });

    if (!account || account.status !== 'ACTIVATED') {
      return null;
    }

    return account.razorpayAccountId;
  }

  async updateStatusFromWebhook(
    razorpayAccountId: string,
    status: RazorpayRouteStatus,
    requirements?: unknown,
    resolutionUrl?: string,
  ): Promise<void> {
    await prisma.razorpayRouteAccountEntity.update({
      where: { razorpayAccountId },
      data: {
        status,
        requirements: requirements as object,
        resolutionUrl: resolutionUrl ?? null,
      },
    });
  }

  private mapActivationStatus(activationStatus?: string): RazorpayRouteStatus {
    if (!activationStatus) return 'UNDER_REVIEW';
    switch (activationStatus) {
      case 'activated':
        return 'ACTIVATED';
      case 'needs_clarification':
        return 'NEEDS_CLARIFICATION';
      case 'under_review':
        return 'UNDER_REVIEW';
      case 'suspended':
        return 'SUSPENDED';
      default:
        return 'UNDER_REVIEW';
    }
  }
}
