"use client"

import { InfiniteScrollTable } from "@/components/features/infinite-scroll-table"
import { getHackathons, toggleFeatureApproval } from "@/lib/api/actions"


export default function HackathonsPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <InfiniteScrollTable
                type="hackathon"
                fetchData={getHackathons}
                toggleApproval={toggleFeatureApproval}
            />
        </div>
    )
}
