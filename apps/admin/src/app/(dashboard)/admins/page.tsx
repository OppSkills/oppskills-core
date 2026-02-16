import React from 'react'
import { AdminList } from "@/components/admins/admin-list"
import { AdminActions } from "@/components/admins/admin-actions"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { getAdmins, getMe } from '@/lib/api/actions'


export default async function page() {
    const [{ data: admins }, { data: currentUser }] = await Promise.all([
        getAdmins(),
        getMe()
    ]);

    return (
        <div className="flex flex-col gap-6 p-0 sm:p-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Admins</h1>
                    <p className="text-muted-foreground">
                        Manage your administrators and their permissions.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search admins..."
                            className="w-full pl-9 sm:w-[300px]"
                        />
                    </div>
                    <AdminActions />
                </div>
            </div>
            <AdminList initialAdmins={admins.filter((admin: any) => admin.id !== currentUser.id)} currentUserImmutable={currentUser.immutable} />
        </div>
    )
}
