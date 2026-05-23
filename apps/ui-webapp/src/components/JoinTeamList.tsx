"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useAuth, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Users, CheckCircle, KeyRound, Tag } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  getTeamsByHackathon,
  joinTeam,
  joinTeamByCode,
  joinDraftTeam,
  getPerUserFeePaidStatus,
  type TeamDetailResponse,
} from "@/lib/api/teamApi";
import {
  createPaymentOrder,
  verifyPayment,
  submitRegistration,
  saveHackathonRegistrationCheckoutDraft,
} from "@/lib/api/paymentsApi";
import { withRetry } from "@/lib/utils/retry";
import { SITE_URL } from "@/lib/constants";
import { writePendingHackathonRegistration } from "@/lib/registration/pendingHackathonRegistration";
import { writeHackathonCheckoutIntent } from "@/lib/registration/hackathonCheckoutIntent";
import { getMe } from "@/lib/api/usersApi";
import {
  HackathonRegistrationModal,
  type RegistrationField,
  type UserDataForPrefill,
} from "@/components/HackathonRegistrationModal";

interface RegistrationForm {
  id: string;
  externalFormLink: string | null;
  fields: RegistrationField[];
}

export interface JoinTeamListProps {
  hackathonId: string;
  hackathonSlug: string;
  hackathonName: string;
  registrationForm: RegistrationForm | null;
  isFree?: boolean;
  entryFeeAmount?: number | null;
  currency?: string;
  chargeMode?: "PER_TEAM" | "PER_USER";
  feeBearer?: "ORGANISER" | "PARTICIPANT";
  /** Prefill invite code (e.g. deep link from /hackathons/[slug]/join?code=) */
  initialInviteCode?: string;
  /** One-shot: open registration modal for the invite code on mount */
  autoOpenInviteFlow?: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function JoinTeamList({
  hackathonId,
  hackathonSlug,
  hackathonName,
  registrationForm,
  isFree = true,
  entryFeeAmount,
  currency = "INR",
  chargeMode = "PER_TEAM",
  feeBearer = "ORGANISER",
  initialInviteCode = "",
  autoOpenInviteFlow = false,
}: JoinTeamListProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();
  const autoOpenInviteOnceRef = useRef(false);

  const [teams, setTeams] = useState<TeamDetailResponse[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [joinedTeamName, setJoinedTeamName] = useState("");

  // Discount code state (PER_USER paid hackathons only)
  const [discountCode, setDiscountCode] = useState("");

  // Invite code state
  const [inviteCode, setInviteCode] = useState(() =>
    initialInviteCode.trim() ? initialInviteCode.trim().toUpperCase() : "",
  );
  const [isJoiningByCode, setIsJoiningByCode] = useState(false);

  // Registration modal state
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isSubmittingRegistration, setIsSubmittingRegistration] =
    useState(false);
  const [pendingJoinTeamId, setPendingJoinTeamId] = useState<string | null>(
    null,
  );
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(
    null,
  );

  const [registrationFields, setRegistrationFields] = useState<
    RegistrationField[]
  >([]);
  const [userDataForPrefill, setUserDataForPrefill] = useState<
    UserDataForPrefill | undefined
  >(undefined);

  const baselineUserData = {
    name: user
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
      : undefined,
    email: user?.primaryEmailAddress?.emailAddress,
    phone: user?.primaryPhoneNumber?.phoneNumber,
  };

  useEffect(() => {
    async function fetchTeams() {
      setIsLoadingTeams(true);
      try {
        const token = await getToken();
        if (!token) {
          setIsLoadingTeams(false);
          return;
        }

        const data = await getTeamsByHackathon(token, hackathonId);
        setTeams(data);
      } catch (error) {
        console.error("Failed to fetch teams:", error);
        toast.error("Failed to load teams");
      } finally {
        setIsLoadingTeams(false);
      }
    }

    fetchTeams();
  }, [hackathonId, getToken]);

  const openRegistrationModal = async (next: {
    teamId?: string;
    inviteCode?: string;
  }) => {
    const token = await getToken();
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    const meData = await getMe(token);

    if (registrationForm?.externalFormLink) {
      window.open(
        registrationForm.externalFormLink,
        "_blank",
        "noopener,noreferrer",
      );
      toast.info(
        "Complete the external registration form to finish registration.",
      );

      if (next.teamId) {
        await submitJoinTeam(next.teamId, []);
      } else if (next.inviteCode) {
        await submitJoinByCode(next.inviteCode, []);
      }

      return;
    }

    const onboardingProfile = meData.onboardingProfile;
    const fullName =
      [meData.firstName, meData.lastName].filter(Boolean).join(" ") ||
      undefined;

    const prefillData: UserDataForPrefill = {
      name: fullName,
      email: meData.email ?? undefined,
      phone: user?.primaryPhoneNumber?.phoneNumber,
      gender: onboardingProfile?.gender,
      collegeName: onboardingProfile?.college?.name ?? undefined,
      companyName: onboardingProfile?.companyName ?? undefined,
      schoolName: onboardingProfile?.schoolName ?? undefined,
    };

    setUserDataForPrefill(prefillData);

    const userCategory = onboardingProfile?.userCategory;

    const defaultFields: RegistrationField[] = [
      {
        id: "default-name",
        label: "Name",
        type: "TEXT",
        required: true,
        order: -50,
        options: [],
        placeholder: "Your full name",
      },
      {
        id: "default-email",
        label: "Email",
        type: "EMAIL",
        required: true,
        order: -40,
        options: [],
        placeholder: "email@example.com",
      },
      {
        id: "default-phone",
        label: "Phone No.",
        type: "PHONE_NO",
        required: true,
        order: -30,
        options: [],
        placeholder: "+91 XXXXX XXXXX",
      },
      {
        id: "default-gender",
        label: "Gender",
        type: "OPTIONS",
        required: true,
        order: -20,
        options: [],
        placeholder: "Select gender",
      },
    ];

    if (userCategory === "SCHOOL_STUDENT") {
      defaultFields.push({
        id: "default-school-name",
        label: "School Name",
        type: "TEXT",
        required: true,
        order: -10,
        options: [],
        placeholder: "Your school name",
      });
    } else if (
      userCategory === "COLLEGE_STUDENT" ||
      userCategory === "PROFESSIONAL_SCHOOL_STUDENT" ||
      userCategory === "FRESHER"
    ) {
      defaultFields.push({
        id: "default-college-name",
        label: "College Name",
        type: "TEXT",
        required: true,
        order: -10,
        options: [],
        placeholder: "Your college name",
      });
    } else if (userCategory === "WORKING_PROFESSIONAL") {
      defaultFields.push({
        id: "default-company-name",
        label: "Company Name",
        type: "TEXT",
        required: true,
        order: -10,
        options: [],
        placeholder: "Your company name",
      });
    } else {
      defaultFields.push({
        id: "default-college-name",
        label: "College Name",
        type: "TEXT",
        required: true,
        order: -10,
        options: [],
        placeholder: "Your college/institution name",
      });
    }

    const customFields = registrationForm?.fields ?? [];
    const defaultLabels = new Set(
      defaultFields.map((f) => f.label.toLowerCase()),
    );

    // Also filter out all identity fields (school/college/company) from custom fields
    // since we add the appropriate one based on userCategory
    const identityFieldLabels = new Set([
      "school name",
      "college name",
      "company name",
    ]);

    const filteredCustomFields = customFields.filter(
      (f) =>
        !defaultLabels.has(f.label.toLowerCase()) &&
        !identityFieldLabels.has(f.label.toLowerCase()),
    );

    const mergedFields = [...defaultFields, ...filteredCustomFields].sort(
      (a, b) => a.order - b.order,
    );

    setRegistrationFields(mergedFields);

    setPendingJoinTeamId(next.teamId ?? null);
    setPendingInviteCode(next.inviteCode ?? null);
    setShowRegistrationModal(true);
  };

  const handleJoinTeam = async (teamId: string) => {
    await openRegistrationModal({ teamId });
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) {
      toast.error("Please enter an invitation code");
      return;
    }

    await openRegistrationModal({ inviteCode: inviteCode.trim() });
  };

  // Deep link from invite URL: open registration modal once for the code
  useEffect(() => {
    if (
      !autoOpenInviteFlow ||
      !initialInviteCode?.trim() ||
      autoOpenInviteOnceRef.current
    ) {
      return;
    }
    autoOpenInviteOnceRef.current = true;
    const code = initialInviteCode.trim().toUpperCase();
    setInviteCode(code);
    void openRegistrationModal({ inviteCode: code });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot; openRegistrationModal is not stable
  }, [autoOpenInviteFlow, initialInviteCode]);

  /** PER_USER paid: join draft team + submit registration (payment already satisfied). */
  const finalizePerUserMemberJoin = async (
    token: string,
    answers: Array<{ fieldId: string; value: string | number | string[] }>,
    opts: { teamId?: string; invitationCode?: string; teamNameLabel?: string },
  ) => {
    if (opts.teamId) {
      await joinDraftTeam(token, hackathonSlug, { teamId: opts.teamId });
    } else if (opts.invitationCode) {
      await joinDraftTeam(token, hackathonSlug, {
        invitationCode: opts.invitationCode,
      });
    } else {
      throw new Error("Missing team join target");
    }
    const formattedAnswers = answers.map((a) => ({
      fieldId: a.fieldId,
      value: String(a.value),
    }));
    await submitRegistration(token, hackathonSlug, formattedAnswers);
    setJoinedTeamName(opts.teamNameLabel ?? "the team");
    setIsSuccess(true);
    toast.success("Successfully joined the team!");
    setTimeout(() => {
      router.push(`/hackathons/${hackathonSlug}`);
    }, 2000);
    setJoiningTeamId(null);
    setIsJoiningByCode(false);
    setShowRegistrationModal(false);
    setIsSubmittingRegistration(false);
  };

  const processPaymentAndRegistration = async (
    token: string,
    answers: Array<{ fieldId: string; value: string | number | string[] }>,
    teamId?: string,
    invitationCode?: string,
  ) => {
    try {
      // Create payment order first (before joining team)
      // Note: This function is only for PER_USER mode
      // PER_TEAM members should use the direct join flow (they don't pay)
      if (chargeMode !== "PER_USER") {
        throw new Error(
          "processPaymentAndRegistration should only be called for PER_USER mode",
        );
      }

      const formattedAnswers = answers.map((a) => ({
        fieldId: a.fieldId,
        value: String(a.value),
      }));

      if (!isFree) {
        await saveHackathonRegistrationCheckoutDraft(token, hackathonSlug, {
          answers: formattedAnswers,
          invitationCode: invitationCode?.toUpperCase(),
          joinTeamId: teamId,
        });
        writeHackathonCheckoutIntent(hackathonSlug, {
          discountCode: discountCode.trim() || undefined,
          invitationCode: invitationCode?.toUpperCase(),
          joinTeamId: teamId,
        });
        writePendingHackathonRegistration(hackathonSlug, {
          answers: formattedAnswers,
          userId: user?.id,
          invitationCode: invitationCode?.toUpperCase(),
          joinTeamId: teamId,
        });
        toast.success("Continue to secure checkout.");
        setShowRegistrationModal(false);
        setIsSubmittingRegistration(false);
        setJoiningTeamId(null);
        setIsJoiningByCode(false);
        router.push(`/hackathons/${hackathonSlug}/checkout`);
        return;
      }

      const order = await createPaymentOrder(token, hackathonSlug, {
        discountCode: discountCode.trim() || undefined,
        ...(invitationCode && {
          invitationCode: invitationCode.toUpperCase(),
        }),
        ...(teamId && { joinTeamId: teamId }),
      });

      // If discount makes this a zero-amount payment, backend already marks it as CAPTURED.
      // Skip Razorpay checkout and proceed to team join and registration submission.
      if (order.zeroAmountPayment || order.amountPaise === 0) {
        await finalizePerUserMemberJoin(token, answers, {
          teamId,
          invitationCode,
          teamNameLabel: "the team",
        });
        return;
      }

      const razorpayKey = order.razorpayKeyId || order.keyId;
      const razorpayOrderId = order.razorpayOrderId || order.orderId;

      if (!razorpayKey) {
        throw new Error("Payment configuration missing (Razorpay key)");
      }

      if (!razorpayOrderId) {
        throw new Error(
          "Payment initialization failed (missing Razorpay order id)",
        );
      }

      // Ensure Razorpay script is loaded
      if (!window.Razorpay) {
        throw new Error(
          "Razorpay payment gateway is not loaded. Please refresh the page and try again.",
        );
      }

      const options = {
        key: razorpayKey,
        amount: order.amountPaise,
        currency: order.currency,
        name: hackathonName,
        description: "Registration Fee",
        order_id: razorpayOrderId,
        callback_url: `${SITE_URL}/hackathons/${hackathonSlug}?razorpay_return=1`,
        handler: async (response: any) => {
          try {
            const verifyToken = await getToken();
            if (!verifyToken) throw new Error("Authentication required");

            const responseOrderId = response?.razorpay_order_id;
            const responsePaymentId = response?.razorpay_payment_id;
            const responseSignature = response?.razorpay_signature;

            if (!responseOrderId || !responsePaymentId || !responseSignature) {
              throw new Error(
                "Payment verification failed (missing Razorpay fields). Please try again.",
              );
            }

            const formattedAnswers = answers.map((a) => ({
              fieldId: a.fieldId,
              value: String(a.value),
            }));

            await withRetry(() =>
              verifyPayment(verifyToken, hackathonSlug, {
                razorpayOrderId: responseOrderId,
                razorpayPaymentId: responsePaymentId,
                razorpaySignature: responseSignature,
                answers: formattedAnswers,
              }),
            );

            setIsSuccess(true);
            toast.success("Payment successful! You have joined the team.");

            setTimeout(() => {
              router.push(`/hackathons/${hackathonSlug}`);
            }, 2000);
          } catch (err: unknown) {
            console.error("Post-payment error:", err);
            const msg =
              err instanceof Error
                ? err.message
                : "Registration failed after payment";
            toast.error(msg);
          } finally {
            setIsSubmittingRegistration(false);
            setShowRegistrationModal(false);
            setJoiningTeamId(null);
            setIsJoiningByCode(false);
          }
        },
        modal: {
          ondismiss: () => {
            // Payment cancelled - user did NOT join team
            setIsSubmittingRegistration(false);
            setJoiningTeamId(null);
            setIsJoiningByCode(false);
            toast.info("Payment cancelled. You have not joined the team.");
          },
        },
      };

      const formattedAnswersForPending = answers.map((a) => ({
        fieldId: a.fieldId,
        value: String(a.value),
      }));
      writePendingHackathonRegistration(hackathonSlug, {
        answers: formattedAnswersForPending,
        userId: user?.id,
        invitationCode: invitationCode?.toUpperCase(),
        joinTeamId: teamId,
      });

      // Close the registration modal BEFORE opening Razorpay.
      // Radix UI Dialog uses a focus trap and sets pointer-events:none on the
      // body while open, which blocks all interaction with the Razorpay iframe.
      setShowRegistrationModal(false);

      requestAnimationFrame(() => {
        const rzp = new window.Razorpay(options);
        rzp.open();
      });
    } catch (error: unknown) {
      console.error("Payment init error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to initiate payment";
      toast.error(message);
      setIsSubmittingRegistration(false);
      // User did NOT join team since payment failed
    }
  };

  const submitJoinTeam = async (
    teamId: string,
    answers: Array<{ fieldId: string; value: string | number | string[] }>,
  ) => {
    setJoiningTeamId(teamId);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      if (isFree) {
        // Free hackathons: join team directly
        await joinTeam(token, { teamId, answers });
        const team = teams.find((t) => t.id === teamId);
        setJoinedTeamName(team?.name || "the team");
        setIsSuccess(true);
        toast.success("Successfully joined the team!");

        setTimeout(() => {
          router.push(`/hackathons/${hackathonSlug}`);
        }, 2000);

        setJoiningTeamId(null);
        setShowRegistrationModal(false);
      } else {
        // Paid hackathons: Payment first, then join team after successful payment
        if (chargeMode === "PER_USER") {
          const { hasPaid } = await getPerUserFeePaidStatus(
            token,
            hackathonSlug,
          );
          if (hasPaid) {
            try {
              const team = teams.find((t) => t.id === teamId);
              await finalizePerUserMemberJoin(token, answers, {
                teamId,
                teamNameLabel: team?.name ?? "the team",
              });
            } catch (err: unknown) {
              const message =
                err instanceof Error ? err.message : "Failed to join team";
              toast.error(message);
              setJoiningTeamId(null);
              setIsSubmittingRegistration(false);
              setShowRegistrationModal(false);
            }
            return;
          }
          await processPaymentAndRegistration(token, answers, teamId);
        } else {
          // PER_TEAM: For members, check if leader has paid, then join and submit registration
          // Members don't pay, but can only join if team payment is complete
          // The backend will validate payment when submitting registration
          // So we can join draft team first, then submit registration (backend validates)
          try {
            await joinDraftTeam(token, hackathonSlug, { teamId });
            const formattedAnswers = answers.map((a) => ({
              fieldId: a.fieldId,
              value: String(a.value),
            }));
            await submitRegistration(token, hackathonSlug, formattedAnswers);

            const team = teams.find((t) => t.id === teamId);
            setJoinedTeamName(team?.name || "the team");
            setIsSuccess(true);
            toast.success("Successfully joined!");

            setTimeout(() => {
              router.push(`/hackathons/${hackathonSlug}`);
            }, 2000);

            setJoiningTeamId(null);
            setShowRegistrationModal(false);
          } catch (error: unknown) {
            // If payment validation fails, user is not in team
            const message =
              error instanceof Error
                ? error.message
                : "Failed to join team. Team payment may not be complete.";
            toast.error(message);
            setJoiningTeamId(null);
            setShowRegistrationModal(false);
          }
        }
      }
    } catch (error: unknown) {
      console.error("Failed to join team:", error);
      const message =
        error instanceof Error ? error.message : "Failed to join team";
      toast.error(message);
      setJoiningTeamId(null);
      setShowRegistrationModal(false);
      setIsSubmittingRegistration(false);
    }
  };

  const submitJoinByCode = async (
    code: string,
    answers: Array<{ fieldId: string; value: string | number | string[] }>,
  ) => {
    setIsJoiningByCode(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      if (isFree) {
        // Free hackathons: join team directly
        await joinTeamByCode(token, code, answers);
        setJoinedTeamName("the team");
        setIsSuccess(true);
        toast.success("Successfully joined the team!");

        setTimeout(() => {
          router.push(`/hackathons/${hackathonSlug}`);
        }, 2000);

        setIsJoiningByCode(false);
        setShowRegistrationModal(false);
      } else {
        // Paid hackathons: Payment first, then join team after successful payment
        if (chargeMode === "PER_USER") {
          const { hasPaid } = await getPerUserFeePaidStatus(
            token,
            hackathonSlug,
          );
          if (hasPaid) {
            try {
              await finalizePerUserMemberJoin(token, answers, {
                invitationCode: code,
                teamNameLabel: "the team",
              });
            } catch (err: unknown) {
              const message =
                err instanceof Error ? err.message : "Failed to join team";
              toast.error(message);
              setIsJoiningByCode(false);
              setIsSubmittingRegistration(false);
              setShowRegistrationModal(false);
            }
            return;
          }
          await processPaymentAndRegistration(token, answers, undefined, code);
        } else {
          // PER_TEAM: For members, check if leader has paid, then join and submit registration
          // Members don't pay, but can only join if team payment is complete
          // The backend will validate payment when submitting registration
          try {
            await joinDraftTeam(token, hackathonSlug, { invitationCode: code });
            const formattedAnswers = answers.map((a) => ({
              fieldId: a.fieldId,
              value: String(a.value),
            }));
            await submitRegistration(token, hackathonSlug, formattedAnswers);

            setJoinedTeamName("the team");
            setIsSuccess(true);
            toast.success("Successfully joined!");

            setTimeout(() => {
              router.push(`/hackathons/${hackathonSlug}`);
            }, 2000);

            setIsJoiningByCode(false);
            setShowRegistrationModal(false);
          } catch (error: unknown) {
            // If payment validation fails, user is not in team
            const message =
              error instanceof Error
                ? error.message
                : "Failed to join team. Team payment may not be complete.";
            toast.error(message);
            setIsJoiningByCode(false);
            setShowRegistrationModal(false);
          }
        }
      }
    } catch (error: unknown) {
      console.error("Failed to join team:", error);
      const message =
        error instanceof Error ? error.message : "Invalid invitation code";
      toast.error(message);
      setIsJoiningByCode(false);
      setShowRegistrationModal(false);
      setIsSubmittingRegistration(false);
    }
  };

  const handleRegistrationSubmit = async (
    answers: Array<{ fieldId: string; value: string | number | string[] }>,
  ) => {
    setIsSubmittingRegistration(true);
    try {
      if (pendingJoinTeamId) {
        await submitJoinTeam(pendingJoinTeamId, answers);
      } else if (pendingInviteCode) {
        await submitJoinByCode(pendingInviteCode, answers);
      }
    } catch (err) {
      console.error("Registration submission failed:", err);
      setIsSubmittingRegistration(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="text-center space-y-4 py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold text-green-700">
          Successfully Joined {joinedTeamName}!
        </h2>
        <p className="text-gray-600">Redirecting to competition page...</p>
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="space-y-6">
        {!isFree && chargeMode === "PER_USER" && (
          <div className="p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900 space-y-3">
            {(() => {
              const raw = entryFeeAmount as number | string | null | undefined;
              const base =
                typeof raw === "number" ? raw : Number(raw ?? 0) || 0;
              if (!(feeBearer === "PARTICIPANT" && base > 0)) return null;
              const fee = Math.ceil(base * 0.0236 * 100) / 100;
              const total = base + fee;
              return (
                <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-3 text-sm">
                  <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
                    <span>Entry Fee</span>
                    <span>₹{base.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-start text-neutral-500 mt-1 gap-2">
                    <div className="min-w-0">
                      <span>Transaction Charges</span>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Charged by payment partners to process your transaction.
                      </p>
                    </div>
                    <span className="shrink-0">₹{fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-neutral-800 dark:text-neutral-200 mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              );
            })()}
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Discount Code (Optional)</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Have a discount code? Enter it here before joining a team — it
              will be applied to your payment.
            </p>
            <div className="space-y-1">
              <Label htmlFor="discountCodeJoin" className="sr-only">
                Discount Code
              </Label>
              <Input
                id="discountCodeJoin"
                placeholder="Enter discount code (e.g., EARLY50)"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>
          </div>
        )}

        <div className="p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Join with Invite Code</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Have an invitation code from a team? Enter it below to join
            directly.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter invite code (e.g., ABC123XY)"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="font-mono"
              disabled={isJoiningByCode}
            />
            <Button
              onClick={handleJoinByCode}
              disabled={isJoiningByCode || !inviteCode.trim()}
            >
              {isJoiningByCode && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Join
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Browse Open Teams
          </h3>

          {isLoadingTeams ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No open teams available yet.</p>
              <p className="text-sm mt-1">
                Be the first to create a team, or join using an invite code!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team) => {
                const memberCount = (team.members?.length || 0) + 1;
                const isFull = memberCount >= team.maxSize;
                const isJoining = joiningTeamId === team.id;

                return (
                  <Card key={team.id} className={isFull ? "opacity-60" : ""}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Leader:{" "}
                        {team.leader?.firstName ||
                          team.leader?.email ||
                          "Unknown"}
                      </p>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex justify-between items-center">
                        <Badge variant={isFull ? "secondary" : "outline"}>
                          <Users className="w-3 h-3 mr-1" />
                          {memberCount} / {team.maxSize}
                        </Badge>
                        {isFull && <Badge variant="destructive">Full</Badge>}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        onClick={() => handleJoinTeam(team.id)}
                        disabled={isJoining || isFull || !!joiningTeamId}
                      >
                        {isJoining && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        {isFull ? "Team Full" : "Join Team"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <HackathonRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => {
          setShowRegistrationModal(false);
          setPendingJoinTeamId(null);
          setPendingInviteCode(null);
        }}
        onSubmit={handleRegistrationSubmit}
        fields={registrationFields}
        hackathonName={hackathonName}
        isSubmitting={isSubmittingRegistration}
        userData={userDataForPrefill ?? baselineUserData}
        title="Complete Registration"
        description={`Fill in the required information to join the team for ${hackathonName}`}
      />
    </>
  );
}
