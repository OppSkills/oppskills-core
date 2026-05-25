export function isInvalidDiscountCodeMessage(message: string): boolean {
  return /invalid discount code/i.test(message);
}
