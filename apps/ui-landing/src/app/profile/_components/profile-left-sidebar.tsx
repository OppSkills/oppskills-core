"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Calendar, Trophy, LogOutIcon, Wallet } from "lucide-react";
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
    title: "My Opportunities",
    href: "/profile/opportunity-history",
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

export function ProfileLeftSidebar({ setActivePage }: { setActivePage: (page: string) => void }) {
  const pathname = usePathname();
  const { signOut } = useClerk();


  return (
    <aside className="hidden lg:flex flex-col w-80 bg-neutral-100 border-r border-neutral-100 p-8 sticky top-0 overflow-y-auto rounded-3xl h-full">
      <div className="mb-8 flex w-full justify-center">
        <Link href="/">
          <Image
            src="/logo.svg"
            alt="OppSkills"
            width={200}
            height={30}
          />
        </Link>
      </div>

      <div className="space-y-10 h-full">
        <div className="flex flex-col gap-4 h-full">
          <p className="text-neutral-600 font-medium">Menu</p>
          <nav className="space-y-3">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              if (isActive) setActivePage(item.title);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("flex rounded-lg w-full gap-4 text-neutral-700 hover:text-neutral-900 py-1 px-4", isActive && "text-primary-600 bg-primary-100")}
                >
                  <Icon
                    strokeWidth={1.5}
                  />
                  <span className="text-xl font-medium tracking-tight">
                    {item.title}
                  </span>
                </Link>
              );
            })}

          </nav>
          <p
            onClick={() => signOut()}
            className={"cursor-pointer flex mt-auto items-center rounded-lg w-full gap-4 text-destructive-foreground/90 hover:text-destructive-foreground  hover:bg-destructive py-1 px-4"}
          >
            <LogOutIcon />
            <span className="text-xl font-medium tracking-tight">
              Logout
            </span>
          </p>
        </div>
      </div>
    </aside>
  );
}
