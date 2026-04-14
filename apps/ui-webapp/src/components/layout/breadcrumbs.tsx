"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Home } from "@solar-icons/react";
import { cn } from "@/lib/utils";

export function Breadcrumbs() {
  const pathname = usePathname();
  
  const segments = pathname.split("/").filter(Boolean);
  
  // Don't show breadcrumbs if we're not in dashboard or profile
  if (!segments.includes("dashboard") && !segments.includes("profile")) {
    return null;
  }

  const truncate = (str: string, length = 20) => {
    if (!str) return "";
    return str.length > length ? str.substring(0, length) + "..." : str;
  };

  const formatLabel = (segment: string) => {
    // Check if it looks like a slug (contains hyphens)
    if (segment.includes("-")) {
      return truncate(segment.split("-").map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(" "));
    }
    
    // Default formatting
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const getBreadcrumbs = () => {
    const items: { label: React.ReactNode; href: string; active: boolean }[] = [
      {
        label: <Home className="size-4" />,
        href: "/dashboard",
        active: pathname === "/dashboard",
      },
    ];

    let currentPath = "/dashboard";
    
    // Skip the first "dashboard" segment as we've already added the Home icon
    const dashboardIndex = segments.indexOf("dashboard");
    const subSegments = segments.slice(dashboardIndex + 1);

    subSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === subSegments.length - 1;
      
      items.push({
        label: formatLabel(segment),
        href: currentPath,
        active: isLast,
      });
    });

    return items;
  };

  const breadcrumbItems = getBreadcrumbs();

  return (
    <nav className="flex items-center text-sm font-medium text-neutral-500" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5">
        {breadcrumbItems.map((item, index) => (
          <li key={item.href} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="size-3.5 text-neutral-400 shrink-0" />}
            <Link
              href={item.href}
              className={cn(
                "transition-colors hover:text-primary-600",
                item.active ? "text-primary-900 font-semibold pointer-events-none" : "text-neutral-500"
              )}
            >
              <div className="flex items-center">
                {item.label}
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
