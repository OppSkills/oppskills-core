"use client"

import React, { useEffect, useState } from 'react'
import { AdminList } from "@/components/admins/admin-list"
import { AdminActions } from "@/components/admins/admin-actions"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { getAdmins, getMe } from '@/lib/api/actions'
import { toast } from "sonner"


export default function page() {
    const [admins, setAdmins] = useState<any[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    const fetchAdmins = async () => {
        try {
            const { data } = await getAdmins()
            setAdmins(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch admins")
        }
    }

    const fetchCurrentUser = async () => {
        try {
            const { data } = await getMe()
            setCurrentUser(data)
        } catch (error) {
            console.error("Failed to fetch user", error)
        }
    }

    useEffect(() => {
        const init = async () => {
            await Promise.all([fetchAdmins(), fetchCurrentUser()])
            setLoading(false)
        }
        init()
    }, [])

    const filteredAdmins = admins.filter((admin) => {
        if (currentUser && admin.id === currentUser.id) return false;

        if (!searchQuery) return true;

        const term = searchQuery.toLowerCase();
        return (
            admin.name.toLowerCase().includes(term) ||
            admin.email.toLowerCase().includes(term)
        );
    })

    if (loading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

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
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <AdminActions onAdminCreated={fetchAdmins} />
                </div>
            </div>
            {currentUser && (
                <AdminList
                    initialAdmins={filteredAdmins}
                    currentUserImmutable={currentUser.immutable}
                    onRefresh={fetchAdmins}
                />
            )}
        </div>
    )
}
