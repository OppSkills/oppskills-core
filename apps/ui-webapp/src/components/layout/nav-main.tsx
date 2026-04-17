"use client";

import * as React from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavMainItem = {
  title: string;
  url: string;
  icon?: React.ReactNode;
};

/**
 * Normalize paths so active matching is stable:
 * - Ensure empty/undefined becomes "/"
 * - Remove trailing slash (except root)
 */
function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (trimmed.length === 0) {
    return "/";
  }

  if (trimmed.length > 1 && trimmed.endsWith("/")) {
    return trimmed.slice(0, -1);
  }

  return trimmed;
}

/**
 * Match on the longest URL prefix so that:
 * - `/dashboard/hackathon/...` activates "Opportunity" over "Dashboards"
 * - nested pages like `/manage-registration/...` still activate "Registration"
 */
function findActiveUrl(
  items: NavMainItem[],
  currentPath: string
): string | null {
  const normalizedPath = normalizePath(currentPath);

  let bestUrl: string | null = null;
  let bestScore = 0;

  for (const item of items) {
    const normalizedItemUrl = normalizePath(item.url);

    // Exact match
    if (normalizedPath === normalizedItemUrl) {
      const score = normalizedItemUrl.length;
      if (score > bestScore) {
        bestScore = score;
        bestUrl = normalizedItemUrl;
      }
      continue;
    }

    // Prefix match with segment boundary
    if (normalizedPath.startsWith(`${normalizedItemUrl}/`)) {
      const score = normalizedItemUrl.length;
      if (score > bestScore) {
        bestScore = score;
        bestUrl = normalizedItemUrl;
      }
    }
  }

  return bestUrl;
}

export function NavMain({
  items,
  showPill = false,
}: {
  items: NavMainItem[];
  showPill?: boolean;
}) {
  const pathname = usePathname();

  const { isHovered, setOpen, state } = useSidebar();
  const isVisualExpanded = state === "expanded" || isHovered;

  const activeUrl = React.useMemo(() => {
    return findActiveUrl(items, pathname);
  }, [items, pathname]);

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2 mt-4">
        <SidebarMenu>
          {items.map((item) => {
            const normalizedItemUrl = normalizePath(item.url);
            const isActive = activeUrl === normalizedItemUrl;

            return (
              <SidebarMenuItem key={item.title} className="mt-1">
                <SidebarMenuButton
                  variant={"outline"}
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  showPill={showPill}
                >
                  <Link
                    href={item.url}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => {
                      if (isHovered) setOpen(false);
                    }}
                    className="flex items-center gap-3 cursor-pointer text-neutral-700 w-full"
                  >
                    <div className={cn(
                      "flex items-center justify-center transition-all duration-200",
                      isVisualExpanded ? "size-6" : "size-4"
                    )}>
                      {item.icon}
                    </div>
                    <span className="text-xs font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
