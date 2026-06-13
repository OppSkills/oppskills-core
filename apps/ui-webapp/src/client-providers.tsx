"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InitBoneyard } from "@/components/boneyard/init-boneyard";
import { MotionConfig } from "framer-motion";
import { PublishingProvider } from "@/hooks/community/usePublishing";

const queryClient = new QueryClient();

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <PublishingProvider>
        <InitBoneyard />
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </PublishingProvider>
    </QueryClientProvider>
  );
}
