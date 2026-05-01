"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Loader2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PayoutDetailsInput } from "@/lib/api/paymentsApi";
import GeneralModal from "@/components/ui/derived/GeneralModal";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

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
  const [formData, setFormData] = useState({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    panNumber: "",
    ifsc: "",
    gstNumber: "",
    upiId: "",
    pinCode: "",
    state: "",
    city: "",
    address1: "",
    address2: "",
    razorpayBankName: false,
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bankInfo, setBankInfo] = useState<string | null>(null);
  const [isFetchingBank, setIsFetchingBank] = useState(false);
  const [ifscNotFound, setIfscNotFound] = useState<boolean>(false);

  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [pincodeNotFound, setPincodeNotFound] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

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
        bankName: initialData?.bankName || "",
        accountNumber: initialData?.accountNumber || "",
        confirmAccountNumber: initialData?.accountNumber || "",
        panNumber: initialData?.panNumber || "",
        ifsc: initialData?.ifsc || "",
        gstNumber: initialData?.gstNumber || "",
        upiId: initialData?.upiId || "",
        pinCode: initialData?.pinCode || "",
        state: initialData?.state || "",
        city: initialData?.city || "",
        address1: initialData?.address1 || "",
        address2: initialData?.address2 || "",
        razorpayBankName: initialData?.razorpayBankName || false,
      });
      setErrors({});
      setTouched({});
    }

    // Reset the flag when modal closes
    if (!isOpen) {
      hasInitializedRef.current = false;
      setBankInfo(null);
      setIfscNotFound(false);
      setAvailableCities([]);
      setPincodeNotFound(false);
    }
  }, [isOpen, initialData]);

  // IFSC Lookup Logic
  useEffect(() => {
    const fetchBankInfo = async () => {
      const ifsc = formData.ifsc;
      if (ifsc.length === 11 && IFSC_REGEX.test(ifsc)) {
        setIsFetchingBank(true);
        setIfscNotFound(false);
        try {
          const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
          if (res.ok) {
            const data = await res.json();
            setBankInfo(`${data.BANK}, ${data.BRANCH}`);
            setFormData((prev) => ({
              ...prev,
              bankName: data.BANK || prev.bankName,
              razorpayBankName: true,
            }));
            setIfscNotFound(false);
          } else {
            setBankInfo(null);
            setIfscNotFound(true);
            setFormData((prev) => ({ ...prev, razorpayBankName: false }));
          }
        } catch (err) {
          setBankInfo(null);
          setIfscNotFound(true);
          setFormData((prev) => ({ ...prev, razorpayBankName: false }));
        } finally {
          setIsFetchingBank(false);
        }
      } else {
        setBankInfo(null);
        setIfscNotFound(false);
        setFormData((prev) => ({ ...prev, razorpayBankName: false }));
      }
    };

    const timer = setTimeout(fetchBankInfo, 500);
    return () => clearTimeout(timer);
  }, [formData.ifsc]);

  // Pincode Lookup Logic
  useEffect(() => {
    const fetchPincodeInfo = async () => {
      const pin = formData.pinCode;
      if (pin.length === 6 && /^\d{6}$/.test(pin)) {
        setIsFetchingPincode(true);
        setPincodeNotFound(false);
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
          if (res.ok) {
            const data = await res.json();
            if (data[0] && data[0].Status === "Success" && data[0].PostOffice) {
              const firstPO = data[0].PostOffice;
              if (firstPO && firstPO.length > 0) {
                const cities = Array.from(new Set(firstPO.map((po: any) => po.Name)));
                setAvailableCities(cities as string[]);
                setFormData((prev) => ({
                  ...prev,
                  state: firstPO[0].State || "",
                  city: (cities[0] as string) || "",
                }));
                setPincodeNotFound(false);
                return;
              }
            }
          }
          setAvailableCities([]);
          setPincodeNotFound(true);
        } catch (err) {
          setAvailableCities([]);
          setPincodeNotFound(true);
        } finally {
          setIsFetchingPincode(false);
        }
      } else {
        setPincodeNotFound(false);
      }
    };

    const timer = setTimeout(fetchPincodeInfo, 500);
    return () => clearTimeout(timer);
  }, [formData.pinCode]);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "accountHolderName":
        return !value.trim() ? "Account holder name is required" : "";
      case "bankName":
        return !value.trim() ? "Bank name is required" : "";
      case "accountNumber":
        if (!value.trim()) return "Account number is required";
        if (!/^\d{9,18}$/.test(value)) return "Account number must be 9-18 digits";
        return "";
      case "confirmAccountNumber":
        if (!value.trim()) return "Confirm account number is required";
        if (value !== formData.accountNumber) return "Account numbers must match";
        return "";
      case "ifsc":
        if (!value.trim()) return "IFSC is required";
        if (!IFSC_REGEX.test(value)) return "Invalid IFSC format";
        return "";
      case "pinCode":
        if (!value.trim()) return "Pincode is required";
        if (!/^\d{6}$/.test(value)) return "Invalid pincode format";
        return "";
      case "state":
        return !value.trim() ? "State is required" : "";
      case "city":
        return !value.trim() ? "City is required" : "";
      case "address1":
        return !value.trim() ? "Address 1 is required" : "";
      case "panNumber":
        if (value.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) {
          return "Invalid PAN format (e.g., ABCDE1234F)";
        }
        return "";
      case "gstNumber":
        if (value.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value)) {
          return "Invalid GSTIN format (e.g., 22AAAAA0000A1Z5)";
        }
        return "";
      case "upiId":
        if (value.trim() && !/^[\w.-]+@[\w.-]+$/.test(value)) {
          return "Invalid UPI ID format (e.g., name@bank)";
        }
        return "";
      default:
        return "";
    }
  };

  const getFormErrors = (data: typeof formData) => {
    const newErrors: Record<string, string> = {};
    Object.keys(data).forEach((key) => {
      const error = validateField(key, data[key as keyof typeof formData] as string);
      if (error) {
        newErrors[key] = error;
      }
    });
    return newErrors;
  };

  const isFormValid = useMemo(() => {
    const currentErrors = getFormErrors(formData);
    return Object.keys(currentErrors).length === 0;
  }, [formData]);

  const handleChange = (field: keyof typeof formData, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    if (touched[field] || errors[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: keyof typeof formData) => {
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
      // Exclude confirmAccountNumber before sending
      const { confirmAccountNumber: _, ...submitPayload } = formData;
      onSave(submitPayload);
    }
  };

  const footerActions = (
    <Button
      onClick={handleSave}
      disabled={!isFormValid || isLoading}
      className="rounded-full bg-[#3b0764] hover:bg-[#2e0452] active:bg-[#1e0237] text-white font-inter text-base font-semibold px-8 py-3.5 h-auto transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Saving...
        </>
      ) : (
        "Save Account Details"
      )}
    </Button>
  );

  return (
    <GeneralModal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Form"
      footerActions={footerActions}
      maxWidth="max-w-[1200px]"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
        <CustomInput
          label="Account Holder Name"
          placeholder="Enter Account Holder Name"
          value={formData.accountHolderName}
          onChange={(v) => handleChange("accountHolderName", v)}
          onBlur={() => handleBlur("accountHolderName")}
          error={errors.accountHolderName}
        />

        <div className="flex flex-col gap-1">
          <CustomInput
            label="IFSC Code"
            placeholder="Enter IFSC Code"
            value={formData.ifsc}
            onChange={(v) => handleChange("ifsc", v.toUpperCase())}
            onBlur={() => handleBlur("ifsc")}
            error={errors.ifsc}
          />
          {isFetchingBank && (
            <div className="flex items-center gap-1.5 text-xs text-primary animate-pulse px-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying IFSC...
            </div>
          )}
          {bankInfo && (
            <div className="text-xs text-emerald-600 font-medium px-1">
              {bankInfo}
            </div>
          )}
          {ifscNotFound && (
            <div className="text-xs text-amber-600 font-medium px-1">
              IFSC not found
            </div>
          )}
        </div>

        <CustomInput
          label="Bank Name"
          placeholder="Enter Bank Name"
          value={formData.bankName}
          onChange={(v) => handleChange("bankName", v)}
          onBlur={() => handleBlur("bankName")}
          error={errors.bankName}
        />

        <CustomInput
          label="Account Number"
          placeholder="Enter Account Number"
          value={formData.accountNumber}
          onChange={(v) => handleChange("accountNumber", v)}
          onBlur={() => handleBlur("accountNumber")}
          error={errors.accountNumber}
        />

        <CustomInput
          label="Confirm Account Number"
          placeholder="Enter Confirm Account Number"
          value={formData.confirmAccountNumber}
          onChange={(v) => handleChange("confirmAccountNumber", v)}
          onBlur={() => handleBlur("confirmAccountNumber")}
          error={errors.confirmAccountNumber}
        />

        <CustomInput
          label="Pan Number"
          placeholder="Enter Pan Number"
          isOptional
          tooltip="Format: 5 letters, 4 digits, 1 letter. e.g. ABCDE1234F"
          value={formData.panNumber}
          onChange={(v) => handleChange("panNumber", v.toUpperCase())}
          onBlur={() => handleBlur("panNumber")}
          error={errors.panNumber}
        />

        <CustomInput
          label="GST TIN"
          placeholder="Enter GST TIN"
          isOptional
          tooltip="Format: 15 alphanumeric characters. e.g. 22AAAAA0000A1Z5"
          value={formData.gstNumber}
          onChange={(v) => handleChange("gstNumber", v.toUpperCase())}
          onBlur={() => handleBlur("gstNumber")}
          error={errors.gstNumber}
        />

        <CustomInput
          label="UPI ID"
          placeholder="Enter UPI ID"
          isOptional
          tooltip="Format: alphanumeric characters and dot/dash. e.g. name@okbank"
          value={formData.upiId}
          onChange={(v) => handleChange("upiId", v)}
          onBlur={() => handleBlur("upiId")}
          error={errors.upiId}
        />

        <div className="flex flex-col gap-1">
          <CustomInput
            label="Pincode"
            placeholder="Enter Pincode"
            value={formData.pinCode}
            onChange={(v) => handleChange("pinCode", v)}
            onBlur={() => handleBlur("pinCode")}
            error={errors.pinCode}
          />
          {isFetchingPincode && (
            <div className="flex items-center gap-1.5 text-xs text-primary animate-pulse px-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying Pincode...
            </div>
          )}
          {pincodeNotFound && (
            <div className="text-xs text-amber-600 font-medium px-1">
              Pincode not found
            </div>
          )}
        </div>

        <CustomInput
          label="State"
          placeholder="State (Autofilled)"
          readOnly
          value={formData.state}
          onChange={(v) => handleChange("state", v)}
          onBlur={() => handleBlur("state")}
          error={errors.state}
        />

        {availableCities.length > 0 ? (
          <div className="flex flex-col items-start gap-1 w-full">
            <Label className="font-inter text-foreground text-sm font-semibold leading-[140%] select-none flex items-center gap-1.5">
              City <span className="text-red-500">*</span>
            </Label>
            <select
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              onBlur={() => handleBlur("city")}
              className={`flex h-10 w-full rounded-full border bg-background px-4 py-2 text-sm text-neutral-700 placeholder:text-neutral-400 transition-colors focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 ${
                errors.city
                  ? "border-red-500 focus-visible:ring-red-500"
                  : "border-border/60 hover:border-border"
              }`}
            >
              {availableCities.map((cityOpt) => (
                <option key={cityOpt} value={cityOpt}>
                  {cityOpt}
                </option>
              ))}
            </select>
            {errors.city && (
              <span className="text-red-500 text-xs px-1 select-none animate-in fade-in slide-in-from-top-1">
                {errors.city}
              </span>
            )}
          </div>
        ) : (
          <CustomInput
            label="City"
            placeholder="City (Autofilled)"
            readOnly
            value={formData.city}
            onChange={(v) => handleChange("city", v)}
            onBlur={() => handleBlur("city")}
            error={errors.city}
          />
        )}

        <div className="md:col-span-2 lg:col-span-1">
          <CustomInput
            label="Address 1"
            placeholder="Enter Address 1"
            value={formData.address1}
            onChange={(v) => handleChange("address1", v)}
            onBlur={() => handleBlur("address1")}
            error={errors.address1}
          />
        </div>

        <div className="md:col-span-2 lg:col-span-2">
          <CustomInput
            label="Address 2"
            placeholder="Enter Address 2"
            isOptional
            value={formData.address2}
            onChange={(v) => handleChange("address2", v)}
            onBlur={() => handleBlur("address2")}
            error={errors.address2}
          />
        </div>
      </div>
    </GeneralModal>
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
  isOptional = false,
  readOnly = false,
  tooltip,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  error?: string;
  isOptional?: boolean;
  readOnly?: boolean;
  tooltip?: string;
}) => (
  <div className="flex flex-col items-start gap-1 w-full">
    <Label className="font-inter text-foreground text-sm font-semibold leading-[140%] select-none flex items-center gap-1.5 flex-wrap">
      {label}
      {isOptional ? (
        <span className="text-neutral-400 font-normal text-sm select-none">(Optional)</span>
      ) : (
        <span className="text-red-500">*</span>
      )}
      {tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex cursor-help text-neutral-400 hover:text-neutral-600 transition-colors">
              <HelpCircle className="w-4 h-4" />
            </span>
          </TooltipTrigger>
          <TooltipContent className="bg-neutral-800 text-white rounded px-2 py-1 text-xs max-w-xs shadow-md border-0 select-none">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      )}
    </Label>
    <Input
      type={type}
      placeholder={placeholder}
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={`rounded-full bg-background text-neutral-700 placeholder:text-neutral-400 transition-colors focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 ${
        error
          ? "border-red-500 focus-visible:ring-red-500"
          : "border-border/60 hover:border-border"
      } ${readOnly ? "bg-neutral-50 cursor-not-allowed select-none opacity-80" : ""}`}
    />
    {error && (
      <span className="text-red-500 text-xs px-1 select-none animate-in fade-in slide-in-from-top-1">
        {error}
      </span>
    )}
  </div>
);
