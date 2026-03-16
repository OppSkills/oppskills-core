"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from "@clerk/nextjs";
import { getFullProfile } from '@/lib/api/usersApi';
import { ProfileStats } from './_components/profile-stats';
import { PersonalInfo } from './_components/personal-info';
import { EducationInfo } from './_components/education-info';
import { SkillsInfo } from './_components/skills-info';
import { InterestsInfo } from './_components/interests-info';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { isLoaded, getToken } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!isLoaded) return;
      try {
        const token = await getToken();
        if (token) {
          const data = await getFullProfile(token);
          setProfileData(data);
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [isLoaded, getToken]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex h-full w-full items-center justify-center text-neutral-500">
        Failed to load profile
      </div>
    );
  }

  return (
    <div className='flex flex-col xl:flex-row gap-4 flex-1'>
      <div className='p-4 lg:p-8 bg-neutral-100 rounded-3xl flex-1 overflow-y-auto custom-scrollbar'>
        <PersonalInfo data={profileData.personalInfo} />
        <EducationInfo data={profileData.educationInfo} />
        <SkillsInfo data={{ skills: profileData.skills }} />
        <InterestsInfo data={{ interests: profileData.interests }} />
      </div>
      <ProfileStats data={profileData.stats} />
    </div>
  );
}
