import React from "react";
import { cn } from "@/lib/utils";
import { OpportunityStatus } from "./types";

interface StatusBadgeProps {
  status: OpportunityStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles = {
    "In Progress": "bg-accent-green-100 text-accent-green-500",
    Completed: "bg-primary-100 text-primary-500",
    Closed: "bg-neutral-200 text-neutral-500",
  };

  return (
    <span
      className={cn(
        "py-1 px-2 rounded-xs text-xs font-medium whitespace-nowrap",
        styles[status] || styles["Closed"],
      )}
    >
      {status}
    </span>
  );
};
