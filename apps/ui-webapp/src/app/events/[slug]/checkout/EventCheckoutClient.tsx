"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { Landmark, Loader2, Percent, Ticket } from "lucide-react";
import { toast } from "sonner";
import {
  checkMyRegistration,
  createEventPaymentOrder,
  getPublicEventBySlug,
  verifyEventPayment,
} from "@/lib/api/eventApi";
import { clearPendingEventRegistration } from "@/lib/registration/pendingHackathonRegistration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, ensureAbsoluteUrl, getApiErrorMessage } from "@/lib/utils";
import { withRetry } from "@/lib/utils/retry";
import { SITE_URL } from "@/lib/constants";
import Image from "next/image";
import {
  CardLogoRow,
  CheckoutTrustFooter,
  UpiLogoRow,
  WalletLogoRow,
} from "@/components/checkout/PaymentMethodLogos";
import { isInvalidDiscountCodeMessage } from "@/components/checkout/coupon";
import {
  type PayMethod,
  razorpayMethodBlock,
  waitForRazorpay,
} from "@/components/checkout/razorpay-checkout";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function EventCheckoutClient({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tierFromUrl = searchParams.get("tier") ?? undefined;
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();

  const [eventTitle, setEventTitle] = useState("");
  const [eventSubtitle, setEventSubtitle] = useState("");
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [tierLabel, setTierLabel] = useState("Participation fee");
  const [tierHint, setTierHint] = useState<string | null>(null);
  const [feeBearer, setFeeBearer] = useState<"ORGANISER" | "PARTICIPANT">(
    "ORGANISER",
  );
  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<string | undefined>(
    undefined,
  );
  const [order, setOrder] = useState<any>(null);
  const [orderLoading, setOrderLoading] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "processing">("idle");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PayMethod | null>(null);
  const [payFlowActive, setPayFlowActive] = useState(false);
  const verifyingRef = useRef(false);
  const prevOrderIdRef = useRef<string | null>(null);

  const returnUrl = useMemo(() => {
    const base = `${SITE_URL}/events/${encodeURIComponent(slug)}/checkout`;
    const q = new URLSearchParams();
    if (tierFromUrl) q.set("tier", tierFromUrl);
    q.set("razorpay_return", "1");
    return `${base}?${q.toString()}`;
  }, [slug, tierFromUrl]);

  const loadOrder = useCallback(async () => {
    setOrderLoading(true);
    setOrderError(null);
    setCouponError(null);
    try {
      const token = await getToken();
      if (!token) {
        setOrderError("Please sign in to continue.");
        return;
      }

      const pub = (await getPublicEventBySlug(slug)) as Record<string, any>;
      if (!pub?.id) {
        setOrderError("Event not found.");
        return;
      }

      setEventTitle(pub.name || "Event");
      const org =
        pub.organizationName ||
        pub.organization_name ||
        [pub.owner?.firstName, pub.owner?.lastName].filter(Boolean).join(" ") ||
        pub.locationCoords ||
        "";
      setEventSubtitle(org || "Event registration");
      if (pub.bannerImageUrl) {
        setBannerUrl(ensureAbsoluteUrl(String(pub.bannerImageUrl)));
      }

      if (tierFromUrl && Array.isArray(pub.ticketTiers)) {
        const t = pub.ticketTiers.find(
          (x: { id: string }) => x.id === tierFromUrl,
        );
        if (t) {
          setTierLabel(t.name || "Ticket");
          setTierHint(
            typeof t.description === "string" && t.description.trim()
              ? t.description.trim()
              : null,
          );
        }
      }

      if (pub.feeBearer === "PARTICIPANT" || pub.feeBearer === "ORGANISER") {
        setFeeBearer(pub.feeBearer);
      }

      const reg = await checkMyRegistration(token, pub.id);
      if (!reg.awaitingCheckout) {
        router.replace(`/events/${slug}`);
        toast.info("Nothing to pay here — back to the event page.");
        return;
      }

      const o = await createEventPaymentOrder(token, slug, {
        discountCode: appliedDiscount,
        ticketTierId: tierFromUrl,
      });
      if (o.zeroAmountPayment || o.amountPaise === 0) {
        toast.success("No payment required. Returning to the event.");
        router.replace(`/events/${slug}`);
        return;
      }
      setOrder(o);
    } catch (e) {
      const msg = getApiErrorMessage(e, "Could not load checkout.");
      if (appliedDiscount && isInvalidDiscountCodeMessage(msg)) {
        setCouponError(msg);
        try {
          const token = await getToken();
          if (token) {
            const o = await createEventPaymentOrder(token, slug, {
              ticketTierId: tierFromUrl,
            });
            if (!(o.zeroAmountPayment || o.amountPaise === 0)) {
              setOrder(o);
            }
          }
        } catch {
          /* keep previous order if baseline refresh fails */
        }
      } else {
        setOrderError(msg);
      }
    } finally {
      setOrderLoading(false);
    }
  }, [getToken, slug, appliedDiscount, tierFromUrl, router]);

  useEffect(() => {
    const id =
      order?.razorpayOrderId != null
        ? String(order.razorpayOrderId)
        : order?.orderId != null
          ? String(order.orderId)
          : null;
    if (!id) return;
    if (prevOrderIdRef.current !== null && prevOrderIdRef.current !== id) {
      setSelectedMethod(null);
    }
    prevOrderIdRef.current = id;
  }, [order]);

  useEffect(() => {
    if (!isSignedIn) {
      router.replace(`/events/${slug}`);
      return;
    }
    void loadOrder();
  }, [isSignedIn, loadOrder, router, slug]);

  const completeVerify = useCallback(
    async (
      razorpayOrderId: string,
      razorpayPaymentId: string,
      razorpaySignature: string,
    ) => {
      verifyingRef.current = true;
      setPhase("processing");
      setCheckoutError(null);
      try {
        const token = await getToken();
        if (!token) throw new Error("Authentication required.");
        await withRetry(() =>
          verifyEventPayment(token, slug, {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
          }),
        );
        toast.success("Payment confirmed — you are registered!");
        clearPendingEventRegistration(slug);
        router.replace(`/events/${encodeURIComponent(slug)}?registered=true`);
      } catch (e) {
        setCheckoutError(
          getApiErrorMessage(
            e,
            "Payment could not be verified. If you were charged, contact support with your payment id.",
          ),
        );
      } finally {
        verifyingRef.current = false;
        setPhase("idle");
        setPayFlowActive(false);
      }
    },
    [getToken, router, slug],
  );

  useEffect(() => {
    const rp = searchParams.get("razorpay_payment_id");
    const ro = searchParams.get("razorpay_order_id");
    const rs = searchParams.get("razorpay_signature");
    if (rp && ro && rs) {
      void completeVerify(ro, rp, rs);
    }
  }, [searchParams, completeVerify]);

  const openRazorpay = async (method: PayMethod) => {
    if (!order || order.amountPaise === 0 || order.zeroAmountPayment) {
      toast.error("Nothing to pay — return to the event page.");
      setPayFlowActive(false);
      return;
    }
    const ready = await waitForRazorpay();
    if (!ready) {
      toast.error(
        "Secure checkout script did not load. Refresh the page or check your network, then try again.",
      );
      setPayFlowActive(false);
      return;
    }
    setCheckoutError(null);
    const methodBlock = razorpayMethodBlock(method);

    const options = {
      key: order.razorpayKey || order.keyId,
      amount: order.amountPaise,
      currency: order.currency,
      name: eventTitle,
      description: "Event registration",
      order_id: order.razorpayOrderId || order.orderId,
      callback_url: returnUrl,
      method: methodBlock,
      handler: async (response: any) => {
        await completeVerify(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature,
        );
      },
      prefill: {
        name: user?.fullName || "",
        email: user?.primaryEmailAddress?.emailAddress || "",
        contact: user?.primaryPhoneNumber?.phoneNumber || "",
      },
      theme: { color: "#7c3aed" },
      modal: {
        ondismiss: () => {
          queueMicrotask(() => {
            if (!verifyingRef.current) {
              setPayFlowActive(false);
              toast.message("Payment window closed");
            }
          });
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setPayFlowActive(false);
      toast.error("Could not open Razorpay. Try another method.");
    }
  };

  const methodPickDisabled =
    orderLoading || !order || phase === "processing" || payFlowActive;
  const payBusy = payFlowActive || phase === "processing";

  const original = Number(order?.originalAmount ?? 0);
  const discount =
    order?.discountAmount != null ? Number(order.discountAmount) : 0;
  const afterDiscount = Number(order?.finalAmount ?? 0);
  const proc =
    order?.processingFeeAmount != null ? Number(order.processingFeeAmount) : 0;
  const totalCharged = order?.amountPaise != null ? order.amountPaise / 100 : 0;

  /** Razorpay-style split for display when participant pays gateway (2% + 18% GST on fee). */
  const gatewaySplit =
    feeBearer === "PARTICIPANT" && proc > 0
      ? (() => {
          const service = proc / 1.18;
          const gst = proc - service;
          return { service, gst };
        })()
      : null;

  const payRow = (
    method: PayMethod,
    title: string,
    subtitle: ReactNode,
    disabled: boolean,
  ) => (
    <button
      type="button"
      disabled={disabled}
      role="radio"
      aria-checked={selectedMethod === method}
      aria-label={`${title}${selectedMethod === method ? ", selected" : ""}`}
      onClick={() => {
        if (disabled) return;
        setSelectedMethod(method);
      }}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
        selectedMethod === method
          ? "border-violet-500 bg-violet-50/90 ring-1 ring-violet-200"
          : "border-neutral-200 bg-white hover:border-violet-300 hover:bg-violet-50/40",
        disabled && "opacity-50 cursor-not-allowed hover:bg-white",
      )}
    >
      <span className="min-w-0 max-w-[45%] shrink truncate text-sm font-semibold text-neutral-900 sm:max-w-48 md:max-w-none">
        {title}
      </span>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
        <div className="min-w-0 flex flex-1 justify-end overflow-hidden text-neutral-600">
          {subtitle}
        </div>
        <span
          className={cn(
            "relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 bg-white sm:h-5 sm:w-5",
            selectedMethod === method
              ? "border-violet-600"
              : "border-neutral-300",
          )}
          aria-hidden
        >
          {selectedMethod === method ? (
            <span className="h-2 w-2 rounded-full bg-violet-600" />
          ) : null}
        </span>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-neutral-100/90 pb-16 pt-6 px-3 sm:px-6">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/events/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-violet-800 mb-5"
        >
          ← Back to event
        </Link>

        <header className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pb-4 mb-6 border-b-2 border-violet-200">
          {bannerUrl ? (
            <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-full border border-violet-200 bg-white">
              <Image
                src={bannerUrl}
                alt=""
                fill
                className="object-cover"
                sizes="56px"
                unoptimized
              />
            </div>
          ) : (
            <div className="h-12 w-12 shrink-0 rounded-full bg-violet-100 border border-violet-200" />
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight truncate">
              {eventTitle || "…"}
            </h1>
            <p className="text-sm text-neutral-600 truncate">{eventSubtitle}</p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
              <h2 className="text-base font-bold text-neutral-900">
                Ticket(s)
              </h2>
              <p className="text-sm text-neutral-600 mt-1 mb-4">
                The ticket amount is shown in the summary. You can apply a
                coupon code on the right to get a discount.
              </p>
              <div className="flex gap-3 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-800">
                  <Ticket className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-neutral-900">
                      {tierLabel}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide rounded bg-red-100 text-red-700 px-1.5 py-0.5">
                      Required
                    </span>
                  </div>
                  {tierHint ? (
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                      {tierHint}
                    </p>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  {order && !orderLoading ? (
                    <p className="text-sm font-bold text-neutral-900 tabular-nums">
                      {order.currency || "INR"} {original.toFixed(2)}
                    </p>
                  ) : (
                    <p className="text-xs text-neutral-500">…</p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
              <h2 className="text-base font-bold text-neutral-900 mb-3">
                Payment methods
              </h2>
              <p className="text-xs text-neutral-500 mb-3">
                Choose how you want to pay, then use{" "}
                <span className="font-medium text-neutral-700">
                  Confirm and pay
                </span>{" "}
                in the order summary. Domestic Indian cards only — no
                international card flow.
              </p>
              <div
                className="space-y-2 rounded-xl border border-neutral-200 p-2 bg-neutral-50/50"
                role="radiogroup"
                aria-label="Payment method"
              >
                {payRow("upi", "UPI", <UpiLogoRow />, methodPickDisabled)}
                {payRow(
                  "wallet",
                  "Wallet",
                  <WalletLogoRow />,
                  methodPickDisabled,
                )}
                {payRow(
                  "netbanking",
                  "Net banking",
                  <div className="flex w-full items-center justify-end gap-2 text-neutral-600">
                    <Landmark className="h-5 w-5 shrink-0 text-violet-700" />
                    <span className="text-xs whitespace-nowrap">
                      All major banks
                    </span>
                  </div>,
                  methodPickDisabled,
                )}
                {payRow(
                  "card",
                  "Indian credit / debit card",
                  <CardLogoRow />,
                  methodPickDisabled,
                )}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-violet-700 to-violet-900 px-4 py-3 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-wider opacity-95">
                  Order summary
                </p>
                <p className="text-sm font-semibold mt-0.5 line-clamp-2">
                  {eventTitle}
                </p>
              </div>
              <div className="p-4 sm:p-5 space-y-4">
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                  <Input
                    placeholder="Enter coupon code"
                    value={discountInput}
                    onChange={(e) => {
                      setDiscountInput(e.target.value.toUpperCase());
                      setCouponError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        setAppliedDiscount(discountInput.trim() || undefined);
                      }
                    }}
                    className="pl-10 h-11 rounded-lg border-dashed border-neutral-300"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    disabled={orderLoading}
                    onClick={() =>
                      setAppliedDiscount(discountInput.trim() || undefined)
                    }
                  >
                    Apply coupon
                  </Button>
                </div>
                {couponError ? (
                  <p className="text-sm text-red-600 -mt-2">{couponError}</p>
                ) : null}

                <div>
                  <h3 className="text-sm font-bold text-neutral-900 mb-2">
                    Amount summary
                  </h3>
                  {orderLoading ? (
                    <div className="flex items-center gap-2 text-neutral-600 py-6 justify-center text-sm">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Calculating…
                    </div>
                  ) : order ? (
                    <div className="rounded-lg border border-neutral-200 overflow-hidden text-sm">
                      <div className="flex justify-between px-3 py-2 bg-white">
                        <span className="text-neutral-600">Base amount</span>
                        <span className="tabular-nums font-medium text-neutral-900">
                          {original.toFixed(2)} {order.currency || "INR"}
                        </span>
                      </div>
                      {discount > 0 ? (
                        <div className="flex justify-between px-3 py-2 bg-emerald-50/60 border-t border-neutral-100">
                          <span className="text-emerald-800">
                            Coupon
                            {appliedDiscount ? ` (${appliedDiscount})` : ""}
                          </span>
                          <span className="tabular-nums font-medium text-emerald-800">
                            − {discount.toFixed(2)} {order.currency || "INR"}
                          </span>
                        </div>
                      ) : null}
                      <div className="flex justify-between px-3 py-2 bg-white border-t border-neutral-100">
                        <span className="text-neutral-600">
                          Ticket (after discount)
                        </span>
                        <span className="tabular-nums font-medium text-neutral-900">
                          {afterDiscount.toFixed(2)} {order.currency || "INR"}
                        </span>
                      </div>
                      {feeBearer === "PARTICIPANT" &&
                      proc > 0 &&
                      gatewaySplit ? (
                        <>
                          <div className="flex justify-between px-3 py-2 bg-neutral-50 border-t border-neutral-100 text-xs">
                            <span className="text-neutral-600">
                              Service charge (gateway)
                            </span>
                            <span className="tabular-nums text-neutral-800">
                              + {gatewaySplit.service.toFixed(2)}{" "}
                              {order.currency || "INR"}
                            </span>
                          </div>
                          <div className="flex justify-between px-3 py-2 bg-neutral-50 border-t border-neutral-100 text-xs">
                            <span className="text-neutral-600">
                              GST (18% on service charge)
                            </span>
                            <span className="tabular-nums text-neutral-800">
                              + {gatewaySplit.gst.toFixed(2)}{" "}
                              {order.currency || "INR"}
                            </span>
                          </div>
                        </>
                      ) : feeBearer === "PARTICIPANT" && proc > 0 ? (
                        <div className="flex justify-between px-3 py-2 bg-neutral-50 border-t border-neutral-100 text-xs">
                          <span className="text-neutral-600">
                            Payment gateway &amp; taxes
                          </span>
                          <span className="tabular-nums text-neutral-800">
                            + {proc.toFixed(2)} {order.currency || "INR"}
                          </span>
                        </div>
                      ) : null}
                      <div className="flex justify-between px-3 py-3 bg-violet-50 border-t-2 border-violet-200 font-bold text-neutral-900">
                        <span>Total due</span>
                        <span className="tabular-nums">
                          {totalCharged.toFixed(2)} {order.currency || "INR"}
                        </span>
                      </div>
                    </div>
                  ) : orderError ? (
                    <p className="text-sm text-red-600 py-2">{orderError}</p>
                  ) : null}
                </div>

                <Button
                  type="button"
                  className="w-full h-12 text-base font-semibold inline-flex items-center justify-center gap-2 bg-violet-700 hover:bg-violet-800 text-white shadow-sm"
                  disabled={
                    !selectedMethod ||
                    !order ||
                    orderLoading ||
                    payBusy ||
                    !!orderError
                  }
                  onClick={() => {
                    if (!selectedMethod || !order) return;
                    setPayFlowActive(true);
                    void openRazorpay(selectedMethod);
                  }}
                >
                  {payBusy ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                      Processing…
                    </>
                  ) : (
                    "Confirm and pay"
                  )}
                </Button>

                {checkoutError ? (
                  <p className="text-sm text-red-600 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                    {checkoutError}
                  </p>
                ) : null}

                <CheckoutTrustFooter />

                <p className="text-[10px] text-center text-neutral-500 leading-snug">
                  Razorpay opens after you confirm. Complete payment in the
                  secure window; this page will show success or an error when
                  verification finishes.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
