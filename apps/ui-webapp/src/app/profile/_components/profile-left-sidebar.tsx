"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Calendar, Trophy, LogOutIcon, Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useClerk } from "@clerk/nextjs";

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
  isCollapsed = false
}: {
  setActivePage: (page: string) => void,
  onItemClick?: () => void,
  isCollapsed?: boolean
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

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex rounded-lg w-full gap-4 text-neutral-700 hover:text-neutral-900 py-2 transition-colors items-center",
                isCollapsed ? "justify-center px-2" : "px-4",
                isActive && "text-primary-600 bg-primary-100"
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <Icon strokeWidth={1.5} className="shrink-0" />
              {!isCollapsed && (
                <span className="text-xl font-medium tracking-tight whitespace-nowrap">
                  {item.title}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div
        onClick={() => {
          signOut();
          onItemClick?.();
        }}
        className={cn(
          "cursor-pointer flex mt-auto items-center rounded-lg w-full gap-4 text-destructive-foreground py-2 hover:bg-destructive-foreground/10 transition-colors",
          isCollapsed ? "justify-center px-2" : "px-4"
        )}
        title={isCollapsed ? "Logout" : undefined}
      >
        <LogOutIcon className="shrink-0" />
        {!isCollapsed && (
          <span className="text-xl font-medium tracking-tight whitespace-nowrap">
            Logout
          </span>
        )}
      </div>
    </div>
  );
}

export function ProfileLeftSidebar({ setActivePage }: { setActivePage: (page: string) => void }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={cn(
      "hidden lg:flex flex-col bg-neutral-100 border-r border-neutral-100 sticky top-4 rounded-3xl h-[calc(100vh-2rem)] transition-all duration-300",
      isCollapsed ? "w-[100px]" : "w-80"
    )}>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-12 bg-white border border-neutral-200 rounded-full p-1.5 shadow-sm z-50 hover:bg-neutral-50 flex items-center justify-center transition-colors"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4 text-neutral-600" /> : <ChevronLeft className="w-4 h-4 text-neutral-600" />}
      </button>

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
