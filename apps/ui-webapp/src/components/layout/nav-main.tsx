"use client";

import * as React from "react";
import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavMainItem = {
  title: string;
  url: string;
  icon?: Icon;
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

export function NavMain({ items }: { items: NavMainItem[] }) {
  const pathname = usePathname();

  const activeUrl = React.useMemo(() => {
    return findActiveUrl(items, pathname);
  }, [items, pathname]);

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const normalizedItemUrl = normalizePath(item.url);
            const isActive = activeUrl === normalizedItemUrl;

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                >
                  <Link
                    href={item.url}
                    aria-current={isActive ? "page" : undefined}
                    className="block cursor-pointer"
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
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
