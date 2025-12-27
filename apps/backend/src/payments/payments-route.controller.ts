import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { PaymentsRouteService } from './payments-route.service';

interface OnboardRouteDto {
  email: string;
  phone: string;
  legalBusinessName: string;
  businessType:
    | 'individual'
    | 'partnership'
    | 'private_limited'
    | 'public_limited'
    | 'llp'
    | 'ngo'
    | 'trust'
    | 'society'
    | 'not_yet_registered';
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
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    kyc?: {
      pan: string;
    };
  };
  settlements: {
    accountNumber: string;
    ifscCode: string;
    beneficiaryName: string;
  };
}

interface UpdateSettlementsDto {
  accountNumber: string;
  ifscCode: string;
  beneficiaryName: string;
}

@Controller('payments/route')
@UseGuards(ClerkAuthGuard)
export class PaymentsRouteController {
  constructor(private readonly paymentsRouteService: PaymentsRouteService) {}

  @Post('onboard')
  async onboardOrganizer(
    @Req() req: { user: { id: string } },
    @Body() dto: OnboardRouteDto,
  ) {
    const userId = req.user.id;

    const existing =
      await this.paymentsRouteService.getRouteAccountByUserId(userId);

    if (existing && existing.status === 'ACTIVATED') {
      return {
        success: true,
        status: existing.status,
        razorpayAccountId: existing.razorpayAccountId,
        message: 'Account already activated',
      };
    }

    if (existing) {
      const result = await this.paymentsRouteService.completeOnboarding(
        userId,
        existing.razorpayAccountId,
        dto.stakeholder,
        dto.settlements,
      );
      return result;
    }

    const result = await this.paymentsRouteService.createFullOnboarding(
      userId,
      {
        email: dto.email,
        phone: dto.phone,
        legalBusinessName: dto.legalBusinessName,
        businessType: dto.businessType,
        contactName: dto.contactName,
        profile: dto.profile,
        legalInfo: dto.legalInfo,
      },
      dto.stakeholder,
      dto.settlements,
    );

    return result;
  }

  @Get('status')
  async getRouteStatus(@Req() req: { user: { id: string } }) {
    const userId = req.user.id;
    const account =
      await this.paymentsRouteService.getRouteAccountByUserId(userId);

    if (!account) {
      return {
        onboarded: false,
        status: null,
        razorpayAccountId: null,
        requirements: null,
        resolutionUrl: null,
      };
    }

    return {
      onboarded: true,
      status: account.status,
      razorpayAccountId: account.razorpayAccountId,
      routeProductId: account.routeProductId,
      requirements: account.requirements,
      resolutionUrl: account.resolutionUrl,
    };
  }

  @Post('refresh-status')
  async refreshRouteStatus(@Req() req: { user: { id: string } }) {
    const userId = req.user.id;
    const account =
      await this.paymentsRouteService.getRouteAccountByUserId(userId);

    if (!account || !account.routeProductId) {
      throw new BadRequestException('No Route product found for this user');
    }

    const result = await this.paymentsRouteService.refreshProductStatus(
      userId,
      account.razorpayAccountId,
      account.routeProductId,
    );

    return result;
  }

  @Post('update-settlements')
  async updateSettlements(
    @Req() req: { user: { id: string } },
    @Body() dto: UpdateSettlementsDto,
  ) {
    const userId = req.user.id;
    const account =
      await this.paymentsRouteService.getRouteAccountByUserId(userId);

    if (!account || !account.routeProductId) {
      throw new BadRequestException(
        'No Route product found. Please complete onboarding first.',
      );
    }

    const result = await this.paymentsRouteService.updateSettlements(
      userId,
      account.razorpayAccountId,
      account.routeProductId,
      dto,
    );

    return result;
  }
}
