"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getAdminLogs } from "@/lib/api/services";
import { Loader2, Info, Activity, Clock, ChevronRight } from "lucide-react";
import { AdminLog } from "@/components/admin-panel/log-item";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function LogsPage() {
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    // Intersection Observer for infinite scroll
    const observer = useRef<IntersectionObserver | null>(null);

    // We need two refs for the last element depending on the view
    const lastLogElementRef = useCallback((node: any) => {
        if (loading || isFetchingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, isFetchingMore, hasMore]);

    const fetchLogs = async (currentPage: number, isInitial = false) => {
        if (!isInitial) setIsFetchingMore(true);

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

    const getLogBadgeColor = (type: string) => {
        switch (type.toUpperCase()) {
            case 'LOGIN': return "bg-blue-100 text-blue-700 border-blue-200";
            case 'CREATE': return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case 'UPDATE': return "bg-amber-100 text-amber-700 border-amber-200";
            case 'DELETE': return "bg-rose-100 text-rose-700 border-rose-200";
            case 'APPROVAL': return "bg-indigo-100 text-indigo-700 border-indigo-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    // Mobile Card Component
    const LogMobileCard = ({ log, isLast }: { log: AdminLog; isLast: boolean }) => (
        <div
            ref={isLast ? lastLogElementRef : null}
            className="p-5 border-b border-border/40 last:border-0 hover:bg-muted/10 transition-colors"
        >
            <div className="flex items-center justify-between gap-3 mb-3">
                <Badge variant="outline" className={cn("text-[10px] font-bold uppercase px-2 py-0 border rounded-md h-5", getLogBadgeColor(log.type))}>
                    {log.type}
                </Badge>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
            <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-gray-700 font-medium leading-relaxed">
                    {log.action}
                </p>
                <ChevronRight className="h-4 w-4 text-muted-foreground/30 mt-1 shrink-0" />
            </div>
        </div>
    );

    return (
        <div className="px-4 md:px-6 py-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">System Logs</h1>
                    <p className="text-muted-foreground text-xs md:text-sm italic">
                        Real-time audit records of system activities.
                    </p>
                </div>
            </div>

            <Card className="border-border/40 bg-card shadow-sm overflow-hidden py-0 gap-0">
                <CardHeader className="bg-muted/30 py-4">
                    <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Audit Trail</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading && page === 1 ? (
                        <div className="h-96 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="text-sm font-medium text-muted-foreground">Loading audit records...</span>
                        </div>
                    ) : error ? (
                        <div className="h-96 flex items-center justify-center text-rose-600 font-medium px-4 text-center">
                            {error}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="h-96 flex flex-col items-center justify-center text-muted-foreground gap-2">
                            <div className="p-4 rounded-full bg-muted/60">
                                <Info className="h-10 w-10 opacity-30" />
                            </div>
                            <p className="text-sm font-medium">No activity records found</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop View: Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/20">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="pl-6 h-11 uppercase text-[10px] font-black tracking-widest text-muted-foreground">Action Details</TableHead>
                                            <TableHead className="w-[120px] h-11 uppercase text-[10px] font-black tracking-widest text-muted-foreground text-center">Operation</TableHead>
                                            <TableHead className="w-[200px] pr-6 h-11 uppercase text-[10px] font-black tracking-widest text-muted-foreground text-right">Occurrence Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.map((log, index) => {
                                            const isLast = (index === logs.length - 1);
                                            return (
                                                <TableRow
                                                    key={`${log.id}-${index}`}
                                                    ref={isLast ? lastLogElementRef : null}
                                                    className="group hover:bg-muted/10 transition-colors border-0"
                                                >
                                                    <TableCell className="pl-6 py-4">
                                                        <p className="text-sm text-gray-600 font-medium group-hover:text-primary transition-colors leading-relaxed">
                                                            {log.action}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell className="text-center py-4">
                                                        <Badge variant="outline" className={cn("text-[10px] font-bold uppercase px-2 py-0 border rounded-md whitespace-nowrap h-5", getLogBadgeColor(log.type))}>
                                                            {log.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6 py-4">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-xs font-bold text-gray-900">
                                                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                            </span>
                                                            <span className="text-[10px] font-medium text-muted-foreground mt-0.5 flex items-center gap-1">
                                                                <Clock className="size-2.5" />
                                                                {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile View: Cards */}
                            <div className="block md:hidden divide-y divide-border/40">
                                {logs.map((log, index) => (
                                    <LogMobileCard
                                        key={`${log.id}-card-${index}`}
                                        log={log}
                                        isLast={index === logs.length - 1}
                                    />
                                ))}
                            </div>

                            {/* Fetching More Loader */}
                            {isFetchingMore && (
                                <div className="text-center py-8 border-t border-border/40">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin text-primary/40" />
                                        <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-tighter">Updating...</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
