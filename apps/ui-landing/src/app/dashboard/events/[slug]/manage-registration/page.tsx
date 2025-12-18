"use client";

import React from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download } from "lucide-react";

// Mock Data Type
type Participant = {
  id: string;
  name: string;
  email: string;
  ticketType: string;
  status: "Confirmed" | "Pending" | "Cancelled";
  registrationDate: string;
};

// Mock Data
const MOCK_PARTICIPANTS: Participant[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@example.com",
    ticketType: "Early Bird",
    status: "Confirmed",
    registrationDate: "2024-01-15",
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@example.com",
    ticketType: "Standard",
    status: "Pending",
    registrationDate: "2024-01-16",
  },
  {
    id: "3",
    name: "Charlie Brown",
    email: "charlie@example.com",
    ticketType: "VIP",
    status: "Confirmed",
    registrationDate: "2024-01-14",
  },
  {
    id: "4",
    name: "Diana Prince",
    email: "diana@example.com",
    ticketType: "Standard",
    status: "Cancelled",
    registrationDate: "2024-01-18",
  },
  {
    id: "5",
    name: "Evan Wright",
    email: "evan@example.com",
    ticketType: "Early Bird",
    status: "Confirmed",
    registrationDate: "2024-01-15",
  },
];

const columnHelper = createColumnHelper<Participant>();

const columns = [
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor("email", {
    header: "Email",
  }),
  columnHelper.accessor("ticketType", {
    header: "Ticket Type",
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const status = info.getValue();
      const colorClass =
        status === "Confirmed"
          ? "bg-green-100 text-green-700"
          : status === "Pending"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-red-100 text-red-700";
      return (
        <span
          className={cn(
            "px-2 py-1 rounded-full text-xs font-semibold",
            colorClass
          )}
        >
          {status}
        </span>
      );
    },
  }),
  columnHelper.accessor("registrationDate", {
    header: "Date",
  }),
];

export default function ManageRegistrationPage() {
  const [data] = React.useState(() => MOCK_PARTICIPANTS);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full bg-neutral-200 min-h-screen p-6 flex justify-center">
      <div className="w-full max-w-6xl bg-background rounded-2xl p-6 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold font-poppins">
              Manage Registrations
            </h1>
            <p className="text-muted-foreground text-sm">
              View and manage event attendees.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search participants..."
                className="pl-9 w-64 rounded-full bg-neutral-100 border-none"
              />
            </div>
            <Button variant="outline" className="rounded-full gap-2">
              <Download className="w-4 h-4" /> Export
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground font-medium">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="p-4">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-muted/10 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
