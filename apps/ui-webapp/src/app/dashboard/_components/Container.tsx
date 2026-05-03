import React from "react";
import { cn } from "@/lib/utils";

interface ContainerProps {
  heading: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  variant?: "col" | "row";
}

export const Container = ({
  heading,
  description,
  className,
  children,
  action,
  variant = "col",
}: ContainerProps) => {
  if (variant === "row") {
    return (
      <div className="w-full border border-neutral-200 rounded-2xl p-6 shadow-sm bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-1 max-w-xl">
            <p className="text-lg text-neutral-800 poppins font-bold leading-tight">{heading}</p>
            {description && (
              <p className="text-sm text-neutral-600 inter font-medium leading-normal">{description}</p>
            )}
          </div>
          <div className={cn("flex flex-col gap-2 flex-1 md:flex-initial md:min-w-[240px]", className)}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 border border-neutral-200 rounded-2xl py-4 px-6 shadow-sm bg-white">
      <div className="flex justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xl text-neutral-800 poppins font-bold">{heading}</p>
          {description && (
            <p className="text-sm text-neutral-600 inter font-medium">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className={cn("flex flex-col gap-2", className)}>{children}</div>
    </div>
  );
};
