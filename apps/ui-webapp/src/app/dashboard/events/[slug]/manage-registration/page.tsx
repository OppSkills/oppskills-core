"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
} from "@tanstack/react-table";
import { cn, ensureAbsoluteUrl } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  MoreVertical,
  SlidersHorizontal,
  Loader2,
  MailIcon,
  Download,
  Check,
  X,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEventRegistrationsBySlug } from "@/hooks/useEventRegistrationsBySlug";
import type { EventRegistration } from "@/lib/api/eventApi";
import { getParticipantRegistrationAnswers, getEventBySlug, approveParticipant } from "@/lib/api/eventApi";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import SendParticipantEmailModal from "./_components/SendParticipantEmailModal";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportToExcel } from "@/lib/exportToExcel";

/**
 * Profile columns written before merging custom registration form answers.
 * If the form defines fields with the same labels (e.g. "Name", "Email"), merging
 * would overwrite these with empty or stale answers — the dashboard table would
 * still show profile data from the list API. Skip those labels when applying answers.
 */
const EVENT_REGISTRATION_EXPORT_BASE_KEYS = new Set([
  "Name",
  "Email",
  "Gender",
  "University",
  "Course",
  "Location",
  "Status",
  "Registered On",
  "Approved",
  "Pass Sent",
  "Pass Sent At",
  "Approved At",
]);

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
  gender: string | null;
  registeredOn: string;
  approved: boolean;
  passEmailSent: boolean;
  passEmailSentAt?: string;
  approvedAt?: string;
}

// --- Components ---

const StatusBadge = ({ status }: { status: RegistrationStatus }) => {
  const styles =
    status === "Completed"
      ? "bg-primary-100 text-primary-700 text-xs"
      : "bg-destructive text-destructive-foreground-foreground text-xs";

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

export default function ManageRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === "string" ? params.slug : null;

  const {
    data: registrations,
    isLoading,
    error,
  } = useEventRegistrationsBySlug(slug);

  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [activeTab, setActiveTab] = useState<
    "All" | "Completed" | "Incomplete" | "Pending" | "Approved"
  >("All");
  const [emailRecipient, setEmailRecipient] = useState<Participant | null>(
    null
  );
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);

  const handleEmailSuccess = (result: any) => {
    setSuccessAlert(result.message || `Email has been processed successfully`);
    setTimeout(() => setSuccessAlert(null), 10000);
  };

  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { data: eventDetails } = useQuery({
    queryKey: ["event-details", slug],
    queryFn: async () => {
      if (!slug) return null;
      const token = await getToken();
      if (!token) return null;
      return getEventBySlug(token, slug);
    },
    enabled: !!slug,
  });

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
      gender: reg.gender ?? null,
      registeredOn: reg.registeredOn,
      approved: reg.approved ?? false,
      passEmailSent: reg.passEmailSent ?? false,
      passEmailSentAt: reg.passEmailSentAt,
      approvedAt: reg.approvedAt,
    }));
  }, [registrations]);

  const handleApprove = useCallback(async (participantId: string) => {
    if (!slug) return;
    
    setApprovingId(participantId);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }
      
      await approveParticipant(token, slug, participantId);
      toast.success("Participant approved! Event pass is being sent.");
      
      // Refresh the list
      queryClient.invalidateQueries({ queryKey: ['event-registrations-by-slug', slug] });
    } catch (error) {
      console.error('Error approving participant:', error);
      toast.error("Failed to approve participant");
    } finally {
      setApprovingId(null);
    }
  }, [slug, getToken, queryClient]);

  const handleExportRegistrations = useCallback(async () => {
    if (!slug) return;

    if (data.length === 0) {
      toast.info("No registrations to export");
      return;
    }

    setIsExporting(true);
    const exportToastId = toast.loading("Preparing export…");

    try {
      const token = await getToken();
      if (!token) {
        toast.dismiss(exportToastId);
        toast.error("Authentication required");
        return;
      }

      // Fetch per-participant answers in parallel — only for Completed registrations.
      // Incomplete registrations have no submission, so we fall back to base profile data only.
      const answersResults = await Promise.all(
        data.map((p) => {
          if (p.status !== "Completed") return Promise.resolve(null);
          return getParticipantRegistrationAnswers(token, slug, p.id).catch(
            () => null
          );
        })
      );

      // Collect all unique field labels in insertion order
      const allLabels = new Set<string>();
      answersResults.forEach((ans) => {
        if (ans) ans.fields.forEach((f) => allLabels.add(f.label));
      });

      const rows = data.map((p, idx) => {
        const base: Record<string, string | number | boolean | null | undefined> = {
          "Name": p.name,
          "Email": p.email,
          "Gender": p.gender ?? "",
          "University": p.university || "",
          "Course": p.course || "",
          "Location": p.location || "",
          "Status": p.status,
          "Registered On": p.registeredOn
            ? new Date(p.registeredOn).toLocaleString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
            : "",
          "Approved": p.approved ? "Yes" : "No",
          "Pass Sent": p.passEmailSent ? "Yes" : "No",
          "Pass Sent At": p.passEmailSentAt
            ? new Date(p.passEmailSentAt).toLocaleString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
            : "",
          "Approved At": p.approvedAt
            ? new Date(p.approvedAt).toLocaleString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
            : "",
        };

        const ans = answersResults[idx];
        if (ans) {
          for (const label of allLabels) {
            if (EVENT_REGISTRATION_EXPORT_BASE_KEYS.has(label)) {
              continue;
            }
            const field = ans.fields.find((f) => f.label === label);
            if (field) {
              const answer = ans.answers.find((a) => a.fieldId === field.id);
              const val = answer?.value;
              base[label] = Array.isArray(val)
                ? val.join(", ")
                : val !== null && val !== undefined
                ? String(val)
                : "";
            } else {
              base[label] = "";
            }
          }
        } else {
          for (const label of allLabels) {
            if (EVENT_REGISTRATION_EXPORT_BASE_KEYS.has(label)) {
              continue;
            }
            base[label] = "";
          }
        }

        return base;
      });

      exportToExcel({
        rows,
        fileName: `${slug}-registrations.xlsx`,
        sheetName: "Registrations",
      });

      toast.dismiss(exportToastId);
      toast.success(`Exported ${rows.length} registration${rows.length === 1 ? "" : "s"}`);
    } catch (err) {
      console.error("[handleExportRegistrations]", err);
      toast.dismiss(exportToastId);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [slug, data, getToken]);

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
            className="border-background data-[state=checked]:bg-background data-[state=checked]:text-primary"
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
              className="border-muted-foreground/30 data-[state=checked]:bg-primary-500 data-[state=checked]:text-primary-foreground"
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
              <AvatarImage src={ensureAbsoluteUrl(info.row.original.avatarUrl) || undefined} />
              <AvatarFallback>
                {String(info.getValue()).charAt(0)}
              </AvatarFallback>
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
      {
        accessorKey: "passEmailSent",
        header: "Pass Status",
        cell: ({ row }) => {
          const sent = row.original.passEmailSent;
          const approved = row.original.approved;
          
          if (sent) {
            return (
              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                ✓ Pass Sent
              </Badge>
            );
          } else if (approved) {
            return (
              <Badge variant="secondary">
                Approved (Sending...)
              </Badge>
            );
          } else {
            return (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100">
                Pending Approval
              </Badge>
            );
          }
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const participant = row.original;
          const needsApproval = !participant.approved;
          
          return (
            <div className="flex items-center gap-2">
              {needsApproval && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleApprove(participant.id)}
                  disabled={approvingId === participant.id}
                >
                  {approvingId === participant.id ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin mr-1" /> Approving...
                    </>
                  ) : (
                    'Approve'
                  )}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push(`/dashboard/events/${slug}/manage-registration/${participant.id}`)}
              >
                View
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEmailRecipient(participant)}>
                    <MailIcon className="w-4 h-4 mr-2" />
                    Send Email
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [data.length, approvingId, handleApprove]
  );

  const filteredData = useMemo(() => {
    if (activeTab === "All") return data;
    if (activeTab === "Pending") return data.filter((p) => !p.approved);
    if (activeTab === "Approved") return data.filter((p) => p.approved);
    return data.filter((participant) => participant.status === activeTab);
  }, [data, activeTab]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full bg-background min-h-screen p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full bg-background min-h-screen p-8 flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          Error Loading Registrations
        </h1>
        <p className="text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "Failed to load registrations. Please try again."}
        </p>
      </div>
    );
  }

  const completedCount = data.filter((p) => p.status === "Completed").length;
  const incompleteCount = data.filter((p) => p.status === "Incomplete").length;
  const pendingCount = data.filter((p) => !p.approved).length;
  const approvedCount = data.filter((p) => p.approved).length;

  return (
    <div className="w-full bg-background min-h-screen p-8 flex flex-col items-center gap-8">
      {successAlert && (
        <div className="w-full max-w-5xl bg-primary-100 border border-primary-200 text-primary-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
          <div className="p-1 rounded-full bg-primary-200">
            <Check className="w-4 h-4 text-primary-700" />
          </div>
          <span className="text-sm font-semibold">{successAlert}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-auto h-7 w-7 p-0 hover:bg-primary-200 hover:text-primary-700 rounded-full"
            onClick={() => setSuccessAlert(null)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <SendParticipantEmailModal
        isOpen={!!emailRecipient}
        onClose={() => setEmailRecipient(null)}
        onSuccess={(result) => {
          setEmailRecipient(null);
          handleEmailSuccess(result);
        }}
        participant={emailRecipient}
        eventDetails={
          eventDetails
            ? {
              id: (eventDetails as any).id,
              slug: (eventDetails as any).slug,
              name: (eventDetails as any).name,
            }
            : null
        }
      />

      {/* Header Controls */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Select
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as any)
            }
          >
            <SelectTrigger className="w-[200px] h-10 rounded-full bg-primary-50 border-primary-100 text-foreground font-medium focus:ring-1 focus:ring-primary/20">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary-500" />
                <SelectValue placeholder="Filter Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border shadow-lg">
              <SelectItem value="All" className="rounded-lg">All Registrations ({data.length})</SelectItem>
              <SelectItem value="Completed" className="rounded-lg">Completed ({completedCount})</SelectItem>
              <SelectItem value="Incomplete" className="rounded-lg">Incomplete ({incompleteCount})</SelectItem>
              <SelectItem value="Pending" className="rounded-lg">Pending Approval ({pendingCount})</SelectItem>
              <SelectItem value="Approved" className="rounded-lg">Approved ({approvedCount})</SelectItem>
            </SelectContent>
          </Select>
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
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={handleExportRegistrations}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? "Exporting…" : "Export"}
          </Button>
          <button className="p-2 rounded-full border border-border hover:bg-muted text-muted-foreground transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full max-w-5xl rounded-xl overflow-x-auto border border-border/50 shadow-sm">
        <div className="min-w-[800px]">
          {/* Custom Header with Purple Background */}
          <div className="bg-primary-600 text-background px-4 py-3 grid grid-cols-[50px_80px_1fr_150px_150px_200px] items-center text-sm font-medium">
            <div className="flex justify-center">
              <Checkbox
                className="border-background data-[state=checked]:bg-background data-[state=checked]:text-primary-600"
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) =>
                  table.toggleAllPageRowsSelected(!!value)
                }
              />
            </div>
            <div>S. No.</div>
            <div className="flex items-center gap-2">
              {data.length} Participated{" "}
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-end gap-2 text-right">
              <Filter className="w-4 h-4" /> Reg. Status{" "}
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div className="text-center">Pass Status</div>
            <div className="text-center">Actions</div>
          </div>

          {/* Table Body */}
          <div className="bg-background">
            {table.getRowModel().rows.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                No registrations found
              </div>
            ) : (
              table.getRowModel().rows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[50px_80px_1fr_150px_150px_200px] items-center px-4 py-4 border-b border-border/40 hover:bg-muted/5 transition-colors"
                >
                  <div
                    className="flex justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={row.getIsSelected()}
                      onCheckedChange={(value) => row.toggleSelected(!!value)}
                      className="border-muted-foreground/30 data-[state=checked]:bg-primary-600 data-[state=checked]:text-background"
                    />
                  </div>
                  <div className="text-muted-foreground text-sm font-medium pl-2">
                    {row.index + 1}
                  </div>
                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => router.push(`/dashboard/events/${slug}/manage-registration/${row.original.id}`)}>
                    <Avatar className="w-10 h-10 border border-border/50">
                      <AvatarImage
                        src={ensureAbsoluteUrl(row.original.avatarUrl) || undefined}
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
                  <div className="flex justify-center">
                    {(() => {
                      const sent = row.original.passEmailSent;
                      const approved = row.original.approved;
                      
                      if (sent) {
                        return (
                          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                            ✓ Pass Sent
                          </Badge>
                        );
                      } else if (approved) {
                        return (
                          <Badge variant="secondary">
                            Approved (Sending...)
                          </Badge>
                        );
                      } else {
                        return (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100">
                            Pending Approval
                          </Badge>
                        );
                      }
                    })()}
                  </div>
                  <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {!row.original.approved && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprove(row.original.id)}
                        disabled={approvingId === row.original.id}
                      >
                        {approvingId === row.original.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin mr-1" /> Approving...
                          </>
                        ) : (
                          'Approve'
                        )}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/dashboard/events/${slug}/manage-registration/${row.original.id}`)}
                    >
                      View
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEmailRecipient(row.original)}>
                          <MailIcon className="w-4 h-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="w-full max-w-5xl flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} entries
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="text-sm text-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
