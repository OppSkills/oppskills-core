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
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  title: string;
  type: "Event" | "Competition";
  opportunityType: "event" | "hackathon";
  slug: string;
  grossAmount: number;
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

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
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
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        className
      )}
    >
      {status === "CAPTURED" && <CheckCircle2 className="w-3 h-3" />}
      {status === "REFUNDED" && <RotateCcw className="w-3 h-3" />}
      {label}
    </span>
  );
}

function TypeBadge({ type }: { type: "Event" | "Competition" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
        type === "Competition"
          ? "bg-violet-50 text-violet-700 border-violet-100"
          : "bg-blue-50 text-blue-700 border-blue-100"
      )}
    >
      {type === "Competition" ? (
        <Trophy className="w-3 h-3" />
      ) : (
        <Calendar className="w-3 h-3" />
      )}
      {type}
    </span>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const effectiveAmount =
    tx.paymentStatus === "REFUNDED"
      ? tx.grossAmount - tx.refundedAmount
      : tx.grossAmount;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors group">
      {/* Icon */}
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          tx.paymentStatus === "REFUNDED"
            ? "bg-amber-50"
            : "bg-primary-50"
        )}
      >
        <ArrowDownLeft
          className={cn(
            "w-5 h-5",
            tx.paymentStatus === "REFUNDED"
              ? "text-amber-500"
              : "text-primary-600"
          )}
        />
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-neutral-900 truncate">
          {tx.title}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
          <TypeBadge type={tx.type} />
          {tx.discountAmount && tx.discountAmount > 0 && (
            <span className="text-xs text-emerald-600 font-medium">
              −{formatCurrency(tx.discountAmount, tx.currency)} discount
            </span>
          )}
          <span className="text-xs text-neutral-400">
            {formatDate(tx.capturedAt ?? tx.createdAt)}
          </span>
          {tx.razorpayPaymentId && (
            <span className="text-xs text-neutral-400 font-mono hidden sm:inline truncate max-w-[160px]">
              {tx.razorpayPaymentId}
            </span>
          )}
        </div>
      </div>

      {/* Amount + status */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          className={cn(
            "text-base font-bold tabular-nums",
            tx.paymentStatus === "REFUNDED"
              ? "text-amber-600"
              : "text-neutral-900"
          )}
        >
          {formatCurrency(effectiveAmount, tx.currency)}
        </span>
        <StatusBadge status={tx.paymentStatus} />
      </div>
    </div>
  );
}

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

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await getMyTransactions(token);
        setTransactions(data as Transaction[]);
      } catch (err) {
        console.error("Failed to load transactions", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [getToken]);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesTab =
        activeTab === "all" || tx.opportunityType === activeTab;
      const matchesSearch = tx.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [transactions, activeTab, searchQuery]);

  const totals = useMemo(() => {
    const paid = transactions
      .filter((t) => t.paymentStatus === "CAPTURED")
      .reduce((s, t) => s + t.grossAmount, 0);
    const refunded = transactions
      .filter((t) => t.paymentStatus === "REFUNDED")
      .reduce((s, t) => s + t.refundedAmount, 0);
    return { paid, refunded, net: paid - refunded };
  }, [transactions]);

  const currency =
    transactions.find(() => true)?.currency ?? "INR";

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-3xl p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Summary cards */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Total paid",
              value: formatCurrency(totals.paid, currency),
              sub: `${transactions.filter((t) => t.paymentStatus === "CAPTURED").length} transactions`,
              color: "text-neutral-900",
              bg: "bg-white",
            },
            {
              label: "Refunded",
              value: formatCurrency(totals.refunded, currency),
              sub: `${transactions.filter((t) => t.paymentStatus === "REFUNDED").length} refunds`,
              color: "text-amber-600",
              bg: "bg-white",
            },
            {
              label: "Net spent",
              value: formatCurrency(totals.net, currency),
              sub: "after refunds",
              color: "text-primary-700",
              bg: "bg-primary-50",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={cn(
                "rounded-2xl px-5 py-4 border border-[#E0E0E6]",
                card.bg
              )}
            >
              <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">
                {card.label}
              </p>
              <p className={cn("text-2xl font-bold mt-1 tabular-nums", card.color)}>
                {card.value}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table card */}
      <div className="w-full bg-white rounded-3xl border border-[#E0E0E6] overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-neutral-100">
          {/* Filter tabs */}
          <div className="flex items-center gap-6 overflow-x-auto pb-0.5">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "text-sm font-medium whitespace-nowrap pb-1 transition-all relative",
                  activeTab === tab.id
                    ? "text-primary-600"
                    : "text-neutral-500 hover:text-neutral-800"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] rounded-full bg-primary-600" />
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-[240px]">
            <input
              type="text"
              placeholder="Search transactions…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-full px-4 py-2 pr-10 text-sm text-neutral-700 placeholder:text-neutral-400 outline-none focus:border-primary-400 transition-colors"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>
        </div>

        {/* Rows */}
        {filtered.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {filtered.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-4">
            <Image
              src="/illustrations/working-on-desk.svg"
              alt="No transactions"
              width={200}
              height={200}
            />
            <div>
              <h3 className="text-base font-semibold text-neutral-800">
                No transactions found
              </h3>
              <p className="text-sm text-neutral-400 mt-1">
                Payments you make for events and competitions will appear here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
