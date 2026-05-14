"use client";

import Image from "next/image";
import { useState } from "react";

/** Hosted checkout artwork (Unstop / Razorpay-style strips). */
export const CHECKOUT_UPI_STRIP_URL =
  "https://d8it4huxumps7.cloudfront.net/uploads/images/651e4755aa19f_frame_1000010991.png";
export const CHECKOUT_WALLET_STRIP_URL =
  "https://d8it4huxumps7.cloudfront.net/uploads/images/651e4913767c4_frame_1000010991_1.png";
export const CHECKOUT_BANK_BADGES_URL =
  "https://d8it4huxumps7.cloudfront.net/uploads/images/652510cdd7e00_frame_1000010976.png";
export const CHECKOUT_RAZORPAY_BADGE_URL =
  "https://d8it4huxumps7.cloudfront.net/uploads/images/652510f61522e_frame_1000010982.png";

/** simple-icons slug @ v11 on jsDelivr CDN */
const si = (slug: string) =>
  `https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${slug}.svg`;

export function PaymentLogo({ slug, label }: { slug: string; label: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return (
      <span
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded bg-neutral-100 border border-neutral-200 text-[10px] font-bold text-neutral-500"
        title={label}
      >
        ?
      </span>
    );
  }
  return (
    <span className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white border border-neutral-200 overflow-hidden">
      <Image
        src={si(slug)}
        alt=""
        width={20}
        height={20}
        className="object-contain opacity-90"
        unoptimized
        onError={() => setOk(false)}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function UpiLogoRow() {
  return (
    <div className="flex h-8 w-full max-w-[220px] items-center justify-end sm:max-w-[260px]">
      <Image
        src={CHECKOUT_UPI_STRIP_URL}
        alt=""
        width={280}
        height={44}
        className="h-8 w-auto max-h-8 max-w-full object-contain object-right"
        unoptimized
      />
    </div>
  );
}

export function WalletLogoRow() {
  return (
    <div className="flex h-8 w-full max-w-[220px] items-center justify-end sm:max-w-[260px]">
      <Image
        src={CHECKOUT_WALLET_STRIP_URL}
        alt=""
        width={280}
        height={44}
        className="h-8 w-auto max-h-8 max-w-full object-contain object-right"
        unoptimized
      />
    </div>
  );
}

export function CardLogoRow() {
  const brands = [
    { slug: "visa", label: "Visa" },
    { slug: "mastercard", label: "Mastercard" },
    { slug: "rupay", label: "RuPay" },
  ];
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {brands.map((b) => (
        <PaymentLogo key={b.slug} slug={b.slug} label={b.label} />
      ))}
    </div>
  );
}

export function CheckoutTrustFooter() {
  return (
    <div className="flex flex-col items-stretch gap-3 pt-2 border-t border-neutral-100">
      <div className="relative w-full flex justify-center">
        <Image
          src={CHECKOUT_BANK_BADGES_URL}
          alt="Accepted cards and banks"
          width={360}
          height={48}
          className="h-auto w-full max-w-[320px] object-contain"
          unoptimized
        />
      </div>
      <div className="relative w-full flex justify-center">
        <Image
          src={CHECKOUT_RAZORPAY_BADGE_URL}
          alt="Secured by Razorpay"
          width={200}
          height={40}
          className="h-8 w-auto object-contain"
          unoptimized
        />
      </div>
    </div>
  );
}
