"use client";

import React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";
import { cn, ensureAbsoluteUrl } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { TableBlockFallback } from "@/components/boneyard/loading-fallbacks";

import {
  MoreVertical,
  MailIcon,
  Check,
  Loader2,
  Users,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type RegistrationStatus = "Completed" | "Incomplete";

export interface RegistrationData {
  id: string;
  name: string;
  email: string;
  university?: string;
  avatarUrl: string | null;
  status: RegistrationStatus;
  registeredOn: string;
  approved?: boolean;
  passStatus?: string;
  attendanceStatus?: "Present" | "Absent";
  membersCount?: number;
  [key: string]: any;
}

interface RegistrationsTableProps {
  data: RegistrationData[];
  type: "Event" | "Hackathon";
  isLoading?: boolean;
  onMarkAttendance: (id: string, present: boolean) => void;
  onSendPass?: (id: string) => void;
  onApprove?: (id: string) => void;
  onView?: (id: string) => void;
  onSendEmail?: (data: RegistrationData) => void;
  actionLoadingId?: string | null;
}

const StatusBadge = ({ status }: { status: RegistrationStatus }) => {
  const isCompleted = status === "Completed";
  return (
    <Badge
      variant="outline"
      className={cn(
        "px-3 py-1 rounded-md text-[10px] font-medium border-0",
        isCompleted
          ? "bg-green-50 text-green-600"
          : "bg-red-50 text-red-600"
      )}
    >
      {status}
    </Badge>
  );
};

const PassBadge = ({ status }: { status: string }) => {
  const isSent = status === "Sent" || status === "Pass sent";
  return (
    <Badge
      variant="outline"
      className={cn(
        "px-3 py-1 rounded-md text-[10px] font-medium border-0",
        isSent
          ? "bg-green-50 text-green-600"
          : "bg-red-50 text-red-600"
      )}
    >
      {isSent ? "Pass sent" : "Pass not sent"}
    </Badge>
  );
};

export function RegistrationsTable({
  data,
  type,
  isLoading = false,
  onMarkAttendance,
  onApprove,
  onView,
  onSendEmail,
  actionLoadingId,
}: RegistrationsTableProps) {
  const columns = React.useMemo<ColumnDef<RegistrationData>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex justify-center border-r border-white/10 h-full py-4 px-2">
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-primary-800"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center border-r border-neutral-200 h-full py-4 px-2">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              className="border-neutral-300 data-[state=checked]:bg-primary-600 data-[state=checked]:text-white"
            />
          </div>
        ),
      },
      {
        id: "sno",
        header: () => (
          <div className="flex items-center justify-center border-r border-white/10 h-full px-2">
            S. No.
          </div>
        ),
        cell: (info) => (
          <div className="flex items-center justify-center border-r border-neutral-200 h-full px-2 text-neutral-500 font-medium">
            {info.row.index + 1}
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: () => (
          <div className="flex items-center gap-2 border-r border-white/10 h-full px-4">
            {type === "Hackathon" ? "Team" : "Participated"}
          </div>
        ),
        cell: (info) => (
          <div className="flex items-center gap-3 border-r border-neutral-200 h-full px-4 py-2">
            <Avatar className="w-10 h-10 border border-neutral-100">
              <AvatarImage src={ensureAbsoluteUrl(info.row.original.avatarUrl) || undefined} />
              <AvatarFallback className="bg-primary-50 text-primary-600 font-bold">
                {String(info.getValue()).charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-neutral-900 text-sm truncate">
                {String(info.getValue())}
              </span>
              {type === "Hackathon" && (
                <div className="flex items-center gap-1.5 text-primary-600 text-[10px] font-semibold mt-0.5">
                  <Users className="w-3 h-3" />
                  {info.row.original.membersCount} Members Joined
                </div>
              )}
              <span className="text-[11px] text-neutral-500 truncate mt-0.5">
                {info.row.original.email}
              </span>
              <span className="text-[10px] text-neutral-400 truncate">
                {info.row.original.university || "N/A"}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => (
          <div className="flex items-center justify-center border-r border-white/10 h-full px-4">
            Reg. Status
          </div>
        ),
        cell: (info) => (
          <div className="flex items-center justify-center border-r border-neutral-200 h-full px-4">
            <StatusBadge status={info.getValue() as RegistrationStatus} />
          </div>
        ),
      },
      {
        accessorKey: "passStatus",
        header: () => (
          <div className="flex items-center justify-center border-r border-white/10 h-full px-4">
            Pass Status
          </div>
        ),
        cell: (info) => (
          <div className="flex items-center justify-center border-r border-neutral-200 h-full px-4">
            <PassBadge status={info.getValue() as string} />
          </div>
        ),
      },
      {
        id: "actions",
        header: () => (
          <div className="flex items-center justify-center h-full px-4">
            Actions
          </div>
        ),
        cell: ({ row }) => {
          const reg = row.original;
          const isPresent = reg.attendanceStatus === "Present";
          const isRowLoading = actionLoadingId === reg.id;

          return (
            <div className="flex items-center justify-center gap-3 h-full px-4">
              <Button
                variant={isPresent ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-8 px-4 rounded-md text-[11px] font-bold transition-all",
                  isPresent
                    ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                    : "border-purple-600 text-purple-600 hover:bg-purple-50"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAttendance(reg.id, !isPresent);
                }}
                disabled={isRowLoading}
              >
                {isRowLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                ) : isPresent ? (
                  <Check className="w-3 h-3 mr-1.5" />
                ) : null}
                {isPresent ? "Marked Present" : "Mark Present"}
              </Button>

              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-neutral-900">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-xl border-neutral-100">
                    <DropdownMenuItem
                      onClick={() => onView?.(reg.id)}
                      className="rounded-lg gap-2 text-neutral-600 focus:text-primary-600 focus:bg-primary-50"
                    >
                      <User className="w-4 h-4" /> View Details
                    </DropdownMenuItem>
                    {onApprove && !reg.approved && (
                      <DropdownMenuItem
                        onClick={() => onApprove(reg.id)}
                        className="rounded-lg gap-2 text-neutral-600 focus:text-green-600 focus:bg-green-50"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => onSendEmail?.(reg)}
                      className="rounded-lg gap-2 text-neutral-600 focus:text-primary-600 focus:bg-primary-50"
                    >
                      <MailIcon className="w-4 h-4 mr-2" /> Send Email
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        },
      },
    ],
    [type, onMarkAttendance, onApprove, onView, onSendEmail, actionLoadingId]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <BoneyardSkeleton
      loading={isLoading}
      name="registrations-table"
      fallback={<TableBlockFallback className="px-0 py-0" />}
      className="w-full"
    >
      {data.length === 0 ? (
        <EmptyState
          title="No registrations found"
          description={`There are no ${type.toLowerCase()} registrations to display at the moment.`}
          className="bg-white rounded-2xl border border-neutral-200 shadow-sm py-20"
        />
      ) : (
        <div className="w-full overflow-hidden rounded-2xl border border-neutral-200 shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="bg-primary-800 text-white h-12">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="p-0 text-left text-[11px] font-bold uppercase tracking-wider"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors cursor-pointer group h-16"
                    onClick={() => onView?.(row.original.id)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-0 h-full">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </BoneyardSkeleton>
  );
}
