"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
interface FeatureItem {
    id: string;
    name: string;
    status: string;
    approvalStatus: string;
    bannerImageUrl?: string;
    posterImageUrl?: string;
    slug: string;
    owner?: {
        firstName: string | null;
        lastName: string | null;
        email: string;
    };
    organizer?: {
        firstName: string | null;
        lastName: string | null;
        email: string;
    };
    [key: string]: any;
}

interface InfiniteScrollTableProps {
    type: 'hackathon' | 'event' | 'festival';
    fetchData: (limit: number, cursor?: string, filterPending?: boolean) => Promise<any>;
    toggleApproval: (type: 'hackathon' | 'event' | 'festival', id: string, status: 'APPROVED' | 'REJECTED' | 'PENDING') => Promise<any>;
}

export function InfiniteScrollTable({ type, fetchData, toggleApproval }: InfiniteScrollTableProps) {
    const [items, setItems] = useState<FeatureItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [filterPending, setFilterPending] = useState(false);
    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback(
        (node: HTMLTableRowElement) => {
            if (loading) return;
            if (observer.current) observer.current.disconnect();
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    loadMore();
                }
            });
            if (node) observer.current.observe(node);
        },
        [loading, hasMore]
    );

    const loadData = async (reset = false) => {
        if (loading) return;
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            const currentCursor = reset ? undefined : cursor;
            const response = await fetchData(50, currentCursor, filterPending);
            const { data, nextCursor, hasMore: more } = response.data;

            setItems((prev) => (reset ? data : [...prev, ...data]));
            setCursor(nextCursor);
            setHasMore(more);
        } catch (error) {
            console.error("Failed to fetch data", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        loadData();
    }

    useEffect(() => {
        // Reset cursor and items when filter changes
        setCursor(undefined);
        setItems([]);
        setHasMore(true);
        // We need to call loadData with reset=true, but since we reset state above, 
        // the closure might capture old values if not careful. 
        // Better to just call loadData(true) which handles the reset logic inside.
        // Waiting for state update might be tricky without extra effect or ref.
        // Let's modify loadData to accept params directly or rely on a fresh closure from useEffect dependency.

        // Actually best way:
        const fetchDataAsync = async () => {
            if (loading) return;
            setLoading(true);
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                const response = await fetchData(50, undefined, filterPending);
                const { data, nextCursor, hasMore: more } = response.data;
                setItems(data);
                setCursor(nextCursor);
                setHasMore(more);
            } catch (error) {
                console.error("Failed to fetch data", error);
                toast.error("Failed to load data");
            } finally {
                setLoading(false);
            }
        }
        fetchDataAsync();

    }, [filterPending]);

    const handleApproval = async (id: string, status: 'APPROVED' | 'REJECTED' | 'PENDING') => {
        try {
            await toggleApproval(type, id, status);
            toast.success(`Status updated to ${status}`);
            setItems((prev) =>
                prev.map((item) =>
                    item.id === id ? { ...item, approvalStatus: status } : item
                )
            );
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error("Failed to update approval status");
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold capitalize">{type}s</h2>
                <div className="flex items-center gap-2">
                    <Button
                        variant={filterPending ? "secondary" : "outline"}
                        onClick={() => setFilterPending(!filterPending)}
                    >
                        {filterPending ? "Showing Pending" : "Show Pending Only"}
                    </Button>
                </div>
            </div>

            <div className="rounded-md border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Owner/Organizer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Approval</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item, index) => {
                            const isLast = index === items.length - 1;
                            const ownerName = item.owner
                                ? `${item.owner.firstName || ''} ${item.owner.lastName || ''}`
                                : item.organizer
                                    ? `${item.organizer.firstName || ''} ${item.organizer.lastName || ''}`
                                    : 'N/A';

                            return (
                                <TableRow
                                    key={item.id}
                                    ref={isLast ? lastElementRef : null}
                                >
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{ownerName}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{item.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={item.approvalStatus === 'APPROVED' ? 'default' : item.approvalStatus === 'REJECTED' ? 'destructive' : 'secondary'}
                                        >
                                            {item.approvalStatus}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {item.approvalStatus === 'PENDING' && item.status === 'PUBLISHED' && (
                                                <>
                                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleApproval(item.id, 'APPROVED')}>
                                                        <CheckCircle className="h-4 w-4" />
                                                        <span className="sr-only">Approve</span>
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleApproval(item.id, 'REJECTED')}>
                                                        <XCircle className="h-4 w-4" />
                                                        <span className="sr-only">Reject</span>
                                                    </Button>
                                                </>
                                            )}
                                            {item.approvalStatus !== 'PENDING' && item.status === 'PUBLISHED' && (
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleApproval(item.id, 'PENDING')}>
                                                    <RotateCcw className="h-4 w-4" />
                                                    <span className="sr-only">Revert to Pending</span>
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {loading && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="flex justify-center items-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                        {!loading && items.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No {type}s found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
