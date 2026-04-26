"use client";

import React, { memo, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  ColumnDef,
} from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useReferralRegistrations } from "@/hooks/useReferrals";
import { ReferredUser } from "@/lib/api/referralApi";


export const ReferredUsersTable = memo(function ReferredUsersTable({ referralId }: { referralId: string }) {
  const { data } = useReferralRegistrations(referralId);
  const rows = useMemo(() => (data?.data ?? []), [data?.data]);
  const columns = useMemo<ColumnDef<ReferredUser>[]>(
    () => [
      {
        id: "sno",
        header: "S. No.",
        cell: (info) => <span className="text-neutral-600 font-medium px-2">{info.row.index + 1}</span>,
      },
      {
        accessorKey: "name",
        header: "User Details",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center gap-4 py-2">
              <Avatar className="w-10 h-10 rounded-full border border-neutral-100">
                <AvatarImage src={row.avatarUrl ?? undefined} className="object-cover" />
                <AvatarFallback>{row.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-bold text-neutral-900 text-sm">{row.name}</span>
                <span className="text-xs text-neutral-500 font-medium">{row.email}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "registrationDate",
        header: "Registration Date",
        cell: (info) => {
          const date = new Date(info.getValue() as string);
          return (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-neutral-800">{format(date, "dd MMM yyyy")}</span>
              <span className="text-[11px] text-neutral-400">{format(date, "hh:mm a")}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "institution",
        header: "Institution / Profession",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-neutral-800 truncate max-w-[200px]">{row.institution || "N/A"}</span>
              <span className="text-[11px] text-neutral-400">{row.profession || "N/A"}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: (info) => <span className="text-sm text-neutral-600">{info.getValue() as string || "N/A"}</span>,
      },
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-neutral-200 bg-white shadow-sm">
      {table.getRowModel().rows.length > 0 ? (
        <Table className="min-w-[800px] border-collapse!">
          <TableHeader className="bg-primary-800 hover:bg-primary-800!">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent! border-b-primary-900 border-b!">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-white font-semibold py-5 px-6 whitespace-nowrap"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="hover:bg-neutral-50/50 border-neutral-100 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="py-4 px-6"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          title="No registered users found"
          description="There are no users registered using this referral link yet."
        />
      )}
    </div>
  );
});
