import React from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface ContainerProps {
  heading: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export const Container = ({
  heading,
  description,
  className,
  children,
  action,
}: ContainerProps) => {
  return (
    <div className="w-full flex flex-col gap-2 border border-neutral-200 rounded-2xl py-4 px-6 shadow-sm">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <p className="text-xl text-neutral-800 poppins font-bold">{heading}</p>
          {description && <p className="text-sm text-neutral-700 inter">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <Separator className="my-3 bg-neutral-300" />
      <div className={cn("flex flex-col gap-2", className)}>{children}</div>
    </div>
  );
};
