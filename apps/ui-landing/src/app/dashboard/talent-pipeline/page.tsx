"use client";

import { Search, ChevronDown, MapPin } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

// Type definition for our data
type Talent = {
  id: number;
  name: string;
  role: string;
  location: string;
  phone: string;
  email: string;
  institute: string;
  course: string;
  imageUrl: string;
};

// Varied Mock Data
const data: Talent[] = [
  {
    id: 1,
    name: "Aarav Sharma",
    role: "College Student",
    location: "Mumbai, Maharashtra",
    phone: "+91 98765 43210",
    email: "aarav.sharma@example.com",
    institute: "Indian Institute of Technology, Bombay",
    course: "B.Tech in Computer Science Engineering",
    imageUrl: "https://i.pravatar.cc/150?u=1",
  },
  {
    id: 2,
    name: "Priya Patel",
    role: "Graduate",
    location: "Ahmedabad, Gujarat",
    phone: "+91 87654 32109",
    email: "priya.patel@example.com",
    institute: "National Institute of Design",
    course: "B.Des in Graphic Design",
    imageUrl: "https://i.pravatar.cc/150?u=2",
  },
  {
    id: 3,
    name: "Rahul Verma",
    role: "Intern",
    location: "Bangalore, Karnataka",
    phone: "+91 76543 21098",
    email: "rahul.verma@example.com",
    institute: "RV College of Engineering",
    course: "B.E. in Information Science",
    imageUrl: "https://i.pravatar.cc/150?u=3",
  },
  {
    id: 4,
    name: "Sneha Gupta",
    role: "Job Seeker",
    location: "Delhi, Delhi",
    phone: "+91 65432 10987",
    email: "sneha.gupta@example.com",
    institute: "Delhi Technological University",
    course: "B.Tech in Electronics and Communication",
    imageUrl: "https://i.pravatar.cc/150?u=4",
  },
  {
    id: 5,
    name: "Vikram Singh",
    role: "College Student",
    location: "Jaipur, Rajasthan",
    phone: "+91 54321 09876",
    email: "vikram.singh@example.com",
    institute: "Malaviya National Institute of Technology",
    course: "B.Tech in Mechanical Engineering",
    imageUrl: "https://i.pravatar.cc/150?u=5",
  },
  {
    id: 6,
    name: "Ananya Das",
    role: "Freelancer",
    location: "Kolkata, West Bengal",
    phone: "+91 43210 98765",
    email: "ananya.das@example.com",
    institute: "Jadavpur University",
    course: "B.A. in English Literature",
    imageUrl: "https://i.pravatar.cc/150?u=6",
  },
  {
    id: 7,
    name: "Karthik Reddy",
    role: "College Student",
    location: "Hyderabad, Telangana",
    phone: "+91 32109 87654",
    email: "karthik.reddy@example.com",
    institute: "International Institute of Information Technology",
    course: "B.Tech in Computer Science and Engineering",
    imageUrl: "https://i.pravatar.cc/150?u=7",
  },
];

const columnHelper = createColumnHelper<Talent>();

const columns = [
  columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <div className="flex justify-center">
        <Checkbox
          checked={
            table.getIsAllRowsSelected() ||
            (table.getIsSomeRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
  }),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => (
      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            src={info.row.original.imageUrl}
            alt={info.getValue()}
            className="w-12 h-12 rounded-full object-cover border border-border"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="font-semibold text-base lg:text-lg text-foreground">
            {info.getValue()}
          </span>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="px-2 py-0.5 rounded font-medium bg-[#FFEF99] text-[#8E7700]"
            >
              {info.row.original.role}
            </Badge>
          </div>
        </div>
      </div>
    ),
  }),
  columnHelper.display({
    id: "location",
    header: () => <div className="text-start">Location</div>,
    cell: (info) => (
      <div className="flex flex-col text-start">
        <span className="text-xs text-muted-foreground">
          {info.row.original.location}
        </span>
      </div>
    ),
  }),
  columnHelper.display({
    id: "contact",
    header: () => <div className="text-center">Contact</div>,
    cell: (info) => (
      <div className="flex flex-col text-center">
        <span className="text-xs text-muted-foreground">
          {info.row.original.phone}
        </span>
        <span className="text-xs text-muted-foreground">
          {info.row.original.email}
        </span>
      </div>
    ),
  }),
  columnHelper.accessor("institute", {
    header: () => <div className="text-center">Institute/ College</div>,
    cell: (info) => (
      <div className="text-xs text-muted-foreground text-center line-clamp-3 leading-relaxed px-2">
        {info.getValue()}
      </div>
    ),
  }),
  columnHelper.accessor("course", {
    header: () => <div className="text-center">Course</div>,
    cell: (info) => (
      <div className="text-xs text-muted-foreground text-center line-clamp-3 leading-relaxed px-2">
        {info.getValue()}
      </div>
    ),
  }),
];

export default function TalentPipelinePage() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [tableData, setTableData] = React.useState(data);
  const [searchTerm, setSearchTerm] = React.useState("");

  React.useEffect(() => {
    if (!searchTerm.trim()) return setTableData(data);
    const filteredData = data.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setTableData(filteredData);
  }, [searchTerm]);

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
      <div className="w-full space-y-8">
        {/* Search and Filters */}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <ChevronDown className="w-4 h-4" /> Last 7 Days
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[180px] rounded-xl p-0 text-primary overflow-hidden border-border shadow-lg"
            >
              <DropdownMenuLabel className="p-3 text-sm font-medium hover:bg-muted/50 cursor-pointer text-center">
                Last 7 Days
              </DropdownMenuLabel>

              <DropdownMenuLabel className="p-3 text-sm font-medium hover:bg-muted/50 cursor-pointer text-center">
                Last Month
              </DropdownMenuLabel>

              <DropdownMenuLabel className="p-3 text-sm font-medium hover:bg-muted/50 cursor-pointer text-center">
                Last Year
              </DropdownMenuLabel>

              <DropdownMenuLabel className="p-3 text-sm font-medium hover:bg-muted/50 cursor-pointer text-center">
                Lifetime
              </DropdownMenuLabel>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table Container */}
        <div className="rounded-[24px] border border-border overflow-hidden shadow-sm overflow-x-auto bg-white">
          {/* Header Row */}
          <div className="grid grid-cols-[60px_1.8fr_1.2fr_1.2fr_1.8fr_1.8fr] gap-4 items-center bg-primary/10 p-4 border-b-2 border-primary/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <React.Fragment key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <div
                    key={header.id}
                    className={cn(
                      "text-sm text-foreground"
                      // Alignments based on column ID if needed, though handled in cells
                    )}
                  >
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
          <div className="flex flex-col">
            {table.getRowModel().rows.map((row) => (
              <div
                key={row.id}
                className={cn(
                  "grid grid-cols-[60px_1.8fr_1.2fr_1.2fr_1.8fr_1.8fr] gap-4 p-5 items-center border-b border-border last:border-0 hover:bg-muted/5 transition-colors",
                  "h-auto"
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <div key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            ))}
            {data.length === 0 && (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                No talents found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
