"use client";

import React from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ActionDropdownProps {
  onEdit?: () => void;
  onDelete?: () => void;
  editHref?: string;
  className?: string;
}

export default function ActionDropdown({
  onEdit,
  onDelete,
  editHref,
  className,
}: ActionDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className={cn(
            "p-2 rounded-full hover:bg-muted transition-colors border border-gray-300 cursor-pointer h-8 w-8 flex items-center justify-center",
            className
          )}
        >
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {editHref ? (
          <DropdownMenuItem asChild>
            <Link href={editHref} className="w-full cursor-pointer">
              Edit
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
            Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={onDelete}
          className="text-destructive-foreground focus:text-destructive cursor-pointer"
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
