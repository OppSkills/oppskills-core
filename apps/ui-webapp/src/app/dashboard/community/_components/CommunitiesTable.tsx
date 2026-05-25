"use client";

import React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/common/EmptyState";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { TableBlockFallback } from "@/components/boneyard/loading-fallbacks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/common/Pagination";
import type { MyCommunityListItem } from "@/lib/api/communityApi";
import {
  COMMUNITY_INDUSTRY_LABELS,
  type CommunityIndustryValue,
} from "@oppskills/types/enums";
import { Badge } from "@/components/ui/badge";

const ROLE_LABEL: Record<MyCommunityListItem["myRole"], string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  EDITOR: "Editor",
};

function industryLabel(value: CommunityIndustryValue): string {
  return COMMUNITY_INDUSTRY_LABELS[value] ?? value;
}

interface CommunitiesTableProps {
  data: ReadonlyArray<MyCommunityListItem>;
  isLoading?: boolean;
}

export function CommunitiesTable({
  data,
  isLoading = false,
}: CommunitiesTableProps) {
  const router = useRouter();

  const columns: ColumnDef<MyCommunityListItem>[] = [
    {
      id: "serialNumber",
      header: "S. No.",
      cell: (info) => {
        const { pageIndex, pageSize } = info.table.getState().pagination;
        const serial = pageIndex * pageSize + info.row.index + 1;
        return (
          <div className="text-neutral-600 text-center">{serial}</div>
        );
      },
      size: 56,
    },
    {
      accessorKey: "name",
      header: "Community",
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex items-center gap-4 py-2">
            <div className="relative h-12 w-20 overflow-hidden rounded-lg border border-neutral-100 bg-muted shrink-0">
              {c.coverImage ? (
                <Image
                  src={c.coverImage}
                  alt={c.name}
                  fill
                  className="object-cover"
                  unoptimized={c.coverImage.startsWith("http")}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-900 to-slate-800">
                  <span className="text-white font-bold opacity-20 text-xl">
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-bold text-neutral-900">
                {c.name}
              </span>
              <span className="text-xs text-neutral-500">@{c.handle}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "industry",
      header: "Industry",
      cell: ({ row }) => (
        <span className="text-sm text-neutral-700">
          {industryLabel(row.original.industry)}
        </span>
      ),
    },
    {
      accessorKey: "myRole",
      header: "Your access",
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge variant="secondary" className="font-medium">
            {ROLE_LABEL[row.original.myRole]}
          </Badge>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-primary-600 text-[10px] font-bold text-primary-600 hover:bg-primary-50"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/dashboard/community/manage/${row.original.id}`);
            }}
          >
            Manage
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: [...data],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex + 1;

  return (
    <BoneyardSkeleton
      loading={isLoading}
      name="communities-table"
      fallback={<TableBlockFallback className="px-0 py-0" />}
      className="w-full"
    >
      {data.length === 0 ? (
        <EmptyState
          title="No communities yet"
          description="Create a community or ask an owner to invite you as an admin or editor."
          className="py-16"
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader className="bg-primary-800 border-none!">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="hover:bg-transparent border-none!"
                    >
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="h-14 text-[11px] font-bold uppercase tracking-wider text-white border-none!"
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
                      className="h-16 cursor-pointer border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors"
                      onClick={() =>
                        router.push(
                          `/dashboard/community/manage/${row.original.id}`,
                        )
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-2">
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
          {pageCount > 1 ? (
            <div className="mt-6 flex justify-center">
              <Pagination
                curPage={pageIndex}
                totalPages={pageCount}
                onPageChange={(p) => table.setPageIndex(p - 1)}
                perPage={10}
                setPerPage={() => {}}
              />
            </div>
          ) : null}
        </div>
      )}
    </BoneyardSkeleton>
  );
}
