"use client";

import { Search, Plus, MoreVertical } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { getHackathons } from "@/lib/api/hackathonApi";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";

/**
 * Converts stored rich-text HTML into a human-friendly plain-text snippet.
 *
 * We intentionally do NOT render HTML here (security + table UX).
 */
function stripHtmlToText(input: string): string {
  const value = input.trim();
  if (value.length === 0) return "";

  // In the browser we can reliably parse HTML.
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const el = document.createElement("div");
    el.innerHTML = value;
    return (el.textContent ?? el.innerText ?? "").replace(/\s+/g, " ").trim();
  }

  // Fallback for non-browser contexts (shouldn't run for this client page, but safe).
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Row model for the dashboard table.
 *
 * Note: This is an adapter around the backend hackathon entity.
 */
type HackathonRow = {
  id: string;
  ownerId?: string;
  dashboardSlug: string;
  name: string;
  description: string;
  type: "Hackathon";
  status: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  candidates: string;
  isOpen: boolean;
  registrationLabel: "Open" | "Closed";
};

const columnHelper = createColumnHelper<HackathonRow>();

const columns = [
  columnHelper.display({
    id: "sno",
    header: () => <div className="text-center">S. No.</div>,
    cell: (info) => (
      <div className="text-center font-medium text-lg">
        <Link
          href={`/dashboard/opportunity/${info.row.original.dashboardSlug}`}
          aria-label={`Open ${info.row.original.name}`}
          className="inline-flex w-full justify-center hover:underline"
        >
          {info.row.index + 1}
        </Link>
      </div>
    ),
  }),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => (
      <Link
        href={`/dashboard/opportunity/${info.row.original.dashboardSlug}`}
        aria-label={`Open ${info.row.original.name}`}
        className="flex flex-col gap-1 hover:underline"
      >
        <div className="flex gap-2 items-start">
          <span className="font-semibold text-base lg:text-lg">
            {info.getValue()}
          </span>
          <div>
            <Badge className="bg-muted text-muted-foreground text-[10px] px-1">
              {info.row.original.type}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed max-w-[90%]">
          {stripHtmlToText(info.row.original.description)}
        </p>
      </Link>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => (
      <Badge
        variant="secondary"
        className="bg-secondary/50 text-secondary-foreground font-normal"
      >
        {info.getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor("startDate", {
    header: "Start Date",
    cell: (info) => (
      <div className="flex flex-col text-sm">
        <span className="font-medium text-base">{info.getValue()}</span>
        <span className="text-xs text-muted-foreground">
          {info.row.original.startTime}
        </span>
      </div>
    ),
  }),
  columnHelper.accessor("endDate", {
    header: "End Date",
    cell: (info) => (
      <div className="flex flex-col text-sm">
        <span className="font-medium text-base">{info.getValue()}</span>
        <span className="text-xs text-muted-foreground">
          {info.row.original.endTime}
        </span>
      </div>
    ),
  }),
  columnHelper.accessor("candidates", {
    header: "Candidates",
    cell: (info) => (
      <div className="text-base font-medium">{info.getValue()}</div>
    ),
  }),
  columnHelper.accessor("isOpen", {
    header: () => <div className="text-center">Registration</div>,
    cell: (info) => (
      <div className="flex items-center justify-center gap-3">
        <Switch checked={info.getValue()} />

        <span
          className={cn(
            "px-3 py-1 rounded text-xs font-medium w-16 text-center shadow-sm",
            info.getValue()
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          )}
        >
          {info.row.original.registrationLabel}
        </span>
      </div>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-center">Edit</div>,
    cell: (info) => (
      <div className="flex justify-center">
        <Link
          href={`/dashboard/opportunity/${info.row.original.dashboardSlug}/edit-opportunity`}
          aria-label={`Edit ${info.row.original.name}`}
          className="p-2 rounded-full hover:bg-muted transition-colors border border-gray-300"
        >
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </Link>
      </div>
    ),
  }),
];

/**
 * Type guard: checks if a value is a non-null object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(
  obj: Record<string, unknown>,
  key: string
): string | undefined {
  const value = obj[key];
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "dd MMM yy");
}

function isRegistrationOpen(input: {
  status?: string;
  registrationDeadline?: string;
}): boolean {
  const status = (input.status ?? "").toUpperCase();
  if (status === "CANCELLED" || status === "COMPLETED") return false;

  const deadlineStr = input.registrationDeadline;
  if (!deadlineStr) return false;
  const deadline = new Date(deadlineStr);
  if (Number.isNaN(deadline.getTime())) return false;

  return Date.now() <= deadline.getTime();
}

function extractHackathonRows(input: unknown): HackathonRow[] {
  const raw = Array.isArray(input)
    ? input
    : isRecord(input) && Array.isArray(input["data"])
      ? input["data"]
      : [];

  return raw
    .map((row): HackathonRow | null => {
      if (!isRecord(row)) return null;

      const id = getString(row, "id");
      const name = getString(row, "name");
      if (!id || !name) return null;

      const slug = getString(row, "slug");
      const ownerId =
        getString(row, "ownerId") ??
        (isRecord(row["owner"]) ? getString(row["owner"], "id") : undefined);
      const status = getString(row, "status") ?? "DRAFT";
      const registrationDeadline = getString(row, "registrationDeadline");
      const open = isRegistrationOpen({ status, registrationDeadline });

      return {
        id,
        ownerId,
        dashboardSlug: slug ?? id,
        name,
        description: getString(row, "description") ?? "",
        type: "Hackathon",
        status,
        startDate: formatDate(getString(row, "startDate")),
        startTime: "—",
        endDate: formatDate(getString(row, "endDate")),
        endTime: "—",
        candidates: "—",
        isOpen: open,
        registrationLabel: open ? "Open" : "Closed",
      };
    })
    .filter((v): v is HackathonRow => v !== null);
}

export default function OpportunityPage() {
  const { getToken, userId, isLoaded } = useAuth();
  const router = useRouter();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [allRows, setAllRows] = React.useState<HackathonRow[]>([]);
  const [tableData, setTableData] = React.useState<HackathonRow[]>([]);
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  /**
   * Clerk's `getToken` reference can change across renders, which would re-trigger our
   * data-fetching effect and make the page feel slow. Keep the latest function in a ref
   * and only re-run the fetch when auth/user identity is actually ready/changed.
   */
  const getTokenRef = React.useRef(getToken);
  React.useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  React.useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;

    const run = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const token = await getTokenRef.current();
        if (typeof token !== "string" || token.trim().length === 0) {
          if (!cancelled) {
            setAllRows([]);
            setTableData([]);
          }
          return;
        }

        const res = await getHackathons(token);
        const rows = extractHackathonRows(res);

        /**
         * Dashboard default: show only hackathons owned by the current user.
         * If you want "all hackathons", remove this filter.
         */
        const filtered =
          typeof userId === "string"
            ? rows.filter(
              (r) => typeof r.ownerId === "string" && r.ownerId === userId
            )
            : rows;

        if (!cancelled) {
          setAllRows(filtered);
          setTableData(filtered);
        }
      } catch (err: unknown) {
        toast.error("Failed to load hackathons.");
        if (!cancelled) {
          setAllRows([]);
          setTableData([]);
        }
        // eslint-disable-next-line no-console
        console.error(err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId]);

  React.useEffect(() => {
    const q = searchTerm.trim().toLowerCase();
    if (q.length === 0) {
      setTableData(allRows);
      return;
    }
    setTableData(allRows.filter((item) => item.name.toLowerCase().includes(q)));
  }, [searchTerm, allRows]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  return (
    <div className="w-full min-h-screen bg-background p-6 flex flex-col items-center">
      <div className="w-full max-w-[1150px] space-y-6">
        {/* Top Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-4 pr-12 rounded-full border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={() => router.push("/organizer")}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-medium shadow-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Host
          </button>
        </div>

        {/* List Container */}
        <div className="bg-muted/30 rounded-[20px] border border-border p-2 overflow-hidden shadow-sm">
          {/* Header Row - Desktop Only */}
          <div className="hidden lg:grid grid-cols-[60px_2fr_1fr_1fr_1fr_1fr_1.5fr_60px] gap-4 items-center bg-secondary/30 p-4 rounded-t-xl text-sm font-semibold text-foreground border-b border-border/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <React.Fragment key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <div key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>

          {/* Data Rows */}
          <div className="flex flex-col bg-white rounded-b-xl">
            {isLoading ? (
              <div className="h-24 flex items-center justify-center text-muted-foreground">
                Loading hackathons...
              </div>
            ) : table.getRowModel().rows.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-muted-foreground">
                No results found.
              </div>
            ) : (
              table.getRowModel().rows.map((row) => (
                <div
                  key={row.id}
                  className={cn(
                    "flex flex-col lg:grid lg:grid-cols-[60px_2fr_1fr_1fr_1fr_1fr_1.5fr_60px] gap-4 p-6 items-center border-b border-border last:border-0 hover:bg-muted/10 transition-colors",
                    "lg:h-32"
                  )}
                >
                  {row.getVisibleCells().map((cell, index) => {
                    const isSno = index === 0;
                    return (
                      <div
                        key={cell.id}
                        className={cn(isSno && "hidden lg:block text-center")}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}