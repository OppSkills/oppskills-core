"use client";

import { useEffect, useState } from "react";

export function useChatLayout(
  selectedChatId: string | null,
  isGroup = false,
) {
  const [isMobile, setIsMobile] = useState(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState(!selectedChatId);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [activeRightSidebarTab, setActiveRightSidebarTab] = useState<
    "Members" | "Media" | "Docs"
  >("Media");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setShowRightSidebar(false);
    setActiveRightSidebarTab(isGroup ? "Members" : "Media");
    setShowLeftSidebar(!selectedChatId);
  }, [selectedChatId, isGroup]);

  return {
    isMobile,
    showLeftSidebar,
    setShowLeftSidebar,
    showRightSidebar,
    setShowRightSidebar,
    activeRightSidebarTab,
    setActiveRightSidebarTab,
  };
}
