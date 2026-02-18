"use client"

import * as React from "react"
import {
    Calendar,
    Code,
    CreditCard,
    LayoutDashboard,
    Music,
    Shield,
    Users,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

// This is sample data.
const data = {
    navMain: [
        {
            title: "Navigation",
            url: "#",
            items: [
                { name: "Dashboard", href: "/", icon: LayoutDashboard },
                { name: "Admin", href: "/admins", icon: Shield },
                { name: "Users", href: "/users", icon: Users },
                { name: "Events", href: "/events", icon: Calendar },
                { name: "Hackathons", href: "/hackathons", icon: Code },
                { name: "Festivals", href: "/festivals", icon: Music },
                { name: "Payments", href: "/payments", icon: CreditCard },
            ],
        },
    ],
}

import { UserNav } from "@/components/admin-panel/user-nav";
import Link from "next/link"

import { getMe } from "@/lib/api/actions"
import { useRouter } from "next/navigation"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname();
    const { state } = useSidebar();
    const router = useRouter()

    React.useEffect(() => {
        const checkUser = async () => {
            try {
                const response = await getMe()
                if (response.data.isFirstLogin && pathname !== "/onboarding") {
                    router.push("/onboarding")
                }
            } catch (error) {
                console.error("Failed to check user status", error)
            }
        }
        checkUser()
    }, [pathname, router])

    return (
        <Sidebar {...props} collapsible="icon">
            <SidebarHeader>
                <div className="flex h-16 items-center justify-center border-b px-2">
                    {state === "expanded" ? (
                        <img
                            src="/logo.svg"
                            alt="Logo"
                            className="h-10 w-auto object-contain transition-all duration-300"
                        />
                    ) : (
                        <img
                            src="/logof.png"
                            alt="Logo"
                            className="h-10 w-10 object-contain transition-all duration-300"
                        />
                    )}
                </div>
            </SidebarHeader>
            <SidebarContent>
                {data.navMain.map((group) => (
                    <SidebarGroup key={group.title}>
                        <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.name}>
                                        <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.name}>
                                            <Link href={item.href}>
                                                <item.icon />
                                                <span className="font-medium">{item.name}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarFooter>
                <UserNav />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
