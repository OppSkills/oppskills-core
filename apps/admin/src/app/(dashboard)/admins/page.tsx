import React from 'react'
import { AdminList } from "@/components/admins/admin-list"
import { CreateAdminDialog } from "@/components/admins/create-admin-dialog"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function page() {
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
                    <CreateAdminDialog />
                </div>
            </div>
            <AdminList />
        </div>
    )
}
