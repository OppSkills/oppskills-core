import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQueryState } from "nuqs";
import { Users, UserPlus, Loader2 } from "lucide-react";
import Script from "next/script";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  saveHackathonRegistrationCheckoutDraft,
} from "@/lib/api/paymentsApi";
import {
  joinEvent,
  checkMyRegistration,
  createEventPaymentOrder,
  verifyEventPayment,
  submitMissingRegistrationAnswers,
  saveEventRegistrationCheckoutDraft,
} from "@/lib/api/eventApi";
import { getMe, submitOnboarding, updateProfile } from "@/lib/api/usersApi";
import type { MeResponseDto } from "@oppskills/types";
import { UserCategoryValue } from "@oppskills/types/enums";
import { mergeDefaultAndCustomFields } from "@/lib/registration/mergeRegistrationFields";
import {
  EMPTY_REGISTRATION_ONBOARDING,
  type RegistrationOnboardingErrors,
  type RegistrationOnboardingValues,
} from "@/lib/registration/registrationOnboardingTypes";
import {
  buildCreateOnboardingDtoFromRegistration,
  buildProfileNameUpdate,
  buildRegistrationSubmissionAnswers,
  clearRegistrationOnboardingForCategory,
  injectOnboardingIntoRegistrationAnswers,
  prefillRegistrationOnboarding,
  validateRegistrationOnboarding,
} from "@/lib/registration/registrationOnboardingSync";
import { presignDocumentUpload } from "@/lib/api/mediaApi";
import { uploadDocumentToS3PresignedPost } from "@/lib/uploads/uploadDocumentToS3";
import { getApiErrorMessage, cn, ensureAbsoluteUrl } from "@/lib/utils";
import { withRetry } from "@/lib/utils/retry";
import { SITE_URL } from "@/lib/constants";
import {
  writePendingHackathonRegistration,
  writePendingEventRegistration,
  clearPendingHackathonRegistration,
  clearPendingEventRegistration,
} from "@/lib/registration/pendingHackathonRegistration";
import { isFreeTicketTierId } from "@/lib/registration/ticketTierUtils";
import { writeHackathonCheckoutIntent } from "@/lib/registration/hackathonCheckoutIntent";
import type {
  RegistrationModalProps,
  RegistrationMode,
} from "./RegistrationModal.types";
import { CreateTeamFormContent } from "./CreateTeamFormContent";
import { JoinTeamFormContent } from "./JoinTeamFormContent";
import type { RegistrationField } from "@/lib/registration/mergeRegistrationFields";
import { mapMaxSize } from "./transform";

declare global {
  interface Window {
    Razorpay: any;
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

async function completeHackathonFreeTierRegistration(
  token: string,
  competition: RegistrationModalProps["competition"],
  formattedAnswers: Array<{ fieldId: string; value: string }>,
  ticketTierId: string,
  opts: {
    finalTeamName: string;
    maxSize: number;
    teamId?: string;
    invitationCode?: string;
  },
) {
  const realTierId =
    ticketTierId && ticketTierId !== "__free__" ? ticketTierId : undefined;
  if (!realTierId) {
    throw new Error("Please select a ticket type");
  }

  if (competition.chargeMode === "PER_USER") {
    if (opts.invitationCode) {
      try {
        await joinDraftTeam(token, competition.slug, {
          invitationCode: opts.invitationCode,
          ticketTierId: realTierId,
        });
      } catch (e) {
        if (!isBenignTeamAlreadyExistsError(e)) throw e;
      }
    } else if (opts.teamId) {
      try {
        await joinDraftTeam(token, competition.slug, {
          teamId: opts.teamId,
          ticketTierId: realTierId,
        });
      } catch (e) {
        if (!isBenignTeamAlreadyExistsError(e)) throw e;
      }
    } else {
      try {
        await createDraftTeam(token, competition.slug, {
          name: opts.finalTeamName,
          maxSize: opts.maxSize,
        });
      } catch (e) {
        if (!isBenignTeamAlreadyExistsError(e)) throw e;
      }
    }
  } else if (!opts.teamId) {
    try {
      await createDraftTeam(token, competition.slug, {
        name: opts.finalTeamName,
        maxSize: opts.maxSize,
      });
    } catch (e) {
      if (!isBenignTeamAlreadyExistsError(e)) throw e;
    }
  }

  await submitRegistration(
    token,
    competition.slug,
    formattedAnswers,
    realTierId,
  );
}

export function RegistrationModal({
  isOpen,
  onClose,
  competition,
  onSuccess,
  initialMode,
  initialInvitationCode,
  type = "HACKATHON",
  completionMode = false,
  pageSelectedTicketTierId = null,
  omitTicketTierSection = false,
  prefillAnswers,
  paymentCompleted = false,
  teamId,
  isLeader,
}: RegistrationModalProps) {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [registrationMode, setRegistrationMode] = useQueryState("registration");
  const mode: RegistrationMode =
    registrationMode === "join" ? "JOIN" : "CREATE";
  const setMode = (newMode: RegistrationMode) =>
    setRegistrationMode(newMode.toLowerCase());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Form states
  const [teamName, setTeamName] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, { name: string; url: string }>
  >({});
  const [invitationCode, setInvitationCode] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [ticketTierId, setTicketTierId] = useState<string | undefined>(
    undefined,
  );
  const [isOpenToggle, setIsOpenToggle] = useState(true);

  const selectedTierDisplayName = useMemo(() => {
    if (!ticketTierId || !(competition.ticketTiers?.length ?? 0)) return null;
    const t = competition.ticketTiers?.find(
      (x: { id: string }) => x.id === ticketTierId,
    ) as { name?: string } | undefined;
    return t?.name ?? null;
  }, [ticketTierId, competition.ticketTiers]);

  // Team search state
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [teams, setTeams] = useState<TeamDetailResponse[]>([]);
  const [mergedFields, setMergedFields] = useState<RegistrationField[]>([]);
  const [fieldsReady, setFieldsReady] = useState(false);
  const [onboardingProfile, setOnboardingProfile] =
    useState<MeResponseDto["onboardingProfile"]>(undefined);
  const [meData, setMeData] = useState<MeResponseDto | null>(null);
  const [onboardingValues, setOnboardingValues] =
    useState<RegistrationOnboardingValues>(EMPTY_REGISTRATION_ONBOARDING);
  const [onboardingErrors, setOnboardingErrors] =
    useState<RegistrationOnboardingErrors>({});

  const maxSize = mapMaxSize(competition.participantType || "");
  const isIndividual =
    type === "EVENT" || competition.participantType === "INDIVIDUAL";

  const onUpdateAnswer = useCallback((fieldId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleOnboardingChange = useCallback(
    (next: RegistrationOnboardingValues) => {
      setOnboardingValues((prev) => {
        if (
          next.userCategory &&
          next.userCategory !== prev.userCategory
        ) {
          return clearRegistrationOnboardingForCategory(
            next,
            next.userCategory as UserCategoryValue,
          );
        }
        return next;
      });
      setOnboardingErrors({});
    },
    [],
  );

  useEffect(() => {
    if (!isOpen || !fieldsReady) return;
    const merged = mergeDefaultAndCustomFields(
      competition.registrationForm?.fields as RegistrationField[] | undefined,
      onboardingValues.userCategory || onboardingProfile?.userCategory,
      { includeOnboardingBlock: true },
    );
    setMergedFields(merged);
  }, [
    isOpen,
    fieldsReady,
    onboardingValues.userCategory,
    onboardingProfile?.userCategory,
    competition.registrationForm?.fields,
  ]);

  const onboardingFieldProps = {
    onboardingValues,
    onOnboardingChange: handleOnboardingChange,
    onboardingErrors,
    showTeamPreference: type === "HACKATHON",
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTeamName("");
      setAnswers({});
      setUploadedFiles({});
      setInvitationCode("");
      setDiscountCode("");
      setTicketTierId(undefined);
      setSearchQuery("");
      setMergedFields([]);
      setFieldsReady(false);
      setOnboardingProfile(undefined);
      setMeData(null);
      setOnboardingValues(EMPTY_REGISTRATION_ONBOARDING);
      setOnboardingErrors({});
    } else {
      if (initialInvitationCode) {
        setInvitationCode(initialInvitationCode);
      }

      const activeTiers = (competition.ticketTiers ?? []).filter(
        (t: { isActive?: boolean }) => t.isActive !== false,
      ) as Array<{ id: string }>;
      if (activeTiers.length > 0) {
        const fromPage =
          pageSelectedTicketTierId &&
          activeTiers.some((t) => t.id === pageSelectedTicketTierId)
            ? pageSelectedTicketTierId
            : undefined;
        setTicketTierId(fromPage ?? activeTiers[0].id);
      } else {
        setTicketTierId(undefined);
      }

      const fetchProfileAndInit = async () => {
        setFieldsReady(false);
        try {
          const token = await getToken();
          if (!token) return;
          const me = await getMe(token);
          const profile = me.onboardingProfile;
          setMeData(me);
          setOnboardingProfile(profile ?? undefined);

          const prefilledOnboarding = prefillRegistrationOnboarding({
            me,
            phone: user?.primaryPhoneNumber?.phoneNumber,
          });
          setOnboardingValues(prefilledOnboarding);

          const merged = mergeDefaultAndCustomFields(
            competition.registrationForm?.fields as
              | RegistrationField[]
              | undefined,
            prefilledOnboarding.userCategory || profile?.userCategory,
            { includeOnboardingBlock: true },
          );
          setMergedFields(merged);

          const phone =
            profile?.mobileNumber || user?.primaryPhoneNumber?.phoneNumber;
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
                [me.firstName, me.lastName].filter(Boolean).join(" "),
              );
            } else if (id === "default-email") {
              setIf(id, me.email);
            } else if (id === "default-phone") {
              setIf(id, phone);
            } else {
              const lowerLabel = field.label.toLowerCase();
              const prefillMap: Record<string, unknown> = {
                name: [me.firstName, me.lastName].filter(Boolean).join(" "),
                email: me.email,
                phone,
                gender: profile?.gender,
                city: profile?.locationCoords,
                state: profile?.locationState,
                country: profile?.locationCountry,
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

          if (
            (type === "EVENT" || type === "HACKATHON") &&
            prefillAnswers?.length
          ) {
            for (const row of prefillAnswers) {
              if (
                row.fieldId &&
                row.value !== undefined &&
                row.value !== null &&
                row.value !== ""
              ) {
                initialAnswers[row.fieldId] = row.value;
              }
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

      if (type === "HACKATHON") {
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
    }
  }, [
    isOpen,
    competition.id,
    getToken,
    user?.primaryPhoneNumber?.phoneNumber,
    competition.registrationForm?.fields,
    competition.ticketTiers,
    pageSelectedTicketTierId,
    initialInvitationCode,
    type,
    prefillAnswers,
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

        setUploadedFiles((prev) => ({ ...prev, [fieldId]: fileData }));
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
    opts: { teamId?: string; invitationCode?: string },
  ) => {
    try {
      if (type === "EVENT") {
        const eventTicketTiers = (competition as any).ticketTiers as
          | Array<{ id: string; isFree?: boolean; price?: unknown }>
          | undefined;
        const selectedFreeTier = isFreeTicketTierId(
          ticketTierId,
          eventTicketTiers,
        );

        if (competition.isFree || selectedFreeTier) {
          writePendingEventRegistration(competition.slug, {
            answers: formattedAnswers,
            userId: user?.id,
          });
          await joinEvent(token, competition.id, {
            answers: formattedAnswers,
            ticketTierId: selectedFreeTier ? ticketTierId : undefined,
          });
          clearPendingEventRegistration(competition.slug);
          toast.success("Successfully registered for the event!");
          onSuccess?.(null);
          onClose();
          router.push(`/events/${competition.slug}?registered=true`);
          return;
        }

        const isPaidEvent =
          !competition.isFree &&
          (((competition as any).ticketTiers?.length ?? 0) > 0 ||
            !!(competition as any).entryFeeAmount);

        if (isPaidEvent && !completionMode) {
          try {
            await saveEventRegistrationCheckoutDraft(token, competition.slug, {
              answers: formattedAnswers,
              ticketTierId,
            });
            toast.success("Saved. Continue to secure checkout.");
            clearPendingEventRegistration(competition.slug);
            onClose();
            const tierQ =
              ticketTierId != null
                ? `?tier=${encodeURIComponent(ticketTierId)}`
                : "";
            router.push(`/events/${competition.slug}/checkout${tierQ}`);
            return;
          } catch (e) {
            const msg = getApiErrorMessage(e, "");
            if (
              msg.toLowerCase().includes("free entry") ||
              msg.toLowerCase().includes("without this checkout")
            ) {
              // Free college etc.: fall through to order + join / zero path below
            } else {
              throw e;
            }
          }
        }

        const order = await createEventPaymentOrder(token, competition.slug, {
          ticketTierId,
          answers: formattedAnswers,
        });

        if (order.zeroAmountPayment || order.amountPaise === 0) {
          await joinEvent(token, competition.id, { answers: formattedAnswers });

          toast.success("Successfully registered for the event!");
          onSuccess?.(null);
          onClose();
          router.push(`/events/${competition.slug}?registered=true`);
          return;
        }

        const options = {
          key: order.razorpayKey || (order as any).keyId,
          amount: order.amountPaise,
          currency: order.currency,
          name: competition.title || (competition as any).name,
          description: "Event registration",
          order_id: order.razorpayOrderId || (order as any).orderId,
          /** Mobile redirect flows: return to app if checkout kills the tab */
          callback_url: `${SITE_URL}/events/${competition.slug}?razorpay_return=1`,
          handler: async (response: any) => {
            const completingId = toast.loading("Completing your registration…");
            try {
              const verifyToken = await getToken();
              if (!verifyToken) throw new Error("Authentication required.");

              await withRetry(() =>
                verifyEventPayment(verifyToken, competition.slug, {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  answers: formattedAnswers,
                }),
              );

              toast.dismiss(completingId);
              toast.success("Registration successful!");
              clearPendingEventRegistration(competition.slug);
              onSuccess?.(null);
              router.push(`/events/${competition.slug}?registered=true`);
            } catch (err) {
              toast.dismiss(completingId);
              toast.error(
                getApiErrorMessage(err, "Registration verification failed."),
              );
            }
          },
          prefill: {
            name: user?.fullName || "",
            email: user?.primaryEmailAddress?.emailAddress || "",
            contact: user?.primaryPhoneNumber?.phoneNumber || "",
          },
          theme: { color: "#5B2E63" },
          modal: { ondismiss: () => toast.info("Payment cancelled") },
        };

        if (!window.Razorpay) throw new Error("Razorpay not loaded");
        writePendingEventRegistration(competition.slug, {
          answers: formattedAnswers,
          userId: user?.id,
        });
        onClose();
        requestAnimationFrame(() => {
          new window.Razorpay(options).open();
        });
        return;
      }

      if (type === "HACKATHON" && !competition.isFree) {
        const hackathonTiers = (
          competition as {
            ticketTiers?: Array<{
              id: string;
              isFree?: boolean;
              price?: unknown;
            }>;
          }
        ).ticketTiers;
        const selectedFreeTier = isFreeTicketTierId(
          ticketTierId,
          hackathonTiers,
        );
        if (selectedFreeTier && ticketTierId) {
          await completeHackathonFreeTierRegistration(
            token,
            competition,
            formattedAnswers,
            ticketTierId,
            {
              finalTeamName,
              maxSize,
              teamId: opts.teamId,
              invitationCode: opts.invitationCode,
            },
          );
          const myUpdatedTeam = await checkMyHackathonTeam(
            token,
            competition.id,
          );
          clearPendingHackathonRegistration(competition.slug);
          toast.success("Registration successful!");
          if (myUpdatedTeam) {
            onSuccess?.(myUpdatedTeam);
          }
          onClose();
          router.push(`/hackathons/${competition.slug}?registered=true`);
          return;
        }
      }

      const orderParams: {
        discountCode?: string;
        ticketTierId?: string;
        teamId?: string;
        teamName?: string;
        maxSize?: number;
        invitationCode?: string;
        joinTeamId?: string;
        answers?: Array<{ fieldId: string; value: string }>;
      } = {
        discountCode: discountCode.trim() || undefined,
        ticketTierId,
        answers: formattedAnswers,
      };

      if (competition.chargeMode === "PER_TEAM") {
        if (opts.teamId) {
          orderParams.teamId = opts.teamId;
        } else {
          orderParams.teamName = finalTeamName;
          orderParams.maxSize = maxSize;
        }
      } else if (competition.chargeMode === "PER_USER") {
        if (opts.invitationCode) {
          orderParams.invitationCode = opts.invitationCode;
        } else if (opts.teamId) {
          orderParams.joinTeamId = opts.teamId;
        } else {
          orderParams.teamName = finalTeamName;
          orderParams.maxSize = maxSize;
        }
      }

      if (
        type === "HACKATHON" &&
        (!completionMode || !paymentCompleted) &&
        !competition.isFree
      ) {
        // Strip synthetic '__free__' id before sending to backend.
        const realTierId =
          ticketTierId && ticketTierId !== "__free__"
            ? ticketTierId
            : undefined;
        await saveHackathonRegistrationCheckoutDraft(token, competition.slug, {
          answers: formattedAnswers,
          ticketTierId: realTierId,
          teamId: orderParams.teamId,
          teamName: orderParams.teamName,
          maxSize: orderParams.maxSize,
          invitationCode: orderParams.invitationCode,
          joinTeamId: orderParams.joinTeamId,
        });
        writeHackathonCheckoutIntent(competition.slug, {
          discountCode: orderParams.discountCode,
          ticketTierId: realTierId,
          teamId: orderParams.teamId,
          teamName: orderParams.teamName,
          maxSize: orderParams.maxSize,
          invitationCode: orderParams.invitationCode,
          joinTeamId: orderParams.joinTeamId,
        });
        writePendingHackathonRegistration(competition.slug, {
          answers: formattedAnswers,
          teamName: opts.invitationCode ? undefined : finalTeamName,
          maxSize,
          invitationCode: opts.invitationCode,
          joinTeamId: orderParams.joinTeamId,
          ticketTierId: realTierId,
          userId: user?.id,
        });
        toast.success("Saved. Continue to secure checkout.");
        onClose();
        const tierQ =
          realTierId != null ? `?tier=${encodeURIComponent(realTierId)}` : "";
        router.push(`/hackathons/${competition.slug}/checkout${tierQ}`);
        return;
      }

      const order = await createPaymentOrder(
        token,
        competition.slug,
        orderParams,
      );

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
            try {
              const draft = await joinDraftTeam(token, competition.slug, {
                teamId: opts.teamId,
              });
              teamId = (draft as { team?: { id: string } }).team?.id;
            } catch (e) {
              if (!isBenignTeamAlreadyExistsError(e)) throw e;
            }
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

      const tierQHack =
        ticketTierId != null
          ? `?tier=${encodeURIComponent(ticketTierId)}&razorpay_return=1`
          : `?razorpay_return=1`;

      await saveHackathonRegistrationCheckoutDraft(token, competition.slug, {
        answers: formattedAnswers,
        ticketTierId,
        teamId: orderParams.teamId,
        teamName: orderParams.teamName,
        maxSize: orderParams.maxSize,
        invitationCode: orderParams.invitationCode,
        joinTeamId: orderParams.joinTeamId,
      });
      writeHackathonCheckoutIntent(competition.slug, {
        discountCode: orderParams.discountCode,
        ticketTierId,
        teamId: orderParams.teamId,
        teamName: orderParams.teamName,
        maxSize: orderParams.maxSize,
        invitationCode: orderParams.invitationCode,
        joinTeamId: orderParams.joinTeamId,
      });

      const options = {
        key: order.razorpayKeyId || order.keyId,
        amount: order.amountPaise,
        currency: order.currency,
        name: competition.title || (competition as any).name,
        description: "Hackathon registration",
        order_id: order.razorpayOrderId || order.orderId,
        /** Mobile redirect: dedicated checkout page runs verify from query params */
        callback_url: `${SITE_URL}/hackathons/${competition.slug}/checkout${tierQHack}`,
        handler: async (response: any) => {
          // Modal is already closed (onClose before rzp.open) so do not call setState here.
          // Use a global toast so the user sees progress/errors after pay.
          const completingId = toast.loading("Completing your registration…");
          try {
            const verifyToken = await getToken();
            if (!verifyToken)
              throw new Error(
                "Authentication required. Please sign in and try again.",
              );

            await withRetry(() =>
              verifyPayment(verifyToken, competition.slug, {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                answers: formattedAnswers,
              }),
            );

            const myUpdatedTeam =
              type === "HACKATHON"
                ? await checkMyHackathonTeam(verifyToken, competition.id)
                : null;

            toast.dismiss(completingId);
            toast.success("Registration successful!");
            clearPendingHackathonRegistration(competition.slug);
            if (myUpdatedTeam) {
              onSuccess?.(myUpdatedTeam);
            }

            const redirectPath =
              type === "HACKATHON"
                ? `/hackathons/${competition.slug}`
                : `/events/${competition.slug}`;
            router.push(`${redirectPath}?registered=true`);
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

      writePendingHackathonRegistration(competition.slug, {
        answers: formattedAnswers,
        teamName: opts.invitationCode ? undefined : finalTeamName,
        maxSize,
        invitationCode: opts.invitationCode,
        joinTeamId: orderParams.joinTeamId,
        ticketTierId,
        userId: user?.id,
      });

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

      const onboardingValidation = validateRegistrationOnboarding(
        onboardingValues,
      );
      if (!onboardingValidation.isValid) {
        setOnboardingErrors(onboardingValidation.errors);
        toast.error("Please complete your profile details.");
        return;
      }
      setOnboardingErrors({});

      const answersWithOnboarding = injectOnboardingIntoRegistrationAnswers(
        answers,
        onboardingValues,
      );

      const missingFields = mergedFields
        .filter((f) => f.required && !answersWithOnboarding[f.id])
        .map((f) => f.label);

      if (missingFields.length > 0) {
        toast.error(
          `Please fill all required fields: ${missingFields.join(", ")}`,
        );
        return;
      }

      const mergedFieldIds = new Set(mergedFields.map((f) => f.id));
      const filteredFormatted = buildRegistrationSubmissionAnswers(
        answersWithOnboarding,
        mergedFieldIds,
      );

      // Defensive check: if the form has fields, answers should not be empty.
      // This catches edge cases where field IDs mismatch or form state was lost.
      if (mergedFields.length > 0 && filteredFormatted.length === 0) {
        console.warn(
          "[RegistrationModal] filteredFormatted is empty but mergedFields has entries",
          {
            mergedFieldCount: mergedFields.length,
            answerKeys: Object.keys(answers),
          },
        );
        toast.error(
          "Registration form answers are missing. Please fill in the required fields.",
        );
        return;
      }

      const activeRegTiers = (competition.ticketTiers ?? []).filter(
        (t: { isActive?: boolean }) => t.isActive !== false,
      );
      // isFree=false always goes through ticket/payment flow (even ₹0).
      const isPaidOpportunity = !competition.isFree;
      // Block only when user has NOT chosen among multiple real tiers.
      if (
        isPaidOpportunity &&
        activeRegTiers.length > 1 &&
        (!ticketTierId || ticketTierId === "__free__")
      ) {
        toast.error("Please select a ticket type before continuing.");
        return;
      }

      let onboardingDto;
      try {
        onboardingDto = buildCreateOnboardingDtoFromRegistration({
          onboarding: onboardingValues,
          answers: answersWithOnboarding,
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

      const fullName = answersWithOnboarding["default-name"];
      if (typeof fullName === "string") {
        const nameUpdate = buildProfileNameUpdate(fullName, {
          firstName: meData?.firstName,
          lastName: meData?.lastName,
        });
        if (nameUpdate) {
          try {
            await updateProfile(token, nameUpdate);
          } catch (profileErr: unknown) {
            console.warn("Profile name sync failed:", profileErr);
          }
        }
      }

      if (completionMode && type === "HACKATHON") {
        if (!paymentCompleted && !competition.isFree) {
          await processPayment(token, teamName, filteredFormatted, {
            teamId: teamId,
            invitationCode: isLeader ? undefined : invitationCode || undefined,
          });
          return;
        }
        const freeTierId =
          ticketTierId &&
          isFreeTicketTierId(
            ticketTierId,
            (
              competition as {
                ticketTiers?: Array<{
                  id: string;
                  isFree?: boolean;
                  price?: unknown;
                }>;
              }
            ).ticketTiers,
          )
            ? ticketTierId
            : undefined;
        await submitRegistration(
          token,
          competition.slug,
          filteredFormatted,
          freeTierId,
        );
        const myUpdatedTeam = await checkMyHackathonTeam(token, competition.id);
        toast.success("Registration successful!");
        if (myUpdatedTeam) {
          onSuccess?.(myUpdatedTeam);
        }
        onClose();
        router.push(`/hackathons/${competition.slug}?registered=true`);
        return;
      }

      if (completionMode && type === "EVENT") {
        await submitMissingRegistrationAnswers(
          token,
          competition.id,
          filteredFormatted,
        );
        toast.success("Registration successful!");
        onSuccess?.(null);
        onClose();
        router.push(`/events/${competition.slug}?registered=true`);
        return;
      }

      const finalTeamName = teamName.trim();

      if (type === "EVENT") {
        const eventTicketTiers = (competition as any).ticketTiers as
          | Array<{ id: string; isFree?: boolean; price?: unknown }>
          | undefined;
        const selectedFreeTier = isFreeTicketTierId(
          ticketTierId,
          eventTicketTiers,
        );

        if (competition.isFree || selectedFreeTier) {
          writePendingEventRegistration(competition.slug, {
            answers: filteredFormatted as Array<{
              fieldId: string;
              value: string;
            }>,
            userId: user?.id,
          });
          await joinEvent(token, competition.id, {
            answers: filteredFormatted,
            ticketTierId: selectedFreeTier ? ticketTierId : undefined,
          });
          clearPendingEventRegistration(competition.slug);
          toast.success("Registration successful!");
          onSuccess?.(null);
          onClose();
          router.push(`/events/${competition.slug}?registered=true`);
        } else {
          await processPayment(token, "", filteredFormatted, {});
        }
        return;
      }

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
        } else if (
          isFreeTicketTierId(
            ticketTierId,
            (
              competition as {
                ticketTiers?: Array<{
                  id: string;
                  isFree?: boolean;
                  price?: unknown;
                }>;
              }
            ).ticketTiers,
          ) &&
          ticketTierId
        ) {
          await completeHackathonFreeTierRegistration(
            token,
            competition,
            filteredFormatted,
            ticketTierId,
            { finalTeamName, maxSize },
          );
          const myUpdatedTeam = await checkMyHackathonTeam(
            token,
            competition.id,
          );
          toast.success("Registration successful!");
          if (myUpdatedTeam) {
            onSuccess?.(myUpdatedTeam);
          }
          onClose();
          router.push(`/hackathons/${competition.slug}?registered=true`);
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
        } else if (
          isFreeTicketTierId(
            ticketTierId,
            (
              competition as {
                ticketTiers?: Array<{
                  id: string;
                  isFree?: boolean;
                  price?: unknown;
                }>;
              }
            ).ticketTiers,
          ) &&
          ticketTierId
        ) {
          try {
            await completeHackathonFreeTierRegistration(
              token,
              competition,
              filteredFormatted,
              ticketTierId,
              {
                finalTeamName,
                maxSize,
                invitationCode: invitationCode.toUpperCase(),
              },
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
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(getApiErrorMessage(error, "Registration failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPaidWithTier =
    !competition.isFree &&
    (!completionMode || !paymentCompleted) &&
    !!ticketTierId &&
    !isFreeTicketTierId(ticketTierId, competition.ticketTiers) &&
    (competition.ticketTiers ?? []).some(
      (t: { id: string; isActive?: boolean }) =>
        t.id === ticketTierId && t.isActive !== false,
    );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <DialogContent className="p-0 md:w-[460px] overflow-hidden sm:rounded-3xl border-none shadow-2xl max-h-full h-full sm:h-auto sm:max-h-[80vh] flex flex-col bg-neutral-100">
        {/* Header Area (Fixed) */}
        <div className="p-6 pb-4 shadow-sm">
          <h2 className="text-3xl font-medium tracking-tight text-neutral-900">
            {completionMode && (type === "HACKATHON" || type === "EVENT")
              ? "Complete registration"
              : "Registration"}
          </h2>
          {!completionMode && selectedTierDisplayName ? (
            <p className="mt-2 text-sm text-neutral-600 leading-snug">
              Registering with the{" "}
              <span className="font-semibold text-[#7E22CE]">
                {selectedTierDisplayName}
              </span>{" "}
              ticket.
            </p>
          ) : null}
          {!isIndividual && !completionMode && (
            <div className="flex gap-3">
              {[
                {
                  title: "Create team",
                  id: "CREATE" as RegistrationMode,
                  icon: Users,
                },
                {
                  title: "Join existing team",
                  id: "JOIN" as RegistrationMode,
                  icon: UserPlus,
                },
              ].map((e) => (
                <button
                  key={e.id}
                  onClick={() => setMode(e.id)}
                  className={cn(
                    "flex py-3 items-center gap-2 sm:gap-4 text-primary-600 font-medium bg-primary-100/50 flex-1 rounded-full justify-center truncate transition-all",
                    mode === e.id &&
                      "border-2 border-primary-600 bg-primary-100",
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
          <div className="px-6 py-2">
            {completionMode && type === "HACKATHON" ? (
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
                ticketTiers={competition.ticketTiers}
                ticketTierId={ticketTierId}
                setTicketTierId={setTicketTierId}
                isOpenToggle={isOpenToggle}
                setIsOpenToggle={setIsOpenToggle}
                type={type}
                completionMode
                paymentCompleted={paymentCompleted}
                omitTicketTierSection={omitTicketTierSection}
                {...onboardingFieldProps}
              />
            ) : completionMode && type === "EVENT" ? (
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
                ticketTiers={competition.ticketTiers}
                ticketTierId={ticketTierId}
                setTicketTierId={setTicketTierId}
                isOpenToggle={isOpenToggle}
                setIsOpenToggle={setIsOpenToggle}
                type={type}
                completionMode
                paymentCompleted={paymentCompleted}
                omitTicketTierSection={omitTicketTierSection}
                {...onboardingFieldProps}
              />
            ) : mode === "CREATE" ? (
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
                {...(type === "EVENT" ? {} : { discountCode, setDiscountCode })}
                ticketTiers={competition.ticketTiers}
                ticketTierId={ticketTierId}
                setTicketTierId={setTicketTierId}
                isOpenToggle={isOpenToggle}
                setIsOpenToggle={setIsOpenToggle}
                type={type}
                omitTicketTierSection={omitTicketTierSection}
                {...onboardingFieldProps}
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
                {...onboardingFieldProps}
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
                      src={ensureAbsoluteUrl(user.imageUrl)}
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
                ) : completionMode &&
                  (type === "HACKATHON" || type === "EVENT") ? (
                  "Submit registration"
                ) : isPaidWithTier ? (
                  "Continue to payment"
                ) : mode === "CREATE" ? (
                  isIndividual ? (
                    "Register"
                  ) : (
                    "Register as team"
                  )
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
