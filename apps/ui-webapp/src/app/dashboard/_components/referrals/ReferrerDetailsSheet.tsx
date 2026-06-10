"use client";

import React, { useState, useEffect, memo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { SortFromTopToBottom } from "@solar-icons/react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useReferrerDetailsForOrganizer } from "@/hooks/referrals/useReferrals";
import { ReferredUsersTable } from "./ReferredUsersTable";
import { UserProfileCard } from "./UserProfileCard";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { ProfileLikeFallback } from "@/components/boneyard/loading-fallbacks";

interface ReferrerDetailsSheetProps {
  referralId: string | null;
  onClose: () => void;
}

export function ReferrerDetailsSheet({
  referralId,
  onClose,
}: ReferrerDetailsSheetProps) {
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);
  const { data, isLoading } = useReferrerDetailsForOrganizer(referralId);

  const columns = React.useMemo<
    ColumnDef<NonNullable<typeof data>["opportunities"][0]>[]
  >(
    () => [
      {
        id: "sno",
        header: "S. No.",
        cell: (info) => (
          <span className="text-neutral-600 font-medium">
            {info.row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: "entityName",
        header: () => (
          <div className="flex items-center gap-2">
            Event/ Competition{" "}
            <SortFromTopToBottom size={18} className="ml-1 opacity-60" />
          </div>
        ),
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center gap-4 py-2 group/name">
              <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-900 flex items-center justify-center text-neutral-200 font-semibold text-2xl border border-primary-100">
                {row.image ? (
                  <Image
                    src={row.image}
                    alt={row.entityName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span>{row.entityName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-bold text-neutral-900 text-sm group-hover/name:text-primary-800 transition-colors">
                  {row.entityName}
                </span>
                <span className="text-xs text-neutral-500 font-medium capitalize">
                  {row.entityType.toLowerCase()}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "clicks",
        header: () => (
          <div className="flex items-center gap-2 justify-center">
            Link Clicks{" "}
            <SortFromTopToBottom size={18} className="ml-1 opacity-60" />
          </div>
        ),
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex flex-col items-center gap-1">
              <Badge className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-sm hover:bg-yellow-100">
                {row.clicks} Clicks
              </Badge>
              <span className="text-xs text-neutral-500">
                {row.clicksLast24h} in last 24 hrs
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "registrations",
        header: () => (
          <div className="flex items-center gap-2 justify-center">
            Registrations{" "}
            <SortFromTopToBottom size={18} className="ml-1 opacity-60" />
          </div>
        ),
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex flex-col items-center gap-1">
              <Badge className="bg-pink-100 text-pink-600 px-3 py-1 rounded text-sm hover:bg-pink-100">
                {row.registrations.toString().padStart(2, "0")} Registrations
              </Badge>
              <span className="text-xs text-neutral-500">
                {row.registrationsLast24h.toString().padStart(2, "0")} in last
                24 hrs
              </span>
            </div>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: data?.opportunities || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const opp = data?.opportunities.find((o) => o.id === selectedOppId);

  return (
    <Sheet
      open={!!referralId}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedOppId(null);
          onClose();
        }
      }}
    >
      <SheetContent className="w-full sm:max-w-4xl bg-neutral-100 p-0 flex flex-col gap-0 border-l border-neutral-200">
        {!selectedOppId ? (
          <>
            <SheetHeader className="p-4 bg-white flex flex-row items-center gap-4 space-y-0 shadow-sm z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedOppId(null);
                  onClose();
                }}
                className="rounded-full hover:bg-neutral-100 text-neutral-600 -ml-2"
              >
                <ChevronLeft className="size-6" />
              </Button>
              <SheetTitle className="text-xl font-medium text-neutral-900">
                Referrer Details
              </SheetTitle>
              <SheetDescription className="sr-only">
                Details for referrer {data?.referrer?.name}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              <BoneyardSkeleton
                loading={isLoading || !data}
                name={`referrer-details-${referralId}`}
                fallback={<ProfileLikeFallback className="px-0 py-0" />}
                className="w-full"
              >
                {data && (
                  <div className="flex flex-col gap-6">
                    {/* User Profile Card */}
                    <UserProfileCard user={data.referrer} />

                    {/* Analytics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-primary-900 text-white rounded-xl p-5 flex flex-col justify-between h-36">
                        <span className="text-primary-100 font-medium">
                          All Events Referrals
                        </span>
                        <span className="text-5xl font-normal">
                          {data.summary.totalRegistrations}
                        </span>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-sm text-primary-200">
                            Last 24 Hrs
                          </span>
                          <span className="bg-primary-800 text-primary-50 text-xs px-3 py-1 rounded-full border border-primary-700">
                            {data.summary.registrationsLast24h}
                          </span>
                        </div>
                      </div>
                      <div className="bg-primary-50 text-neutral-900 rounded-xl p-5 flex flex-col justify-between h-36 border border-primary-100">
                        <span className="text-neutral-700 font-medium">
                          No. Of Links Generated
                        </span>
                        <span className="text-5xl font-normal text-primary-900">
                          {data.summary.totalReferrals}
                        </span>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-sm text-primary-600">
                            Active Links
                          </span>
                          <span className="bg-primary-900 text-white text-xs px-3 py-1 rounded-full">
                            {data.summary.activeLinks}
                          </span>
                        </div>
                      </div>
                      <div className="bg-primary-50 text-neutral-900 rounded-xl p-5 flex flex-col justify-between h-36 border border-primary-100">
                        <span className="text-neutral-700 font-medium">
                          No. Of Impressions
                        </span>
                        <span className="text-5xl font-normal text-primary-900">
                          {data.summary.totalClicks}
                        </span>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-sm text-primary-600">
                            Impression last 24 hrs
                          </span>
                          <span className="bg-primary-900 text-white text-xs px-3 py-1 rounded-full">
                            {data.summary.clicksLast24h}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="w-full rounded-2xl overflow-hidden border border-neutral-200 bg-white shadow-sm">
                      <Table className="min-w-full border-collapse!">
                        <TableHeader className="bg-primary-800 hover:bg-primary-800!">
                          {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow
                              key={headerGroup.id}
                              className="hover:bg-transparent! border-b-0!"
                            >
                              {headerGroup.headers.map((header) => (
                                <TableHead
                                  key={header.id}
                                  className={cn(
                                    "text-white font-normal py-4 px-6 whitespace-nowrap border-r border-primary-700 last:border-r-0",
                                    (header.id === "clicks" ||
                                      header.id === "registrations") &&
                                      "text-center",
                                  )}
                                  style={{
                                    width:
                                      header.id === "sno" ? "80px" : "auto",
                                  }}
                                >
                                  {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext(),
                                      )}
                                </TableHead>
                              ))}
                            </TableRow>
                          ))}
                        </TableHeader>
                        <TableBody>
                          {table.getRowModel().rows.map((row) => (
                            <TableRow
                              key={row.id}
                              onClick={() => {
                                setSelectedOppId(row.original.id);
                              }}
                              className="hover:bg-neutral-50/50 border-neutral-200 transition-colors cursor-pointer"
                            >
                              {row.getVisibleCells().map((cell) => (
                                <TableCell
                                  key={cell.id}
                                  className={cn(
                                    "py-3 px-6 border-r border-neutral-200 last:border-r-0",
                                    (cell.column.id === "clicks" ||
                                      cell.column.id === "registrations") &&
                                      "text-center",
                                  )}
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </BoneyardSkeleton>
            </div>
          </>
        ) : (
          <>
            {/* NEW SHEET CONTENT FOR REFERRED USERS */}
            <SheetHeader className="p-4 bg-white flex flex-row items-center gap-4 space-y-0 shadow-sm z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedOppId(null)}
                className="rounded-full hover:bg-neutral-100 text-neutral-600 -ml-2"
              >
                <ChevronLeft className="size-6" />
              </Button>
              <SheetTitle className="text-xl font-medium text-neutral-900">
                Referred Users
              </SheetTitle>
              <SheetDescription className="sr-only">
                Users referred to {opp?.entityName}
              </SheetDescription>
            </SheetHeader>

            <div className="w-full">
              <ReferredUsersTable referralId={selectedOppId} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
