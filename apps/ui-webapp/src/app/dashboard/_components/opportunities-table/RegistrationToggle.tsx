import React from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface RegistrationToggleProps {
  isOpen: boolean;
  onChange?: (isOpen: boolean) => void;
}

export const RegistrationToggle: React.FC<RegistrationToggleProps> = ({
  isOpen,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={isOpen}
        onCheckedChange={onChange}
        className={cn(
          "h-5 w-10 px-0.5 data-[state=checked]:**:data-[slot=switch-thumb]:translate-x-5",
          isOpen ? "bg-UI-Success" : "bg-UI-Error",
        )}
      />
      <span
        className={cn(
          "text-xs font-medium px-2 py-0.5 rounded-full",
          isOpen
            ? "bg-accent-green-100 text-accent-green-500"
            : "bg-destructive/20 text-destructive-foreground",
        )}
      >
        {isOpen ? "Open" : "Closed"}
      </span>
    </div>
  );
};
