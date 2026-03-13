"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FloatingLabelInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ className, label, icon, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const hasValue = props.value || props.defaultValue || (ref && typeof ref !== 'function' && ref.current?.value);

    return (
      <div className="group relative w-full">
        <div
          className={cn(
            "relative flex items-center min-h-[56px] rounded-2xl border bg-white transition-all duration-200 px-4",
            isFocused
              ? "border-primary-500 ring-4 ring-primary-100"
              : "border-primary-200 hover:border-primary-300",
            className
          )}
        >
          <label
            className={cn(
              "absolute left-4 transition-all duration-200 pointer-events-none text-neutral-500",
              (isFocused || hasValue)
                ? "-top-2.5 left-3 px-1 text-xs font-semibold text-primary-600 bg-white"
                : "text-base"
            )}
          >
            {label}
          </label>
          <input
            {...props}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className="w-full bg-transparent border-none outline-none text-neutral-900 text-base py-3 autofill-bg-transparent"
          />
          {icon && (
            <div className="ml-2 text-primary-500">
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  }
);
FloatingLabelInput.displayName = "FloatingLabelInput";

export { FloatingLabelInput };
