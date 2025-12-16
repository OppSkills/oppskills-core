"use client";

import * as React from "react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    RowSelectionState,
    useReactTable,
} from "@tanstack/react-table";
import {
    Filter,
    ListFilter,
    ArrowRight,
    Search,
    EllipsisVertical,
} from "lucide-react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { FloatingInput } from "@/components/ui/derived/FloatingInput"
import { useParams, useRouter } from "next/navigation"

export type Participant = {
    id: string;
    serialNumber: number;
    teamName: string;
    memberCount: number;
    email: string;
    university: string;
    avatarUrl: string;
    status: "Completed" | "Incomplete";
    currentRound: string;
};

/* -------------------------- COLUMNS --------------------------- */

interface ParticipantsProps {
    data: Participant[];
}

export default function Participants({ data }: ParticipantsProps) {
    const params = useParams();
    const slug = params.slug as string;
    const router = useRouter();

    const columns: ColumnDef<Participant>[] = React.useMemo(() => [
        {
            id: "select",
            header: ({ table }) => {
                const isAll = table.getIsAllPageRowsSelected()
                const isSome = table.getIsSomePageRowsSelected()

                return (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={isAll ? true : isSome ? "indeterminate" : false}
                            onCheckedChange={(value) =>
                                table.toggleAllPageRowsSelected(!!value)
                            }
                            aria-label="Select all"
                            className="border-primary-foreground"
                        /></div>
                )
            },
            cell: ({ row }) => (
                <div className="flex items-center justify-center">
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "serialNumber",
            header: () => <span className="text-primary-foreground flex  justify-center">S. No.</span>,
            cell: ({ getValue }) => (
                <div className="text-center">{getValue<number>()}</div>
            ),
        },
        {
            accessorKey: "teamName",
            header: () => (
                <div className="flex items-center gap-2 text-primary-foreground">
                    <span>{data.length} Teams Participated</span>
                    <Image alt="Arrange Order" src="/icons/order.svg" width={24} height={24} />
                </div>
            ),
            cell: ({ row }) => {
                const {
                    avatarUrl,
                    teamName,
                    memberCount,
                    email,
                    university,
                } = row.original

                return (
                    <div className="flex gap-4 py-2">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={avatarUrl} alt={teamName} />
                            <AvatarFallback>
                                {teamName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold hover:text-primary cursor-pointer" onClick={() => { router.push(`/dashboard/opportunity/${slug}/manage-registration/${row.original.id}`) }}>{teamName}</span>
                                <span className="rounded-sm bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                                    {memberCount} Members Joined
                                </span>
                            </div>
                            <span className="text-xs text-muted-foreground">{email}</span>
                            <span className="text-xs text-muted-foreground">
                                {university}
                            </span>
                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: "status",
            header: () => (
                <div className="flex items-center justify-center gap-2 text-primary-foreground">
                    <Filter className="h-4 w-4" />
                    <span>Reg. Status</span>
                    <Image alt="Arrange Order" src="/icons/order.svg" width={24} height={24} />

                </div>
            ),
            cell: ({ getValue }) => {
                const status = getValue<Participant["status"]>()

                return (
                    <div className="flex justify-center">
                        <span
                            className={`rounded-xs px-4 py-1 text-xs ${status === "Completed"
                                ? "bg-primary/10 text-primary"
                                : "bg-destructive/10 text-destructive"
                                }`}
                        >
                            {status}
                        </span>
                    </div>
                )
            },
        },
        {
            accessorKey: "currentRound",
            header: () => (
                <div className="text-center text-primary-foreground">Action / Status</div>
            ),
            cell: ({ getValue }) => (
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
                    <span>REG</span>
                    <ArrowRight className="h-4 w-4" />
                    <span>{getValue<string>()}</span>
                </div>
            ),
        },
    ], [slug, router])

    const [filteredData, setFilteredData] = React.useState(data);
    const [filterValue, setFilteredValue] = React.useState("all");
    const [rowSelection, setRowSelection] =
        React.useState<RowSelectionState>({})

    const table = useReactTable({
        data: filteredData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onRowSelectionChange: setRowSelection,
        state: { rowSelection },
    });

    React.useEffect(() => {
        if (filterValue == "all") setFilteredData(data);
        else if (filterValue == "completed")
            setFilteredData(data.filter((item) => item.status == "Completed"));
        else if (filterValue == "incomplete")
            setFilteredData(data.filter((item) => item.status == "Incomplete"));
    }, [filterValue, data]);

    return (
        <div className="w-full overflow-x-auto pb-4">
            {/* HEADER */}
            <div className="py-4 flex w-full justify-between">
                <div className="flex gap-4">
                    <Button
                        className="border-2"
                        onClick={() => setFilteredValue("all")}
                        variant={filterValue === "all" ? "default" : "outline"}
                    >
                        All ({data.length})
                    </Button>
                    <Button
                        className="border-2"
                        onClick={() => setFilteredValue("completed")}
                        variant={filterValue === "completed" ? "default" : "outline"}
                    >
                        Completed
                    </Button>
                    <Button
                        className="border-2"
                        onClick={() => setFilteredValue("incomplete")}
                        variant={filterValue === "incomplete" ? "default" : "outline"}
                    >
                        Incomplete
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <FloatingInput
                            className="rounded-full min-w-sm"
                            placeholder="Search"
                        />
                        <div className="absolute flex right-3 top-1/2 -translate-y-1/2">
                            <Search className="text-foreground/30" />
                        </div>
                    </div>
                    <div className="px-2">
                        <div className="rounded-full w-8 h-8 border flex justify-center items-center">
                            <EllipsisVertical className="w-4 h-4 text-foreground/30" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-full rounded-xl border border-surface bg-primary-foreground shadow-sm">
                <Table>
                    <TableHeader className="sticky top-0 z-10 bg-primary">
                        {table.getHeaderGroups().map((group) => (
                            <TableRow key={group.id} className="border-none">
                                {group.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="h-12 text-primary-foreground first:rounded-tl-xl last:rounded-tr-xl"
                                    >
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="hover:bg-gray-50"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-4">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
