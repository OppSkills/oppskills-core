"use client";

import Navbar from "./navbar";
import Footer from "./footer";
import { Toaster } from "@/components/ui/sonner";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./layout/app-sidebar";
import { SidebarInset } from "./ui/sidebar";
import { SidebarProvider } from "./ui/sidebar";
import { SiteHeader } from "./layout/site-header";

export default function LayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isDashboard = pathname.startsWith("/dashboard");

  if (isDashboard) {
    return (
      <main className="">
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 62)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
          className="bg-neutral-200"
        >
          <AppSidebar variant="floating" className="" />
          <SidebarInset className="bg-neutral-200 p-2">
            <SiteHeader />
            {children}
          </SidebarInset>
        </SidebarProvider>
      </main>
    );
  }
  return (
    <main>
      <Navbar />
      {children}
      <Footer />
      <Toaster position="bottom-right" duration={5000} richColors />
    </main>
  );
}
