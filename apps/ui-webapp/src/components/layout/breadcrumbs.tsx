"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Home } from "@solar-icons/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { globalChatsCache } from "@/hooks/useChatsPage";

function ChatBreadcrumbLabel({ chatId }: { chatId: string }) {
  const [label, setLabel] = useState<string>("Loading...");
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    let active = true;

    // Check in-memory cache first
    const cached = globalChatsCache?.find((c) => c.id === chatId);
    if (cached) {
      setLabel(cached.name);
      return;
    }

    if (!isSignedIn) {
      setLabel("Chat");
      return;
    }

    async function fetchChat() {
      try {
        const token = await getToken();
        if (!token) {
          if (active) setLabel("Chat");
          return;
        }
        const { getConversation } = await import("@/lib/api/chatApi");
        const detail = await getConversation(token, chatId);
        if (active) {
          setLabel(detail.name);
        }
      } catch (err) {
        console.error("Failed to fetch chat for breadcrumb:", err);
        if (active) setLabel("Chat");
      }
    }

    void fetchChat();
    return () => {
      active = false;
    };
  }, [chatId, isSignedIn, getToken]);

  return (
    <span className="truncate max-w-[150px] sm:max-w-[240px]">{label}</span>
  );
}

function CommunityManageBreadcrumbLabel({
  communityId,
}: {
  communityId: string;
}) {
  const [label, setLabel] = useState<string>("Community");
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    let active = true;

    if (!isSignedIn) return;

    async function fetchName() {
      try {
        const token = await getToken();
        if (!token) return;
        const { getCommunity } = await import("@/lib/api/communityApi");
        const detail = await getCommunity(token, communityId);
        if (active) setLabel(detail.name);
      } catch {
        // keep fallback label
      }
    }

    void fetchName();
    return () => {
      active = false;
    };
  }, [communityId, isSignedIn, getToken]);

  return (
    <span className="truncate max-w-[120px] sm:max-w-[200px]">{label}</span>
  );
}

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
      return truncate(
        segment
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
      );
    }

    // Default formatting
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const getBreadcrumbs = () => {
    const isProfile = segments.includes("profile");
    const rootPath = isProfile ? "/profile" : "/dashboard";

    const items: { label: React.ReactNode; href: string; active: boolean }[] =
      [
        {
          label: <Home className="size-4" />,
          href: rootPath,
          active: pathname === rootPath,
        },
      ];

    let currentPath = rootPath;

    // Skip the first root segment (dashboard or profile) as we've already added the Home icon
    const rootIndex = segments.indexOf(isProfile ? "profile" : "dashboard");
    const subSegments = segments.slice(rootIndex + 1);

    subSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === subSegments.length - 1;
      const isChatId = index > 0 && subSegments[index - 1] === "chats";
      // Detect /dashboard/community/manage/[id]
      const isCommunityManageId =
        index > 0 &&
        subSegments[index - 1] === "manage" &&
        subSegments[index - 2] === "community";

      let labelNode: React.ReactNode;
      if (isChatId) {
        labelNode = <ChatBreadcrumbLabel chatId={segment} />;
      } else if (isCommunityManageId) {
        labelNode = (
          <CommunityManageBreadcrumbLabel communityId={segment} />
        );
      } else {
        labelNode = formatLabel(segment);
      }

      items.push({
        label: labelNode,
        href: currentPath,
        active: isLast,
      });
    });

    return items;
  };

  const breadcrumbItems = getBreadcrumbs();

  return (
    <nav
      className="flex items-center text-sm font-medium text-neutral-500 min-w-0 overflow-hidden"
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-1.5 min-w-0 overflow-hidden">
        {breadcrumbItems.map((item, index) => (
          <li
            key={item.href}
            className={cn(
              "flex items-center gap-1.5 shrink-0",
              // Last item can shrink and truncate to avoid overlapping right buttons
              index === breadcrumbItems.length - 1 && "min-w-0 shrink",
            )}
          >
            {index > 0 && (
              <ChevronRight className="size-3.5 text-neutral-400 shrink-0" />
            )}
            <Link
              href={item.href}
              className={cn(
                "transition-colors hover:text-primary-600 min-w-0",
                item.active
                  ? "text-primary-900 font-semibold pointer-events-none"
                  : "text-neutral-500",
              )}
            >
              <div className="flex items-center min-w-0 overflow-hidden">
                {item.label}
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
