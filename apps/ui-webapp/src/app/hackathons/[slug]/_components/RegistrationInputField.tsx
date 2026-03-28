"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface RegistrationInputFieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
  readOnly?: boolean;
  className?: string;
  suffix?: React.ReactNode;
}

export function RegistrationInputField({
  label,
  placeholder,
  value,
  onChange,
  required = false,
  type = "text",
  readOnly = false,
  className,
  suffix,
}: RegistrationInputFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-neutral-500 font-medium ml-1">
        {label}
        {required && <span className="text-red-500 ml-1 font-bold">*</span>}
      </Label>
      <div className="relative">
        <Input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          required={required}
          className="h-14 rounded-full border-neutral-400 bg-neutral-100 px-6"
        />
        {suffix && (
          <div className="absolute right-2 top-2 h-10">
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
}
