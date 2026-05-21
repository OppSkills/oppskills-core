import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import Image from "next/image";
import React from "react";

interface RoleCardProps {
  name: string;
  email: string;
  imageUrl?: string | null;
  type: "Owner" | "Manager" | "Evaluator";
  onDelete?: () => void;
}

export default function RoleCard({
  name,
  email,
  imageUrl,
  type,
  onDelete,
}: RoleCardProps) {
  const isOwner = type === "Owner";

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-xl border gap-4 transition-all",
        isOwner
          ? "bg-[#FCF0FF] border-[#F3E8FF]"
          : "bg-background border-border hover:shadow-sm",
      )}
    >
      <div className="flex items-center gap-4">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            width={56}
            height={56}
            className="w-14 h-14 rounded-full object-cover shrink-0"
          />
        ) : (
          <div
            className={cn(
              "flex items-center justify-center w-14 h-14 rounded-full text-background text-xl font-bold shrink-0",
              "bg-[#3b0764]", // darker purple for avatar
            )}
          >
            {getInitials(name)}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-foreground">{name}</h3>
            {isOwner && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#A020F0] text-background">
                Owner
              </span>
            )}
          </div>
          <span className="text-sm text-muted-foreground">{email}</span>
        </div>
      </div>

      {!isOwner && onDelete && (
        <div className="flex items-center gap-2 self-end md:self-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove
          </Button>
        </div>
      )}

      {isOwner && (
        <div className="flex items-center gap-2 self-end md:self-center">
          <span className="text-xs text-muted-foreground italic">
            Cannot be modified
          </span>
        </div>
      )}
    </div>
  );
}
