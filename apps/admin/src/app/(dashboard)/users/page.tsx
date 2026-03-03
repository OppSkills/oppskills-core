"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getUsers } from "@/lib/api/actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Eye } from "lucide-react";
import { toast } from "sonner";

interface User {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    accessLevel: string;
    createdAt: string;
}

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Intersection Observer for infinite scroll
    const observer = useRef<IntersectionObserver | null>(null);
    const lastUserElementRef = useCallback((node: HTMLTableRowElement) => {
        if (loading || isFetchingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, isFetchingMore, hasMore]);

    const fetchUsers = async (currentPage: number, currentSearch: string, isInitial = false) => {
        if (!isInitial) setIsFetchingMore(true);
        try {
            const response = await getUsers({ page: currentPage, search: currentSearch });
            const newData = response.data.data || [];
            const further = response.data.further;

            if (isInitial) {
                setUsers(newData);
            } else {
                setUsers(prev => [...prev, ...newData]);
            }
            setHasMore(further);
        } catch (err) {
            console.error("Failed to fetch users", err);
            toast.error("Failed to load users. Please try again.");
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        setPage(1);
        fetchUsers(1, debouncedSearch, true);
    }, [debouncedSearch]);

    useEffect(() => {
        if (page > 1) {
            fetchUsers(page, debouncedSearch);
        }
    }, [page]);

    return (
        <div className="px-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Monitor and manage user accounts and view their insights.</p>
                </div>
                <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        className="pl-10 h-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Card className="border-border/40 overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="pl-6 h-12 uppercase text-[10px] font-bold tracking-wider">Name</TableHead>
                                <TableHead className="h-12 uppercase text-[10px] font-bold tracking-wider">Email</TableHead>
                                <TableHead className="h-12 uppercase text-[10px] font-bold tracking-wider">Role</TableHead>
                                <TableHead className="h-12 uppercase text-[10px] font-bold tracking-wider">Joined On</TableHead>
                                <TableHead className="text-right pr-6 h-12 uppercase text-[10px] font-bold tracking-wider">Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && page === 1 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <span className="text-sm font-medium">Fetching users...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Search className="h-8 w-8 opacity-20" />
                                            <span className="text-sm">No users found for "{debouncedSearch}"</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user, index) => {
                                    const isLast = index === users.length - 1;
                                    const fullName = user.firstName ? `${user.firstName} ${user.lastName || ""}` : "Unregistered User";
                                    return (
                                        <TableRow
                                            key={user.id}
                                            ref={isLast ? lastUserElementRef : null}
                                            className="group hover:bg-muted/20 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/users/${user.id}`)}
                                        >
                                            <TableCell className="font-medium pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                                                        {fullName.charAt(0)}
                                                    </div>
                                                    <span className="font-semibold text-gray-700">{fullName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-medium bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 uppercase text-[10px] px-2 py-0.5">{user.accessLevel}</Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(user.createdAt).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-muted-foreground hover:text-primary hover:bg-primary/5 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                            {isFetchingMore && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary/60" />
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
