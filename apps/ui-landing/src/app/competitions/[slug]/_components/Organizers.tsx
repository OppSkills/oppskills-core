"use client";

import React from "react";
import { Organizer } from "./types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Linkedin } from "lucide-react";
import Link from "next/link";

interface OrganizersProps {
  organizers: Organizer[];
}

export function Organizers({ organizers }: OrganizersProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-neutral-900 ">Organizers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {organizers.map((organizer) => (
          <div
            key={organizer.id}
            className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200  bg-white  hover:border-purple-200  transition-colors"
          >
            <Avatar className="h-12 w-12 border border-neutral-100">
              <AvatarImage src={organizer.avatar} alt={organizer.name} />
              <AvatarFallback>
                {organizer.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-neutral-900  truncate">
                {organizer.name}
              </h4>
              <p className="text-xs text-neutral-500  truncate">
                {organizer.role}
              </p>
              {organizer.company && (
                <p className="text-xs text-neutral-400  truncate mt-0.5">
                  {organizer.company}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {organizer.linkedin && (
                <Link
                  href={organizer.linkedin}
                  className="p-2 text-neutral-400 hover:text-[#0077b5] hover:bg-neutral-50  rounded-full transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
