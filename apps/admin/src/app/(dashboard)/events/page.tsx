"use client"

import { AdminHeader } from "@/components/admin-panel/admin-header"
import { InfiniteScrollTable } from "@/components/features/infinite-scroll-table"
import { getEvents, toggleFeatureApproval } from "@/lib/api/actions"

export default function EventsPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <AdminHeader title="Events" breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Events", href: "/events" }]} />
            <InfiniteScrollTable
                type="event"
                fetchData={getEvents}
                toggleApproval={toggleFeatureApproval}
            />
        </div>
    )
}
