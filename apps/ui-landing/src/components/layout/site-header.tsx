"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();

  // Helper to determine title
  const getTitle = () => {
    if (pathname.includes("/manage-registration")) return "Manage Registration";
    if (pathname.includes("/edit-event")) return "Edit Event";
    if (pathname.includes("/edit-opportunity")) return "Edit Opportunity";
    if (pathname.includes("/tickets")) return "Tickets";
    if (pathname.includes("/manage-roles")) return "Manage Roles";
    if (pathname.includes("/notifications")) return "Notifications";

    // Check main sections
    if (pathname.includes("/dashboard/events")) return "Events";
    if (pathname.includes("/dashboard/opportunity")) return "Opportunities";
    if (pathname.includes("/dashboard/festivals")) return "Festivals";

    // Default
    return "Dashboard";
  };

  const title = getTitle();
  const showProfile = pathname.includes("/dashboard");
  const showBackButton =
    pathname.includes("/dashboard/events/") ||
    pathname.includes("/dashboard/opportunity/") ||
    pathname.includes("/dashboard/festivals/");

  return (
    <header className="flex bg-white shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear rounded-xl px-4 lg:px-6">
      <div className="flex w-full items-center justify-between p-5">
        <div className="flex items-center gap-2">
          {(!showBackButton || !pathname.includes("/manage-registration")) && (
            <SidebarTrigger className="-ml-1" />
          )}
          {(!showBackButton || !pathname.includes("/manage-registration")) && (
            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-4"
            />
          )}

          {showBackButton && !pathname.includes("/manage-registration") && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          <h1 className="text-2xl font-semibold tracking-tight text-primary-900">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {showProfile ? (
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-neutral-200 hover:bg-slate-200"
              >
                <Bell className="h-5 w-5 text-neutral-700" />
              </Button>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-slate-200">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback className="bg-primary text-white">
                    EC
                  </AvatarFallback>
                </Avatar>
                <div className="hidden flex-col md:flex items-start">
                  <span className="text-sm font-bold text-[#1A1A1A]">
                    E-Cell NoC
                  </span>
                  <span className="text-xs text-[#5F6368]">
                    Rohanvats12@gmail.com
                  </span>
                </div>
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
                className="dark:text-foreground"
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
