"use client";

import React, { memo, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { X, Loader2, Check, BadgeCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/nextjs";
import {
  useCreateReferral,
  useReferrerLookup,
  useReferrals,
} from "@/hooks/useReferrals";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import type { ReferralEntityType } from "@/lib/api/referralApi";
import { cn } from "@/lib/utils";

interface AddReferrerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: ReferralEntityType;
  entityId: string;
}

export const AddReferrerModal = memo(function AddReferrerModal({
  isOpen,
  onOpenChange,
  entityType,
  entityId,
}: AddReferrerModalProps) {
  const [email, setEmail] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  /**
   * Debounce the email used for the lookup query. Typing fires a re-render per
   * keystroke, but we only want to hit the backend once the user has paused.
   */
  useEffect(() => {
    const trimmed = email.trim();
    const id = window.setTimeout(() => setDebouncedEmail(trimmed), 400);
    return () => window.clearTimeout(id);
  }, [email]);
  const isEmailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(debouncedEmail),
    [debouncedEmail],
  );
  const lookup = useReferrerLookup(
    entityType,
    entityId,
    debouncedEmail,
    isOpen && isEmailValid,
  );
  const createReferral = useCreateReferral(entityType, entityId);
  const { user: currentUser } = useUser();
  const { data: referralsData } = useReferrals(entityType, entityId);

  const currentUserEmail =
    currentUser?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const alreadyExistingEmails = useMemo(() => {
    return new Set(
      referralsData?.data.map((r) => r.referrer.email.toLowerCase()) || [],
    );
  }, [referralsData]);

  const isSelfReferral = useMemo(() => {
    if (!lookup.data || !currentUserEmail) return false;
    return lookup.data.email.toLowerCase() === currentUserEmail;
  }, [lookup.data, currentUserEmail]);

  const isDuplicate = useMemo(() => {
    if (!lookup.data) return false;
    return alreadyExistingEmails.has(lookup.data.email.toLowerCase());
  }, [lookup.data, alreadyExistingEmails]);

  const isInvalidSelection = isSelfReferral || isDuplicate;

  async function onAddReferrer() {
    const targetEmail = selectedEmail ?? email.trim();
    if (!targetEmail) return;
    await createReferral.mutateAsync({ referrerEmail: targetEmail, sendEmail });
    toast.success("Referrer added successfully");
    setEmail("");
    setSelectedEmail(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="ph-no-capture max-w-[90vw] sm:max-w-xl p-0 overflow-hidden border-none bg-background rounded-3xl! shadow-2xl"
      >
        <div className="relative">
          <DialogDescription className="sr-only">
            Invite an existing OppSkills user as a referrer for this listing.
          </DialogDescription>
          {/* Header */}
          <DialogHeader className="bg-neutral-300 px-6 py-5 flex flex-row justify-between items-center sm:rounded-t-3xl">
            <DialogTitle className="text-2xl font-semibold text-neutral-900 font-sans!">
              Add Referrer
            </DialogTitle>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 hover:bg-neutral-200 transition-all active:scale-95 m-0!"
              >
                <X size={20} className="text-neutral-600" />
              </Button>
            </DialogClose>
          </DialogHeader>

          {/* Form Body */}
          <div className="px-4 md:px-6 pt-8 pb-4 space-y-2 bg-white">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-medium text-neutral-700"
              >
                Official Email *
              </Label>
              <Input
                id="email"
                placeholder="john_alex@gmail.com"
                className="w-full rounded-full border-neutral-400 px-6 text-neutral-800 placeholder:text-neutral-600 focus-visible:ring-primary/20"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSelectedEmail(null);
                }}
              />
              {lookup.isFetching && !lookup.data && (
                <div className="flex items-center gap-2 p-3 text-sm text-neutral-500 animate-pulse">
                  <Loader2 size={16} className="animate-spin" />
                  Searching for user...
                </div>
              )}

              {lookup.isError && (
                <div className="mt-2 p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 text-sm">
                  <div className="p-1 rounded-full bg-red-100">
                    <X size={14} />
                  </div>
                  <p>
                    {lookup.error instanceof Error
                      ? lookup.error.message
                      : "User not found"}
                  </p>
                </div>
              )}

              {lookup.data && (
                <button
                  type="button"
                  disabled={isInvalidSelection}
                  className={cn(
                    "w-full mt-2 rounded-2xl border p-4 flex items-center gap-4 transition-all duration-300 group relative overflow-hidden",
                    selectedEmail === lookup.data.email
                      ? "bg-[#4C3E73]/5 border-[#4C3E73] ring-1 ring-[#4C3E73]/30 shadow-md"
                      : isInvalidSelection
                        ? "bg-neutral-50/30 border-neutral-100 opacity-60 cursor-not-allowed"
                        : "bg-neutral-50/50 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100/50 hover:shadow-sm",
                  )}
                  onClick={() =>
                    !isInvalidSelection && setSelectedEmail(lookup.data.email)
                  }
                >
                  {/* Subtle background glow for selected state */}
                  {selectedEmail === lookup.data.email &&
                    !isInvalidSelection && (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#4C3E73]/5 to-transparent pointer-events-none" />
                    )}

                  <div className="relative">
                    <Avatar
                      className={cn(
                        "w-12 h-12 border-2 border-white shadow-sm ring-1",
                        isInvalidSelection
                          ? "ring-neutral-100 grayscale-[0.5]"
                          : "ring-neutral-200",
                      )}
                    >
                      <AvatarImage src={lookup.data.imageUrl ?? ""} />
                      <AvatarFallback className="bg-neutral-200 text-neutral-600 font-bold">
                        {(
                          lookup.data.firstName?.[0] || lookup.data.email[0]
                        ).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {selectedEmail === lookup.data.email &&
                      !isInvalidSelection && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#10B981] border-2 border-white flex items-center justify-center shadow-sm">
                          <Check size={12} className="text-white stroke-[3]" />
                        </div>
                      )}
                  </div>

                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p
                        className={cn(
                          "text-base font-bold truncate",
                          isInvalidSelection
                            ? "text-neutral-400"
                            : "text-neutral-900",
                        )}
                      >
                        {[lookup.data.firstName, lookup.data.lastName]
                          .filter(Boolean)
                          .join(" ") || "User"}
                      </p>
                      {!isInvalidSelection && (
                        <BadgeCheck
                          size={16}
                          className="text-blue-500 fill-blue-50"
                        />
                      )}
                    </div>
                    <p className="text-sm text-neutral-500 truncate">
                      {lookup.data.email}
                    </p>

                    {selectedEmail === lookup.data.email &&
                      !isInvalidSelection && (
                        <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-bold text-[#4C3E73]">
                          Selected
                        </span>
                      )}

                    {isSelfReferral && (
                      <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-bold text-amber-600">
                        Cannot refer yourself
                      </span>
                    )}

                    {isDuplicate && (
                      <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-bold text-red-600">
                        Already a Referrer
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={cn(
                        "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                        isSelfReferral
                          ? "bg-amber-50 text-amber-600 border-amber-100"
                          : isDuplicate
                            ? "bg-red-50 text-red-600 border-red-100"
                            : "bg-neutral-100 text-neutral-600 border-neutral-200",
                      )}
                    >
                      {isSelfReferral
                        ? "Invalid"
                        : isDuplicate
                          ? "Exists"
                          : "Found"}
                    </span>
                  </div>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between py-2">
              <Label
                htmlFor="send-email"
                className="text-base font-medium text-neutral-700 cursor-pointer"
              >
                Send Email to the Referrer
              </Label>
              <Switch
                id="send-email"
                checked={sendEmail}
                onCheckedChange={setSendEmail}
                className="scale-110 data-[state=checked]:bg-[#10B981]"
              />
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="bg-neutral-300 px-6 py-5 sm:rounded-b-3xl">
            <Button
              onClick={onAddReferrer}
              disabled={
                createReferral.isPending ||
                !isEmailValid ||
                !lookup.data ||
                lookup.isFetching ||
                isInvalidSelection
              }
              className="rounded-full px-8 h-12 bg-[#4C3E73] hover:bg-[#3D315C] text-white font-semibold text-lg shadow-lg transition-all active:scale-95"
            >
              Add Referrer
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
});
