"use client";

import {
  LogOut,
  User,
} from "lucide-react";
import { AltArrowDown } from "@solar-icons/react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useUser, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

import { getInitials, getDisplayName } from "@/lib/user-utils";

export function NavUser() {
  const { isMobile, state } = useSidebar();
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-3 p-2">
            <div className="h-8 w-8 rounded-full bg-neutral-200 animate-pulse" />
            <div className="flex flex-col gap-1">
              <div className="h-3 w-20 bg-neutral-200 rounded animate-pulse" />
              <div className="h-2 w-24 bg-neutral-200 rounded animate-pulse" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const userEmail = user.primaryEmailAddress?.emailAddress ?? "";
  const userFirstName = user.firstName ?? null;
  const userLastName = user.lastName ?? null;
  const userImageUrl = user.imageUrl ?? null;
  const displayName = getDisplayName(userFirstName, userLastName, userEmail);
  const initials = getInitials(userFirstName, userLastName, userEmail);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={userImageUrl ?? undefined} alt={displayName} />
                <AvatarFallback className="rounded-full bg-primary-500 text-background">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="truncate text-xs">{userEmail}</span>
              </div>
              {state === "expanded" && (
                <AltArrowDown className="ml-auto size-4" />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage src={userImageUrl ?? undefined} alt={displayName} />
                  <AvatarFallback className="rounded-full bg-primary-500 text-background">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs">{userEmail}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center cursor-pointer">
                  <User className="mr-2 size-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <SignOutButton>
              <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer">
                <LogOut className="mr-2 size-4" />
                Log out
              </DropdownMenuItem>
            </SignOutButton>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
