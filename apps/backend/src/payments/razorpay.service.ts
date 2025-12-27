import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;
  private readonly baseUrl = 'https://api.razorpay.com';

  constructor(private readonly configService: ConfigService) {
    this.keyId = this.configService.getOrThrow<string>('RAZORPAY_KEY_ID');
    this.keySecret = this.configService.getOrThrow<string>(
      'RAZORPAY_KEY_SECRET',
    );
    this.webhookSecret = this.configService.getOrThrow<string>(
      'RAZORPAY_WEBHOOK_SECRET',
    );
  }

  async createOrder(params: {
    amountPaise: number;
    currency: string;
    receipt: string;
    notes?: Record<string, string>;
    transfers?: Array<{
      account: string;
      amount: number;
      currency?: string;
      notes?: Record<string, string>;
      on_hold?: boolean;
      on_hold_until?: number;
    }>;
  }): Promise<RazorpayOrderResponse> {
    const body: Record<string, unknown> = {
      amount: params.amountPaise,
      currency: params.currency,
      receipt: params.receipt,
      payment_capture: 1,
    };

    if (params.notes) {
      body.notes = params.notes;
    }

    if (params.transfers && params.transfers.length > 0) {
      body.transfers = params.transfers;
    }

    const response = await this.request<RazorpayOrderResponse>(
      'POST',
      '/v1/orders',
      body,
    );

    return response;
  }

  async fetchOrder(orderId: string): Promise<RazorpayOrderResponse> {
    return this.request<RazorpayOrderResponse>('GET', `/v1/orders/${orderId}`);
  }

  verifyCheckoutSignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    const payload = `${params.orderId}|${params.paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(params.signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    );
  }

  verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    const bodyString =
      typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(bodyString)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch {
      return false;
    }
  }

  async createRefund(params: {
    paymentId: string;
    amount?: number;
    notes?: Record<string, string>;
    speed?: 'normal' | 'optimum';
  }): Promise<RazorpayRefundResponse> {
    const body: Record<string, unknown> = {};

    if (params.amount !== undefined) {
      body.amount = params.amount;
    }
    if (params.notes) {
      body.notes = params.notes;
    }
    if (params.speed) {
      body.speed = params.speed;
    }

    return this.request<RazorpayRefundResponse>(
      'POST',
      `/v1/payments/${params.paymentId}/refund`,
      body,
    );
  }

  async fetchRefund(refundId: string): Promise<RazorpayRefundResponse> {
    return this.request<RazorpayRefundResponse>(
      'GET',
      `/v1/refunds/${refundId}`,
    );
  }

  async createLinkedAccount(
    params: CreateLinkedAccountParams,
  ): Promise<RazorpayLinkedAccountResponse> {
    const body = {
      email: params.email,
      phone: params.phone,
      type: 'route',
      legal_business_name: params.legalBusinessName,
      business_type: params.businessType,
      contact_name: params.contactName,
      profile: {
        category: params.profile.category,
        subcategory: params.profile.subcategory,
        addresses: {
          registered: {
            street1: params.profile.address.street1,
            street2: params.profile.address.street2 || '',
            city: params.profile.address.city,
            state: params.profile.address.state,
            postal_code: params.profile.address.postalCode,
            country: params.profile.address.country,
          },
        },
      },
      legal_info: params.legalInfo
        ? {
            pan: params.legalInfo.pan,
            gst: params.legalInfo.gst,
          }
        : undefined,
      reference_id: params.referenceId,
    };

    return this.request<RazorpayLinkedAccountResponse>(
      'POST',
      '/v2/accounts',
      body,
    );
  }

  async fetchLinkedAccount(
    accountId: string,
  ): Promise<RazorpayLinkedAccountResponse> {
    return this.request<RazorpayLinkedAccountResponse>(
      'GET',
      `/v2/accounts/${accountId}`,
    );
  }

  async createStakeholder(
    accountId: string,
    params: CreateStakeholderParams,
  ): Promise<RazorpayStakeholderResponse> {
    const body = {
      name: params.name,
      email: params.email,
      phone: params.phone
        ? {
            primary: params.phone.primary,
            secondary: params.phone.secondary,
          }
        : undefined,
      addresses: params.address
        ? {
            residential: {
              street: params.address.street,
              city: params.address.city,
              state: params.address.state,
              postal_code: params.address.postalCode,
              country: params.address.country,
            },
          }
        : undefined,
      kyc: params.kyc
        ? {
            pan: params.kyc.pan,
          }
        : undefined,
      notes: params.notes,
    };

    return this.request<RazorpayStakeholderResponse>(
      'POST',
      `/v2/accounts/${accountId}/stakeholders`,
      body,
    );
  }

  async requestRouteProduct(
    accountId: string,
    tncAccepted: boolean,
  ): Promise<RazorpayProductConfigResponse> {
    return this.request<RazorpayProductConfigResponse>(
      'POST',
      `/v2/accounts/${accountId}/products`,
      {
        product_name: 'route',
        tnc_accepted: tncAccepted,
      },
    );
  }

  async updateRouteProductSettlements(
    accountId: string,
    productId: string,
    params: UpdateSettlementsParams,
  ): Promise<RazorpayProductConfigResponse> {
    const body = {
      settlements: {
        account_number: params.accountNumber,
        ifsc_code: params.ifscCode,
        beneficiary_name: params.beneficiaryName,
      },
      tnc_accepted: params.tncAccepted ?? true,
    };

    return this.request<RazorpayProductConfigResponse>(
      'PATCH',
      `/v2/accounts/${accountId}/products/${productId}`,
      body,
    );
  }

  async fetchRouteProduct(
    accountId: string,
    productId: string,
  ): Promise<RazorpayProductConfigResponse> {
    return this.request<RazorpayProductConfigResponse>(
      'GET',
      `/v2/accounts/${accountId}/products/${productId}`,
    );
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString(
      'base64',
    );

    const headers: Record<string, string> = {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Razorpay API error: ${response.status} ${response.statusText}`,
          errorBody,
        );
        throw new InternalServerErrorException(
          `Razorpay API error: ${response.status}`,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error('Razorpay API request failed', error);
      throw new InternalServerErrorException('Razorpay API request failed');
    }
  }

  getKeyId(): string {
    return this.keyId;
  }
}

export interface RazorpayOrderResponse {
  id: string;
  entity: 'order';
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: 'created' | 'attempted' | 'paid';
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
  transfers?: Array<{
    id: string;
    entity: 'transfer';
    status: string;
    source: string;
    recipient: string;
    amount: number;
    currency: string;
    amount_reversed: number;
    on_hold: boolean;
    on_hold_until: number | null;
    created_at: number;
  }>;
}

export interface RazorpayRefundResponse {
  id: string;
  entity: 'refund';
  amount: number;
  currency: string;
  payment_id: string;
  notes: Record<string, string>;
  receipt: string | null;
  acquirer_data: {
    arn?: string;
  };
  created_at: number;
  batch_id: string | null;
  status: 'pending' | 'processed' | 'failed';
  speed_processed: 'normal' | 'optimum';
  speed_requested: 'normal' | 'optimum';
}

export interface RazorpayLinkedAccountResponse {
  id: string;
  type: 'route';
  status: 'created' | 'suspended';
  email: string;
  profile: {
    category: string;
    subcategory: string;
    addresses: {
      registered: {
        street1: string;
        street2: string;
        city: string;
        state: string;
        postal_code: number;
        country: string;
      };
    };
  };
  notes: Record<string, string>;
  created_at: number;
  phone: {
    primary: string;
    secondary: string | null;
  };
  business_type: string;
  legal_business_name: string;
  customer_facing_business_name: string | null;
  legal_info: {
    pan: string | null;
    gst: string | null;
  } | null;
}

export interface RazorpayStakeholderResponse {
  entity: 'stakeholder';
  id: string;
  name: string;
  email: string;
  phone: {
    primary: string;
    secondary: string | null;
  };
  addresses: {
    residential: {
      street: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  kyc: {
    pan: string;
  };
  notes: Record<string, string>;
}

export interface RazorpayProductConfigResponse {
  id: string;
  account_id: string;
  product_name: 'route';
  requested_at: number;
  active_configuration: {
    payment_capture: string;
    settlements: {
      account_number: string;
      ifsc_code: string;
      beneficiary_name: string;
    } | null;
  };
  requirements: Array<{
    field_reference: string;
    resolution_url: string;
    status: string;
    reason_code: string;
  }>;
  activation_status:
    | 'requested'
    | 'needs_clarification'
    | 'under_review'
    | 'activated'
    | 'suspended';
}

export interface CreateLinkedAccountParams {
  email: string;
  phone: string;
  legalBusinessName: string;
  businessType: string;
  contactName: string;
  referenceId?: string;
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
}

export interface CreateStakeholderParams {
  name: string;
  email: string;
  phone?: {
    primary: string;
    secondary?: string;
  };
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
  notes?: Record<string, string>;
}

export interface UpdateSettlementsParams {
  accountNumber: string;
  ifscCode: string;
  beneficiaryName: string;
  tncAccepted?: boolean;
}
