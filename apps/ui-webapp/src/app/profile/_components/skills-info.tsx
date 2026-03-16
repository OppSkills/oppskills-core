"use client";

import React from "react";
import { useAuth } from "@clerk/nextjs";
import { updateSkills } from "@/lib/api/usersApi";
import { trendingSkills } from "@/lib/data/skills";
import { TagSection } from "./tag-section";

interface SkillsInfoProps {
  data: {
    skills: string[];
  };
}

export function SkillsInfo({ data }: SkillsInfoProps) {
  const { getToken } = useAuth();

  const handleSave = async (skills: string[]) => {
    const token = await getToken();
    if (!token) throw new Error("Unauthorized");
    await updateSkills(token, skills);
  };

  return (
    <TagSection
      title="Skills"
      initialTags={data.skills}
      trendingTags={trendingSkills}
      onSave={handleSave}
      placeholder="Search Skills..."
    />
  );
}
