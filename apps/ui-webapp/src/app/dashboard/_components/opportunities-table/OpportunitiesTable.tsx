"use client";

import React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from '@tanstack/react-table';
import Image from 'next/image';
import { SortFromTopToBottom } from '@solar-icons/react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/common/EmptyState';
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { TableBlockFallback } from "@/components/boneyard/loading-fallbacks";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Opportunity } from './types';
import { StatusBadge } from './StatusBadge';
import { RegistrationToggle } from './RegistrationToggle';
import Pagination from '@/components/common/Pagination';

interface OpportunitiesTableProps {
  data: Opportunity[];
  onToggleRegistration?: (id: string, isOpen: boolean) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

export const OpportunitiesTable: React.FC<OpportunitiesTableProps> = ({
  data,
  onToggleRegistration,
  page,
  totalPages,
  onPageChange,
  isLoading = false,
}) => {
  const router = useRouter();
  const columns: ColumnDef<Opportunity>[] = [
    {
      id: 'serialNumber',
      header: 'S. No.',
      cell: (info) => <div className="text-neutral-600 text-center">{info.row.index + 1}</div>,
      size: 60,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-2 text-left">
            Opportunity Name
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 w-8 hover:bg-transparent"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              <SortFromTopToBottom className="h-3 w-3" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const opp = row.original;
        return (
          <div className="flex items-center gap-4 py-2">
            <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
              {opp.image ? (
                <Image
                  src={opp.image}
                  alt={opp.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-neutral-300 font-bold">
                  {opp.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-bold text-neutral-900">
                {opp.name}
              </span>
              <span className="text-xs text-neutral-500 capitalize">{opp.type.toLowerCase()}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'candidates',
      header: ({ column }) => (
        <div className="flex items-center justify-center gap-2">
          Candidates
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 w-8 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <SortFromTopToBottom className="h-3 w-3" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center font-medium text-neutral-700">
          {row.original.candidates.toString().padStart(2, '0')}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <div className="flex items-center justify-center gap-2">
          Status
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 w-8 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <SortFromTopToBottom className="h-3 w-3" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <StatusBadge status={row.original.status} />
        </div>
      ),
    },
    {
      id: 'registration',
      header: 'Registration',
      cell: ({ row }) => (
        <div className="flex justify-center">
          <RegistrationToggle
            isOpen={row.original.registrationOpen}
            onToggle={(isOpen) => onToggleRegistration?.(row.original.id, isOpen)}
          />
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-primary-600 text-[10px] font-bold text-primary-600 hover:bg-primary-50"
            onClick={() => router.push(`/dashboard/${row.original.type.toLowerCase()}/${row.original.slug}`)}
          >
            Manage
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <BoneyardSkeleton
      loading={isLoading}
      name="opportunities-table"
      fallback={<TableBlockFallback className="px-0 py-0" />}
      className="w-full"
    >
      {data.length === 0 ? (
        <EmptyState
          title="No opportunities found"
          description="You haven't created any opportunities yet."
          className="py-16"
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader className="bg-primary-800 border-none!">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent border-none!">
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="h-14 text-[11px] font-bold uppercase tracking-wider text-white border-none!"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
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
                      onClick={() => router.push(`/dashboard/${row.original.type.toLowerCase()}/${row.original.slug}`)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-2">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          {totalPages && totalPages > 1 && onPageChange && (
            <div className="mt-6 flex justify-center">
              <Pagination
                curPage={page || 1}
                totalPages={totalPages}
                onPageChange={onPageChange}
                perPage={10}
                setPerPage={() => {}}
              />
            </div>
          )}
        </div>
      )}
    </BoneyardSkeleton>
  );
};
