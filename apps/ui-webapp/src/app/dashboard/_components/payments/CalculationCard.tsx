"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, Circle } from "lucide-react";

interface CalculationCardProps {
  title: string;
  isSelected: boolean;
  onClick: () => void;
  totalRowLabel?: string;
  values: {
    reg: string;
    platformFee: string;
    gst: string;
    totalDeduction: string;
    youGet: string;
  };
}

export const CalculationCard = ({
  title,
  isSelected,
  onClick,
  totalRowLabel = "Total processing",
  values,
}: CalculationCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex w-full max-w-[362px] p-5 flex-col items-start gap-3 rounded-2xl border transition-all duration-200",
        isSelected
          ? "border-primary-500 bg-primary-100/30 shadow-md shadow-primary-500/10"
          : "border-neutral-200 bg-white cursor-pointer hover:border-primary-200",
      )}
    >
      <div className="flex justify-between items-center self-stretch">
        <span className="font-sans text-neutral-900 text-xl font-bold poppins leading-relaxed">
          {title}
        </span>
        {isSelected ? (
          <CheckCircle className="w-6 h-6 text-primary-600 fill-primary-600" />
        ) : (
          <Circle className="w-6 h-6 text-neutral-300" />
        )}
      </div>

      <div className="flex flex-col w-full gap-3">
        <div className="flex justify-between items-center self-stretch">
          <span className="font-sans text-neutral-600 text-base font-normal leading-relaxed">
            Entry Fee:
          </span>
          <span className="font-sans text-primary-600 text-base font-bold leading-relaxed">
            {values.reg}
          </span>
        </div>

        <div className="flex justify-between items-center self-stretch">
          <span className="font-sans text-neutral-600 text-base font-normal leading-relaxed">
            Razorpay fee (2%):
          </span>
          <span className="font-sans text-primary-600 text-base font-bold leading-relaxed">
            {values.platformFee}
          </span>
        </div>

        <div className="flex justify-between items-center self-stretch">
          <span className="font-sans text-neutral-600 text-base font-normal leading-relaxed">
            GST on Razorpay fee:
          </span>
          <span className="font-sans text-primary-600 text-base font-bold leading-relaxed">
            {values.gst}
          </span>
        </div>

        <div className="flex justify-between items-center self-stretch">
          <span className="font-sans text-neutral-600 text-base font-normal leading-relaxed">
            {totalRowLabel}:
          </span>
          <span className="font-sans text-primary-600 text-base font-bold leading-relaxed">
            {values.totalDeduction}
          </span>
        </div>
      </div>

      <div className="w-full h-[1px] bg-neutral-200 my-1"></div>

      <div className="flex justify-between items-center self-stretch">
        <span className="font-sans text-neutral-600 text-base font-medium leading-relaxed">
          You receive
        </span>
        <span className="font-sans text-primary-600 text-lg font-black leading-relaxed">
          {values.youGet}
        </span>
      </div>
    </div>
  );
};
