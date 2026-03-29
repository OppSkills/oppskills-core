import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQueryState } from "nuqs";
import {
  Users,
  UserPlus,
  Loader2,
} from "lucide-react";
import Script from "next/script";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  createTeam,
  createDraftTeam,
  joinTeam,
  joinDraftTeam,
  getTeamsByHackathon,
  getPerUserFeePaidStatus,
  checkMyHackathonTeam,
  type TeamDetailResponse,
} from "@/lib/api/teamApi";
import {
  createPaymentOrder,
  verifyPayment,
  submitRegistration,
} from "@/lib/api/paymentsApi";
import { getMe } from "@/lib/api/usersApi";
import { presignDocumentUpload } from "@/lib/api/mediaApi";
import { uploadDocumentToS3PresignedPost } from "@/lib/uploads/uploadDocumentToS3";
import { getApiErrorMessage, cn } from "@/lib/utils";
import type { RegistrationModalProps, RegistrationMode, UserDataForPrefill } from "./RegistrationModal.types";
import { CreateTeamFormContent } from "./CreateTeamFormContent";
import { JoinTeamFormContent } from "./JoinTeamFormContent";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function getMaxSizeFromParticipantType(participantType?: string): number {
  if (!participantType) return 4;
  switch (participantType) {
    case "INDIVIDUAL": return 1;
    case "TEAM_OF_2": return 2;
    case "TEAM_OF_3": return 3;
    case "TEAM_OF_4": return 4;
    case "TEAM_OF_5": return 5;
    case "TEAM_OF_6": return 6;
    case "MORE_THAN_6": return 10;
    default: return 4;
  }
}

export function RegistrationModal({
  isOpen,
  onClose,
  competition,
  onSuccess,
  initialMode,
  initialInvitationCode,
}: RegistrationModalProps) {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [registrationMode, setRegistrationMode] = useQueryState("registration");
  const mode: RegistrationMode = registrationMode === "join" ? "JOIN" : "CREATE";
  const setMode = (newMode: RegistrationMode) => setRegistrationMode(newMode.toLowerCase());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Form states
  const [teamName, setTeamName] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { name: string; url: string }>>({});
  const [invitationCode, setInvitationCode] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [isOpenToggle, setIsOpenToggle] = useState(true);

  // Team search state
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [teams, setTeams] = useState<TeamDetailResponse[]>([]);

  const maxSize = getMaxSizeFromParticipantType(competition.participantType);
  const isIndividual = competition.participantType === "INDIVIDUAL";

  const onUpdateAnswer = useCallback((fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTeamName("");
      setAnswers({});
      setUploadedFiles({});
      setInvitationCode("");
      setDiscountCode("");
      setSearchQuery("");
    } else {
      // When opening, if we have an initial invitation code, set it
      if (initialInvitationCode) {
        setInvitationCode(initialInvitationCode);
      }

      // Initialize questions/answers
      const initialAnswers: Record<string, any> = {};
      const fields = competition.registrationForm?.fields || [];

      // Fetch user profile for pre-fill
      const fetchProfileAndInit = async () => {
        try {
          const token = await getToken();
          if (!token) return;
          const meData = await getMe(token);
          const profile = meData.onboardingProfile;

          const prefillMap: Record<string, any> = {
            "name": [meData.firstName, meData.lastName].filter(Boolean).join(" "),
            "email": meData.email,
            "phone": user?.primaryPhoneNumber?.phoneNumber,
            "gender": profile?.gender,
            "college": profile?.college?.name,
            "company": profile?.companyName,
            "school": profile?.schoolName,
          };

          fields.forEach((field) => {
            const lowerLabel = field.label.toLowerCase();
            // Match label to prefill map
            Object.entries(prefillMap).forEach(([key, value]) => {
              if (lowerLabel.includes(key) && value && value !== "") {
                initialAnswers[field.id] = value;
              }
            });
          });

          // Ensure default-ids are also checked even if labels don't match perfectly
          fields.forEach((field) => {
            if (field.id === "default-name" && !initialAnswers[field.id]) initialAnswers[field.id] = prefillMap.name;
            if (field.id === "default-email" && !initialAnswers[field.id]) initialAnswers[field.id] = prefillMap.email;
            if (field.id === "default-phone" && !initialAnswers[field.id]) initialAnswers[field.id] = prefillMap.phone;
          });

          setAnswers(initialAnswers);
        } catch (error) {
          console.error("Failed to fetch profile:", error);
        }
      };

      fetchProfileAndInit();

      // Fetch teams for Join mode
      const fetchTeams = async () => {
        setIsLoadingTeams(true);
        try {
          const token = await getToken();
          if (!token) return;
          const data = await getTeamsByHackathon(token, competition.id);
          setTeams(data);
        } catch (error) {
          console.error("Failed to fetch teams:", error);
        } finally {
          setIsLoadingTeams(false);
        }
      };
      fetchTeams();
    }
  }, [isOpen, competition.id, getToken, user?.primaryPhoneNumber?.phoneNumber, competition.registrationForm?.fields]);

  const handleFileSelect = useCallback(
    async (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File size exceeds 10MB limit");
        return;
      }

      setIsUploading(true);
      try {
        const token = await getToken();
        if (!token) {
          toast.error("Please sign in to upload files");
          return;
        }

        const presign = await presignDocumentUpload(token, {
          purpose: "OPPORTUNITY_ATTACHMENT",
          mimeType: file.type,
          fileName: file.name,
        });

        await uploadDocumentToS3PresignedPost({
          presign,
          file,
        });

        const fileData = {
          url: presign.publicUrl,
          name: file.name,
        };

        setUploadedFiles(prev => ({ ...prev, [fieldId]: fileData }));
        onUpdateAnswer(fieldId, presign.publicUrl);

        toast.success("Document uploaded successfully");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(getApiErrorMessage(error, "Failed to upload document"));
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    },
    [getToken, onUpdateAnswer],
  );

  const processPayment = async (
    token: string,
    finalTeamName: string,
    formattedAnswers: Array<{ fieldId: string; value: string }>,
    opts: { teamId?: string; invitationCode?: string }
  ) => {
    try {
      const orderParams: any = {
        discountCode: discountCode.trim() || undefined,
      };

      if (competition.chargeMode === "PER_TEAM") {
        if (opts.teamId) {
          orderParams.teamId = opts.teamId;
        } else {
          orderParams.teamName = finalTeamName;
          orderParams.maxSize = maxSize;
        }
      }

      const order = await createPaymentOrder(token, competition.slug, orderParams);

      if (order.zeroAmountPayment || order.amountPaise === 0) {
        let teamId = order.teamId;
        if (!teamId && competition.chargeMode === "PER_USER") {
          if (opts.invitationCode) {
            const draft = await joinDraftTeam(token, competition.slug, { invitationCode: opts.invitationCode });
            teamId = (draft as any).team?.id;
          } else if (opts.teamId) {
            const draft = { team: { id: opts.teamId } };
            teamId = draft.team.id;
          } else {
            const draft = await createDraftTeam(token, competition.slug, { name: finalTeamName, maxSize });
            teamId = draft.team.id;
          }
        }

        await submitRegistration(token, competition.slug, formattedAnswers);

        const myUpdatedTeam = await checkMyHackathonTeam(token, competition.id);

        toast.success("Registration successful!");
        if (myUpdatedTeam) {
          onSuccess?.(myUpdatedTeam);
        }

        onClose();
        router.push(`/hackathons/${competition.slug}?registered=true`);
        return;
      }

      const options = {
        key: order.razorpayKeyId || order.keyId,
        amount: order.amountPaise,
        currency: order.currency,
        name: competition.title,
        order_id: order.razorpayOrderId || order.orderId,
        handler: async (response: any) => {
          try {
            setIsSubmitting(true);
            const verifyToken = await getToken();
            if (!verifyToken) throw new Error("Auth required");

            await verifyPayment(verifyToken, competition.slug, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (competition.chargeMode === "PER_USER") {
              if (opts.invitationCode) {
                await joinDraftTeam(verifyToken, competition.slug, { invitationCode: opts.invitationCode });
              } else if (!opts.teamId) {
                await createDraftTeam(verifyToken, competition.slug, { name: finalTeamName, maxSize });
              }
            }

            await submitRegistration(verifyToken, competition.slug, formattedAnswers);

            const myUpdatedTeam = await checkMyHackathonTeam(verifyToken, competition.id);

            toast.success("Payment successful!");
            if (myUpdatedTeam) {
              onSuccess?.(myUpdatedTeam);
            }

            onClose();
            router.push(`/hackathons/${competition.slug}?registered=true`);
          } catch (err) {
            toast.error("Registration failed after payment");
          } finally {
            setIsSubmitting(false);
          }
        },
      };

      if (!window.Razorpay) throw new Error("Razorpay not loaded");
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Payment failed"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = await getToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      // Final validation of required fields
      const missingFields = competition.registrationForm?.fields
        .filter(f => f.required && !answers[f.id])
        .map(f => f.label);

      if (missingFields && missingFields.length > 0) {
        toast.error(`Please fill all required fields: ${missingFields.join(", ")}`);
        setIsSubmitting(false);
        return;
      }

      const formattedAnswers = Object.entries(answers).map(([fieldId, value]) => ({
        fieldId,
        value: typeof value === "string" ? value : String(value),
      }));

      const finalTeamName = teamName.trim();

      if (mode === "CREATE") {
        if (!finalTeamName) {
          toast.error("Please enter a team name");
          setIsSubmitting(false);
          return;
        }

        if (competition.isFree) {
          const result = await createTeam(token, {
            name: finalTeamName,
            hackathonId: competition.id,
            maxSize,
            isOpen: isOpenToggle,
            answers: formattedAnswers,
          });
          toast.success("Registration successful!");
          onSuccess?.(result);
          onClose();
        } else {
          await processPayment(token, finalTeamName, formattedAnswers, {});
        }
      } else {
        if (!invitationCode.trim()) {
          toast.error("Please enter invitation code");
          setIsSubmitting(false);
          return;
        }

        if (competition.isFree) {
          await joinTeam(token, {
            invitationCode: invitationCode.toUpperCase(),
            answers: formattedAnswers,
          });

          // Fetch the updated team to sync the UI immediately
          const myUpdatedTeam = await checkMyHackathonTeam(token, competition.id);

          toast.success("Joined team successfully!");
          if (myUpdatedTeam) {
            onSuccess?.(myUpdatedTeam);
          }
          onClose();
          router.push(`/hackathons/${competition.slug}?registered=true`);
        } else {
          if (competition.chargeMode === "PER_TEAM") {
            try {
              // PER_TEAM members do not pay themselves. The team leader already paid.
              await joinDraftTeam(token, competition.slug, { invitationCode: invitationCode.toUpperCase() });
              await submitRegistration(token, competition.slug, formattedAnswers);

              const myUpdatedTeam = await checkMyHackathonTeam(token, competition.id);

              toast.success("Joined team successfully!");
              if (myUpdatedTeam) {
                onSuccess?.(myUpdatedTeam);
              }

              onClose();
              router.push(`/hackathons/${competition.slug}?registered=true`);
            } catch (err) {
              toast.error(getApiErrorMessage(err, "Failed to join team"));
              setIsSubmitting(false);
              return;
            }
          } else {
            // PER_USER members must pay their entry fee to join.
            await processPayment(token, finalTeamName, formattedAnswers, { invitationCode: invitationCode.toUpperCase() });
          }
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(getApiErrorMessage(error, "Registration failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <DialogContent className="p-0 md:w-[460px] overflow-hidden sm:rounded-3xl border-none shadow-2xl max-h-full h-full sm:h-auto sm:max-h-[80vh] flex flex-col bg-neutral-100">
        {/* Header Area (Fixed) */}
        <div className="p-6 pb-4">
          <h2 className="mb-6 text-3xl font-medium tracking-tight text-neutral-900">
            Registration Form
          </h2>
          {!isIndividual && (
            <div className="flex gap-3">
              {[
                { title: "Create team", id: "CREATE" as RegistrationMode, icon: Users },
                { title: "Join existing team", id: "JOIN" as RegistrationMode, icon: UserPlus },
              ].map((e) => (
                <button
                  key={e.id}
                  onClick={() => setMode(e.id)}
                  className={cn(
                    "flex py-3 items-center gap-2 sm:gap-4 text-primary-600 font-medium bg-primary-100/50 flex-1 rounded-full justify-center truncate transition-all",
                    mode === e.id && "border-2 border-primary-600 bg-primary-100"
                  )}
                >
                  <e.icon className="h-4 w-4" />
                  <span className="truncate">{e.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden relative"
        >
          {/* Scrollable Fields area */}
          <div
            className="flex-1 overflow-y-auto px-6 py-2 scrollbar"
          >
            {mode === "CREATE" ? (
              <CreateTeamFormContent
                fields={competition.registrationForm?.fields || []}
                answers={answers}
                onUpdateAnswer={onUpdateAnswer}
                teamName={teamName}
                setTeamName={setTeamName}
                onFileSelect={handleFileSelect}
                isUploading={isUploading}
                uploadedFiles={uploadedFiles}
                isIndividual={isIndividual}
                isFree={competition.isFree}
                entryFeeAmount={competition.entryFeeAmount}
                feeBearer={competition.feeBearer}
                discountCode={discountCode}
                setDiscountCode={setDiscountCode}
                isOpenToggle={isOpenToggle}
                setIsOpenToggle={setIsOpenToggle}
              />
            ) : (
              <JoinTeamFormContent
                fields={competition.registrationForm?.fields || []}
                answers={answers}
                onUpdateAnswer={onUpdateAnswer}
                invitationCode={invitationCode}
                setInvitationCode={setInvitationCode}
                teams={teams}
                isLoadingTeams={isLoadingTeams}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onJoinTeam={(code: string) => {
                  setInvitationCode(code);
                }}
                onFileSelect={handleFileSelect}
                isUploading={isUploading}
                uploadedFiles={uploadedFiles}
                slug={competition.slug}
              />
            )}
          </div>

          {/* Footer Area (Fixed) */}
          <div className="p-6 pt-4">
            <div className="flex flex-col w-full gap-2 rounded-3xl border border-primary-600 bg-primary-100 p-1">
              <div className="flex items-center justify-center gap-3 py-2">
                <div className="h-5 w-5 overflow-hidden rounded-full border-2 border-white">
                  {user?.imageUrl ? (
                    <Image
                      src={user.imageUrl}
                      alt={user.fullName || "User"}
                      width={20}
                      height={20}
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-primary-600 flex items-center justify-center text-neutral-100 font-bold">
                      {user?.firstName?.[0] ||
                        user?.emailAddresses?.[0]?.emailAddress?.[0] ||
                        "U"}
                    </div>
                  )}
                </div>
                <div className="flex flex-col md:flex-row text-neutral-700 sm:items-center md:gap-2">
                  <span className="text-base font-medium truncate">
                    {user?.fullName || "User"}
                  </span>
                  <span className="text-base truncate">
                    {user?.primaryEmailAddress?.emailAddress}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="py-6 bg-primary-600 rounded-full w-full text-neutral-100"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : mode === "CREATE" ? (
                  isIndividual ? "Register" : "Register as team"
                ) : (
                  "Join team"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}