"use client";

import React, { memo, useMemo, useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { useReferralRegistrations } from "@/hooks/useReferrals";
import { UserProfileCard } from "./UserProfileCard";
import { Button } from "@/components/ui/button";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { CardListFallback } from "@/components/boneyard/loading-fallbacks";

export const ReferredUsersTable = memo(function ReferredUsersTable({ referralId }: { referralId: string }) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  const { data, isLoading } = useReferralRegistrations(referralId, page, pageSize);
  const users = useMemo(() => (data?.data ?? []), [data?.data]);

  return (
    <BoneyardSkeleton
      loading={isLoading || !data}
      name={`referred-users-${referralId}`}
      fallback={<CardListFallback rows={4} className="px-0 py-0" />}
      className="w-full"
    >
      {!users.length && page === 1 ? (
        <EmptyState
          title="No Referred Users Yet"
          description="This referral link hasn't been used by anyone to register yet."
        />
      ) : (
        <div className="flex flex-col gap-6 p-4">
          <div className="grid grid-cols-1 gap-6">
            {users.map((user) => (
              <UserProfileCard key={user.id} user={user} />
            ))}
          </div>
          
          {/* Basic Pagination Controls */}
          {data && data.total > data.pageSize && (
            <div className="flex items-center justify-between py-4 border-t border-neutral-200 mt-4 px-2">
              <div className="text-sm text-neutral-500">
                Page {data.page} of {Math.ceil(data.total / data.pageSize)}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page >= Math.ceil(data.total / data.pageSize)}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </BoneyardSkeleton>
  );
});
