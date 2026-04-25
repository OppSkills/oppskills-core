"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { getFestivals } from "@/lib/api/festivalApi";
import { GenericListingPage } from "@/components/common/GenericListingPage";
import { ListingItem } from "@/components/common/ListingCard";

export default function FestivalsPage() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<ListingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const run = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const token = await getToken();
        // Since getFestivals might require token broadly but public festivals specifically might allow no token?
        // Original code used getToken so we keep it.
        // If public viewing is needed without auth, we might need a public endpoint.
        // Assuming user is logged in or token is string | null
        const safeToken = token || "";
        const res = await getFestivals(safeToken);

        // Transform logic
        const rawList = Array.isArray((res as any)?.data)
          ? (res as any).data
          : Array.isArray(res)
            ? res
            : [];

        const transformed: ListingItem[] = rawList.map((f: any) => ({
          id: f.id,
          title: f.name,
          slug: f.slug || f.id,
          bannerUrl: f.posterImageUrl || f.thumbnailUrl || undefined,
          startDate: f.startDate,
          endDate: f.endDate,
          status: f.status,
          routePrefix: "festivals",
          eventType: "Festival",
          registrationCount: f.totalRegistrations || 0,
          opportunityCount: f.opportunityCount || 0,
        }));

        setItems(transformed);
      } catch (err) {
        toast.error("Failed to load festivals.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [getToken]);

  return (
    <GenericListingPage
      title="College Festivals"
      description="Explore college festivals and cultural events."
      items={items}
      isLoading={isLoading}
    />
  );
}
