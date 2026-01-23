"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Calendar,
    Code,
    Music,
    CreditCard,
    Menu,
    X,
} from "lucide-react";
import { useState } from "react";

const links = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Users", href: "/users", icon: Users },
    { name: "Events", href: "/events", icon: Calendar },
    { name: "Hackathons", href: "/hackathons", icon: Code },
    { name: "Festivals", href: "/festivals", icon: Music },
    { name: "Payments", href: "/payments", icon: CreditCard },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-md"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-40 h-screen w-64 bg-gray-900 text-white transition-transform duration-300 ease-in-out md:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-16 items-center justify-center border-b border-gray-800">
                    <h1 className="text-2xl font-bold">Admin Panel</h1>
                </div>

                <nav className="mt-6 px-4 space-y-2">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                )}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{link.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-4 left-0 w-full px-4">
                    <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-400">Logged in as</p>
                        <p className="font-medium">Admin User</p>
                    </div>
                </div>
            </aside>
        </>
    );
}
