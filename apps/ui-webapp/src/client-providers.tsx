"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InitBoneyard } from "@/components/boneyard/init-boneyard";

const queryClient = new QueryClient();

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <InitBoneyard />
      {children}
    </QueryClientProvider>
  );
}
