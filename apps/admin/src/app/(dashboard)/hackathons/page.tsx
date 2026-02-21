"use client"

import { AdminHeader } from "@/components/admin-panel/admin-header"
import { InfiniteScrollTable } from "@/components/features/infinite-scroll-table"
import { getHackathons, toggleFeatureApproval } from "@/lib/api/actions"


export default function HackathonsPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <AdminHeader title="Hackathons" breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Hackathons", href: "/hackathons" }]} />
            <InfiniteScrollTable
                type="hackathon"
                fetchData={getHackathons}
                toggleApproval={toggleFeatureApproval}
            />
        </div>
    )
}
