"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import Link from "next/link";
import { getMyCommunities, type MyCommunityListItem } from "@/lib/api/communityApi";
import { CommunitiesTable } from "./_components/CommunitiesTable";

export default function CommunitiesDashboardPage() {
  const { getToken, isLoaded } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [communities, setCommunities] = useState<ReadonlyArray<MyCommunityListItem>>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isLoaded) return;
      setIsLoading(true);
      try {
        const token = await getToken();
        if (!token) {
          setCommunities([]);
          return;
        }
        const items = await getMyCommunities(token);
        if (!cancelled) {
          setCommunities(items);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          toast.error("Failed to load communities");
          setCommunities([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, getToken]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length === 0) return communities;
    return communities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q),
    );
  }, [communities, searchQuery]);

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-neutral-100 w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-neutral-900">
          Communities ({communities.length})
        </h1>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search communities"
              className="pl-10 h-11 border-neutral-200 bg-white rounded-full shadow-sm focus-visible:ring-primary-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Link href="/dashboard/community/create">
            <Button className="h-11 px-4 rounded-full bg-primary-800 hover:bg-primary-900 text-white flex items-center gap-2 shadow-md">
              <div className="flex items-center justify-center h-6 w-6 rounded-full border border-white/30">
                <Plus className="h-4 w-4" />
              </div>
              <span>Create</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
          </div>
        ) : communities.length === 0 ? (
          <CommunitiesTable data={[]} isLoading={false} />
        ) : filtered.length === 0 ? (
          <p className="text-center text-neutral-600 py-16 text-sm">
            No communities match your search.
          </p>
        ) : (
          <CommunitiesTable data={filtered} isLoading={false} />
        )}
      </div>
    </div>
  );
}
