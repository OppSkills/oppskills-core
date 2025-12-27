"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  businessType: string;
  businessCategory: string;
  businessSubcategory: string;
}

const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli",
  "Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const BUSINESS_TYPES = [
  { label: "Individual", value: "individual" },
  { label: "Proprietorship", value: "proprietorship" },
  { label: "Partnership", value: "partnership" },
  { label: "Private Limited", value: "private_limited" },
  { label: "Public Limited", value: "public_limited" },
  { label: "LLP", value: "llp" },
  { label: "NGO", value: "ngo" },
  { label: "Trust", value: "trust" },
  { label: "Society", value: "society" },
  { label: "Not Yet Registered", value: "not_yet_registered" },
];

const BUSINESS_CATEGORIES = [
  {
    label: "Education",
    value: "education",
    subcategories: [
      { label: "Coaching", value: "coaching" },
      { label: "College", value: "college" },
      { label: "Schools", value: "schools" },
      { label: "Other", value: "other" },
    ],
  },
  {
    label: "Financial Services",
    value: "financial_services",
    subcategories: [
      { label: "Advisor", value: "financial_advisor" },
      { label: "Accounting", value: "accounting" },
      { label: "Other", value: "other" },
    ],
  },
  {
    label: "Services",
    value: "services",
    subcategories: [
      { label: "Software", value: "software" },
      { label: "Consulting", value: "consulting" },
      { label: "Other", value: "other" },
    ],
  },
  {
    label: "Technology",
    value: "technology",
    subcategories: [
      { label: "SaaS", value: "saas" },
      { label: "E-commerce", value: "ecommerce" },
      { label: "Other", value: "other" },
    ],
  },
];

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PayoutDetails) => void;
  initialData?: Partial<PayoutDetails>;
  isLoading?: boolean;
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10}$/;

export default function PaymentFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isLoading = false,
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
    businessType: "individual",
    businessCategory: "education",
    businessSubcategory: "coaching",
  });

  const [touched, setTouched] = useState<
    Partial<Record<keyof PayoutDetails, boolean>>
  >({});
  const [errors, setErrors] = useState<
    Partial<Record<keyof PayoutDetails, string>>
  >({});

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }));
      setErrors({});
      setTouched({});
    }
  }, [isOpen, initialData]);

  const validateField = (
    name: keyof PayoutDetails,
    value: string,
    allData: PayoutDetails,
  ): string => {
    switch (name) {
      case "accountHolderName":
        return !value.trim() ? "Name is required" : "";
      case "email":
        if (!value.trim()) return "Email is required";
        if (!EMAIL_REGEX.test(value)) return "Invalid email format";
        return "";
      case "phone":
        if (!value.trim()) return "Phone is required";
        if (!PHONE_REGEX.test(value)) return "Phone must be 10 digits";
        return "";
      case "bankName":
        return !value.trim() ? "Bank name is required" : "";
      case "accountNumber":
        return !value.trim() ? "Account number is required" : "";
      case "confirmAccountNumber":
        if (!value.trim()) return "Confirm account number is required";
        if (value !== allData.accountNumber)
          return "Account numbers do not match";
        return "";
      case "panNumber":
        if (!value.trim()) return "PAN is required";
        if (!PAN_REGEX.test(value))
          return "Invalid PAN format (e.g., ABCDE1234F)";
        return "";
      case "ifscCode":
        if (!value.trim()) return "IFSC is required";
        if (!IFSC_REGEX.test(value)) return "Invalid IFSC format";
        return "";
      case "pincode":
        return !value.trim() ? "Pincode is required" : "";
      case "state":
        return !value.trim() ? "State is required" : "";
      case "city":
        return !value.trim() ? "City is required" : "";
      case "address1":
        return !value.trim() ? "Address is required" : "";
      case "businessType":
        return !value.trim() ? "Business type is required" : "";
      case "businessCategory":
        return !value.trim() ? "Category is required" : "";
      case "businessSubcategory":
        return !value.trim() ? "Subcategory is required" : "";
      case "gstTin":
      case "address2":
        return "";
      default:
        return "";
    }
  };

  const getFormErrors = (data: PayoutDetails) => {
    const newErrors: Partial<Record<keyof PayoutDetails, string>> = {};
    (Object.keys(data) as Array<keyof PayoutDetails>).forEach((key) => {
      const error = validateField(key, data[key], data);
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

  const handleChange = (field: keyof PayoutDetails, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    if (touched[field] || errors[field]) {
      const error = validateField(field, value, newData);
      setErrors((prev) => ({ ...prev, [field]: error }));

      if (field === "accountNumber" && touched.confirmAccountNumber) {
        const confirmError = validateField(
          "confirmAccountNumber",
          newData.confirmAccountNumber,
          newData,
        );
        setErrors((prev) => ({ ...prev, confirmAccountNumber: confirmError }));
      }
    }
  };

  const handleBlur = (field: keyof PayoutDetails) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field], formData);
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
                className="flex items-center justify-center w-8 h-8 cursor-pointer rounded-full hover:bg-foreground/5 transition-colors"
              >
                <X className="w-6 h-6 text-muted-foreground" strokeWidth={2} />
              </div>
            </div>

            {/* --- BODY (SCROLLABLE) --- */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-background">
              {/* Row 1 */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <CustomSelect
                  label="Business Type *"
                  value={formData.businessType}
                  onChange={(v) => handleChange("businessType", v)}
                  error={errors.businessType}
                  options={BUSINESS_TYPES}
                  placeholder="Select Type"
                />
                <CustomInput
                  label="Account Holder Name *"
                  placeholder="Enter Name"
                  value={formData.accountHolderName}
                  onChange={(v) => handleChange("accountHolderName", v)}
                  onBlur={() => handleBlur("accountHolderName")}
                  error={errors.accountHolderName}
                />
              </div>

              {/* Row 2 - Business Category */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <CustomSelect
                  label="Business Category *"
                  value={formData.businessCategory}
                  onChange={(v) => {
                    handleChange("businessCategory", v);
                    // Reset subcategory when category changes
                    const cat = BUSINESS_CATEGORIES.find((c) => c.value === v);
                    if (cat && cat.subcategories.length > 0) {
                      handleChange(
                        "businessSubcategory",
                        cat.subcategories[0].value,
                      );
                    }
                  }}
                  error={errors.businessCategory}
                  options={BUSINESS_CATEGORIES}
                  placeholder="Select Category"
                />
                <CustomSelect
                  label="Business Subcategory *"
                  value={formData.businessSubcategory}
                  onChange={(v) => handleChange("businessSubcategory", v)}
                  error={errors.businessSubcategory}
                  options={
                    BUSINESS_CATEGORIES.find(
                      (c) => c.value === formData.businessCategory,
                    )?.subcategories || []
                  }
                  placeholder="Select Subcategory"
                />
              </div>

              {/* Row 3 - Contact Info */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <CustomInput
                  label="Email *"
                  placeholder="Enter Email"
                  type="email"
                  value={formData.email}
                  onChange={(v) => handleChange("email", v)}
                  onBlur={() => handleBlur("email")}
                  error={errors.email}
                />
                <CustomInput
                  label="Phone Number *"
                  placeholder="Enter Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(v) => handleChange("phone", v)}
                  onBlur={() => handleBlur("phone")}
                  error={errors.phone}
                />
              </div>

              {/* Row 4 - Bank Details */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <CustomInput
                  label="Bank Name *"
                  placeholder="Enter Bank Name"
                  value={formData.bankName}
                  onChange={(v) => handleChange("bankName", v)}
                  onBlur={() => handleBlur("bankName")}
                  error={errors.bankName}
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
                  label="Confirm Account Number *"
                  placeholder="Re-enter Account Number"
                  value={formData.confirmAccountNumber}
                  onChange={(v) => handleChange("confirmAccountNumber", v)}
                  onBlur={() => handleBlur("confirmAccountNumber")}
                  error={errors.confirmAccountNumber}
                />
              </div>

              {/* Row 5 - Tax Info */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <CustomInput
                  label="Pan Number *"
                  placeholder="Enter PAN"
                  value={formData.panNumber}
                  onChange={(v) => handleChange("panNumber", v)}
                  onBlur={() => handleBlur("panNumber")}
                  error={errors.panNumber}
                />
                <CustomInput
                  label="IFSC Code *"
                  placeholder="Enter IFSC"
                  value={formData.ifscCode}
                  onChange={(v) => handleChange("ifscCode", v)}
                  onBlur={() => handleBlur("ifscCode")}
                  error={errors.ifscCode}
                />
                <CustomInput
                  label="GST TIN"
                  placeholder="Enter GST TIN"
                  value={formData.gstTin}
                  onChange={(v) => handleChange("gstTin", v)}
                  onBlur={() => handleBlur("gstTin")}
                  error={errors.gstTin}
                />
              </div>

              {/* Row 6 - Address Location */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <CustomInput
                  label="Pincode *"
                  placeholder="Enter Pincode"
                  value={formData.pincode}
                  onChange={(v) => handleChange("pincode", v)}
                  onBlur={() => handleBlur("pincode")}
                  error={errors.pincode}
                />
                <CustomSelect
                  label="State *"
                  value={formData.state}
                  onChange={(v) => handleChange("state", v)}
                  error={errors.state}
                  options={INDIAN_STATES.map((state) => ({
                    label: state,
                    value: state,
                  }))}
                  placeholder="Select State"
                />
                <CustomInput
                  label="City *"
                  placeholder="Enter City"
                  value={formData.city}
                  onChange={(v) => handleChange("city", v)}
                  onBlur={() => handleBlur("city")}
                  error={errors.city}
                />
              </div>

              {/* Row 7 - Address Lines */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <CustomInput
                  label="Address 1 *"
                  placeholder="Enter Address Line 1"
                  value={formData.address1}
                  onChange={(v) => handleChange("address1", v)}
                  onBlur={() => handleBlur("address1")}
                  error={errors.address1}
                />
                <CustomInput
                  label="Address 2"
                  placeholder="Enter Address Line 2"
                  value={formData.address2}
                  onChange={(v) => handleChange("address2", v)}
                  onBlur={() => handleBlur("address2")}
                  error={errors.address2}
                />
              </div>
            </div>

            {/* --- FOOTER --- */}
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
                  "Save Account Details"
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- HELPER COMPONENT FOR SELECT ---
const CustomSelect = ({
  label,
  value,
  onChange,
  error,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  options: { label: string; value: string }[];
  placeholder: string;
}) => (
  <div className="flex flex-col items-start gap-1 flex-1 w-full">
    <Label className="font-inter text-muted-foreground text-xs font-normal leading-[150%]">
      {label}
    </Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={`flex h-12 px-4 items-center self-stretch rounded-[24px] border ${
          error
            ? "border-red-500 focus:ring-red-500"
            : "border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-primary-500"
        } focus:ring-offset-0`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    {error && (
      <span className="text-red-500 text-xs px-1 animate-in fade-in slide-in-from-top-1">
        {error}
      </span>
    )}
  </div>
);

// --- HELPER COMPONENT FOR INPUTS ---
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
      className={`flex h-12 px-4 items-center self-stretch rounded-[24px] border ${
        error
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
