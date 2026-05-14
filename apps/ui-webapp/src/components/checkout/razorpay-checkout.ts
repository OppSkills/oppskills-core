export type PayMethod = "upi" | "wallet" | "netbanking" | "card";

/** Next `Script` onLoad can miss when checkout.js is cached; poll until Razorpay exists. */
export function waitForRazorpay(maxMs = 12000): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const start = Date.now();
    const id = window.setInterval(() => {
      if (window.Razorpay) {
        window.clearInterval(id);
        resolve(true);
      } else if (Date.now() - start >= maxMs) {
        window.clearInterval(id);
        resolve(false);
      }
    }, 100);
  });
}

export function razorpayMethodBlock(m: PayMethod) {
  switch (m) {
    case "upi":
      return { upi: true, card: false, netbanking: false, wallet: false };
    case "wallet":
      return { wallet: true, card: false, upi: false, netbanking: false };
    case "netbanking":
      return { netbanking: true, card: false, upi: false, wallet: false };
    case "card":
      return { card: true, upi: false, netbanking: false, wallet: false };
    default:
      return { card: true, upi: true, netbanking: true, wallet: true };
  }
}
