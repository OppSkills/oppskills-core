"use client";

import { InfiniteScrollTable } from "@/components/features/infinite-scroll-table";
import { getFestivals } from "@/lib/api/actions";
import { useRouter } from "next/navigation";

export default function FestivalsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 p-6">
      <InfiniteScrollTable
        type="festival"
        fetchData={getFestivals}
        onRowClick={(slug) => router.push(`/festivals/${slug}`)}
      />
    </div>
  );
}
