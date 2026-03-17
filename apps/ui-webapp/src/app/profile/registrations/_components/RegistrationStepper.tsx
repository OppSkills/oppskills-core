"use client";

import React from "react";
import { Check, Edit3, Users, Wallet, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { RegistrationStage } from "./registration-types";

interface RegistrationStepperProps {
  stages: RegistrationStage[];
}

export function RegistrationStepper({ stages }: RegistrationStepperProps) {
  const getIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case "registration":
        return <Check className="w-5 h-5" />;
      case "team":
        return <Users className="w-5 h-5" />;
      case "payment":
        return <Wallet className="w-5 h-5" />;
      case "extended form":
        return <Edit3 className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex items-center w-full max-w-[600px] mt-6">
      {stages.map((stage, index) => (
        <React.Fragment key={stage.label}>
          <div className="flex flex-col items-center relative group">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all mb-2",
                stage.status === "completed" 
                  ? "bg-[#6B4EAB] text-white" 
                  : stage.status === "current"
                    ? "bg-[#6B4EAB]/10 text-[#6B4EAB] border-2 border-[#6B4EAB]"
                    : "bg-[#F2F2F5] text-[#9E9EAE]"
              )}
            >
              {getIcon(stage.label)}
            </div>
            <span
              className={cn(
                "text-xs font-medium whitespace-nowrap absolute -bottom-6",
                stage.status === "pending" ? "text-[#9E9EAE]" : "text-[#4A4A5A]"
              )}
            >
              {stage.label}
            </span>
          </div>

          {index < stages.length - 1 && (
            <div className="flex-1 h-[2px] mx-2 mb-2 bg-[#F2F2F5] relative overflow-hidden">
              <div 
                className={cn(
                  "absolute inset-0 bg-[#6B4EAB] transition-all duration-500",
                  stage.status === "completed" ? "w-full" : "w-0"
                )} 
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
