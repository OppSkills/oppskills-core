"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InitBoneyard } from "@/components/boneyard/init-boneyard";
import LocationTracker from "@/components/LocationTracker";

const queryClient = new QueryClient();

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <InitBoneyard />
      <LocationTracker />
      {children}
    </QueryClientProvider>
  );
}
