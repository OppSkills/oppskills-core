"use client";

import * as React from "react";
import { IconMenu2, IconLayoutSidebar } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMobileNavigation } from "./mobile-navigation-context";

interface MobileSidebarSwitcherProps {
  className?: string;
}

export function MobileSidebarSwitcher({
  className,
}: MobileSidebarSwitcherProps) {
  const { activeMobileTab, setActiveMobileTab, setMobileMenuOpen } =
    useMobileNavigation();

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md border bg-background p-1 md:hidden",
        className
      )}
    >
      <Button
        variant={activeMobileTab === "main" ? "default" : "ghost"}
        size="sm"
        className="flex-1"
        onClick={() => {
          setActiveMobileTab("main");
          setMobileMenuOpen(true);
        }}
      >
        <IconMenu2 className="mr-2 size-4" />
        Main
      </Button>
      <Button
        variant={activeMobileTab === "opportunity" ? "default" : "ghost"}
        size="sm"
        className="flex-1"
        onClick={() => {
          setActiveMobileTab("opportunity");
          setMobileMenuOpen(true);
        }}
      >
        <IconLayoutSidebar className="mr-2 size-4" />
        Context
      </Button>
    </div>
  );
}
