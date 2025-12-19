"use client";

import React, { useState, useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  ColumnDef,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search, Filter, MoreVertical, SlidersHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- Types ---
type RegistrationStatus = "Completed" | "Incomplete";

interface Participant {
  id: string;
  name: string;
  email: string;
  university: string;
  avatarUrl: string;
  status: RegistrationStatus;
}

// --- Mock Data ---
const MOCK_PARTICIPANTS: Participant[] = [
  {
    id: "1",
    name: "Bessie Cooper",
    email: "esther.williamson@five9.com",
    university: "Standford University",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    status: "Completed",
  },
  {
    id: "2",
    name: "Ronald Richards",
    email: "cody.cooper@five9.com",
    university: "Niagara University",
    avatarUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36",
    status: "Completed",
  },
  {
    id: "3",
    name: "Cody Fisher",
    email: "aubrey.flores@five9.com",
    university: "Brown University",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
    status: "Completed",
  },
  {
    id: "4",
    name: "Guy Hawkins",
    email: "shane.webb@five9.com",
    university: "Massachusetts Institute of Technology",
    avatarUrl: "https://images.unsplash.com/photo-1527980965255-d3b416303d12",
    status: "Incomplete",
  },
  {
    id: "5",
    name: "Theresa Webb",
    email: "arthur.russel@five9.com",
    university: "Villanova University",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
    status: "Completed",
  },
  {
    id: "6",
    name: "Kathryn Murphy",
    email: "arthur.russel@five9.com",
    university: "Villanova University",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
    status: "Completed",
  },
];

const columnHelper = createColumnHelper<Participant>();

// --- Components ---

const StatusBadge = ({ status }: { status: RegistrationStatus }) => {
  const styles =
    status === "Completed"
      ? "bg-primary-100 text-primary-700"
      : "bg-destructive text-destructive-foreground";

  return (
    <div
      className={cn(
        "px-3 py-1.5 rounded-lg inline-flex items-center justify-center min-w-[80px]",
        styles
      )}
    >
      {status}
    </div>
  );
};

export default function ManageRegistrationPage() {
  const [data] = useState(() => MOCK_PARTICIPANTS);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [activeTab, setActiveTab] = useState<
    "All" | "Completed" | "Incomplete"
  >("All");

  const columns = useMemo<ColumnDef<Participant, any>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
            className="border-white data-[state=checked]:bg-white data-[state=checked]:text-primary"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      columnHelper.display({
        id: "sno",
        header: () => <span>S. No.</span>,
        cell: (info) => (
          <span className="text-muted-foreground">{info.row.index + 1}</span>
        ),
      }),
      columnHelper.accessor("name", {
        header: () => (
          <div className="flex items-center gap-2 cursor-pointer">
            240 Team/ Participated{" "}
            <SlidersHorizontal className="w-4 h-4 ml-2" />
          </div>
        ),
        cell: (info) => (
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={info.row.original.avatarUrl} />
              <AvatarFallback>{info.getValue().charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground text-sm">
                {info.getValue()}
              </span>
              <span className="text-xs text-muted-foreground">
                {info.row.original.email}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">
                {info.row.original.university}
              </span>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("status", {
        header: () => (
          <div className="flex items-center gap-2 cursor-pointer justify-end">
            <Filter className="w-4 h-4" /> Reg. Status{" "}
            <SlidersHorizontal className="w-4 h-4" />
          </div>
        ),
        cell: (info) => (
          <div className="flex justify-end">
            <StatusBadge status={info.getValue()} />
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="w-full bg-white min-h-screen p-8 flex flex-col items-center gap-8">
      {/* Header Controls */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          {[
            {
              label: `All (${data.length})`,
              value: "All",
              color: "bg-[#A855F7]",
            },
            {
              label: "Completed",
              value: "Completed",
              color: "bg-transparent text-foreground border border-border",
            },
            {
              label: "Incomplete",
              value: "Incomplete",
              color: "bg-transparent text-foreground border border-border",
            },
          ].map((tab) => (
            <button
              key={tab.value}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                tab.value === "All"
                  ? "bg-primary-500 text-primary-foreground"
                  : "bg-primary-100 text-foreground hover:bg-primary-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Input
              placeholder="Search"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-4 pr-10 rounded-full border-border bg-background w-[300px] focus:ring-1 focus:ring-primary/20 transition-all"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          <button className="p-2 rounded-full border border-border hover:bg-muted text-muted-foreground transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full max-w-5xl rounded-xl overflow-hidden border border-border/50 shadow-sm">
        {/* Custom Header with Purple Background */}
        <div className="bg-primary-600 text-white px-4 py-3 grid grid-cols-[50px_80px_1fr_200px] items-center text-sm font-medium">
          <div className="flex justify-center">
            <Checkbox
              className="border-white data-[state=checked]:bg-white data-[state=checked]:text-primary-600"
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
            />
          </div>
          <div>S. No.</div>
          <div className="flex items-center gap-2">
            240 Team/ Participated <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-end gap-2 text-right">
            <Filter className="w-4 h-4" /> Reg. Status{" "}
            <SlidersHorizontal className="w-4 h-4" />
          </div>
        </div>

        {/* Table Body */}
        <div className="bg-white">
          {table.getRowModel().rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[50px_80px_1fr_200px] items-center px-4 py-4 border-b border-border/40 hover:bg-muted/5 transition-colors"
            >
              <div className="flex justify-center">
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={(value) => row.toggleSelected(!!value)}
                  className="border-muted-foreground/30 data-[state=checked]:bg-primary-600 data-[state=checked]:text-white"
                />
              </div>
              <div className="text-muted-foreground text-sm font-medium pl-2">
                {row.index + 1}
              </div>
              <div className="flex items-center gap-4">
                <Avatar className="w-10 h-10 border border-border/50">
                  <AvatarImage
                    src={row.original.avatarUrl}
                    className="object-cover"
                  />
                  <AvatarFallback>{row.original.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-foreground">
                    {row.original.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {row.original.email}
                  </span>
                  <span className="text-[11px] text-muted-foreground/70">
                    {row.original.university}
                  </span>
                </div>
              </div>
              <div className="flex justify-end">
                <StatusBadge status={row.original.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
