"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import { Breadcrumbs } from "./breadcrumbs";
import { useUser } from "@clerk/nextjs";
import { MessageSquare } from "lucide-react";
import { chatNavLink } from "@/lib/site-navigation";
import { cn } from "@/lib/utils";

import { getInitials, getDisplayName } from "@/lib/user-utils";

export function SiteHeader() {
  const pathname = usePathname();
  const params = useParams();
  const slug = params?.slug as string;
  const { user, isLoaded } = useUser();
  const { state } = useSidebar();
  const isExpanded = state === "expanded";

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
    if (pathname.includes("/dashboard/chats")) return "Chats";

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

  const isChatActive = pathname.startsWith(chatNavLink.href);

  return (
    <header className="sticky top-0 z-40 flex bg-background shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear px-4 lg:px-6 h-14 border-neutral-300">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <Breadcrumbs />
        </div>
        <Link
          href={chatNavLink.href}
          aria-current={isChatActive ? "page" : undefined}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            isChatActive
              ? "border-primary-200 bg-primary-50 text-primary-700"
              : "border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
          )}
        >
          <MessageSquare className="size-4" />
          <span>{chatNavLink.name}</span>
        </Link>
      </div>
    </header>
  );
}
