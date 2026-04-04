"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { getMyTransactions } from "@/lib/api/usersApi";
import {
  Loader2,
  Search,
  CheckCircle2,
  RotateCcw,
  Trophy,
  Calendar,
  ArrowDownLeft,
  ArrowUpDown,
  MoreVertical,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnDef,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AnalyticCard from "@/app/dashboard/_components/AnalyticCard";
import {
  MotionContainer,
  MotionItem,
} from "@/components/ui/derived/MotionWrapper";
import { toast } from "sonner";

interface Transaction {
  id: string;
  title: string;
  type: "Event" | "Competition";
  opportunityType: "event" | "hackathon";
  slug: string;
  /** Registration fee (organizer-facing); excludes gateway when participant paid it on top. */
  grossAmount: number;
  /** Total charged via Razorpay when set (use for display). */
  chargedAmount?: number | null;
  currency: string;
  paymentStatus: string;
  refundStatus: string | null;
  refundedAmount: number;
  discountAmount: number | null;
  capturedAt: string | null;
  createdAt: string;
  razorpayPaymentId: string | null;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function amountCharged(tx: Transaction): number {
  return tx.chargedAmount ?? tx.grossAmount;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }) + ", " + date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const columnHelper = createColumnHelper<Transaction>();

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "event", label: "Events" },
  { id: "hackathon", label: "Competitions" },
];

export default function TransactionsPage() {
  const { getToken } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    razorpayPaymentId: true,
    date: true,
  });

  // Table is now scrollable horizontally on mobile, so we don't need to hide columns.


  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const token = await getToken();
        if (!token) return;

        const data = await getMyTransactions(token);
        setTransactions(data);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        toast.error("Failed to load transactions");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [getToken]);

  const columns = useMemo<ColumnDef<Transaction, any>[]>(
    () => [
      columnHelper.accessor("title", {
        header: "Opportunity",
        cell: (info) => {
          const tx = info.row.original;
          const isRefunded = tx.paymentStatus === "REFUNDED";
          return (
            <div className="flex items-center gap-3 min-w-[200px] py-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                  isRefunded
                    ? "bg-amber-50 border-amber-100"
                    : "bg-primary-50 border-primary-100"
                )}
              >
                <ArrowDownLeft
                  className={cn(
                    "w-5 h-5",
                    isRefunded ? "text-amber-500" : "text-primary-600"
                  )}
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-neutral-900 leading-tight">
                  {tx.title}
                </span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] h-4 px-1.5 font-medium border-none rounded-sm uppercase tracking-wider",
                      tx.opportunityType === "hackathon"
                        ? "bg-violet-100/50 text-violet-600"
                        : "bg-blue-100/50 text-blue-600"
                    )}
                  >
                    {tx.opportunityType === "hackathon"
                      ? "Competition"
                      : "Event"}
                  </Badge>
                </div>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.capturedAt ?? row.createdAt, {
        id: "date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent -ml-2 text-neutral-500 font-medium whitespace-nowrap"
          >
            Date
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: (info) => (
          <div className="text-sm text-neutral-600 whitespace-nowrap">
            {formatDate(info.getValue())}
          </div>
        ),
      }),
      columnHelper.accessor((row) => amountCharged(row), {
        id: "amount",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent -ml-2 text-neutral-500 font-medium whitespace-nowrap"
          >
            Amount
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: (info) => {
          const tx = info.row.original;
          const isRefunded = tx.paymentStatus === "REFUNDED";
          const paid = amountCharged(tx);
          return (
            <div className="flex flex-col items-start gap-0.5 tabular-nums">
              {isRefunded ? (
                <>
                  <span className="text-xs text-neutral-400 line-through">
                    {formatCurrency(paid, tx.currency)}
                  </span>
                  <span className="text-sm font-bold text-amber-600">
                    +{formatCurrency(tx.refundedAmount, tx.currency)}
                  </span>
                </>
              ) : (
                <span className="text-sm font-bold text-neutral-900">
                  {formatCurrency(paid, tx.currency)}
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("paymentStatus", {
        header: "Status",
        cell: (info) => {
          const status = info.getValue() as string;
          const map: Record<string, { label: string; className: string }> = {
            CAPTURED: {
              label: "Paid",
              className: "bg-emerald-50 text-emerald-700 border-emerald-100",
            },
            REFUNDED: {
              label: "Refunded",
              className: "bg-amber-50 text-amber-700 border-amber-100",
            },
            CREATED: {
              label: "Pending",
              className: "bg-neutral-100 text-neutral-600 border-neutral-200",
            },
            FAILED: {
              label: "Failed",
              className: "bg-red-50 text-red-600 border-red-100",
            },
          };
          const { label, className } = map[status] ?? {
            label: status,
            className: "bg-neutral-100 text-neutral-500 border-neutral-200",
          };
          return (
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap uppercase tracking-tight",
                className
              )}
            >
              {status === "CAPTURED" && <CheckCircle2 className="w-3 h-3" />}
              {status === "REFUNDED" && <RotateCcw className="w-3 h-3" />}
              {label}
            </div>
          );
        },
      }),
      columnHelper.accessor("razorpayPaymentId", {
        header: "Payment ID",
        cell: (info) => {
          const id = info.getValue();
          if (!id) return <span className="text-neutral-300">—</span>;
          return (
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono group/id cursor-default">
              <span className="truncate max-w-[120px]">{id}</span>
              <ExternalLink className="w-3 h-3 opacity-0 group-hover/id:opacity-100 transition-opacity" />
            </div>
          );
        },
      }),
    ],
    []
  );

  const filteredData = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesTab =
        activeTab === "all" || tx.opportunityType === activeTab;
      const matchesSearch = tx.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [transactions, activeTab, searchQuery]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter: searchQuery,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearchQuery,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  });

  const totals = useMemo(() => {
    const paid = transactions
      .filter((t) => t.paymentStatus === "CAPTURED")
      .reduce((s, t) => s + amountCharged(t), 0);
    const refunded = transactions
      .filter((t) => t.paymentStatus === "REFUNDED")
      .reduce((s, t) => s + t.refundedAmount, 0);
    return { paid, refunded, net: paid - refunded };
  }, [transactions]);

  const currency = transactions[0]?.currency ?? "INR";

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-3xl p-8 flex items-center justify-center min-h-[400px] border border-[#E0E0E6]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Summary cards */}
      {transactions.length > 0 && (
        <MotionContainer className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          <MotionItem>
            <AnalyticCard
              title="Total Paid"
              value={formatCurrency(totals.paid, currency)}
              badge="Transactions"
              badgeValue={
                transactions.filter((t) => t.paymentStatus === "CAPTURED").length
              }
              type="normal"
            />
          </MotionItem>
          <MotionItem>
            <AnalyticCard
              title="Refunded"
              value={formatCurrency(totals.refunded, currency)}
              badge="Refunds"
              badgeValue={
                transactions.filter((t) => t.paymentStatus === "REFUNDED")
                  .length
              }
              type="normal"
            />
          </MotionItem>
          <MotionItem
            className="col-span-2 sm:col-span-1">
            <AnalyticCard
              title="Net Spent"
              value={formatCurrency(totals.net, currency)}
              badge="Actual Expenditure"
              badgeValue="Net"
              type="highlight"
            />
          </MotionItem>
        </MotionContainer>
      )}

      {/* Table Section */}
      <div className="w-full bg-white rounded-3xl border border-[#E0E0E6] shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 px-6 py-5 border-b border-neutral-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "text-sm font-semibold whitespace-nowrap pb-1 transition-all relative group",
                  activeTab === tab.id
                    ? "text-primary-600"
                    : "text-neutral-500 hover:text-neutral-800"
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "absolute bottom-[-1px] left-0 w-full h-[2px] rounded-full bg-primary-600 transition-transform duration-300",
                    activeTab === tab.id
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-50"
                  )}
                />
              </button>
            ))}
          </div>

          <div className="relative group">
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-[280px] bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 pr-10 text-sm text-neutral-700 placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 transition-all"
            />
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
          </div>
        </div>

        {/* Table Content */}
        <div className="relative overflow-x-auto no-scrollbar">
          <Table className="min-w-[700px]">
            <TableHeader className="bg-neutral-50/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="hover:bg-transparent border-b border-neutral-100"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="px-6 h-12 text-neutral-500 font-semibold"
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
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="group border-b border-neutral-100 last:border-0 hover:bg-neutral-50/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-6 py-4">
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
                    className="h-[400px] text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
                      <div className="w-48 h-48 relative">
                        <Image
                          src="/illustrations/working-on-desk.svg"
                          alt="Empty state"
                          fill
                          className="object-contain opacity-60 grayscale-[0.2]"
                        />
                      </div>
                      <div className="max-w-[280px]">
                        <h3 className="text-lg font-bold text-neutral-800">
                          No transactions found
                        </h3>
                        <p className="text-sm text-neutral-400 mt-1">
                          We couldn't find any financial records matching your
                          current filters or search.
                        </p>
                        {(activeTab !== "all" || searchQuery) && (
                          <Button
                            variant="link"
                            className="mt-2 text-primary-600 font-semibold h-auto p-0"
                            onClick={() => {
                              setActiveTab("all");
                              setSearchQuery("");
                            }}
                          >
                            Clear all filters
                          </Button>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {table.getRowModel().rows?.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 bg-neutral-50/30">
            <div className="text-xs font-medium text-neutral-400 uppercase tracking-widest leading-none">
              Viewing {table.getRowModel().rows.length} of{" "}
              {filteredData.length} records
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-neutral-200"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from(
                  { length: table.getPageCount() },
                  (_, i) => i + 1
                ).map((page) => (
                  <button
                    key={page}
                    onClick={() => table.setPageIndex(page - 1)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                      table.getState().pagination.pageIndex === page - 1
                        ? "bg-primary-600 text-white shadow-md shadow-primary-200"
                        : "text-neutral-500 hover:bg-neutral-100"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-neutral-200"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
