import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Mail, MapPin, GraduationCap, PencilLine } from "lucide-react";

import { formatDateTime } from "@/lib/utils/date";

interface UserProfileCardProps {
  user: {
    name: string;
    email: string;
    avatarUrl?: string | null;
    institution?: string | null;
    location?: string | null;
    profession?: string | null;
    registrationDate?: Date | string | null;
  };
}

export function UserProfileCard({ user }: UserProfileCardProps) {

  return (
    <div className="flex flex-col gap-4 p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <Avatar className="h-28 w-28 shadow-md ring-1 ring-neutral-100 shrink-0">
          <AvatarImage
            src={user.avatarUrl || undefined}
            alt={user.name}
            className="object-cover"
          />
          <AvatarFallback className="bg-primary-50 text-primary-600 text-3xl font-bold">
            {user.name ? user.name.charAt(0).toUpperCase() : "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2">
          <h3 className="text-2xl font-medium text-neutral-900 tracking-tight">
            {user.name || "Unknown User"}
          </h3>
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex items-center gap-3 text-neutral-500">
              <Building2 className="size-4 shrink-0" />
              <span className="text-sm font-medium">
                {user.institution || "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-neutral-500">
              <Mail className="size-4 shrink-0" />
              <span className="text-sm font-medium">{user.email || "N/A"}</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-500">
              <MapPin className="size-4 shrink-0" />
              <span className="text-sm font-medium">
                {user.location || "N/A"}
              </span>
            </div>
            <div className="flex items-start gap-3 text-neutral-500">
              <GraduationCap className="size-4 shrink-0 mt-0.5" />
              <span className="text-sm font-medium leading-tight">
                {user.profession || "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-neutral-500">
              <PencilLine className="size-4 shrink-0" />
              <span className="text-sm font-medium">
                Registered on: {formatDateTime(user.registrationDate)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
