import React from "react";
import { cn } from "@/lib/utils";

interface InputBlockProps {
  icon?: React.ReactNode;
  label: React.ReactNode;
  subLabel?: string;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function InputBlock({
  icon,
  label,
  subLabel,
  children,
  className,
  onClick,
}: InputBlockProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-neutral-200 break-all rounded-xl p-4 flex flex-col justify-center gap-1 hover:bg-muted/80 transition-colors cursor-pointer group",
        className,
      )}
    >
      <div className="flex items-center gap-3 text-neutral-700 group-hover:text-foreground transition-colors">
        {icon && <div className="min-w-4 shrink-0">{icon}</div>}
        <span className="font-medium text-xl truncate w-full text-neutral-700">
          {label}
        </span>
      </div>
      {subLabel && (
        <p className="text-muted-foreground/60 text-sm pl-9 truncate">
          {subLabel}
        </p>
      )}
      {children}
    </div>
  );
}
