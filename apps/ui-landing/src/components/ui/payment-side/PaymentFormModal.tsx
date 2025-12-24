"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";

export interface PayoutDetails {
  accountHolderName: string;
  email: string;
  phone: string;
  bankName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  panNumber: string;
  ifscCode: string;
  gstTin: string;
  pincode: string;
  state: string;
  city: string;
  address1: string;
  address2: string;
}

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PayoutDetails) => void;
  initialData?: Partial<PayoutDetails>;
}

export default function PaymentFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: PaymentFormModalProps) {
  const [formData, setFormData] = useState<PayoutDetails>({
    accountHolderName: "",
    email: "",
    phone: "",
    bankName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    panNumber: "",
    ifscCode: "",
    gstTin: "",
    pincode: "",
    state: "",
    city: "",
    address1: "",
    address2: "",
  });

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }));
    }
  }, [isOpen, initialData]);

  const handleChange = (field: keyof PayoutDetails, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
          {/* MODAL CONTAINER */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-[1000px] max-h-[90vh] flex flex-col bg-background rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* --- HEADER --- */}
            <div className="flex items-center justify-between px-6 py-5 bg-muted border-b border-border/10">
              <h5 className="font-poppins text-foreground text-2xl font-semibold leading-[125%] capitalize">
                Payment Form
              </h5>
              <div
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 cursor-pointer rounded-full hover:bg-black/5 transition-colors"
              >
                <X className="w-6 h-6 text-muted-foreground" strokeWidth={2} />
              </div>
            </div>

            {/* --- BODY (SCROLLABLE) --- */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-background">
              {/* Row 1 */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <CustomInput
                  label="Account Holder Name *"
                  placeholder="Enter Name"
                  value={formData.accountHolderName}
                  onChange={(v) => handleChange("accountHolderName", v)}
                />
                <CustomInput
                  label="Email *"
                  placeholder="Enter Email"
                  type="email"
                  value={formData.email}
                  onChange={(v) => handleChange("email", v)}
                />
                <CustomInput
                  label="Phone Number *"
                  placeholder="Enter Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(v) => handleChange("phone", v)}
                />
              </div>

              {/* Row 2 */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <CustomInput
                  label="Bank Name *"
                  placeholder="Enter Bank Name"
                  value={formData.bankName}
                  onChange={(v) => handleChange("bankName", v)}
                />
                <CustomInput
                  label="Account Number *"
                  placeholder="Enter Account Number"
                  value={formData.accountNumber}
                  onChange={(v) => handleChange("accountNumber", v)}
                />
                <CustomInput
                  label="Confirm Account Number *"
                  placeholder="Re-enter Account Number"
                  value={formData.confirmAccountNumber}
                  onChange={(v) => handleChange("confirmAccountNumber", v)}
                />
              </div>

              {/* Row 3 */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <CustomInput
                  label="Pan Number *"
                  placeholder="Enter PAN"
                  value={formData.panNumber}
                  onChange={(v) => handleChange("panNumber", v)}
                />
                <CustomInput
                  label="IFSC Code *"
                  placeholder="Enter IFSC"
                  value={formData.ifscCode}
                  onChange={(v) => handleChange("ifscCode", v)}
                />
                <CustomInput
                  label="GST TIN *"
                  placeholder="Enter GST TIN"
                  value={formData.gstTin}
                  onChange={(v) => handleChange("gstTin", v)}
                />
              </div>

              {/* Row 4 */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <CustomInput
                  label="Pincode *"
                  placeholder="Enter Pincode"
                  value={formData.pincode}
                  onChange={(v) => handleChange("pincode", v)}
                />
                <CustomInput
                  label="State *"
                  placeholder="Enter State"
                  value={formData.state}
                  onChange={(v) => handleChange("state", v)}
                />
                <CustomInput
                  label="City *"
                  placeholder="Enter City"
                  value={formData.city}
                  onChange={(v) => handleChange("city", v)}
                />
              </div>

              {/* Row 5 */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <CustomInput
                  label="Address 1 *"
                  placeholder="Enter Address Line 1"
                  value={formData.address1}
                  onChange={(v) => handleChange("address1", v)}
                />
                <CustomInput
                  label="Address 2 *"
                  placeholder="Enter Address Line 2"
                  value={formData.address2}
                  onChange={(v) => handleChange("address2", v)}
                />
              </div>
            </div>

            {/* --- FOOTER --- */}
            <div className="flex items-center justify-end px-5 py-4 bg-muted gap-2">
              <Button
                onClick={handleSave}
                className="rounded-full bg-primary-500 hover:bg-primary/90 text-primary-foreground font-inter text-base font-medium leading-[150%] px-6 py-2.5 h-auto"
              >
                Save Account Details
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- HELPER COMPONENT FOR INPUTS ---
const CustomInput = ({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
}) => (
  <div className="flex flex-col items-start gap-1 flex-1 w-full">
    <Label className="font-inter text-muted-foreground text-xs font-normal leading-[150%]">
      {label}
    </Label>
    <Input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-12 px-4 items-center self-stretch rounded-[24px] border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary-500 focus-visible:ring-offset-0"
    />
  </div>
);
