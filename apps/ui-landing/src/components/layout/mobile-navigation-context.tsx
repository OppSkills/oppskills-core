"use client";

import * as React from "react";

interface MobileNavigationContextType {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  activeMobileTab: "main" | "opportunity";
  setActiveMobileTab: (tab: "main" | "opportunity") => void;
  isOpportunityDetail: boolean;
}

const MobileNavigationContext =
  React.createContext<MobileNavigationContextType | null>(null);

export function useMobileNavigation() {
  const context = React.useContext(MobileNavigationContext);
  if (!context) {
    throw new Error(
      "useMobileNavigation must be used within a MobileNavigationProvider"
    );
  }
  return context;
}

export const MobileNavigationProvider = MobileNavigationContext.Provider;
