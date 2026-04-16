"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
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

interface AddReferrerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddReferrerModal: React.FC<AddReferrerModalProps> = ({
  isOpen,
  onOpenChange,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-[90vw] sm:max-w-xl p-0 overflow-hidden border-none bg-background rounded-3xl! shadow-2xl">
        <div className="relative">
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
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <Label htmlFor="send-email" className="text-base font-medium text-neutral-700 cursor-pointer">
                Send Email to the Referrer
              </Label>
              <Switch id="send-email" defaultChecked={true} className="scale-110 data-[state=checked]:bg-[#10B981]" />
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="bg-neutral-300 px-6 py-5 sm:rounded-b-3xl">
            <Button
              onClick={() => onOpenChange(false)}
              className="rounded-full px-8 h-12 bg-[#4C3E73] hover:bg-[#3D315C] text-white font-semibold text-lg shadow-lg transition-all active:scale-95"
            >
              Add Referrer
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
