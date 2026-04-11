"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useParams, usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, SignOutButton } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";

function getInitials(
  firstName: string | null,
  lastName: string | null,
  email: string
): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }
  if (lastName) {
    return lastName.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function getDisplayName(
  firstName: string | null,
  lastName: string | null,
  email: string
): string {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  if (firstName) {
    return firstName;
  }
  if (lastName) {
    return lastName;
  }
  return email.split("@")[0];
}

export function SiteHeader() {
  const pathname = usePathname();
  const params = useParams();
  const slug = params?.slug as string;
  const { user, isLoaded } = useUser();

  // Helper to determine title
  const getTitle = () => {
    if (pathname.includes("/manage-registration")) return "Manage Registration";
    if (pathname.includes("/edit-event")) return "Edit Event";
    if (pathname.includes("/edit-hackathon")) return "Edit Hackathon";
    if (pathname.includes("/tickets")) return "Tickets";
    if (pathname.includes("/manage-roles")) return "Manage Roles";
    if (pathname.includes("/notifications")) return "Notifications";

    // Check main sections
    if (pathname.includes("/dashboard/events")) return "Events";
    if (pathname.includes("/dashboard/hackathon"))
      return slug ? slug.split("-").join(" ").toUpperCase() : "Hackathons";
    if (pathname.includes("/dashboard/festivals")) return "Festivals";

    if (pathname.startsWith("/profile")) return "Profile";

    // Default
    return "Dashboard";
  };

  const title = getTitle();
  const showProfile = pathname.includes("/dashboard");

  // Extract user info
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  const userFirstName = user?.firstName ?? null;
  const userLastName = user?.lastName ?? null;
  const userImageUrl = user?.imageUrl ?? null;
  const displayName = getDisplayName(userFirstName, userLastName, userEmail);
  const initials = getInitials(userFirstName, userLastName, userEmail);

  return (
    <header className="flex bg-background shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear px-4 lg:px-6 h-14">
      <div className="flex w-full items-center justify-between ">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />

          <h1 className="text-2xl font-semibold tracking-tight text-primary-900">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {showProfile && isLoaded && user ? (
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-neutral-200 hover:bg-slate-200"
              >
                <Bell className="h-5 w-5 text-neutral-700" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 cursor-pointer outline-none">
                    <Avatar className="h-10 w-10 border border-slate-200">
                      <AvatarImage src={userImageUrl ?? undefined} />
                      <AvatarFallback className="bg-primary-500 text-background">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden flex-col md:flex items-start">
                      <span className="text-sm font-bold text-[#1A1A1A]">
                        {displayName}
                      </span>
                      <span className="text-xs text-[#5F6368]">
                        {userEmail}
                      </span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userImageUrl ?? undefined} />
                      <AvatarFallback className="bg-primary-500 text-background text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{displayName}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                        {userEmail}
                      </span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a
                      href="/dashboard/profile"
                      className="flex items-center cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <SignOutButton>
                    <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </SignOutButton>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : showProfile ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-neutral-200 animate-pulse" />
              <div className="hidden md:flex flex-col gap-1">
                <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
                <div className="h-3 w-32 bg-neutral-200 rounded animate-pulse" />
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              asChild
              size="sm"
              className="hidden sm:flex"
            >
              <a
                href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
                rel="noopener noreferrer"
                target="_blank"
                className=""
              >
                GitHub
              </a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
