import React from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface ContainerProps {
  heading: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export const Container = ({
  heading,
  description,
  className,
  children,
}: ContainerProps) => {
  return (
    <div className="w-full flex flex-col gap-2 border border-neutral-200 rounded-2xl py-4 px-6 shadow-sm">
      <p className="text-xl text-neutral-800 poppins">{heading}</p>
      {description && (
        <p className="text-base text-primary-600/80 inter">{description}</p>
      )}
      <Separator className="my-3 bg-primary-100" />
      <div className={cn("flex flex-col gap-2", className)}>{children}</div>
    </div>
  );
};
