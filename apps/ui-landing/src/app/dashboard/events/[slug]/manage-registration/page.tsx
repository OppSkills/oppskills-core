"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  ColumnDef,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search, Filter, MoreVertical, SlidersHorizontal, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEventRegistrationsBySlug } from "@/hooks/useEventRegistrationsBySlug";
import type { EventRegistration } from "@/lib/api/eventApi";

// --- Types ---
type RegistrationStatus = "Completed" | "Incomplete";

interface Participant {
  id: string;
  name: string;
  email: string;
  university: string;
  avatarUrl: string | null;
  status: RegistrationStatus;
  location: string;
  course: string;
  registeredOn: string;
}

// --- Components ---

const StatusBadge = ({ status }: { status: RegistrationStatus }) => {
  const styles =
    status === "Completed"
      ? "bg-primary-100 text-primary-700"
      : "bg-destructive text-destructive-foreground-foreground";

  return (
    <div
      className={cn(
        "px-3 py-1.5 rounded-lg inline-flex items-center justify-center min-w-[80px]",
        styles
      )}
    >
      {status}
    </div>
  );
};

// --- User Detail Modal ---
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  Mail,
  MapPin,
  GraduationCap,
  CalendarDays,
  X,
} from "lucide-react";

const UserDetailModal = ({
  participant,
  isOpen,
  onClose,
}: {
  participant: Participant | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!participant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[700px] p-0 overflow-hidden rounded-[20px] border-none bg-white">
        <div className="flex flex-col p-6 sm:p-8 gap-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar */}
            <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-white shadow-lg">
              <AvatarImage
                src={participant.avatarUrl || undefined}
                className="object-cover"
              />
              <AvatarFallback className="text-2xl">
                {participant.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex flex-col gap-3 flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                {participant.name}
              </h2>

              <div className="flex flex-col gap-2.5 mt-1">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Building2 className="w-4 h-4 translate-y-[1px]" />
                  <span className="text-sm font-medium">
                    {participant.university || "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Mail className="w-4 h-4 translate-y-[1px]" />
                  <span className="text-sm font-medium">
                    {participant.email}
                  </span>
                </div>

                {participant.location && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <MapPin className="w-4 h-4 translate-y-[1px]" />
                    <span className="text-sm font-medium">
                      {participant.location}
                    </span>
                  </div>
                )}

                {participant.course && (
                  <div className="flex items-start gap-2.5 text-muted-foreground">
                    <GraduationCap className="w-4 h-4 translate-y-[3px] shrink-0" />
                    <span className="text-sm font-medium leading-relaxed">
                      {participant.course}
                    </span>
                  </div>
                )}

                {participant.registeredOn && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <CalendarDays className="w-4 h-4 translate-y-[1px]" />
                    <span className="text-sm font-medium">
                      Registered on: {new Date(participant.registeredOn).toLocaleString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function ManageRegistrationPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : null;

  const { data: registrations, isLoading, error } = useEventRegistrationsBySlug(slug);

  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [activeTab, setActiveTab] = useState<
    "All" | "Completed" | "Incomplete"
  >("All");
  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(null);

  const data: Participant[] = useMemo(() => {
    if (!registrations) return [];
    return registrations.map((reg) => ({
      id: reg.id,
      name: reg.name,
      email: reg.email,
      university: reg.university,
      avatarUrl: reg.avatarUrl,
      status: reg.status,
      location: reg.location,
      course: reg.course,
      registeredOn: reg.registeredOn,
    }));
  }, [registrations]);

  const columns = useMemo<ColumnDef<Participant>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
            className="border-white data-[state=checked]:bg-white data-[state=checked]:text-primary"
          />
        ),
        cell: ({ row }) => (
          <div
            onClick={(e) => e.stopPropagation()} // Prevent row click when selecting
          >
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
              className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "sno",
        header: () => <span>S. No.</span>,
        cell: (info) => (
          <span className="text-muted-foreground">{info.row.index + 1}</span>
        ),
      },
      {
        accessorKey: "name",
        header: () => (
          <div className="flex items-center gap-2 cursor-pointer">
            {data.length} Participated{" "}
            <SlidersHorizontal className="w-4 h-4 ml-2" />
          </div>
        ),
        cell: (info) => (
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={info.row.original.avatarUrl || undefined} />
              <AvatarFallback>{String(info.getValue()).charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground text-sm">
                {String(info.getValue())}
              </span>
              <span className="text-xs text-muted-foreground">
                {info.row.original.email}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">
                {info.row.original.university || "N/A"}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => (
          <div className="flex items-center gap-2 cursor-pointer justify-end">
            <Filter className="w-4 h-4" /> Reg. Status{" "}
            <SlidersHorizontal className="w-4 h-4" />
          </div>
        ),
        cell: (info) => (
          <div className="flex justify-end">
            <StatusBadge status={info.getValue() as RegistrationStatus} />
          </div>
        ),
      },
    ],
    [data.length]
  );

  const filteredData = useMemo(() => {
    if (activeTab === "All") return data;
    return data.filter((participant) => participant.status === activeTab);
  }, [data, activeTab]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      rowSelection,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full bg-white min-h-screen p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full bg-white min-h-screen p-8 flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Error Loading Registrations</h1>
        <p className="text-muted-foreground">
          {error instanceof Error ? error.message : "Failed to load registrations. Please try again."}
        </p>
      </div>
    );
  }

  const completedCount = data.filter(p => p.status === "Completed").length;
  const incompleteCount = data.filter(p => p.status === "Incomplete").length;

  return (
    <div className="w-full bg-white min-h-screen p-8 flex flex-col items-center gap-8">
      {/* Modal */}
      <UserDetailModal
        isOpen={!!selectedParticipant}
        onClose={() => setSelectedParticipant(null)}
        participant={selectedParticipant}
      />

      {/* Header Controls */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          {[
            {
              label: `All (${data.length})`,
              value: "All",
            },
            {
              label: `Completed (${completedCount})`,
              value: "Completed",
            },
            {
              label: `Incomplete (${incompleteCount})`,
              value: "Incomplete",
            },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as "All" | "Completed" | "Incomplete")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                activeTab === tab.value
                  ? "bg-primary-500 text-primary-foreground"
                  : "bg-primary-100 text-foreground hover:bg-primary-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Input
              placeholder="Search"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-4 pr-10 rounded-full border-border bg-background w-[300px] focus:ring-1 focus:ring-primary/20 transition-all"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          <button className="p-2 rounded-full border border-border hover:bg-muted text-muted-foreground transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full max-w-5xl rounded-xl overflow-x-auto border border-border/50 shadow-sm">
        <div className="min-w-[800px]">
          {/* Custom Header with Purple Background */}
          <div className="bg-primary-600 text-white px-4 py-3 grid grid-cols-[50px_80px_1fr_200px] items-center text-sm font-medium">
            <div className="flex justify-center">
              <Checkbox
                className="border-white data-[state=checked]:bg-white data-[state=checked]:text-primary-600"
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) =>
                  table.toggleAllPageRowsSelected(!!value)
                }
              />
            </div>
            <div>S. No.</div>
            <div className="flex items-center gap-2">
              {data.length} Participated <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-end gap-2 text-right">
              <Filter className="w-4 h-4" /> Reg. Status{" "}
              <SlidersHorizontal className="w-4 h-4" />
            </div>
          </div>

          {/* Table Body */}
          <div className="bg-white">
            {table.getRowModel().rows.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                No registrations found
              </div>
            ) : (
              table.getRowModel().rows.map((row) => (
                <div
                  key={row.id}
                  onClick={() => setSelectedParticipant(row.original)}
                  className="grid grid-cols-[50px_80px_1fr_200px] items-center px-4 py-4 border-b border-border/40 hover:bg-muted/5 transition-colors cursor-pointer"
                >
                  <div
                    className="flex justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={row.getIsSelected()}
                      onCheckedChange={(value) => row.toggleSelected(!!value)}
                      className="border-muted-foreground/30 data-[state=checked]:bg-primary-600 data-[state=checked]:text-white"
                    />
                  </div>
                  <div className="text-muted-foreground text-sm font-medium pl-2">
                    {row.index + 1}
                  </div>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-10 h-10 border border-border/50">
                      <AvatarImage
                        src={row.original.avatarUrl || undefined}
                        className="object-cover"
                      />
                      <AvatarFallback>
                        {row.original.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-foreground">
                        {row.original.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {row.original.email}
                      </span>
                      <span className="text-[11px] text-muted-foreground/70">
                        {row.original.university || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <StatusBadge status={row.original.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
