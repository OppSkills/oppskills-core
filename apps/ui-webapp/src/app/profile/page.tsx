"use client";

import React, { useEffect, useState } from 'react';
import { useAuth, useUser, useReverification } from "@clerk/nextjs";
import { isClerkRuntimeError, isReverificationCancelledError } from "@clerk/nextjs/errors";
import { getFullProfile } from '@/lib/api/usersApi';
import { ProfileStats } from './_components/profile-stats';
import { PersonalInfo } from './_components/personal-info';
import { EducationInfo } from './_components/education-info';
import { SkillsInfo } from './_components/skills-info';
import { InterestsInfo } from './_components/interests-info';
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { ProfileLikeFallback } from "@/components/boneyard/loading-fallbacks";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getClerkErrorMessage } from '@/lib/utils';

export default function ProfilePage() {
  const { isLoaded, getToken } = useAuth();
  const { user } = useUser();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Wrap updatePassword with reverification so Clerk can prompt the user to
  // verify their identity (e.g. via email code) before performing this
  // sensitive operation.
  const updatePasswordWithReverification = useReverification(
    (params: Parameters<NonNullable<typeof user>['updatePassword']>[0]) =>
      user!.updatePassword(params),
  );

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

  if (!isLoading && !profileData) {
    return (
      <div className="flex h-full w-full items-center justify-center text-neutral-500">
        Failed to load profile
      </div>
    );
  }

  const hasPassword = !!user?.passwordEnabled;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    if (hasPassword && !currentPassword) {
      toast.error('Current password is required to update your password');
      return;
    }

    setIsSavingPassword(true);
    try {
      await updatePasswordWithReverification({
        currentPassword: hasPassword ? currentPassword : undefined,
        newPassword,
      });
      await user.reload();
      toast.success(hasPassword ? 'Password updated successfully' : 'Password added successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      // User dismissed the reverification modal — silently abort
      if (isClerkRuntimeError(error) && isReverificationCancelledError(error)) {
        return;
      }
      toast.error(
        getClerkErrorMessage(
          error,
          hasPassword ? 'Failed to update password' : 'Failed to add password',
        ),
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <BoneyardSkeleton
      loading={isLoading}
      name="profile-page"
      className="flex flex-1 flex-col gap-4 xl:flex-row"
      fallback={<ProfileLikeFallback className="py-8" />}
    >
      {profileData ? (
        <div className='flex flex-col xl:flex-row gap-4 flex-1'>
          <div className='p-4 lg:p-0 flex-1 overflow-y-auto custom-scrollbar'>
            <PersonalInfo data={profileData.personalInfo} />
            <EducationInfo data={profileData.educationInfo} />
            <SkillsInfo data={{ skills: profileData.skills }} />
            <InterestsInfo data={{ interests: profileData.interests }} />

            <div className="mt-8 rounded-2xl border border-neutral-200 bg-background p-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                {hasPassword ? 'Update Password' : 'Add Password'}
              </h3>
              <p className="mt-1 text-sm text-neutral-500">
                {hasPassword
                  ? 'Keep your account secure by setting a new password.'
                  : 'You signed up using OAuth. Add a password to also sign in with email and password.'}
              </p>

              <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3">
                {hasPassword && (
                  <Input
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isSavingPassword}
                  />
                )}
                <Input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSavingPassword}
                />
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSavingPassword}
                />
                <Button type="submit" disabled={isSavingPassword}>
                  {isSavingPassword ? 'Saving...' : hasPassword ? 'Update Password' : 'Add Password'}
                </Button>
              </form>
            </div>
          </div>
          <ProfileStats data={profileData.stats} />
        </div>
      ) : null}
    </BoneyardSkeleton>
  );
}
