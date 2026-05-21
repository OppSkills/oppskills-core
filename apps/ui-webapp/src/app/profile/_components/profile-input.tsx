"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ProfileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  isSelect?: boolean;
  containerClassName?: string;
  disabled?: boolean;
}

export function ProfileInput({
  label,
  icon,
  isSelect,
  containerClassName,
  className,
  value,
  defaultValue,
  placeholder,
  ...props
}: ProfileInputProps) {
  return (
    <div className={cn(label ? "space-y-2" : "", className)}>
      {label && (
        <label className="text-sm font-medium text-neutral-400">{label}</label>
      )}
      <div
        className={cn(
          "w-full border rounded-[28px] px-6 py-4 flex items-center justify-between transition-colors",
          isSelect && !props.disabled ? "cursor-pointer" : "",
          props.disabled
            ? "bg-neutral-50 border-transparent"
            : containerClassName || "bg-[#f2f2f2] border-neutral-300",
        )}
      >
        {isSelect ? (
          <span
            className={cn(
              "text-lg",
              props.disabled ? "text-neutral-500" : "text-neutral-700",
            )}
          >
            {value || defaultValue || placeholder}
          </span>
        ) : (
          <input
            type={props.type || "text"}
            value={value}
            defaultValue={defaultValue}
            placeholder={placeholder}
            disabled={props.disabled}
            className="w-full bg-transparent border-none outline-none text-neutral-700 text-lg placeholder:text-neutral-400 disabled:text-neutral-500 disabled:opacity-100"
            {...props}
          />
        )}
        {icon && <div className="shrink-0 ml-4 flex items-center">{icon}</div>}
      </div>
    </div>
  );
}
