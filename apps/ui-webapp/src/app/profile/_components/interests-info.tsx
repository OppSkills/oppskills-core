"use client";

import React from "react";
import { useAuth } from "@clerk/nextjs";
import { updateInterests } from "@/lib/api/usersApi";
import { trendingSkills } from "@/lib/data/skills";
import { TagSection } from "./tag-section";

interface InterestsInfoProps {
  data: {
    interests: string[];
  };
}

export function InterestsInfo({ data }: InterestsInfoProps) {
  const { getToken } = useAuth();

  const handleSave = async (interests: string[]) => {
    const token = await getToken();
    if (!token) throw new Error("Unauthorized");
    await updateInterests(token, interests);
  };

  // Note: Using trendingSkills as fallback if specific interests aren't defined.
  // In a real app, we might have a separate trendingInterests list.
  return (
    <TagSection
      title="Interests"
      initialTags={data.interests}
      trendingTags={trendingSkills}
      onSave={handleSave}
      placeholder="Search Interests..."
    />
  );
}
