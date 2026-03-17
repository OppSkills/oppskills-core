"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Calendar, Trophy, LogOutIcon, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useClerk } from "@clerk/nextjs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NAV_ITEMS = [
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    title: "Registrations",
    href: "/profile/registrations",
    icon: Calendar,
  },
  {
    title: "Achievements",
    href: "/profile/achievements",
    icon: Trophy,
  },
  {
    title: "Transactions",
    href: "/profile/transactions",
    icon: Wallet,
  },
];

export function ProfileNavContent({
  setActivePage,
  onItemClick,
  isCollapsed = false,
  setIsCollapsed
}: {
  setActivePage: (page: string) => void,
  onItemClick?: () => void,
  isCollapsed?: boolean,
  setIsCollapsed?: (collapsed: boolean) => void
}) {
  const pathname = usePathname();
  const { signOut } = useClerk();

  React.useEffect(() => {
    const activeItem = NAV_ITEMS.find(item => item.href === pathname);
    if (activeItem) {
      setActivePage(activeItem.title);
    }
  }, [pathname, setActivePage]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {!isCollapsed && <p className="text-neutral-600 font-medium px-4 transition-all">Menu</p>}
      <nav className="space-y-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          const content = (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex rounded-lg w-full gap-4 text-neutral-700 hover:text-neutral-900 py-2 transition-colors items-center",
                isCollapsed ? "justify-center px-2" : "px-4",
                isActive && "text-primary-600 bg-primary-100"
              )}
            >
              <Icon strokeWidth={1.5} className="shrink-0" />
              {!isCollapsed && (
                <span className="text-base font-medium tracking-tight whitespace-nowrap">
                  {item.title}
                </span>
              )}
            </Link>
          );

          if (isCollapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  {item.title}
                </TooltipContent>
              </Tooltip>
            );
          }

          return content;
        })}
      </nav>
      {(() => {
        const logoutContent = (
          <div
            onClick={() => {
              signOut();
              onItemClick?.();
            }}
            className={cn(
              "cursor-pointer flex mt-auto items-center rounded-lg w-full gap-4 text-destructive-foreground py-2 hover:bg-destructive-foreground/10 transition-colors",
              isCollapsed ? "justify-center px-2" : "px-4"
            )}
          >
            <LogOutIcon className="shrink-0" />
            {!isCollapsed && (
              <span className="text-xl font-medium tracking-tight whitespace-nowrap">
                Logout
              </span>
            )}
          </div>
        );

        if (isCollapsed) {
          return (
            <Tooltip>
              <TooltipTrigger asChild>{logoutContent}</TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                Logout
              </TooltipContent>
            </Tooltip>
          );
        }

        return logoutContent;
      })()}
    </div>
  );
}

export function ProfileLeftSidebar({ setActivePage, isCollapsed, setIsCollapsed }: { setActivePage: (page: string) => void, isCollapsed: boolean, setIsCollapsed: (collapsed: boolean) => void }) {
  return (
    <aside className={cn(
      "hidden lg:flex flex-col bg-neutral-100 border-r border-neutral-100 sticky top-4 rounded-3xl h-[calc(100vh-2rem)] transition-all duration-300",
      isCollapsed ? "w-[100px]" : "w-80"
    )}>
      <div className={cn("flex flex-col h-full w-full overflow-y-auto overflow-x-hidden custom-scrollbar", isCollapsed ? "p-4 items-center" : "p-8")}>
        <div className={cn("mb-8 flex w-full shrink-0", isCollapsed ? "justify-center" : "justify-start")}>
          <Link href="/">
            {isCollapsed ? (
              <Image
                src="/logof.png"
                alt="OppSkills"
                width={30}
                height={30}
                className="object-contain"
              />
            ) : (
              <Image
                src="/logo.svg"
                alt="OppSkills"
                width={160}
                height={30}
                className="object-contain"
              />
            )}
          </Link>
        </div>

        <div className="space-y-10 h-full w-full">
          <ProfileNavContent setActivePage={setActivePage} isCollapsed={isCollapsed} />
        </div>
      </div>
    </aside>
  );
}
