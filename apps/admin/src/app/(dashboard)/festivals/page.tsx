"use client"

import { AdminHeader } from "@/components/admin-panel/admin-header"
import { InfiniteScrollTable } from "@/components/features/infinite-scroll-table"
import { getFestivals, toggleFeatureApproval } from "@/lib/api/actions"

export default function FestivalsPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <AdminHeader title="Festivals" breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Festivals", href: "/festivals" }]} />
            <InfiniteScrollTable
                type="festival"
                fetchData={getFestivals}
                toggleApproval={toggleFeatureApproval}
            />
        </div>
    )
}
