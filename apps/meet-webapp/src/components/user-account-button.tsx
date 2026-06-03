"use client";

import React from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { LayoutDashboard, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MAIN_SITE_URL } from "@/lib/constants";

export function UserAccountButton() {
  const { user } = useUser();
  const { signOut } = useClerk();

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative h-10 w-10 rounded-full p-0 outline-none focus-visible:ring-2 focus-visible:ring-[#835BD5]/50"
        >
          <Avatar className="h-10 w-10 border-2 border-[#835BD5]/30 transition-all hover:border-[#835BD5]/60">
            <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
            <AvatarFallback className="bg-[#835BD5]/15 text-[#835BD5] font-medium">
              {user.firstName?.charAt(0)}
              {user.lastName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        forceMount
        className="min-w-64 md:min-w-80 rounded-2xl border-white/10"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1 p-2">
            <p className="text-sm font-semibold leading-none text-white">
              {user.fullName}
            </p>
            <p className="text-xs leading-none text-white/45 truncate">
              {user.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer py-2.5">
            <a
              href={`${MAIN_SITE_URL}/dashboard`}
              className="flex items-center"
            >
              <LayoutDashboard className="mr-2 h-4 w-4 text-white/45" />
              <span>Dashboard</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer py-2.5">
            <a href={`${MAIN_SITE_URL}/profile`} className="flex items-center">
              <User className="mr-2 h-4 w-4 text-white/45" />
              <span>My Profile</span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer py-2.5 text-red-400 focus:bg-red-500/10 focus:text-red-400"
          onClick={() => void handleSignOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
