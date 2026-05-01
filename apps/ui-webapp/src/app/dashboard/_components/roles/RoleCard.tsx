"use client";

import { cn } from "@/lib/utils";

import { TrashBin2, TrashBinTrash } from "@solar-icons/react";
interface RoleCardProps {
  name: string;
  email: string;
  phone?: string;
  imageUrl?: string | null;
  type: "Owner" | "Manager" | "Evaluator";
  onDelete?: () => void;
}

export function RoleCard({
  name,
  email,
  phone,
  imageUrl,
  type,
  onDelete,
}: RoleCardProps) {
  const isOwner = type === "Owner";

  const getInitials = (n: string) => {
    return n
      .split(" ")
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between p-3 rounded-lg border transition-all w-full",
        "bg-primary-100 border-primary-500 shadow-sm hover:shadow-md"
      )}
    >
      <div className="flex items-center gap-4 w-full sm:w-auto">
        {/* Avatar */}
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#1A1625] text-white font-bold text-lg shrink-0 overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            getInitials(name)
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-0.5">
          <h3 className="text-neutral-900 font-semibold text-xl">{name}</h3>
          <div className="flex flex-wrap items-center gap-x-2 text-base text-neutral-700">
            {phone && (
              <>
                <span>{phone}</span>
                <span className="hidden sm:inline text-neutral-400">|</span>
              </>
            )}
            <span className="truncate max-w-[200px] sm:max-w-none">{email}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 mt-4 sm:mt-0 ml-auto sm:ml-0">
        <button
          onClick={onDelete}
          disabled={isOwner}
          className={cn(
            "flex items-center gap-2 text-xs font-medium transition-colors md:pr-4 cursor-pointer",
            isOwner ? "text-neutral-400 cursor-not-allowed" : "text-primary-700 hover:text-primary-600 "
          )}
        >
          <TrashBinTrash className="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}

