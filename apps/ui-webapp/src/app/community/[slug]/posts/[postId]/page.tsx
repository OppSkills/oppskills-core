"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import PostDetailView from "../../_components/PostDetailView";
import { getPublicCommunityByHandle } from "@/lib/api/communityApi";

export default function CommunityPostPage() {
  const params = useParams();
  const handle = params.slug as string;
  const postId = params.postId as string;
  const { getToken, isSignedIn } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 200);
    return () => clearTimeout(t);
  }, []);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["community-profile", handle, isSignedIn],
    queryFn: async () => {
      const token = isSignedIn ? await getToken() : undefined;
      return getPublicCommunityByHandle(handle, token ?? undefined);
    },
    enabled: !!handle && ready,
  });

  if (!ready || isLoading) {
    return (
      <div className="w-full flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#5D3EBB]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-bold text-neutral-700">Community not found.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8 animate-in fade-in duration-500">
      <PostDetailView
        handle={handle}
        postId={postId}
        communityId={profile.id}
      />
    </div>
  );
}
