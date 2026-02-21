"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getAdminLogs } from "@/lib/api/services";
import { Loader2, Info, Activity } from "lucide-react";
import { LogItem, AdminLog } from "@/components/admin-panel/log-item";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LogsPage() {
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    // Intersection Observer for infinite scroll
    const observer = useRef<IntersectionObserver | null>(null);
    const lastLogElementRef = useCallback((node: HTMLDivElement) => {
        if (loading || isFetchingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setIsFetchingMore(true);
                setTimeout(() => {
                    setPage(prevPage => prevPage + 1);
                }, 1000);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, isFetchingMore, hasMore]);

    const fetchLogs = async (currentPage: number, isInitial = false) => {
        // If it's not initial, we already set isFetchingMore in the observer
        // but it doesn't hurt to ensure it's true here if called from elsewhere
        if (!isInitial && !isFetchingMore) setIsFetchingMore(true);

        try {
            const response = await getAdminLogs({ page: currentPage });
            // @ts-ignore
            const newData = response.data.data || [];
            // @ts-ignore
            const further = response.data.further;

            if (isInitial) {
                setLogs(newData);
            } else {
                setLogs(prev => [...prev, ...newData]);
            }

            setHasMore(further);
        } catch (err) {
            console.error("Failed to fetch admin logs", err);
            if (isInitial) setError("Failed to load logs");
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    };

    useEffect(() => {
        fetchLogs(page, page === 1);
    }, [page]);

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
                    <p className="text-muted-foreground">
                        View all administrative actions and system events.
                    </p>
                </div>
            </div>

            <Card className="border-border/40 bg-card">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        <CardTitle>Activity Log</CardTitle>
                    </div>
                    <CardDescription>A complete history of admin activities</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading && page === 1 ? (
                        <div className="h-[50vh] flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : error ? (
                        <div className="h-[50vh] flex items-center justify-center text-destructive font-medium">
                            {error}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="h-[50vh] flex flex-col items-center justify-center text-muted-foreground gap-2">
                            <Info className="h-10 w-10 opacity-50" />
                            <p>No activity logs found</p>
                        </div>
                    ) : (
                        <div className="relative pl-4 space-y-6 py-4">
                            {/* Vertical line connecting events */}
                            <div className="absolute left-[2.15rem] top-4 bottom-4 w-px bg-border/60 -z-10" />

                            {logs.map((log, index) => {
                                const isLast = index === logs.length - 1;
                                return (
                                    <div
                                        key={`${log.id}-${index}`}
                                        ref={isLast ? lastLogElementRef : null}
                                    >
                                        <LogItem log={log} />
                                    </div>
                                );
                            })}

                            {isFetchingMore && (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            )}

                            {!hasMore && (
                                <div className="text-center py-8 text-sm text-muted-foreground border-t border-border/40 mt-8">
                                    End of logs
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
