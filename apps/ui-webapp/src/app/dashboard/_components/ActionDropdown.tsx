"use client";

import React from "react";
import Link from "next/link";
import { MoreVertical, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ActionDropdownProps {
  onEdit?: () => void;
  onDelete?: () => void;
  editHref?: string;
  settingsHref?: string;
  className?: string;
}

export default function ActionDropdown({
  onEdit,
  onDelete,
  editHref,
  settingsHref,
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
        {settingsHref && (
          <DropdownMenuItem asChild>
            <Link href={settingsHref} className="w-full cursor-pointer flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
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
