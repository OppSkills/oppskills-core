"use client";

import React, { memo, useMemo } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { useReferralRegistrations } from "@/hooks/useReferrals";
import { UserProfileCard } from "./UserProfileCard";
import { Button } from "@/components/ui/button";

export const ReferredUsersTable = memo(function ReferredUsersTable({ referralId }: { referralId: string }) {
  const { data, isLoading } = useReferralRegistrations(referralId);
  const users = useMemo(() => (data?.data ?? []), [data?.data]);

  if (isLoading) {
    return <div className="text-center py-12 text-neutral-500">Loading users...</div>;
  }

  if (!users.length) {
    return (
      <EmptyState
        title="No Referred Users Yet"
        description="This referral link hasn't been used by anyone to register yet."
        icon="users"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="grid grid-cols-1 gap-6">
        {users.map((user) => (
          <UserProfileCard key={user.id} user={user} />
        ))}
      </div>
      
      {/* Basic Pagination Controls (if meta exists) */}
      {data?.meta && data.meta.pageCount > 1 && (
        <div className="flex items-center justify-between py-4 border-t border-neutral-200 mt-4 px-2">
          <div className="text-sm text-neutral-500">
            Page {data.meta.page} of {data.meta.pageCount}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.meta.page <= 1}
              // Pagination handling would go here, currently useReferralRegistrations doesn't accept page params
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.meta.page >= data.meta.pageCount}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
