import React, { useState, useEffect, useCallback } from "react";
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
  checkMyHackathonTeam,
  type TeamDetailResponse,
} from "@/lib/api/teamApi";
import {
  createPaymentOrder,
  verifyPayment,
  submitRegistration,
} from "@/lib/api/paymentsApi";
import { getMe, submitOnboarding } from "@/lib/api/usersApi";
import type { CreateOnboardingDto, MeResponseDto } from "@oppskills/types/frontend";
import { mergeDefaultAndCustomFields } from "@/lib/registration/mergeRegistrationFields";
import {
  buildCreateOnboardingDtoFromRegistration,
  filterAnswersToMergedFieldIds,
} from "@/lib/registration/hackathonOnboardingFromAnswers";
import { presignDocumentUpload } from "@/lib/api/mediaApi";
import { uploadDocumentToS3PresignedPost } from "@/lib/uploads/uploadDocumentToS3";
import { getApiErrorMessage, cn } from "@/lib/utils";
import type { RegistrationModalProps, RegistrationMode } from "./RegistrationModal.types";
import { CreateTeamFormContent } from "./CreateTeamFormContent";
import { JoinTeamFormContent } from "./JoinTeamFormContent";
import type { RegistrationField } from "@/lib/registration/mergeRegistrationFields";

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

/**
 * After payment, verifyPayment or the Razorpay webhook may already have created the team.
 * A follow-up createDraftTeam/joinDraftTeam then races and throws — treat as safe to continue.
 */
function isBenignTeamAlreadyExistsError(err: unknown): boolean {
  const msg = getApiErrorMessage(err, "").toLowerCase();
  return (
    msg.includes("already in a team") ||
    msg.includes("already the leader of this team") ||
    msg.includes("already a member of this team")
  );
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
  const [mergedFields, setMergedFields] = useState<RegistrationField[]>([]);
  const [fieldsReady, setFieldsReady] = useState(false);
  const [onboardingProfile, setOnboardingProfile] = useState<
    MeResponseDto["onboardingProfile"]
  >(undefined);

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
      setMergedFields([]);
      setFieldsReady(false);
      setOnboardingProfile(undefined);
    } else {
      if (initialInvitationCode) {
        setInvitationCode(initialInvitationCode);
      }

      const fetchProfileAndInit = async () => {
        setFieldsReady(false);
        try {
          const token = await getToken();
          if (!token) return;
          const meData = await getMe(token);
          const profile = meData.onboardingProfile;
          setOnboardingProfile(profile ?? undefined);

          const merged = mergeDefaultAndCustomFields(
            competition.registrationForm?.fields as RegistrationField[] | undefined,
            profile?.userCategory,
          );
          setMergedFields(merged);

          const phone = user?.primaryPhoneNumber?.phoneNumber;
          const cat = profile?.userCategory;
          const initialAnswers: Record<string, unknown> = {};

          const setIf = (id: string, val: unknown) => {
            if (val !== undefined && val !== null && val !== "") {
              initialAnswers[id] = val;
            }
          };

          for (const field of merged) {
            const id = field.id;
            if (id === "default-name") {
              setIf(
                id,
                [meData.firstName, meData.lastName].filter(Boolean).join(" "),
              );
            } else if (id === "default-email") {
              setIf(id, meData.email);
            } else if (id === "default-phone") {
              setIf(id, phone);
            } else if (id === "default-gender") {
              setIf(id, profile?.gender);
            } else if (id === "default-school-name") {
              if (cat === "SCHOOL_STUDENT") setIf(id, profile?.schoolName);
            } else if (id === "default-school-class") {
              if (cat === "SCHOOL_STUDENT") setIf(id, profile?.schoolClass);
            } else if (id === "default-college-name") {
              if (
                cat === "COLLEGE_STUDENT" ||
                cat === "PROFESSIONAL_SCHOOL_STUDENT" ||
                cat === "FRESHER" ||
                !cat
              ) {
                setIf(id, profile?.college?.name);
              }
            } else if (id === "default-company-name") {
              if (cat === "WORKING_PROFESSIONAL") {
                setIf(id, profile?.companyName);
              }
            } else {
              const lowerLabel = field.label.toLowerCase();
              const prefillMap: Record<string, unknown> = {
                name: [meData.firstName, meData.lastName]
                  .filter(Boolean)
                  .join(" "),
                email: meData.email,
                phone,
                gender: profile?.gender,
              };
              Object.entries(prefillMap).forEach(([key, value]) => {
                if (
                  lowerLabel.includes(key) &&
                  value !== undefined &&
                  value !== null &&
                  value !== ""
                ) {
                  initialAnswers[field.id] = value;
                }
              });
            }
          }

          setAnswers(initialAnswers);
        } catch (error) {
          console.error("Failed to fetch profile:", error);
        } finally {
          setFieldsReady(true);
        }
      };

      void fetchProfileAndInit();

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
      void fetchTeams();
    }
  }, [
    isOpen,
    competition.id,
    getToken,
    user?.primaryPhoneNumber?.phoneNumber,
    competition.registrationForm?.fields,
    initialInvitationCode,
  ]);

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
            try {
              const draft = await joinDraftTeam(token, competition.slug, {
                invitationCode: opts.invitationCode,
              });
              teamId = (draft as { team?: { id: string } }).team?.id;
            } catch (e) {
              if (!isBenignTeamAlreadyExistsError(e)) throw e;
            }
          } else if (opts.teamId) {
            const draft = { team: { id: opts.teamId } };
            teamId = draft.team.id;
          } else {
            try {
              const draft = await createDraftTeam(token, competition.slug, {
                name: finalTeamName,
                maxSize,
              });
              teamId = draft.team.id;
            } catch (e) {
              if (!isBenignTeamAlreadyExistsError(e)) throw e;
            }
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
        description: "Hackathon registration",
        order_id: order.razorpayOrderId || order.orderId,
        handler: async (response: any) => {
          // Modal is already closed (onClose before rzp.open) so do not call setState here.
          // Use a global toast so the user sees progress/errors after pay.
          const completingId = toast.loading("Completing your registration…");
          try {
            const verifyToken = await getToken();
            if (!verifyToken) throw new Error("Authentication required. Please sign in and try again.");

            await verifyPayment(verifyToken, competition.slug, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (competition.chargeMode === "PER_USER") {
              if (opts.invitationCode) {
                try {
                  await joinDraftTeam(verifyToken, competition.slug, {
                    invitationCode: opts.invitationCode,
                  });
                } catch (e) {
                  if (!isBenignTeamAlreadyExistsError(e)) throw e;
                }
              } else if (!opts.teamId) {
                try {
                  await createDraftTeam(verifyToken, competition.slug, {
                    name: finalTeamName,
                    maxSize,
                  });
                } catch (e) {
                  if (!isBenignTeamAlreadyExistsError(e)) throw e;
                }
              }
            }

            await submitRegistration(verifyToken, competition.slug, formattedAnswers);

            const myUpdatedTeam = await checkMyHackathonTeam(verifyToken, competition.id);

            toast.dismiss(completingId);
            toast.success("Registration successful!");
            if (myUpdatedTeam) {
              onSuccess?.(myUpdatedTeam);
            }

            router.push(`/hackathons/${competition.slug}?registered=true`);
          } catch (err) {
            toast.dismiss(completingId);
            toast.error(
              getApiErrorMessage(
                err,
                "Registration could not be completed after payment. Please open Register again — you will not be charged twice.",
              ),
            );
          }
        },
        prefill: {
          name: user?.fullName || "",
          email: user?.primaryEmailAddress?.emailAddress || "",
          contact: user?.primaryPhoneNumber?.phoneNumber || "",
        },
        theme: {
          color: "#5B2E63",
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled");
          },
        },
      };

      if (!window.Razorpay) throw new Error("Razorpay not loaded");

      // Close the registration dialog BEFORE opening Razorpay (same as event registration flow).
      // Radix Dialog focus trap + overlay can block taps on the Razorpay iframe on mobile.
      onClose();

      requestAnimationFrame(() => {
        const rzp = new window.Razorpay(options);
        rzp.open();
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Payment failed"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldsReady) {
      toast.error("Loading registration form…");
      return;
    }
    setIsSubmitting(true);

    try {
      const token = await getToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const missingFields = mergedFields
        .filter((f) => f.required && !answers[f.id])
        .map((f) => f.label);

      if (missingFields.length > 0) {
        toast.error(
          `Please fill all required fields: ${missingFields.join(", ")}`,
        );
        return;
      }

      const mergedFieldIds = new Set(mergedFields.map((f) => f.id));
      const filteredFormatted = filterAnswersToMergedFieldIds(
        answers,
        mergedFieldIds,
      );

      let onboardingDto: CreateOnboardingDto;
      try {
        onboardingDto = buildCreateOnboardingDtoFromRegistration({
          answers,
          profile: onboardingProfile ?? null,
        });
      } catch (parseErr: unknown) {
        toast.error(
          parseErr instanceof Error
            ? parseErr.message
            : "Invalid profile or onboarding data.",
        );
        return;
      }

      try {
        await submitOnboarding(token, onboardingDto);
      } catch (onErr: unknown) {
        toast.error(
          getApiErrorMessage(
            onErr,
            "Could not save your profile. Check required fields.",
          ),
        );
        return;
      }

      const finalTeamName = teamName.trim();

      if (mode === "CREATE") {
        if (!finalTeamName) {
          toast.error("Please enter a team name");
          return;
        }

        if (competition.isFree) {
          const result = await createTeam(token, {
            name: finalTeamName,
            hackathonId: competition.id,
            maxSize,
            isOpen: isOpenToggle,
            answers: filteredFormatted,
          });
          toast.success("Registration successful!");
          onSuccess?.(result);
          onClose();
        } else {
          await processPayment(token, finalTeamName, filteredFormatted, {});
        }
      } else {
        if (!invitationCode.trim()) {
          toast.error("Please enter invitation code");
          return;
        }

        if (competition.isFree) {
          await joinTeam(token, {
            invitationCode: invitationCode.toUpperCase(),
            answers: filteredFormatted,
          });

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
              await joinDraftTeam(token, competition.slug, {
                invitationCode: invitationCode.toUpperCase(),
              });
              await submitRegistration(
                token,
                competition.slug,
                filteredFormatted,
              );

              const myUpdatedTeam = await checkMyHackathonTeam(
                token,
                competition.id,
              );

              toast.success("Joined team successfully!");
              if (myUpdatedTeam) {
                onSuccess?.(myUpdatedTeam);
              }

              onClose();
              router.push(`/hackathons/${competition.slug}?registered=true`);
            } catch (err) {
              toast.error(getApiErrorMessage(err, "Failed to join team"));
              return;
            }
          } else {
            await processPayment(token, finalTeamName, filteredFormatted, {
              invitationCode: invitationCode.toUpperCase(),
            });
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
        <div className="p-6 pb-4 shadow-sm">
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
          className="flex flex-col flex-1 overflow-y-auto relative scrollbar"
        >
          {/* Fields area */}
          <div
            className="px-6 py-2"
          >
            {mode === "CREATE" ? (
              <CreateTeamFormContent
                fields={mergedFields}
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
                fields={mergedFields}
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

          {/* Footer Area */}
          <div className="p-6 pt-6 mt-auto">
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
                disabled={isSubmitting || isUploading || !fieldsReady}
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