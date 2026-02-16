import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/admin-panel/sidebar"
import Header from "@/components/admin-panel/header"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <Header />
                <div className="p-4">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
