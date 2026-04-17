"use client";

import React, { memo } from "react";
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
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useEffect, useMemo, useState } from "react";
import { useCreateReferral, useReferrerLookup } from "@/hooks/useReferrals";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import type { ReferralEntityType } from "@/lib/api/referralApi";

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
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-neutral-200 transition-all active:scale-95 m-0!">
                <X size={20} className="text-neutral-600" />
              </Button>
            </DialogClose>
          </DialogHeader>

          {/* Form Body */}
          <div className="px-4 md:px-6 pt-8 pb-4 space-y-2 bg-white">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium text-neutral-700">
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
              {lookup.data ? (
                <button
                  className="w-full mt-2 rounded-xl border p-3 flex items-center gap-3 hover:bg-neutral-50"
                  onClick={() => setSelectedEmail(lookup.data.email)}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={lookup.data.imageUrl ?? ""} />
                    <AvatarFallback>
                      {(lookup.data.firstName?.[0] || lookup.data.email[0]).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-semibold">
                      {[lookup.data.firstName, lookup.data.lastName].filter(Boolean).join(" ") || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">{lookup.data.email}</p>
                  </div>
                </button>
              ) : null}
            </div>

            <div className="flex items-center justify-between py-2">
              <Label htmlFor="send-email" className="text-base font-medium text-neutral-700 cursor-pointer">
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
              disabled={createReferral.isPending || !isEmailValid || !lookup.data}
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
