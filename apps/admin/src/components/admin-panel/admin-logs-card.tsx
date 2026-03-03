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

import { ScrollArea } from "@/components/ui/scroll-area";

export function AdminLogsCard() {
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = async () => {
        try {
            const response = await getAdminLogs({ page: 1 });
            // @ts-ignore
            const newData = response.data.data || [];
            setLogs(newData.slice(0, 10)); // Just the top 10 for dashboard
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
        <Card className="h-full py-0 flex flex-col shadow-sm border-border/40 overflow-hidden">
            <CardHeader className="p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Recent Activity
                        </CardTitle>
                        <CardDescription className="text-[11px] font-medium uppercase tracking-tight opacity-70">
                            Audit trail of recent admin actions
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden bg-muted/5">
                <ScrollArea className="h-full">
                    {loading ? (
                        <div className="h-full flex items-center justify-center min-h-[300px]">
                            <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
                        </div>
                    ) : error ? (
                        <div className="h-full flex items-center justify-center min-h-[300px] text-rose-500 text-xs font-semibold p-6 text-center">
                            {error}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center min-h-[300px] text-muted-foreground text-xs gap-3 p-6 text-center">
                            <div className="p-3 rounded-full bg-muted/50">
                                <Info className="h-8 w-8 opacity-30" />
                            </div>
                            <span>No recent system activity recorded</span>
                        </div>
                    ) : (
                        <div className="px-5 py-6">
                            <div className="relative pl-3 space-y-7">
                                {/* Vertical line with gradient */}
                                <div className="absolute left-[1.65rem] top-1.5 bottom-1.5 w-[1px] bg-linear-to-b from-primary/30 via-primary/10 to-transparent -z-10" />

                                {logs.map((log) => (
                                    <LogItem key={log.id} log={log} />
                                ))}
                            </div>
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
            <CardFooter className="p-3 border-t bg-muted/30">
                <Button variant="outline" className="w-full text-[11px] h-9 font-bold uppercase tracking-wider bg-background hover:bg-muted/50 shadow-xs border-border/60" asChild>
                    <Link href="/logs">
                        Explore All Records
                        <ArrowRight className="ml-2 h-3 w-3" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
