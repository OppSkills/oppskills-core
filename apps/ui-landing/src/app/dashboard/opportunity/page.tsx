"use client";

import { Search, Plus, MoreVertical } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    SortingState,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";

// Type definition for our data
type Hackathon = {
    id: number;
    name: string;
    description: string;
    type: string;
    status: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    candidates: string;
    isOpen: boolean;
    registrationLabel: string;
};

// Mock Data
const data: Hackathon[] = [
    {
        id: 1,
        name: "Hackverse",
        description: "Some so called big engg. college name will come up here who is trying to be tier 1",
        type: "Hackathon",
        status: "Completed",
        startDate: "01 Jan 26",
        startTime: "12:00 AM IST",
        endDate: "01 Jan 26",
        endTime: "12:00 AM IST",
        candidates: "1,243",
        isOpen: false,
        registrationLabel: "Closed",
    },
    {
        id: 2,
        name: "HackInfy",
        description: "Some so called big engg. college name will come up here who is trying to be tier 1",
        type: "Hackathon",
        status: "Completed",
        startDate: "01 Jan 26",
        startTime: "12:00 AM IST",
        endDate: "01 Jan 26",
        endTime: "12:00 AM IST",
        candidates: "12,000",
        isOpen: false,
        registrationLabel: "Closed",
    },
    {
        id: 3,
        name: "HackWipro",
        description: "Some so called big engg. college name will come up here who is trying to be tier 1",
        type: "Hackathon",
        status: "Completed",
        startDate: "01 Jan 26",
        startTime: "12:00 AM IST",
        endDate: "01 Jan 26",
        endTime: "12:00 AM IST",
        candidates: "1300",
        isOpen: false,
        registrationLabel: "Closed",
    },
    {
        id: 4,
        name: "Bas kar",
        description: "Some so called big engg. college name will come up here who is trying to be tier 1",
        type: "Hackathon",
        status: "In Progress",
        startDate: "01 Jan 26",
        startTime: "12:00 AM IST",
        endDate: "01 Jan 26",
        endTime: "12:00 AM IST",
        candidates: "12,232",
        isOpen: true,
        registrationLabel: "Open",
    },
    {
        id: 5,
        name: "Enough of Hack",
        description: "Some so called big engg. college name will come up here who is trying to be tier 1",
        type: "Hackathon",
        status: "In Progress",
        startDate: "01 Jan 26",
        startTime: "12:00 AM IST",
        endDate: "01 Jan 26",
        endTime: "12:00 AM IST",
        candidates: "23,000",
        isOpen: true,
        registrationLabel: "Open",
    },
];

const columnHelper = createColumnHelper<Hackathon>();

const columns = [
    columnHelper.display({
        id: "sno",
        header: () => <div className="text-center">S. No.</div>,
        cell: (info) => <div className="text-center font-medium text-lg">{info.row.index + 1}</div>,
    }),
    columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => (
            <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                    <span className="font-semibold text-base lg:text-lg hover:text-primary cursor-pointer">{info.getValue()}</span>
                    <div>
                        <Badge className="bg-muted text-muted-foreground text-[10px] px-1">{info.row.original.type}</Badge>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed max-w-[90%]">
                    {info.row.original.description}
                </p>
            </div>
        ),
    }),
    columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => (
            <Badge variant="secondary" className="bg-secondary/50 text-secondary-foreground font-normal">
                {info.getValue()}
            </Badge>
        ),
    }),
    columnHelper.accessor("startDate", {
        header: "Start Date",
        cell: (info) => (
            <div className="flex flex-col text-sm">
                <span className="font-medium text-base">{info.getValue()}</span>
                <span className="text-xs text-muted-foreground">{info.row.original.startTime}</span>
            </div>
        ),
    }),
    columnHelper.accessor("endDate", {
        header: "End Date",
        cell: (info) => (
            <div className="flex flex-col text-sm">
                <span className="font-medium text-base">{info.getValue()}</span>
                <span className="text-xs text-muted-foreground">{info.row.original.endTime}</span>
            </div>
        ),
    }),
    columnHelper.accessor("candidates", {
        header: "Candidates",
        cell: (info) => <div className="text-base font-medium">{info.getValue()}</div>,
    }),
    columnHelper.accessor("isOpen", {
        header: () => <div className="text-center">Registration</div>,
        cell: (info) => (
            <div className="flex items-center justify-center gap-3">
                <Switch checked={info.getValue()} />

                <span
                    className={cn(
                        "px-3 py-1 rounded text-xs font-medium w-16 text-center shadow-sm",
                        info.getValue() ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}
                >
                    {info.row.original.registrationLabel}
                </span>
            </div>
        ),
    }),
    columnHelper.display({
        id: "actions",
        header: () => <div className="text-center">Edit</div>,
        cell: () => (
            <div className="flex justify-center">
                <button className="p-2 rounded-full hover:bg-muted transition-colors border border-gray-300">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
            </div>
        ),
    }),
];

export default function OpportunityPage() {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [tableData, setTableData] = React.useState(data);
    const [searchTerm, setSearchTerm] = React.useState("");
    const router = useRouter();

    React.useEffect(() => {
        if (!searchTerm.trim()) return setTableData(data);
        const filteredData = data.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
        setTableData(filteredData);
    }, [searchTerm]);

    const table = useReactTable({
        data: tableData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
        onSortingChange: setSorting,
    });

    return (
        <div className="w-full min-h-screen bg-background p-6 flex flex-col items-center">
            <div className="w-full space-y-6">

                {/* Top Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                    <div className="relative w-full sm:max-w-md">
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 pl-4 pr-12 rounded-full border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
                        />
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    </div>
                    <button className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-medium shadow-md hover:bg-primary/90 transition-colors">
                        <Plus className="w-5 h-5" />
                        Host
                    </button>
                </div>

                {/* List Container */}
                <div className="bg-muted/30 rounded-[20px] border border-border p-2 overflow-hidden shadow-sm">
                    {/* Header Row - Desktop Only */}
                    <div className="hidden lg:grid grid-cols-[60px_2fr_1fr_1fr_1fr_1fr_1.5fr_60px] gap-4 items-center bg-secondary/30 p-4 rounded-t-xl text-sm font-semibold text-foreground border-b border-border/50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <React.Fragment key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <div key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Data Rows */}
                    <div className="flex flex-col bg-white rounded-b-xl">
                        {table.getRowModel().rows.map((row) => (
                            <div
                                key={row.id}
                                className={cn(
                                    "flex flex-col lg:grid lg:grid-cols-[60px_2fr_1fr_1fr_1fr_1fr_1.5fr_60px] gap-4 p-6 items-center border-b border-border last:border-0 hover:bg-muted/10 transition-colors",
                                    "lg:h-32"
                                )}
                            >
                                {row.getVisibleCells().map((cell, index) => {
                                    const isSno = index === 0;
                                    return (
                                        <div key={cell.id} className={cn(isSno && "hidden lg:block text-center")} onClick={() => { router.push(`/dashboard/opportunity/${row.original.id}/manage-registration/`) }}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                        {data.length === 0 && (
                            <div className="h-24 flex items-center justify-center text-muted-foreground">
                                No results found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
