"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InfiniteScrollTable } from "@/components/features/infinite-scroll-table"
import { getHackathons, getEvents, getFestivals, toggleFeatureApproval } from "@/lib/api/actions"
import { AdminHeader } from "@/components/admin-panel/admin-header"

export default function FeaturesPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <AdminHeader title="Feature Management" breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Features", href: "/admin/features" }]} />

            <Tabs defaultValue="hackathons" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
                    <TabsTrigger value="hackathons">Hackathons</TabsTrigger>
                    <TabsTrigger value="events">Events</TabsTrigger>
                    <TabsTrigger value="festivals">Festivals</TabsTrigger>
                </TabsList>
                <TabsContent value="hackathons" className="mt-6">
                    <InfiniteScrollTable
                        type="hackathon"
                        fetchData={getHackathons}
                        toggleApproval={toggleFeatureApproval}
                    />
                </TabsContent>
                <TabsContent value="events" className="mt-6">
                    <InfiniteScrollTable
                        type="event"
                        fetchData={getEvents}
                        toggleApproval={toggleFeatureApproval}
                    />
                </TabsContent>
                <TabsContent value="festivals" className="mt-6">
                    <InfiniteScrollTable
                        type="festival"
                        fetchData={getFestivals}
                        toggleApproval={toggleFeatureApproval}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
