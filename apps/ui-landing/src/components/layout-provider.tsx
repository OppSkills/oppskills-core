"use client";

import Navbar from "./navbar";
import Footer from "./footer";
import { Toaster } from "sonner";
import { usePathname } from "next/navigation";

export default function LayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isDashboard = pathname.startsWith("/dashboard");

  if (isDashboard) {
    return <main>{children}</main>;
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
