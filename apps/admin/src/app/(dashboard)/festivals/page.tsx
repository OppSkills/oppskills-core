"use client"

import { InfiniteScrollTable } from "@/components/features/infinite-scroll-table"
import { getFestivals, toggleFeatureApproval } from "@/lib/api/actions"

export default function FestivalsPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <InfiniteScrollTable
                type="festival"
                fetchData={getFestivals}
                toggleApproval={toggleFeatureApproval}
            />
        </div>
    )
}
