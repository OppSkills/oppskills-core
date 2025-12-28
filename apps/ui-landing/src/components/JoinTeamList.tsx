"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Users, CheckCircle, KeyRound } from "lucide-react";
import {
  getTeamsByHackathon,
  joinTeam,
  joinTeamByCode,
  joinDraftTeam,
  type TeamDetailResponse,
} from "@/lib/api/teamApi";
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

export interface JoinTeamListProps {
  hackathonId: string;
  hackathonSlug: string;
  hackathonName: string;
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

export function JoinTeamList({
  hackathonId,
  hackathonSlug,
  hackathonName,
  registrationForm,
  isFree = true,
  entryFeeAmount,
  currency = "INR",
  chargeMode = "PER_TEAM",
}: JoinTeamListProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [teams, setTeams] = useState<TeamDetailResponse[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [joinedTeamName, setJoinedTeamName] = useState("");

  // Invite code state
  const [inviteCode, setInviteCode] = useState("");
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
    const filteredCustomFields = customFields.filter(
      (f) => !defaultLabels.has(f.label.toLowerCase()),
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

  const processPaymentAndRegistration = async (
    token: string,
    answers: Array<{ fieldId: string; value: string | number | string[] }>,
  ) => {
    try {
      const order = await createPaymentOrder(token, hackathonSlug, {});

      // If discount makes this a zero-amount payment, backend already marks it as CAPTURED.
      // Skip Razorpay checkout and proceed to registration submission (PER_USER flow).
      if (order.zeroAmountPayment || order.amountPaise === 0) {
        if (chargeMode === "PER_USER") {
          const formattedAnswers = answers.map((a) => ({
            fieldId: a.fieldId,
            value: String(a.value),
          }));

          await submitRegistration(token, hackathonSlug, formattedAnswers);
        }

        setIsSuccess(true);
        toast.success("Registration successful!");

        setTimeout(() => {
          router.push(`/competitions/${hackathonSlug}`);
        }, 2000);

        return;
      }

      const razorpayKey = order.razorpayKeyId || order.keyId;
      const razorpayOrderId = order.razorpayOrderId || order.orderId;

      if (!razorpayKey) {
        throw new Error("Payment configuration missing (Razorpay key)");
      }

      if (!razorpayOrderId) {
        throw new Error("Payment initialization failed (missing Razorpay order id)");
      }

      const options = {
        key: razorpayKey,
        amount: order.amountPaise,
        currency: order.currency,
        name: hackathonName,
        description: "Registration Fee",
        order_id: razorpayOrderId,
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

            await verifyPayment(verifyToken, hackathonSlug, {
              razorpayOrderId: responseOrderId,
              razorpayPaymentId: responsePaymentId,
              razorpaySignature: responseSignature,
            });

            if (chargeMode === "PER_USER") {
              // For PER_USER, registration is submitted after payment
              const formattedAnswers = answers.map((a) => ({
                fieldId: a.fieldId,
                value: String(a.value),
              }));
              await submitRegistration(
                verifyToken,
                hackathonSlug,
                formattedAnswers,
              );
            }
            // For PER_TEAM, registration was already submitted by leader,
            // we just needed to pay (if we were paying, but logic suggests PER_TEAM members join free?)
            // Actually, JoinTeamList logic for PER_TEAM seems to skip payment if isFree...
            // Wait, if chargeMode is PER_TEAM, members usually join for free if leader paid.
            // But if there is a fee for joining (unlikely for PER_TEAM mode member), we handle it.

            setIsSuccess(true);
            toast.success("Payment successful! You have joined the team.");

            setTimeout(() => {
              router.push(`/competitions/${hackathonSlug}`);
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
            setIsSubmittingRegistration(false);
            toast.info("Payment cancelled");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: unknown) {
      console.error("Payment init error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to initiate payment";
      toast.error(message);
      setIsSubmittingRegistration(false);
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
        await joinTeam(token, { teamId, answers });
        const team = teams.find((t) => t.id === teamId);
        setJoinedTeamName(team?.name || "the team");
        setIsSuccess(true);
        toast.success("Successfully joined the team!");

        setTimeout(() => {
          router.push(`/competitions/${hackathonSlug}`);
        }, 2000);

        setJoiningTeamId(null);
        setShowRegistrationModal(false);
      } else {
        await joinDraftTeam(token, hackathonSlug, { teamId });

        const team = teams.find((t) => t.id === teamId);
        setJoinedTeamName(team?.name || "the team");

        if (chargeMode === "PER_USER") {
          await processPaymentAndRegistration(token, answers);
        } else {
          const formattedAnswers = answers.map((a) => ({
            fieldId: a.fieldId,
            value: String(a.value),
          }));
          await submitRegistration(token, hackathonSlug, formattedAnswers);

          setIsSuccess(true);
          toast.success("Successfully joined!");

          setTimeout(() => {
            router.push(`/competitions/${hackathonSlug}`);
          }, 2000);

          setJoiningTeamId(null);
          setShowRegistrationModal(false);
        }
      }
    } catch (error: unknown) {
      console.error("Failed to join team:", error);
      const message =
        error instanceof Error ? error.message : "Failed to join team";
      toast.error(message);
      setJoiningTeamId(null);
      setShowRegistrationModal(false);
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
        await joinTeamByCode(token, code, answers);
        setJoinedTeamName("the team");
        setIsSuccess(true);
        toast.success("Successfully joined the team!");

        setTimeout(() => {
          router.push(`/competitions/${hackathonSlug}`);
        }, 2000);

        setIsJoiningByCode(false);
        setShowRegistrationModal(false);
      } else {
        await joinDraftTeam(token, hackathonSlug, { invitationCode: code });
        setJoinedTeamName("the team");

        if (chargeMode === "PER_USER") {
          await processPaymentAndRegistration(token, answers);
        } else {
          const formattedAnswers = answers.map((a) => ({
            fieldId: a.fieldId,
            value: String(a.value),
          }));
          await submitRegistration(token, hackathonSlug, formattedAnswers);

          setIsSuccess(true);
          toast.success("Successfully joined!");

          setTimeout(() => {
            router.push(`/competitions/${hackathonSlug}`);
          }, 2000);

          setIsJoiningByCode(false);
          setShowRegistrationModal(false);
        }
      }
    } catch (error: unknown) {
      console.error("Failed to join team:", error);
      const message =
        error instanceof Error ? error.message : "Invalid invitation code";
      toast.error(message);
      setIsJoiningByCode(false);
      setShowRegistrationModal(false);
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
