"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getAdminLogs } from "@/lib/api/services";
import {
    Loader2,
    LogIn,
    PlusCircle,
    Trash2,
    FileEdit,
    Info,
    Clock,
    Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AdminLog {
    id: string;
    adminId: string;
    action: string;
    type: string;
    createdAt: string;
}

export function AdminLogsCard() {
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await getAdminLogs({ page: 1 });
                // @ts-ignore
                setLogs(response.data.data || []);
            } catch (err) {
                console.error("Failed to fetch admin logs", err);
                setError("Failed to load logs");
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const getLogConfig = (type: string) => {
        switch (type.toUpperCase()) {
            case 'LOGIN':
                return {
                    icon: LogIn,
                    color: "text-blue-600 dark:text-blue-400",
                    bg: "bg-blue-100 dark:bg-blue-900/30",
                    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900"
                };
            case 'CREATE':
                return {
                    icon: PlusCircle,
                    color: "text-green-600 dark:text-green-400",
                    bg: "bg-green-100 dark:bg-green-900/30",
                    badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900"
                };
            case 'UPDATE':
                return {
                    icon: FileEdit,
                    color: "text-orange-600 dark:text-orange-400",
                    bg: "bg-orange-100 dark:bg-orange-900/30",
                    badge: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900"
                };
            case 'DELETE':
                return {
                    icon: Trash2,
                    color: "text-red-600 dark:text-red-400",
                    bg: "bg-red-100 dark:bg-red-900/30",
                    badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900"
                };
            default:
                return {
                    icon: Info,
                    color: "text-gray-600 dark:text-gray-400",
                    bg: "bg-gray-100 dark:bg-gray-800",
                    badge: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                };
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <Card className="h-full flex flex-col shadow-sm border-border/40 py-0">
            <CardHeader className="p-3 border-border/40 bg-muted/40 block">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Recent Activity
                        </CardTitle>
                        <CardDescription>Latest actions performed by administrators</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0">
                {loading ? (
                    <div className="h-full flex items-center justify-center min-h-[300px]">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="h-full flex items-center justify-center min-h-[300px] text-destructive text-sm font-medium">
                        {error}
                    </div>
                ) : logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center min-h-[300px] text-muted-foreground text-sm gap-2">
                        <Info className="h-8 w-8 opacity-50" />
                        No recent activity found
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto px-4 py-2 custom-scrollbar">
                        <div className="relative pl-2 space-y-6 py-4">
                            {/* Vertical line connecting events */}
                            <div className="absolute left-[1.65rem] top-4 bottom-4 w-px bg-border/60 -z-10" />

                            {logs.map((log) => {
                                const config = getLogConfig(log.type);
                                const Icon = config.icon;

                                return (
                                    <div key={log.id} className="group flex gap-4 relative">
                                        {/* Icon Container */}
                                        <div className={cn(
                                            "flex-none w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-border/50 bg-background z-10 transition-colors duration-200",
                                            "group-hover:border-primary/20",
                                            config.color
                                        )}>
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center bg-opacity-10",
                                                config.bg
                                            )}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 pt-1 space-y-2 pb-1">
                                            <div className="flex items-start justify-between gap-4">
                                                <p className="text-sm font-medium leading-none text-foreground/90 group-hover:text-primary transition-colors">
                                                    {log.action}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1 bg-muted/30 px-2 py-1 rounded-full">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(log.createdAt)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="secondary"
                                                    className={cn("text-[10px] h-5 px-2 font-medium border-0", config.badge)}
                                                >
                                                    {log.type}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
