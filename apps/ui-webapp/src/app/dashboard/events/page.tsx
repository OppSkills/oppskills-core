"use client";

import { Search, Plus } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import ActionDropdown from "../_components/ActionDropdown";
import { getMyEvents } from "@/lib/api/eventApi";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

/**
 * Converts stored rich-text HTML into a human-friendly plain-text snippet.
 */
function stripHtmlToText(input: string): string {
  const value = input.trim();
  if (value.length === 0) return "";
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const el = document.createElement("div");
    el.innerHTML = value;
    return (el.textContent ?? el.innerText ?? "").replace(/\s+/g, " ").trim();
  }
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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

function getNumber(
  obj: Record<string, unknown>,
  key: string
): number | undefined {
  const value = obj[key];
  return typeof value === "number" ? value : undefined;
}

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "dd MMM yy");
}

function formatTime(value: string | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "hh:mm a");
}

/**
 * Determines if registration is currently open for an event.
 * Aligns with backend logic in EventService.joinEvent():
 * - Event must be PUBLISHED or ONGOING (DRAFT is NOT open for registration)
 * - Approval status must be APPROVED
 * - Registration must not be paused
 * - Must not be past deadline (if set)
 * - Must have capacity (checked separately)
 */
function isRegistrationOpen(input: {
  status?: string;
  approvalStatus?: string | null;
  registrationDeadline?: string | null;
  isRegistrationPaused?: boolean;
}): boolean {
  const status = (input.status ?? "").toUpperCase();

  // Only PUBLISHED or ONGOING events accept registrations
  // DRAFT, CANCELLED, COMPLETED events never accept registrations
  if (status !== "PUBLISHED" && status !== "ONGOING") return false;

  // Must be APPROVED
  const approval = (input.approvalStatus ?? "").toUpperCase();
  if (approval !== "APPROVED") return false;

  // If registration is paused, it's closed
  if (input.isRegistrationPaused === true) return false;

  // Check deadline (if set)
  const deadlineStr = input.registrationDeadline;
  if (deadlineStr) {
    const deadline = new Date(deadlineStr);
    if (!Number.isNaN(deadline.getTime()) && Date.now() > deadline.getTime()) {
      return false;
    }
  }

  return true;
}

type EventRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: "Event";
  status: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  candidates: string;
  isOpen: boolean;
  registrationLabel: "Open" | "Closed";
};

function extractEventRows(input: unknown): EventRow[] {
  const raw = Array.isArray(input)
    ? input
    : isRecord(input) && Array.isArray(input["data"])
      ? input["data"]
      : [];

  return raw
    .map((row): EventRow | null => {
      if (!isRecord(row)) return null;

      const id = getString(row, "id");
      const name = getString(row, "name");
      if (!id || !name) return null;

      const slug = getString(row, "slug");
      const status = getString(row, "status") ?? "DRAFT";
      const approvalStatus = getString(row, "approvalStatus") ?? null;
      const registrationDeadline =
        getString(row, "registrationDeadline") ?? null;
      const isRegistrationPaused = row["isRegistrationPaused"] === true;
      const open = isRegistrationOpen({
        status,
        approvalStatus,
        registrationDeadline,
        isRegistrationPaused,
      });

      // Try to get registration count from different possible fields
      const registrationCount = getNumber(row, "registrationCount");
      const participantsArray = row["participants"];
      const candidatesCount =
        registrationCount ??
        (Array.isArray(participantsArray) ? participantsArray.length : 0);

      return {
        id,
        slug: slug ?? id,
        name,
        description: getString(row, "description") ?? "",
        type: "Event",
        status,
        startDate: formatDate(getString(row, "startDate")),
        startTime: formatTime(getString(row, "startDate")),
        endDate: formatDate(getString(row, "endDate")),
        endTime: formatTime(getString(row, "endDate")),
        candidates: String(candidatesCount),
        isOpen: open,
        registrationLabel: open ? "Open" : "Closed",
      };
    })
    .filter((v): v is EventRow => v !== null);
}

const columnHelper = createColumnHelper<EventRow>();

const columns = [
  columnHelper.display({
    id: "sno",
    header: () => <div className="text-center">S. No.</div>,
    cell: (info) => (
      <div className="text-center font-medium text-lg">
        <Link
          href={`/dashboard/events/${info.row.original.slug}`}
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
        href={`/dashboard/events/${info.row.original.slug}`}
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
        <p className="text-xs text-muted-foreground leading-relaxed">
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
        <ActionDropdown
          editHref={`/dashboard/events/${info.row.original.slug}/edit-event`}
          settingsHref={`/dashboard/events/${info.row.original.slug}/settings`}
        />
      </div>
    ),
  }),
];

export default function EventsPage() {
  const { getToken, isLoaded } = useAuth();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [allRows, setAllRows] = React.useState<EventRow[]>([]);
  const [tableData, setTableData] = React.useState<EventRow[]>([]);
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  // Create a ref for getToken to avoid useEffect dependency on it changing
  const getTokenRef = React.useRef(getToken);
  React.useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  React.useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;

    const fetchData = async () => {
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

        const res = await getMyEvents(token);
        const rows = extractEventRows(res);

        if (!cancelled) {
          setAllRows(rows);
          setTableData(rows);
        }
      } catch (error) {
        console.error("Failed to fetch events", error);
        toast.error("Failed to load events");
        if (!cancelled) {
          setAllRows([]);
          setTableData([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [isLoaded]);

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
              placeholder="Search events"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-4 pr-12 rounded-full border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          </div>
          <Link href={"/organize/event"} className="w-full sm:w-auto">
            <Button className="rounded-full" size={"lg"}>
              <Plus className="h-5 w-5" />
              Create Event
            </Button>
          </Link>
        </div>

        {/* List Container */}
        <div className="bg-muted/30 rounded-[20px] border border-border p-2 overflow-x-auto shadow-sm">
          <div className="min-w-[1200px]">
            {/* Header Row */}
            <div className="grid grid-cols-[60px_2fr_1fr_1fr_1fr_1fr_1.5fr_60px] gap-4 items-center bg-secondary/30 p-4 rounded-t-xl text-sm font-semibold text-foreground border-b border-border/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <React.Fragment key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <div key={header.id} className="whitespace-nowrap">
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
            <div className="flex flex-col bg-background rounded-b-xl">
              {isLoading ? (
                <div className="h-24 flex items-center justify-center text-muted-foreground">
                  Loading events...
                </div>
              ) : table.getRowModel().rows.length === 0 ? (
                <div className="h-24 flex items-center justify-center text-muted-foreground">
                  No events found.
                </div>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[60px_2fr_1fr_1fr_1fr_1fr_1.5fr_60px] gap-4 p-6 items-center border-b border-border last:border-0 hover:bg-muted/10 transition-colors"
                  >
                    {row.getVisibleCells().map((cell, index) => {
                      const isSno = index === 0;
                      return (
                        <div
                          key={cell.id}
                          className={cn(
                            "whitespace-nowrap overflow-hidden text-ellipsis",
                            isSno && "text-center"
                          )}
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
    </div>
  );
}
