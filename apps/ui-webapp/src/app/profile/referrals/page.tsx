"use client";

import React from "react";
import Image from "next/image";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Copy, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import AnalyticCard from "@/app/dashboard/_components/AnalyticCard";
import {
  MotionContainer,
  MotionItem,
} from "@/components/ui/derived/MotionWrapper";
import { Button } from "@/components/ui/button";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import {
  getMyReferralPerformance,
  getMyReferredUsers,
  ReferralPerformanceItem,
} from "@/lib/api/referralApi";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";

import { ReferredParticipantsSheet } from "./_components/ReferredParticipantsSheet";
import { useState } from "react";
import { SortFromTopToBottom } from "@solar-icons/react";

const columnHelper = createColumnHelper<ReferralPerformanceItem>();

export default function ReferralsPage() {
  const { getToken, isLoaded: isAuthLoaded } = useAuth();
  const [selectedReferral, setSelectedReferral] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const {
    data: performanceData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["my-referral-performance"],
    enabled: isAuthLoaded,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getMyReferralPerformance(token);
    },
  });

  const tableData = performanceData?.referrals || [];

  const columns = [
    columnHelper.display({
      id: "sNo",
      header: () => <div className="text-center w-full">S. No.</div>,
      cell: (info) => (
        <div className="text-center w-full">
          <span className="text-neutral-500 font-medium">
            {info.row.index + 1}
          </span>
        </div>
      ),
    }),
    columnHelper.accessor("title", {
      header: () => (
        <div className="flex items-center gap-2">
          Event/ Competition <SortFromTopToBottom className="size-4" />
        </div>
      ),
      cell: (info) => {
        const row = info.row.original;
        const baseUrl =
          typeof window !== "undefined" ? window.location.origin : "";
        const referralLink = `${baseUrl}/r/${row.code}`;

        return (
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-12 rounded-lg overflow-hidden shrink-0 border border-neutral-200 bg-neutral-100 shadow-sm">
              {row.thumbnail ? (
                <Image
                  src={row.thumbnail}
                  alt={row.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                  <span className="text-white font-bold opacity-20 text-xl select-none">
                    {row.title.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-neutral-800 truncate">
                {row.title}
              </span>
              <span className="text-xs text-neutral-500">
                {row.organization}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-primary-600 underline truncate max-w-[120px]">
                  {referralLink}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(referralLink);
                    toast.success("Link copied to clipboard");
                  }}
                  className="text-neutral-400 hover:text-primary-600 transition-colors"
                >
                  <Copy className="size-3" />
                </button>
                <Link
                  href={`/${row.entityType.toLowerCase()}/${row.slug}`}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="text-neutral-400 hover:text-primary-600 transition-colors"
                >
                  <ExternalLink className="size-3" />
                </Link>
              </div>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("clicks", {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          Link Clicks <SortFromTopToBottom className="size-4" />
        </div>
      ),
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex flex-col items-center justify-center w-full">
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap">
              {row.clicks} Clicks
            </div>
            <span className="text-[10px] text-neutral-400 mt-1">
              {row.clicksLast24h} in last 24 hrs
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor("registrations", {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          Registrations <SortFromTopToBottom className="size-4" />
        </div>
      ),
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex flex-col items-center justify-center w-full">
            <div className="bg-pink-100 text-pink-600 px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap">
              {row.registrations} Registrations
            </div>
            <span className="text-[10px] text-neutral-400 mt-1">
              {row.registrationsLast24h} in last 24 hrs
            </span>
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const summary = performanceData?.summary;
  const analyticData = [
    {
      title: "All Opportunities Referrals",
      value: summary?.totalRegistrations?.toString() || "0",
      badge: "Last 24 Hrs",
      badgeValue: summary?.registrations24h?.toString() || "0",
      type: "highlight" as const,
    },
    {
      title: "No. Of Links Generated",
      value: summary?.linksGenerated?.toString() || "0",
      badge: "Active Links",
      badgeValue: summary?.activeLinks?.toString() || "0",
      type: "normal" as const,
    },
    {
      title: "No. Of Impressions",
      value: summary?.totalImpressions?.toString() || "0",
      badge: "Impression last 24 hrs",
      badgeValue: summary?.impressions24h?.toString() || "0",
      type: "normal" as const,
    },
    {
      title: "No. Of Registrations",
      value: summary?.totalRegistrations?.toString() || "0",
      badge: "Registrations last 24 hrs",
      badgeValue: summary?.registrations24h?.toString() || "0",
      type: "normal" as const,
    },
  ];

  if (isLoading) {
    return (
      <div className="w-full flex flex-col gap-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[160px] w-full rounded-[32px]" />
          ))}
        </div>
        <div className="w-full bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm p-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center text-center gap-4 bg-white rounded-3xl border border-neutral-200">
        <div className="p-4 rounded-full bg-red-50 text-red-500">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-neutral-800">
            Failed to load referrals
          </h3>
          <p className="text-neutral-500 mt-1">
            Please try refreshing the page or contact support if the issue
            persists.
          </p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="rounded-full"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-8">
      <MotionContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyticData.map((item, index) => (
          <MotionItem key={index}>
            <AnalyticCard
              title={item.title}
              value={item.value}
              badge={item.badge}
              badgeValue={item.badgeValue}
              type={item.type}
              className="h-full min-h-[160px]"
            />
          </MotionItem>
        ))}
      </MotionContainer>

      <div className="w-full bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-[#2D1F47]">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="hover:bg-transparent border-none"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-white font-medium py-4 h-auto first:pl-8"
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
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() =>
                      setSelectedReferral({
                        id: row.original.id,
                        title: row.original.title,
                      })
                    }
                    className="hover:bg-neutral-50 border-b border-neutral-100 last:border-none transition-all cursor-pointer group"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4 first:pl-8">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-neutral-500"
                  >
                    No referrals found. Start sharing opportunities to see them
                    here!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ReferredParticipantsSheet
        referralId={selectedReferral?.id || null}
        opportunityTitle={selectedReferral?.title || ""}
        onClose={() => setSelectedReferral(null)}
      />
    </div>
  );
}
