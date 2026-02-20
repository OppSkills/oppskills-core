"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { getAdminLogs } from "@/lib/api/services";
import {
    Loader2,
    Activity,
    ArrowRight
} from "lucide-react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogItem, AdminLog } from "./log-item";

export function AdminLogsCard() {
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = async () => {
        try {
            const response = await getAdminLogs({ page: 1 });
            // @ts-ignore
            const newData = response.data.data || [];

            setLogs(newData);
        } catch (err) {
            console.error("Failed to fetch admin logs", err);
            setError("Failed to load logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <Card className="h-full flex flex-col shadow-sm border-border/40 py-0 gap-0">
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

                            {logs.map((log) => (
                                <LogItem key={log.id} log={log} />
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-2 border-t border-border/40 bg-muted/20">
                <Button variant="ghost" className="w-full text-xs h-8 gap-2" asChild>
                    <Link href="/logs">
                        View All Logs
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
