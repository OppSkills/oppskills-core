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
        "flex items-center gap-1 p-2 border-t bg-background md:hidden",
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
        variant={activeMobileTab === "secondary" ? "default" : "ghost"}
        size="sm"
        className="flex-1"
        onClick={() => {
          setActiveMobileTab("secondary");
          setMobileMenuOpen(true);
        }}
      >
        <IconLayoutSidebar className="mr-2 size-4" />
        Context
      </Button>
    </div>
  );
}
