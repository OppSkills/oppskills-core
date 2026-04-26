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
}

export const OpportunitiesTable: React.FC<OpportunitiesTableProps> = ({ 
  data, 
  onToggleRegistration,
  page,
  totalPages,
  onPageChange
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
        const opportunity = row.original;
        return (
          <div className="flex items-center gap-4 py-2">
            <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={opportunity.image}
                alt={opportunity.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col min-w-0 text-left w-[300px]">
              <h4 className="font-semibold text-neutral-900 break-words whitespace-normal leading-snug">
                {opportunity.name}
              </h4>
              <p className="text-xs text-neutral-500 line-clamp-2 mt-1 break-words whitespace-normal">
                {opportunity.description.replace(/<[^>]*>?/gm, '')}
              </p>
              <span className="text-[10px] uppercase font-bold text-neutral-400 bg-neutral-100 w-fit px-1.5 py-0.5 rounded mt-1">
                {opportunity.type}
              </span>
            </div>
          </div>
        );
      },
      size: 350,
    },
    {
      accessorKey: 'candidates',
      header: 'Candidates',
      cell: ({ getValue }) => (
        <div className="text-center font-medium text-neutral-700">
          {(getValue() as number).toLocaleString()}
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <div className="text-center"><StatusBadge status={getValue() as any} /></div>,
      size: 120,
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      cell: ({ row }) => (
        <div className="flex flex-col items-center">
          <span className="font-medium text-neutral-700">{row.original.startDate}</span>
          <span className="text-[10px] text-neutral-500">{row.original.startTime}</span>
        </div>
      ),
      size: 180,
    },
    {
      accessorKey: 'endDate',
      header: 'End Date',
      cell: ({ row }) => (
        <div className="flex flex-col items-center">
          <span className="font-medium text-neutral-700">{row.original.endDate}</span>
          <span className="text-[10px] text-neutral-500">{row.original.endTime}</span>
        </div>
      ),
      size: 180,
    },
    {
      accessorKey: 'registrationsOpen',
      header: 'Registrations',
      cell: ({ row }) => (
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <RegistrationToggle
            isOpen={row.original.registrationsOpen}
            onChange={(val) => onToggleRegistration?.(row.original.id, val)}
          />
        </div>
      ),
      size: 150,
    },
  ];


  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="w-full max-w-full bg-white rounded-xl shadow-sm border border-neutral-300 overflow-hidden">
      <div className="overflow-x-auto overflow-y-hidden">
        <Table className="min-w-[1000px] w-full border border-neutral-300">
          <TableHeader className="bg-primary-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-neutral-100 font-normal text-sm whitespace-nowrap py-2 border-r border-white/30 last:border-r-0"
                    style={{ width: header.getSize() }}
                  >
                    <div className={header.id === 'name' ? 'text-left' : 'text-center'}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b border-neutral-300 hover:bg-neutral-50 transition-colors cursor-pointer"
                  onClick={() => {
                    const opp = row.original;
                    const basePath = opp.type === 'Competition' ? 'hackathon' : 'events';
                    router.push(`/dashboard/${basePath}/${opp.slug}`);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-3 px-4 border-r border-neutral-300 last:border-r-0"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='px-4'>
        <Pagination
          curPage={page || table.getState().pagination.pageIndex + 1}
          totalPages={totalPages || table.getPageCount()}
          setPerPage={(size) => table.setPageSize(Number(size))}
          perPage={table.getState().pagination.pageSize}
          onPageChange={(p) => onPageChange ? onPageChange(p) : table.setPageIndex(p - 1)}
        />
      </div>
    </div>
  );
};
