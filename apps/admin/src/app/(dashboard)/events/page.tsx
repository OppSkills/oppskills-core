"use client"

import { InfiniteScrollTable } from "@/components/features/infinite-scroll-table"
import { getEvents } from "@/lib/api/actions"
import { useRouter } from "next/navigation"

export default function EventsPage() {
    const router = useRouter()

    return (
        <div className="flex flex-col gap-6 p-6">
            <InfiniteScrollTable
                type="event"
                fetchData={getEvents}
                onRowClick={(slug) => router.push(`/events/${slug}`)}
            />
        </div>
    )
}
