import { Decimal } from '@prisma/client/runtime/library';

const RAZORPAY_PERCENT = 2;
const GST_ON_RAZORPAY_FEE_PERCENT = 18;

/**
 * Razorpay-style fee: 2% of the base amount plus 18% GST on that fee.
 * This is payment-gateway cost, not an OppSkills platform cut.
 */
export function computeRazorpayGatewayFee(baseAmount: Decimal): Decimal {
  if (baseAmount.lessThanOrEqualTo(0)) {
    return new Decimal(0);
  }
  const fee = baseAmount
    .times(RAZORPAY_PERCENT)
    .dividedBy(100)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const gstOnFee = fee
    .times(GST_ON_RAZORPAY_FEE_PERCENT)
    .dividedBy(100)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  return fee.plus(gstOnFee);
}
