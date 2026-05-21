"use client";

import { InfiniteScrollTable } from "@/components/features/infinite-scroll-table";
import { getHackathons } from "@/lib/api/actions";
import { useRouter } from "next/navigation";

export default function HackathonsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 p-6">
      <InfiniteScrollTable
        type="hackathon"
        fetchData={getHackathons}
        onRowClick={(slug) => router.push(`/hackathons/${slug}`)}
      />
    </div>
  );
}
