"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { X, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { PayoutDetailsInput } from "@/lib/api/paymentsApi";

interface PayoutDetailsFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PayoutDetailsInput) => void;
  initialData?: Partial<PayoutDetailsInput>;
  isLoading?: boolean;
}

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export default function PayoutDetailsForm({
  isOpen,
  onClose,
  onSave,
  initialData,
  isLoading = false,
}: PayoutDetailsFormProps) {
  const [formData, setFormData] = useState<PayoutDetailsInput>({
    accountHolderName: "",
    accountNumber: "",
    ifsc: "",
    upiId: "",
  });

  const [touched, setTouched] = useState<
    Partial<Record<keyof PayoutDetailsInput, boolean>>
  >({});
  const [errors, setErrors] = useState<
    Partial<Record<keyof PayoutDetailsInput, string>>
  >({});
  const [bankInfo, setBankInfo] = useState<string | null>(null);
  const [isFetchingBank, setIsFetchingBank] = useState(false);
  const [upiVerified, setUpiVerified] = useState<boolean>(false);

  // Track if we've initialized for this "open" session
  const hasInitializedRef = useRef(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    // Detect transition from closed -> open
    const justOpened = isOpen && !wasOpenRef.current;
    wasOpenRef.current = isOpen;

    // Only initialize when modal just opened, not on every render
    if (justOpened) {
      hasInitializedRef.current = true;
      setFormData({
        accountHolderName: initialData?.accountHolderName || "",
        accountNumber: initialData?.accountNumber || "",
        ifsc: initialData?.ifsc || "",
        upiId: initialData?.upiId || "",
      });
      setErrors({});
      setTouched({});
    }

    // Reset the flag when modal closes
    if (!isOpen) {
      hasInitializedRef.current = false;
      setBankInfo(null);
      setUpiVerified(false);
    }
  }, [isOpen, initialData]);

  // IFSC Lookup Logic
  useEffect(() => {
    const fetchBankInfo = async () => {
      const ifsc = formData.ifsc;
      if (ifsc.length === 11 && IFSC_REGEX.test(ifsc)) {
        setIsFetchingBank(true);
        try {
          const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
          if (res.ok) {
            const data = await res.json();
            setBankInfo(`${data.BANK}, ${data.BRANCH}`);
          } else {
            setBankInfo(null);
          }
        } catch (err) {
          setBankInfo(null);
        } finally {
          setIsFetchingBank(false);
        }
      } else {
        setBankInfo(null);
      }
    };

    const timer = setTimeout(fetchBankInfo, 500);
    return () => clearTimeout(timer);
  }, [formData.ifsc]);

  // UPI Validation Logic
  useEffect(() => {
    const upi = formData.upiId || "";
    const UPI_REGEX = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;
    if (upi && UPI_REGEX.test(upi)) {
      setUpiVerified(true);
    } else {
      setUpiVerified(false);
    }
  }, [formData.upiId]);

  const validateField = (
    name: keyof PayoutDetailsInput,
    value: string,
  ): string => {
    switch (name) {
      case "accountHolderName":
        return !value.trim() ? "Account holder name is required" : "";
      case "accountNumber":
        return !value.trim() ? "Account number is required" : "";
      case "ifsc":
        if (!value.trim()) return "IFSC is required";
        if (!IFSC_REGEX.test(value)) return "Invalid IFSC format";
        return "";
      case "upiId":
        if (value && !/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(value)) {
          return "Invalid UPI ID format";
        }
        return "";
      default:
        return "";
    }
  };

  const getFormErrors = (data: PayoutDetailsInput) => {
    const newErrors: Partial<Record<keyof PayoutDetailsInput, string>> = {};
    (Object.keys(data) as Array<keyof PayoutDetailsInput>).forEach((key) => {
      const error = validateField(key, data[key] as string);
      if (error) {
        newErrors[key] = error;
      }
    });
    return newErrors;
  };

  const isFormValid = useMemo(() => {
    const currentErrors = getFormErrors(formData);
    const hasErrors = Object.keys(currentErrors).length > 0;
    
    // Stricter check: If IFSC is 11 chars, must have bankInfo
    const ifscValid = formData.ifsc.length === 11 && IFSC_REGEX.test(formData.ifsc);
    const ifscVerified = ifscValid && !!bankInfo;
    
    // If they typed 11 chars but it's not verified yet, it's invalid
    if (ifscValid && !bankInfo) return false;

    return !hasErrors;
  }, [formData, bankInfo]);

  const handleChange = (field: keyof PayoutDetailsInput, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    if (touched[field] || errors[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: keyof PayoutDetailsInput) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field] as string);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSave = () => {
    const newErrors = getFormErrors(formData);
    setErrors(newErrors);
    setTouched(
      Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
    );

    if (Object.keys(newErrors).length === 0) {
      onSave(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-foreground/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-[600px] flex flex-col bg-background rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-5 bg-muted border-b border-border/10">
              <h5 className="font-poppins text-foreground text-2xl font-semibold leading-[125%] capitalize">
                Payout Details
              </h5>
              <div
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 cursor-pointer rounded-full hover:bg-foreground/5 transition-colors"
              >
                <X className="w-6 h-6 text-muted-foreground" strokeWidth={2} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-background">
              <CustomInput
                label="Account Holder Name *"
                placeholder="Enter Name"
                value={formData.accountHolderName}
                onChange={(v) => handleChange("accountHolderName", v)}
                onBlur={() => handleBlur("accountHolderName")}
                error={errors.accountHolderName}
              />

              <CustomInput
                label="Account Number *"
                placeholder="Enter Account Number"
                value={formData.accountNumber}
                onChange={(v) => handleChange("accountNumber", v)}
                onBlur={() => handleBlur("accountNumber")}
                error={errors.accountNumber}
              />

              <CustomInput
                label="IFSC Code *"
                placeholder="Enter IFSC Code"
                value={formData.ifsc}
                onChange={(v) => handleChange("ifsc", v.toUpperCase())}
                onBlur={() => handleBlur("ifsc")}
                error={errors.ifsc}
              />
              {isFetchingBank && (
                <div className="flex items-center gap-2 text-xs text-primary-600 animate-pulse px-4 -mt-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Verifying IFSC...
                </div>
              )}
              {bankInfo && (
                <div className="text-xs text-emerald-600 font-medium px-4 -mt-2 animate-in fade-in slide-in-from-top-1">
                  {bankInfo}
                </div>
              )}

              <CustomInput
                label="UPI ID (Optional)"
                placeholder="e.g. username@upi"
                value={formData.upiId || ""}
                onChange={(v) => handleChange("upiId", v)}
                error={errors.upiId}
              />
            </div>

            <div className="flex items-center justify-end px-5 py-4 bg-muted gap-2">
              <Button
                onClick={handleSave}
                disabled={!isFormValid || isLoading}
                className="rounded-full bg-primary-500 hover:bg-primary/90 text-primary-foreground font-inter text-base font-medium leading-[150%] px-6 py-2.5 h-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Details"
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

const CustomInput = ({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  error?: string;
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
      onBlur={onBlur}
      className={`flex h-12 px-4 items-center self-stretch rounded-[24px] border ${error
          ? "border-red-500 focus-visible:ring-red-500"
          : "border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary-500"
        } focus-visible:ring-offset-0`}
    />
    {error && (
      <span className="text-red-500 text-xs px-1 animate-in fade-in slide-in-from-top-1">
        {error}
      </span>
    )}
  </div>
);
