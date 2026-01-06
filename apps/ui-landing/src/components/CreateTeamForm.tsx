"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useAuth, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import { createTeam, createDraftTeam } from "@/lib/api/teamApi";
import {
  createPaymentOrder,
  verifyPayment,
  submitRegistration,
} from "@/lib/api/paymentsApi";
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

export interface CreateTeamFormProps {
  hackathonId: string;
  hackathonSlug: string;
  hackathonName: string;
  maxSize: number;
  isIndividual: boolean;
  registrationForm: RegistrationForm | null;
  isFree?: boolean;
  entryFeeAmount?: number | null;
  currency?: string;
  chargeMode?: "PER_TEAM" | "PER_USER";
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function CreateTeamForm({
  hackathonId,
  hackathonSlug,
  hackathonName,
  maxSize,
  isIndividual,
  registrationForm,
  isFree = true,
  entryFeeAmount,
  currency = "INR",
  chargeMode = "PER_TEAM",
}: CreateTeamFormProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isSubmittingRegistration, setIsSubmittingRegistration] =
    useState(false);

  const [registrationFields, setRegistrationFields] = useState<
    RegistrationField[]
  >([]);
  const [userDataForPrefill, setUserDataForPrefill] = useState<
    UserDataForPrefill | undefined
  >(undefined);
  const [discountCode, setDiscountCode] = useState("");

  const baselineUserData = {
    name: user
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
      : undefined,
    email: user?.primaryEmailAddress?.emailAddress,
    phone: user?.primaryPhoneNumber?.phoneNumber,
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isIndividual && !teamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }

    const token = await getToken();
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    const meData = await getMe(token);
    if (!meData.onboarded) {
      const returnUrl = encodeURIComponent(window.location.href);
      router.push(`/onboarding?returnUrl=${returnUrl}`);
      return;
    }

    if (registrationForm?.externalFormLink) {
      window.open(
        registrationForm.externalFormLink,
        "_blank",
        "noopener,noreferrer",
      );
      toast.info(
        "Complete the external registration form to finish registration.",
      );

      await submitTeamCreation([]);
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
      (f) => !defaultLabels.has(f.label.toLowerCase()) &&
             !identityFieldLabels.has(f.label.toLowerCase()),
    );

    const mergedFields = [...defaultFields, ...filteredCustomFields].sort(
      (a, b) => a.order - b.order,
    );

    setRegistrationFields(mergedFields);
    setShowRegistrationModal(true);
    return;
  };

  const processPaymentAndRegistration = async (
    token: string,
    teamName: string,
    answers: Array<{ fieldId: string; value: string | number | string[] }>,
    existingTeamId?: string,
  ) => {
    try {
      // For PER_TEAM, pass teamName instead of creating team first
      // Team will be created AFTER payment verification
      // For PER_USER, create team after payment
      let teamId: string | undefined = existingTeamId;

      const orderParams: {
        teamId?: string;
        teamName?: string;
        maxSize?: number;
        discountCode?: string;
      } = {
        discountCode: discountCode.trim() || undefined,
      };

      if (chargeMode === "PER_TEAM") {
        if (teamId) {
          // Existing team
          orderParams.teamId = teamId;
        } else {
          // New team - pass teamName, team will be created after payment
          orderParams.teamName = teamName;
          orderParams.maxSize = maxSize;
        }
      }

      const order = await createPaymentOrder(token, hackathonSlug, orderParams);

      // If discount makes this a zero-amount payment, backend already marks it as CAPTURED.
      // Backend creates team for PER_TEAM if teamName was provided
      // For PER_USER, create team after payment is confirmed
      if (order.zeroAmountPayment || order.amountPaise === 0) {
        // Get teamId from order response if team was created by backend
        if (order.teamId) {
          teamId = order.teamId;
        } else if (chargeMode === "PER_USER" && !teamId) {
          // For PER_USER, create draft team after payment is confirmed
          const draft = await createDraftTeam(token, hackathonSlug, {
            name: teamName,
            maxSize,
          });
          teamId = draft.team.id;
        }

        const formattedAnswers = answers.map((a) => ({
          fieldId: a.fieldId,
          value: String(a.value),
        }));

        await submitRegistration(token, hackathonSlug, formattedAnswers);

        setIsSuccess(true);
        toast.success("Registration successful!");

        setTimeout(() => {
          router.push(`/competitions/${hackathonSlug}?registered=true`);
        }, 2000);

        setIsLoading(false);
        setIsSubmittingRegistration(false);
        setShowRegistrationModal(false);
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

      const options = {
        key: razorpayKey,
        amount: order.amountPaise,
        currency: order.currency,
        name: hackathonName,
        description: isIndividual
          ? "Individual Registration"
          : "Team Registration",
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          try {
            setIsSubmittingRegistration(true);
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

            const verifyResult = await verifyPayment(verifyToken, hackathonSlug, {
              razorpayOrderId: responseOrderId,
              razorpayPaymentId: responsePaymentId,
              razorpaySignature: responseSignature,
            });

            // Get teamId from verify result if team was created by backend (PER_TEAM)
            if (verifyResult.teamId) {
              teamId = verifyResult.teamId;
            } else if (chargeMode === "PER_USER" && !teamId) {
              // For PER_USER, create draft team AFTER successful payment
              const draft = await createDraftTeam(verifyToken, hackathonSlug, {
                name: teamName,
                maxSize,
              });
              teamId = draft.team.id;
            }

            const formattedAnswers = answers.map((a) => ({
              fieldId: a.fieldId,
              value: String(a.value),
            }));

            await submitRegistration(
              verifyToken,
              hackathonSlug,
              formattedAnswers,
            );

            setIsSuccess(true);
            toast.success("Payment and registration successful!");

            setTimeout(() => {
              router.push(`/competitions/${hackathonSlug}?registered=true`);
            }, 2000);
          } catch (err: unknown) {
            console.error("Post-payment error:", err);
            const msg =
              err instanceof Error
                ? err.message
                : "Registration failed after payment";
            toast.error(msg);
          } finally {
            setIsLoading(false);
            setIsSubmittingRegistration(false);
            setShowRegistrationModal(false);
          }
        },
        modal: {
          ondismiss: () => {
            // Payment cancelled - user did NOT complete registration
            setIsLoading(false);
            setIsSubmittingRegistration(false);
            toast.info(
              "Payment cancelled. Team creation and registration were not completed.",
            );
            // Note: For PER_TEAM, draft team may have been created but registration is not submitted
            // User can retry payment later if they want
          },
        },
      };

      // Ensure Razorpay script is loaded
      if (!window.Razorpay) {
        throw new Error(
          "Razorpay payment gateway is not loaded. Please refresh the page and try again.",
        );
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: unknown) {
      console.error("Payment init error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to initiate payment";
      toast.error(message);
      setIsLoading(false);
      setIsSubmittingRegistration(false);
      // For PER_TEAM, draft team may have been created but payment failed
      // User can retry payment later, but registration is not submitted
    }
  };

  const submitTeamCreation = async (
    answers: Array<{ fieldId: string; value: string | number | string[] }>,
  ) => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const finalTeamName = isIndividual
        ? `${user?.firstName || "Participant"}'s Registration`
        : teamName.trim();

      if (isFree) {
        await createTeam(token, {
          name: finalTeamName,
          hackathonId,
          maxSize,
          isOpen,
          answers,
        });

        setIsSuccess(true);
        toast.success(
          isIndividual
            ? "Registration successful!"
            : "Team created successfully!",
        );

        setTimeout(() => {
          router.push(`/competitions/${hackathonSlug}?registered=true`);
        }, 2000);
        setIsLoading(false);
        setShowRegistrationModal(false);
      } else {
        // Paid hackathons: Payment first, then create team (for PER_USER) or use existing team (for PER_TEAM)
        // For PER_TEAM, we need to create draft team first to get teamId for payment order
        // For PER_USER, we can create payment order without teamId, then create team after payment
        await processPaymentAndRegistration(
          token,
          finalTeamName,
          answers,
          undefined, // No existing teamId
        );
      }
    } catch (error: unknown) {
      console.error("Failed to create team:", error);
      const message =
        error instanceof Error ? error.message : "Failed to create team";
      toast.error(message);
      setIsLoading(false);
      setShowRegistrationModal(false);
    }
  };

  const handleRegistrationSubmit = async (
    answers: Array<{ fieldId: string; value: string | number | string[] }>,
  ) => {
    setIsSubmittingRegistration(true);
    try {
      await submitTeamCreation(answers);
    } catch (err) {
      console.error("Registration submission failed:", err);
      setIsSubmittingRegistration(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-4 py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold text-green-700">
          {isIndividual ? "Registration Successful!" : "Team Created!"}
        </h2>
        <p className="text-gray-600">Redirecting to competition page...</p>
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <form
        onSubmit={handleCreateTeam}
        className="space-y-6 p-4 border rounded-md"
      >
        <h2 className="text-xl font-semibold">
          {isIndividual ? "Register for Competition" : "Create a New Team"}
        </h2>

        {!isIndividual && (
          <>
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                placeholder="e.g. The Innovators"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>Team Size</Label>
              <p className="text-sm text-muted-foreground">
                Maximum {maxSize} member{maxSize > 1 ? "s" : ""} (set by
                organizer)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isOpen">Open for others to join</Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to browse and request to join your team
                </p>
              </div>
              <Switch
                id="isOpen"
                checked={isOpen}
                onCheckedChange={setIsOpen}
                disabled={isLoading}
              />
            </div>
          </>
        )}

        {isIndividual && (
          <p className="text-sm text-muted-foreground">
            This is an individual competition. Click below to complete your
            registration.
          </p>
        )}

        {!isFree && (
          <div className="space-y-2">
            <Label htmlFor="discountCode">Discount Code (Optional)</Label>
            <Input
              id="discountCode"
              placeholder="Enter discount code"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              disabled={isLoading}
            />
          </div>
        )}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isIndividual ? "Register" : "Create Team"}
        </Button>
      </form>

      <HackathonRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onSubmit={handleRegistrationSubmit}
        fields={registrationFields}
        hackathonName={hackathonName}
        isSubmitting={isSubmittingRegistration}
        userData={userDataForPrefill ?? baselineUserData}
        title={
          isIndividual ? "Complete Registration" : "Complete Team Registration"
        }
        description={
          isIndividual
            ? `Fill in the required information to register for ${hackathonName}`
            : `Fill in the required information to create your team for ${hackathonName}`
        }
      />
    </>
  );
}
