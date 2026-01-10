"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import ActionDropdown from "./ActionDropdown";
import { ArrowUpDown } from "lucide-react";

export interface FestivalItem {
  id: string;
  name: string;
  description?: string;
  tag: string;
  status: "Completed" | "In Progress" | "Upcoming" | string;
  startDate: string | Date;
  endDate: string | Date;
  candidates: number;
  registrationOpen: boolean;
  slug: string;
}

interface FestivalsTableProps {
  data: FestivalItem[];
  onToggleRegistration?: (id: string, isOpen: boolean) => void;
  onEdit?: (id: string) => void;
}

const columnHelper = createColumnHelper<FestivalItem>();

export default function FestivalsTable({
  data,
  onToggleRegistration,
  onEdit,
}: FestivalsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = [
    columnHelper.display({
      id: "index",
      header: "S. No.",
      cell: (info) => (
        <span className="font-medium text-muted-foreground pl-4">
          {info.row.index + 1}
        </span>
      ),
    }),
    columnHelper.accessor("name", {
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: (info) => {
        const item = info.row.original;
        return (
          <div className="flex flex-col gap-1 py-2">
            <span className="font-semibold text-base">{item.name}</span>
            {item.description && (
              <span className="text-muted-foreground text-xs line-clamp-1 max-w-[200px]">
                {item.description}
              </span>
            )}
            <div className="mt-1">
              <span className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-sm font-medium border">
                {item.tag}
              </span>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => {
        const status = info.getValue();
        return (
          <Badge
            variant="secondary"
            className={cn(
              "font-normal pointer-events-none whitespace-nowrap",
              status === "Completed" &&
              "bg-purple-100 text-purple-700 hover:bg-purple-100",
              status === "ONGOING" && // Backend uses ONGOING
              "bg-purple-100 text-purple-700 hover:bg-purple-100",
              status === "PUBLISHED" && // Backend uses PUBLISHED
              "bg-blue-100 text-blue-700 hover:bg-blue-100",
              status === "Upcoming" &&
              "bg-blue-100 text-blue-700 hover:bg-blue-100",
              status === "DRAFT" &&
              "bg-gray-100 text-gray-700 hover:bg-gray-100"
            )}
          >
            {status}
          </Badge>
        );
      },
    }),
    columnHelper.accessor("startDate", {
      header: "Start Date",
      cell: (info) => {
        const date = new Date(info.getValue());
        return (
          <div className="flex flex-col text-sm">
            <span className="font-medium text-foreground">
              {format(date, "dd MMM yy")}
            </span>
            <span className="text-muted-foreground text-xs">
              {format(date, "hh:mm a")} IST
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor("endDate", {
      header: "End Date",
      cell: (info) => {
        const date = new Date(info.getValue());
        return (
          <div className="flex flex-col text-sm">
            <span className="font-medium text-foreground">
              {format(date, "dd MMM yy")}
            </span>
            <span className="text-muted-foreground text-xs">
              {format(date, "hh:mm a")} IST
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor("candidates", {
      header: "Candidates",
      cell: (info) => (
        <span className="font-medium text-lg">
          {info.getValue().toLocaleString()}
        </span>
      ),
    }),
    columnHelper.accessor("registrationOpen", {
      header: "Registration",
      cell: (info) => {
        const isOpen = info.getValue();
        const id = info.row.original.id;
        return (
          <div className="flex items-center gap-3">
            <Switch
              checked={isOpen}
              onCheckedChange={(checked) => onToggleRegistration?.(id, checked)}
              className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
            />
            <Badge
              variant={isOpen ? "default" : "destructive"}
              className={cn(
                "font-normal text-[10px] px-1.5 py-0 h-5 pointer-events-none",
                isOpen
                  ? "bg-green-100 text-green-700 hover:bg-green-100 border-none"
                  : "bg-red-100 text-red-700 hover:bg-red-100 border-none"
              )}
            >
              {isOpen ? "Open" : "Closed"}
            </Badge>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: (info) => {
        return (
          <div className="text-right pr-4">
            <ActionDropdown
              onEdit={() => onEdit?.(info.row.original.id)}
              className="border-none hover:bg-muted"
            />
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="rounded-xl border bg-background overflow-hidden">
        <Table>
          <TableHeader className="bg-primary-500 hover:bg-primary/95">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent border-none"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="text-primary-foreground/90 font-medium h-12"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
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
                  className="h-24 text-center text-muted-foreground"
                >
                  No festivals found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
