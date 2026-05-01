"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  ColumnDef,
} from "@tanstack/react-table";
import { cn, ensureAbsoluteUrl } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  SlidersHorizontal,
  Loader2,
  MailIcon,
  Download,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEventRegistrationsBySlug } from "@/hooks/useEventRegistrationsBySlug";
import { getParticipantRegistrationAnswers, getBulkParticipantRegistrationAnswers, getEventBySlug, approveParticipant, bulkApproveParticipants, markParticipantAttendance } from "@/lib/api/eventApi";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import SendParticipantEmailModal from "./_components/SendParticipantEmailModal";
import { ParticipantRegistrationDetailsSheet } from "./_components/ParticipantRegistrationDetailsSheet";
import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { TableBlockFallback } from "@/components/boneyard/loading-fallbacks";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportToExcel } from "@/lib/exportToExcel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/common/Pagination";
import { CheckCircle } from "@solar-icons/react";

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
  isAttended: boolean;
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
  const slug = typeof params.slug === "string" ? params.slug : null;

  const [page, setPage] = useState(1);
  const [take, setTake] = useState(20);

  const {
    data: paginatedData,
    isLoading,
    error,
  } = useEventRegistrationsBySlug(slug, { page, take });

  const registrations = paginatedData?.items || [];
  const total = paginatedData?.total || 0;
  const totalPages = paginatedData?.totalPages || 0;

  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [activeTab, setActiveTab] = useState<
    "All" | "Completed" | "Incomplete" | "Pending" | "Approved"
  >("All");
  const [emailRecipient, setEmailRecipient] = useState<Participant | null>(
    null
  );
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [markingAttendanceId, setMarkingAttendanceId] = useState<string | null>(null);
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
      return (await getEventBySlug(token, slug)) as { id: string; slug: string; name: string };
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
      isAttended: reg.isAttended ?? false,
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

  const handleMarkAttendance = useCallback(async (participantId: string) => {
    if (!eventDetails?.id) return;

    setMarkingAttendanceId(participantId);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      await markParticipantAttendance(token, eventDetails.id, participantId);
      toast.success("Attendance marked successfully!");

      // Refresh the list
      queryClient.invalidateQueries({ queryKey: ['event-registrations-by-slug', slug] });
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error("Failed to mark attendance");
    } finally {
      setMarkingAttendanceId(null);
    }
  }, [slug, eventDetails?.id, getToken, queryClient]);

  const { mutate: handleBulkApprove, isPending: isBulkApproving } = useMutation({
    mutationFn: async (participantIds: string[]) => {
      const token = await getToken();
      if (!token || !slug) throw new Error("Missing requirements");
      return bulkApproveParticipants(token, slug, participantIds);
    },
    onSuccess: () => {
      toast.success("Selected participants approved! Passes are being sent.");
      setRowSelection({});
      queryClient.invalidateQueries({ queryKey: ['event-registrations-by-slug', slug] });
    },
    onError: (err) => {
      console.error("Bulk approval error:", err);
      toast.error("Failed to approve participants");
    }
  });


  const filteredData = useMemo(() => {
    if (activeTab === "All") return data;
    if (activeTab === "Pending") return data.filter((p) => !p.approved);
    if (activeTab === "Approved") return data.filter((p) => p.approved);
    return data.filter((participant) => participant.status === activeTab);
  }, [data, activeTab]);

  const columns = useMemo<ColumnDef<Participant>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex justify-center">
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Select all"
              className="border-background data-[state=checked]:bg-background data-[state=checked]:text-primary"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div
            className="flex justify-center"
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
          <div
            className="flex items-center gap-3 cursor-pointer group/name"
            onClick={() => setSelectedParticipant(info.row.original)}
          >
            <Avatar className="w-10 h-10 group-hover/name:ring-2 group-hover/name:ring-primary-500 transition-all">
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
          <div className="flex items-center gap-2 cursor-pointer justify-center">
            <Filter className="w-4 h-4" /> Reg. Status{" "}
            <SlidersHorizontal className="w-4 h-4" />
          </div>
        ),
        cell: (info) => (
          <div className="flex justify-center">
            <StatusBadge status={info.getValue() as RegistrationStatus} />
          </div>
        ),
      },
      {
        accessorKey: "passEmailSent",
        header: "Pass Status",
        cell: ({ row }) => {
          const sent = row.original.passEmailSent;

          if (sent) {
            return (
              <Badge variant="outline" className="bg-accent-green-100 text-accent-green-500 border-none whitespace-nowrap p-1 rounded-sm">
                Pass Sent
              </Badge>
            );
          } else {
            return (
              <Badge variant="outline" className="bg-accent-pink-100 text-accent-pink-500 border-none hover:bg-accent-pink-100 whitespace-nowrap">
                Not Sent
              </Badge>
            );
          }
        },
      },
      {
        id: "attendance",
        header: "Attendance",
        cell: ({ row }) => {
          const participant = row.original;
          const isAttended = participant.isAttended;
          const isMarking = markingAttendanceId === participant.id;

          return (
            <div className="flex items-center justify-center gap-2">
              {isAttended ? (
                <Badge variant="outline" className="bg-accent-green-100 text-accent-green-500 border-none whitespace-nowrap py-1 rounded-sm">
                  Already Presented
                </Badge>
              ) : (
                <Button
                  size="sm"
                  className="whitespace-nowrap bg-primary-700 text-neutral-100 flex gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAttendance(participant.id);
                  }}
                  disabled={isMarking || !participant.approved}
                  title={!participant.approved ? "Approve participant first" : "Mark as present"}
                >
                  {isMarking ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin mr-1" /> Marking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3" />Mark present
                    </>
                  )}
                </Button>
              )}

              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                {!participant.approved && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleApprove(participant.id)}
                    disabled={approvingId === participant.id}
                    className="mr-2"
                  >
                    {approvingId === participant.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      'Approve'
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const participant = row.original;
          return (
            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary-100 hover:text-primary-700 rounded-full"
                onClick={() => setEmailRecipient(participant)}
                title="Send Email"
              >
                <MailIcon className="w-4 h-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [data.length, approvingId, markingAttendanceId, handleApprove, handleMarkAttendance, slug]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      rowSelection,
      globalFilter,
    },
    manualPagination: true,
    pageCount: totalPages,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const canBulkApprove = selectedRows.length > 0 && selectedRows.every(row => !row.original.approved);
  const selectedCount = selectedRows.length;

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

      // Fetch per-participant answers in bulk for performance
      const allAnswersResults = await getBulkParticipantRegistrationAnswers(token, slug);

      // Create a map by participant ID for quick lookup
      const answersByParticipantId = new Map<string, any>();
      allAnswersResults.forEach((ans) => {
        if (ans && ans.participant && ans.participant.id) {
          answersByParticipantId.set(ans.participant.id, ans);
        }
      });

      // Collect all unique field labels in insertion order
      const allLabels = new Set<string>();
      allAnswersResults.forEach((ans) => {
        if (ans) ans.fields.forEach((f: any) => allLabels.add(f.label));
      });

      const rows = data.map((p) => {
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

        const ans = answersByParticipantId.get(p.id);
        if (ans) {
          for (const label of allLabels) {
            if (EVENT_REGISTRATION_EXPORT_BASE_KEYS.has(label)) {
              continue;
            }
            const field = ans.fields.find((f: any) => f.label === label);
            if (field) {
              const answer = ans.answers.find((a: any) => a.fieldId === field.id);
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



  // Error state
  if (!isLoading && error) {
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
    <BoneyardSkeleton
      loading={isLoading}
      name="dashboard-event-manage-registration"
      className="w-full min-h-screen bg-background"
      fallback={
        <TableBlockFallback className="min-h-screen bg-background p-8" />
      }
    >
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
                id: eventDetails.id,
                slug: eventDetails.slug,
                name: eventDetails.name,
              }
              : null
          }
        />

        <ParticipantRegistrationDetailsSheet
          participant={selectedParticipant}
          slug={slug || ""}
          onClose={() => setSelectedParticipant(null)}
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

            {canBulkApprove && (
              <Button
                variant="default"
                size="sm"
                className="bg-primary-600 hover:bg-primary-700 text-white rounded-full px-4 flex items-center gap-2 animate-in zoom-in duration-200"
                onClick={() => handleBulkApprove(selectedRows.map(r => r.original.id))}
                disabled={isBulkApproving}
              >
                {isBulkApproving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {isBulkApproving ? "Approving..." : `Approve All (${selectedCount})`}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 rounded-full h-10 border-border bg-background hover:bg-muted"
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
          </div>
        </div>

        {/* Table Container */}
        <div className="w-full max-w-5xl bg-white rounded-xl shadow-sm border border-neutral-300 overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[1000px] w-full border border-neutral-300">
              <TableHeader className="bg-primary-800">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="text-neutral-100 font-normal text-sm whitespace-nowrap py-3 border-r border-white/30 last:border-r-0"
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
                      className="border-b border-neutral-300 hover:bg-neutral-50 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="py-4 px-4 border-r border-neutral-300 last:border-r-0"
                        >
                          <div className={cell.column.id === 'name' ? 'text-left' : 'text-center'}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
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
          <div className="px-4">
            <Pagination
              curPage={page}
              totalPages={totalPages}
              setPerPage={(size) => {
                setTake(Number(size));
                setPage(1);
              }}
              perPage={take}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>
      </div>
    </BoneyardSkeleton>
  );
}
