import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trash2, Pencil } from "lucide-react";
import React from "react";

interface RoleCardProps {
  name: string;
  phone: string;
  email: string;
  type: "Owner" | "Manager" | "Evaluator";
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function RoleCard({
  name,
  phone,
  email,
  type,
  onEdit,
  onDelete,
}: RoleCardProps) {
  const isOwner = type === "Owner";

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-xl border gap-4 transition-all",
        isOwner
          ? "bg-[#FCF0FF] border-[#F3E8FF]"
          : "bg-white border-border hover:shadow-sm"
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex items-center justify-center w-14 h-14 rounded-full text-white text-xl font-bold shrink-0",
            "bg-[#3b0764]" // darker purple for avatar
          )}
        >
          {name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase()}
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-bold text-lg text-foreground">{name}</h3>
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 text-sm text-muted-foreground">
            <span>{phone}</span>
            <span className="hidden md:block w-[1px] h-4 bg-muted-foreground/30"></span>
            <span>{email}</span>
          </div>
        </div>
      </div>

      {!isOwner && (
        <div className="flex items-center gap-2 self-end md:self-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-[#A020F0] hover:text-[#8e1cd6] hover:bg-[#F3E8FF]"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-[#A020F0] hover:text-[#8e1cd6] hover:bg-[#F3E8FF]"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      )}

      {isOwner && (
        <div className="flex items-center gap-2 self-end md:self-center opacity-50 cursor-pointer text-sm text-[#A020F0]">
          <Pencil className="w-4 h-4 mr-2" />
          Edit
          <Trash2 className="w-4 h-4 ml-4 mr-2" />
          Delete
        </div>
      )}
    </div>
  );
}
