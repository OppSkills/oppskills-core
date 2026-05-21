"use client";

import React from "react";
import { RegistrationInputField } from "./RegistrationInputField";
import { Tag, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateTeamFormContentProps } from "./RegistrationModal.types";
import { cn } from "@/lib/utils";
import { isUploadField } from "@/lib/form-utils";

export function CreateTeamFormContent({
  fields,
  answers,
  onUpdateAnswer,
  teamName,
  setTeamName,
  onFileSelect,
  isUploading,
  uploadedFiles,
  isIndividual,
  isFree,
  entryFeeAmount,
  feeBearer,
  discountCode,
  setDiscountCode,
  isOpenToggle,
  setIsOpenToggle,
  type,
  completionMode,
  ticketTiers = [],
  ticketTierId,
  setTicketTierId,
  omitTicketTierSection = false,
}: CreateTeamFormContentProps) {
  const activeTiers = ticketTiers.filter(
    (tier: { isActive?: boolean }) => tier.isActive !== false,
  );
  const hasTiers = activeTiers.length > 0;

  // Default tier only when exactly one active tier; otherwise wait for explicit selection.
  React.useEffect(() => {
    if (!hasTiers || !setTicketTierId) return;
    if (activeTiers.length === 1 && !ticketTierId) {
      setTicketTierId(activeTiers[0].id);
    }
  }, [hasTiers, ticketTierId, setTicketTierId, activeTiers]);

  const selectedTier = hasTiers
    ? activeTiers.find((t: any) => t.id === ticketTierId) || activeTiers[0]
    : null;
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {completionMode && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-sm text-neutral-800">
          {type !== "EVENT" && !isFree ? (
            <p>
              Payment received. Complete the form below to finish your
              registration — you will not be charged again.
            </p>
          ) : (
            <p>Finish your registration by completing the form below.</p>
          )}
        </div>
      )}
      {type !== "EVENT" && !completionMode && (
        <div className="space-y-4">
          <RegistrationInputField
            label="Team Name"
            placeholder="e.g. The Innovators"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
          />

          {!isIndividual && (
            <div
              className="flex items-center justify-between p-4 rounded-2xl bg-neutral-100 border border-neutral-300 cursor-pointer transition-all hover:border-primary-600 group"
              onClick={() => setIsOpenToggle(!isOpenToggle)}
            >
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-neutral-900 cursor-pointer">
                  Open for others to join
                </Label>
                <p className="text-[11px] text-neutral-500 leading-tight">
                  Allow other participants to request joining your team
                </p>
              </div>
              <div
                className={cn(
                  "h-6 w-11 rounded-full p-1 transition-colors duration-200",
                  isOpenToggle ? "bg-primary-600" : "bg-neutral-300",
                )}
              >
                <div
                  className={cn(
                    "h-4 w-4 rounded-full bg-white transition-transform duration-200",
                    isOpenToggle ? "translate-x-5" : "translate-x-0",
                  )}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {!isFree && !completionMode && (
        <div className="space-y-4">
          {hasTiers && !omitTicketTierSection ? (
            <div className="space-y-3">
              <Label className="text-neutral-900 font-semibold text-lg ml-1">
                Select Ticket
              </Label>
              <div className="flex flex-col gap-3">
                {activeTiers.map((tier: any) => {
                  const base =
                    typeof tier.price === "number"
                      ? tier.price
                      : Number(tier.price ?? 0) || 0;
                  const fee =
                    feeBearer === "PARTICIPANT"
                      ? Math.ceil(base * 0.0236 * 100) / 100
                      : 0;
                  const total = base + fee;
                  const isSelected = ticketTierId === tier.id;

                  return (
                    <div
                      key={tier.id}
                      onClick={() =>
                        setTicketTierId && setTicketTierId(tier.id)
                      }
                      className={cn(
                        "rounded-2xl border-2 p-4 cursor-pointer transition-all flex flex-col",
                        isSelected
                          ? "border-primary-600 bg-primary-50/30 shadow-md shadow-primary-900/5"
                          : "border-neutral-200 bg-white hover:border-neutral-300",
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                          <span className="font-bold text-neutral-900 text-lg poppins">
                            {tier.name}
                          </span>
                          {tier.description && (
                            <span className="text-sm text-neutral-500 mt-1">
                              {tier.description}
                            </span>
                          )}
                        </div>
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                            isSelected
                              ? "border-primary-600"
                              : "border-neutral-300",
                          )}
                        >
                          {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-col gap-1 w-full">
                        {feeBearer === "PARTICIPANT" && base > 0 ? (
                          <>
                            <div className="flex justify-between text-neutral-600 text-sm">
                              <span>Entry Fee</span>
                              <span className="font-medium text-neutral-900">
                                ₹{base.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-start text-neutral-500 text-xs">
                              <span>Transaction Charges</span>
                              <span className="shrink-0">
                                ₹{fee.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between font-bold text-neutral-900 text-sm mt-1 pt-1 border-t border-neutral-100">
                              <span>Total Payable</span>
                              <span>₹{total.toFixed(2)}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between font-bold text-neutral-900 text-base">
                            <span>Ticket Price</span>
                            <span>₹{base.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            (() => {
              const base =
                typeof entryFeeAmount === "number"
                  ? entryFeeAmount
                  : Number(entryFeeAmount ?? 0) || 0;
              if (!(feeBearer === "PARTICIPANT" && base > 0)) return null;
              const fee = Math.ceil(base * 0.0236 * 100) / 100;
              const total = base + fee;
              return (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-sm space-y-2">
                  <div className="flex justify-between text-neutral-600">
                    <span>Entry Fee</span>
                    <span className="font-medium text-neutral-900">
                      ₹{base.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-start text-neutral-500 text-xs">
                    <div className="pr-4">
                      <span>Transaction Charges</span>
                      <p className="text-[10px] text-neutral-400 mt-0.5 leading-tight">
                        Charged by payment partners to process your transaction.
                      </p>
                    </div>
                    <span className="shrink-0">₹{fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-neutral-900 mt-2 pt-2 border-t border-blue-200">
                    <span>Total Payable</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              );
            })()
          )}

          {setDiscountCode && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-1">
                Discount Code
              </Label>
              <div className="relative group">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 group-focus-within:text-[#7E22CE] transition-colors" />
                <Input
                  placeholder="ENTER-CODE"
                  value={discountCode}
                  onChange={(e) =>
                    setDiscountCode(e.target.value.toUpperCase())
                  }
                  className="h-14 rounded-full border-neutral-400 bg-neutral-100 pl-11 pr-6 font-mono uppercase focus-visible:ring-primary-600 focus-visible:border-primary-600"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Registration Fields */}
      {fields.map((field) => {
        const isUpload = isUploadField(field.type, field.label);
        const raw = answers[field.id];
        const value =
          typeof raw === "string" || typeof raw === "number" ? String(raw) : "";

        if (isUpload) {
          const uploadedFile = uploadedFiles[field.id];
          return (
            <div key={field.id} className="space-y-2">
              <RegistrationInputField
                label={field.label}
                placeholder={
                  uploadedFile
                    ? uploadedFile.name
                    : field.placeholder || "Upload document"
                }
                value={uploadedFile ? uploadedFile.name : ""}
                readOnly
                onChange={() => {}}
                required={field.required}
                suffix={
                  <div className="flex items-center gap-2 pr-0.5 h-full">
                    <input
                      type="file"
                      id={`file-upload-${field.id}`}
                      className="hidden"
                      onChange={(e) => onFileSelect(field.id, e)}
                      disabled={isUploading}
                    />
                    <Button
                      type="button"
                      variant="default"
                      className="h-10 px-4 rounded-full transition-colors"
                      disabled={isUploading}
                      onClick={() =>
                        document
                          .getElementById(`file-upload-${field.id}`)
                          ?.click()
                      }
                    >
                      <Upload className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                }
              />
            </div>
          );
        }

        if (field.type === "OPTIONS") {
          const optionList = Array.isArray(field.options) ? field.options : [];
          const selectValue =
            value.length > 0 && optionList.includes(value) ? value : undefined;
          return (
            <div key={field.id} className="space-y-2">
              <Label className="text-neutral-500 font-medium ml-1">
                {field.label}
                {field.required && (
                  <span className="text-red-500 ml-1 font-bold">*</span>
                )}
              </Label>
              <Select
                value={selectValue}
                onValueChange={(val) => onUpdateAnswer(field.id, val)}
                required={field.required}
              >
                <SelectTrigger className="h-14 rounded-full border-neutral-400 bg-neutral-100 px-6 w-full text-base focus:ring-1 focus:ring-primary-600 focus:border-primary-600">
                  <SelectValue
                    placeholder={
                      field.placeholder || `Select ${field.label.toLowerCase()}`
                    }
                  />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-neutral-200">
                  {optionList.map((opt) => (
                    <SelectItem
                      key={opt}
                      value={opt}
                      className="rounded-xl px-4 py-2 cursor-pointer hover:bg-neutral-100 focus:bg-neutral-100"
                    >
                      {opt.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

        return (
          <RegistrationInputField
            key={field.id}
            label={field.label}
            placeholder={
              field.placeholder || `Enter ${field.label.toLowerCase()}`
            }
            value={value}
            onChange={(e) => onUpdateAnswer(field.id, e.target.value)}
            required={field.required}
            type={
              field.type === "EMAIL"
                ? "email"
                : field.type === "PHONE_NO"
                  ? "tel"
                  : field.type === "NUMBER"
                    ? "number"
                    : "text"
            }
          />
        );
      })}
    </div>
  );
}
