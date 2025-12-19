"use client";

import * as React from "react";
import Link from "next/link";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  IconCalendar,
  IconClock,
  IconMapPin,
  IconPencil,
  IconDotsVertical,
  IconChevronRight,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// --- Types ---

type EventRow = {
  id: string;
  name: string;
  slug: string;
  thumbnail: string; // URL or placeholder color
  startDate: string;
  endDate: string;
  location: string;
  status: "Draft" | "Published" | "Past";
  description: string;
};

// --- Mock Data ---

const MOCK_EVENTS: EventRow[] = [
  {
    id: "1",
    name: "Tech Innovators Summit 2024",
    slug: "tech-innovators-summit-2024",
    thumbnail: "bg-purple-100",
    startDate: "2024-03-15",
    endDate: "2024-03-16",
    location: "San Francisco, CA",
    status: "Published",
    description: "The leading summit for technology innovation and startups.",
  },
  {
    id: "2",
    name: "Global Hackathon Series: Asia",
    slug: "global-hackathon-asia",
    thumbnail: "bg-blue-100",
    startDate: "2024-04-10",
    endDate: "2024-04-12",
    location: "Singapore",
    status: "Draft",
    description:
      "A 48-hour hackathon bringing together the best minds in Asia.",
  },
  {
    id: "3",
    name: "Creative Design Workshop",
    slug: "creative-design-workshop",
    thumbnail: "bg-pink-100",
    startDate: "2024-05-20",
    endDate: "2024-05-20",
    location: "Online",
    status: "Published",
    description:
      "Learn the fundamentals of UI/UX design in this intensive workshop.",
  },
  {
    id: "4",
    name: "Future of AI Conference",
    slug: "future-of-ai",
    thumbnail: "bg-yellow-100",
    startDate: "2024-06-05",
    endDate: "2024-06-07",
    location: "London, UK",
    status: "Draft",
    description:
      "Exploring the boundaries of Artificial Intelligence and Machine Learning.",
  },
  {
    id: "5",
    name: "Startup Pitch Night",
    slug: "startup-pitch-night",
    thumbnail: "bg-green-100",
    startDate: "2024-02-28",
    endDate: "2024-02-28",
    location: "New York, NY",
    status: "Past",
    description:
      "Watch early-stage startups pitch their ideas to top investors.",
  },
];

// --- Column Definitions ---

const columnHelper = createColumnHelper<EventRow>();

const columns = [
  columnHelper.accessor("thumbnail", {
    header: "",
    cell: (info) => (
      <div
        className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold text-muted-foreground/50",
          info.getValue()
        )}
      >
        {info.row.original.name.charAt(0)}
      </div>
    ),
    enableSorting: false,
  }),
  columnHelper.accessor("name", {
    header: "Event Info",
    cell: (info) => (
      <div className="flex flex-col gap-1">
        <Link
          href={`/dashboard/events/${info.row.original.slug}`}
          className="font-semibold text-foreground hover:text-primary transition-colors text-base"
        >
          {info.getValue()}
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-1 max-w-[300px]">
          {info.row.original.description}
        </p>
      </div>
    ),
  }),
  columnHelper.accessor("startDate", {
    header: "Date & Time",
    cell: (info) => (
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <IconCalendar className="w-4 h-4" />
          <span>{info.getValue()}</span>
        </div>
        <div className="flex items-center gap-2">
          <IconClock className="w-4 h-4" />
          <span>- {info.row.original.endDate}</span>
        </div>
      </div>
    ),
  }),
  columnHelper.accessor("location", {
    header: "Location",
    cell: (info) => (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <IconMapPin className="w-4 h-4" />
        <span>{info.getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const status = info.getValue();
      let variant: "default" | "secondary" | "destructive" | "outline" =
        "secondary";
      if (status === "Published") variant = "default";
      if (status === "Draft") variant = "outline";

      return <Badge variant={variant}>{status}</Badge>;
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: (info) => (
      <div className="flex justify-end pr-4">
        <Link href={`/dashboard/events/${info.row.original.slug}`}>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-muted/50 rounded-full"
          >
            <IconChevronRight className="w-5 h-5 text-muted-foreground" />
          </Button>
        </Link>
      </div>
    ),
  }),
];

// --- Page Component ---

export default function EventsPage() {
  const [data] = React.useState<EventRow[]>(MOCK_EVENTS);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
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
      <div className="w-full max-w-[1200px] space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-poppins">
              Events
            </h1>
            <p className="text-muted-foreground text-sm font-inter">
              Manage your upcoming events and workshops.
            </p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-inter rounded-full">
            Create Event
          </Button>
        </div>

        {/* Table Container */}
        <div className="bg-muted/30 rounded-[20px] border border-border p-2 overflow-x-auto shadow-sm">
          <div className="min-w-[1000px]">
            {/* Table Header */}
            <div className="grid grid-cols-[80px_2fr_1.5fr_1.5fr_1fr_60px] gap-4 items-center bg-secondary/30 p-4 rounded-t-xl text-sm font-semibold text-foreground border-b border-border/50 font-inter">
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

            {/* Table Body */}
            <div className="flex flex-col bg-white rounded-b-xl">
              {table.getRowModel().rows.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-muted-foreground">
                  No events found.
                </div>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[80px_2fr_1.5fr_1.5fr_1fr_60px] gap-4 p-4 items-center border-b border-border last:border-0 hover:bg-muted/10 transition-colors cursor-pointer group"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <div
                        key={cell.id}
                        className="whitespace-nowrap overflow-hidden text-ellipsis"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </div>
                    ))}
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
