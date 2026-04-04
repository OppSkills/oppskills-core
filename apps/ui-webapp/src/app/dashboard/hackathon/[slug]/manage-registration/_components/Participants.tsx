"use client";

import * as React from "react";
import { formatInTimeZone } from "date-fns-tz";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Filter,
  ListFilter,
  ArrowRight,
  Search,
  EllipsisVertical,
  Check,
  X,
  Download,
  Mail,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/derived/FloatingInput";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bulkSetTeamRoundQualification } from "@/lib/api/hackathonApi";
import { getApiErrorMessage } from "@/lib/utils";
import { exportToExcel } from "@/lib/exportToExcel";
import type { HackathonTeamMemberExport } from "@/lib/api/hackathonApi";
import SendTeamEmailModal from "./SendTeamEmailModal";

export type Participant = {
  id: string;
  serialNumber: number;
  teamName: string;
  memberCount: number;
  email: string;
  university: string;
  avatarUrl: string;
  status: "Completed" | "Incomplete";
  currentRound: string;
  qualificationStatus?: "Qualified" | "Not Qualified" | "Awaiting" | null;
  /** For Excel export (team roster) */
  teamCreatedAt: string;
  teamIsOpen: boolean;
  teamInvitationCode: string | null;
  leaderFirstName: string | null;
  leaderLastName: string | null;
  /** Leader mobile from registration form answers */
  leaderPhone: string;
  maxSize: number;
  /** Non-leader members, join order (for member1..memberN columns). */
  teamMembers: HackathonTeamMemberExport[];
};

/* -------------------------- COLUMNS --------------------------- */

interface ParticipantsProps {
  data: Participant[];
  selectedRoundId?: string | null;
  /**
   * The round whose qualification is being set when clicking "Qualify to next round".
   * Example: when viewing R1 tab, nextRoundId should be the R2 id.
   */
  nextRoundId?: string | null;
  hackathonId: string;
  hackathonName: string;
}

export default function Participants({
  data,
  selectedRoundId,
  nextRoundId,
  hackathonId,
  hackathonName,
}: ParticipantsProps) {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [filteredData, setFilteredData] = React.useState(data);
  const [filterValue, setFilteredValue] = React.useState("all");

  const [selectedTeamForEmail, setSelectedTeamForEmail] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [successAlert, setSuccessAlert] = React.useState<string | null>(null);

  const handleEmailSuccess = (result: any) => {
    setSuccessAlert(result.message || `Email has been processed to all the members of ${selectedTeamForEmail?.name}`);
    setTimeout(() => setSuccessAlert(null), 10000); // Hide after 10 seconds
  };

  const { mutate: bulkQualify, isPending } = useMutation({
    mutationFn: async ({
      teamIds,
      qualified,
    }: {
      teamIds: string[];
      qualified: boolean;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      if (!selectedRoundId) throw new Error("No round selected");
      if (!nextRoundId) throw new Error("No next round available");
      return bulkSetTeamRoundQualification(
        token,
        slug,
        nextRoundId,
        teamIds,
        qualified,
      );
    },
    onSuccess: () => {
      toast.success("Teams updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["hackathon-registrations-by-slug", slug],
      });
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update teams"));
    },
  });

  const handleExportParticipants = React.useCallback(() => {
    if (filteredData.length === 0) {
      toast.info("No participants to export");
      return;
    }

    try {
      const rows: Record<string, string | number | boolean>[] = [];
      filteredData.forEach((p) => {
        // 1. Leader
        rows.push({
          "Team Name": p.teamName,
          "Name": [p.leaderFirstName, p.leaderLastName].filter(Boolean).join(" ") || "—",
          "Email": p.email,
          "Mobile Number": p.leaderPhone || "",
          "Participant Type": "Leader",
          "University": p.university || "—",
          "Team Registration Status": p.status,
          "Team Created At": p.teamCreatedAt
            ? formatInTimeZone(new Date(p.teamCreatedAt), "Asia/Kolkata", "dd/MM/yyyy HH:mm:ss")
            : "—",
        });

        // 2. Members
        p.teamMembers.forEach((m) => {
          rows.push({
            "Team Name": p.teamName,
            "Name": [m.firstName, m.lastName].filter(Boolean).join(" ") || "—",
            "Email": m.email,
            "Mobile Number": m.phone || "",
            "Participant Type": "Member",
            "University": "—", // Currently not in HackathonTeamMemberExport
            "Team Registration Status": p.status,
            "Team Created At": p.teamCreatedAt
              ? formatInTimeZone(new Date(p.teamCreatedAt), "Asia/Kolkata", "dd/MM/yyyy HH:mm:ss")
              : "—",
          });
        });
      });

      exportToExcel({
        rows,
        fileName: `${slug}-teams.xlsx`,
        sheetName: "Teams",
      });

      toast.success(`Exported ${rows.length} team${rows.length === 1 ? "" : "s"}`);
    } catch (err) {
      console.error("[handleExportParticipants]", err);
      toast.error("Export failed. Please try again.");
    }
  }, [filteredData, slug]);

  const columns: ColumnDef<Participant>[] = React.useMemo(
    () => [
      {
        accessorKey: "serialNumber",
        header: () => (
          <span className="text-primary-foreground flex  justify-center">
            S. No.
          </span>
        ),
        cell: ({ getValue }) => (
          <div className="text-center">{getValue<number>()}</div>
        ),
      },
      {
        accessorKey: "teamName",
        header: () => (
          <div className="flex items-center gap-2 text-primary-foreground">
            <span>{data.length} Teams Participated</span>
            <Image
              alt="Arrange Order"
              src="/icons/order.svg"
              width={24}
              height={24}
            />
          </div>
        ),
        cell: ({ row }) => {
          const { avatarUrl, teamName, memberCount, email, leaderPhone } =
            row.original;

          return (
            <div className="flex gap-4 py-2">
              <Avatar className="h-12 w-12">
                <AvatarImage src={avatarUrl} alt={teamName} />
                <AvatarFallback>
                  {teamName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className="font-semibold hover:text-primary-500 cursor-pointer break-words"
                    onClick={() => {
                      router.push(
                        `/dashboard/hackathon/${slug}/manage-registration/${row.original.id}`,
                      );
                    }}
                  >
                    {teamName}
                  </span>
                  <span className="rounded-sm bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                    {memberCount} Members Joined
                  </span>
                </div>
                <span className="text-xs text-muted-foreground break-all">{email}</span>
                <span className="text-xs text-muted-foreground">{leaderPhone}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: () => (
          <div className="flex items-center justify-center gap-2 text-primary-foreground">
            <Filter className="h-4 w-4" />
            <span>Reg. Status</span>
            <Image
              alt="Arrange Order"
              src="/icons/order.svg"
              width={24}
              height={24}
            />
          </div>
        ),
        cell: ({ getValue }) => {
          const status = getValue<Participant["status"]>();

          return (
            <div className="flex justify-center">
              <span
                className={`rounded-xs px-4 py-1 text-xs ${status === "Completed"
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/10 text-destructive-foreground"
                  }`}
              >
                {status}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "currentRound",
        header: () => (
          <div className="text-center text-primary-foreground">
            Action / Status
          </div>
        ),
        cell: ({ getValue, row }) => {
          const qualStatus = row.original.qualificationStatus;
          const teamId = row.original.id;

          return (
            <div className="flex items-center justify-center gap-2">
              {selectedRoundId && nextRoundId ? (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                    disabled={isPending || qualStatus === "Qualified"}
                    onClick={(e) => {
                      e.stopPropagation();
                      bulkQualify({ teamIds: [teamId], qualified: true });
                    }}
                    title="Qualify to next round"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={isPending || qualStatus === "Not Qualified"}
                    onClick={(e) => {
                      e.stopPropagation();
                      bulkQualify({ teamIds: [teamId], qualified: false });
                    }}
                    title="Disqualify from next round"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  {qualStatus && (
                    <span
                      className={`ml-1 px-2 py-0.5 rounded-full text-xs border ${qualStatus === "Qualified"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : qualStatus === "Not Qualified"
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-yellow-200 bg-yellow-50 text-yellow-700"
                        }`}
                    >
                      {qualStatus}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {getValue<string>()}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "emailTeam",
        header: () => (
          <div className="text-center text-primary-foreground">
            Email
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTeamForEmail({
                  id: row.original.id,
                  name: row.original.teamName,
                });
              }}
              title="Send email to team"
            >
              <Mail className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    [
      bulkQualify,
      data.length,
      isPending,
      nextRoundId,
      router,
      selectedRoundId,
      slug,
    ],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  React.useEffect(() => {
    if (filterValue == "all") setFilteredData(data);
    else if (filterValue == "completed")
      setFilteredData(data.filter((item) => item.status == "Completed"));
    else if (filterValue == "incomplete")
      setFilteredData(data.filter((item) => item.status == "Incomplete"));
  }, [filterValue, data]);

  return (
    <div className="w-full space-y-4">
      {successAlert && (
        <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-1 rounded-full bg-primary/20">
            <Check className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">{successAlert}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-auto h-7 w-7 p-0 hover:bg-primary/20 hover:text-primary rounded-full"
            onClick={() => setSuccessAlert(null)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* HEADER */}
      <div className="flex w-full flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-wrap gap-2 items-center">
          {(() => {
            const total = data.length;
            const completedCount = data.filter((d) => d.status === 'Completed').length;
            const incompleteCount = data.filter((d) => d.status === 'Incomplete').length;
            return (
              <>
                <Button
                  size="sm"
                  className="border-2"
                  onClick={() => setFilteredValue("all")}
                  variant={filterValue === "all" ? "default" : "outline"}
                >
                  All ({total})
                </Button>
                <Button
                  size="sm"
                  className="border-2"
                  onClick={() => setFilteredValue("completed")}
                  variant={filterValue === "completed" ? "default" : "outline"}
                >
                  Completed ({completedCount})
                </Button>
                <Button
                  size="sm"
                  className="border-2"
                  onClick={() => setFilteredValue("incomplete")}
                  variant={filterValue === "incomplete" ? "default" : "outline"}
                >
                  Incomplete ({incompleteCount})
                </Button>
              </>
            );
          })()}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-auto">
            <FloatingInput
              className="w-full rounded-full md:min-w-sm"
              placeholder="Search"
            />
            <div className="absolute flex right-3 top-1/2 -translate-y-1/2">
              <Search className="text-foreground/30" />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 shrink-0"
            onClick={handleExportParticipants}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <div className="px-2">
            <div className="rounded-full w-8 h-8 border flex justify-center items-center cursor-pointer hover:bg-muted">
              <EllipsisVertical className="w-4 h-4 text-foreground/30" />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-xl border border-surface bg-primary-foreground shadow-sm">
        <Table className="min-w-[800px]">
          <TableHeader className="sticky top-0 z-10 bg-primary">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="border-none">
                {group.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-12 text-primary-foreground first:rounded-tl-xl last:rounded-tr-xl"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-gray-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
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
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedTeamForEmail && (
        <SendTeamEmailModal
          isOpen={!!selectedTeamForEmail}
          onClose={() => setSelectedTeamForEmail(null)}
          teamId={selectedTeamForEmail.id}
          teamName={selectedTeamForEmail.name}
          hackathonId={hackathonId}
          hackathonName={hackathonName}
          slug={slug}
          onSuccess={handleEmailSuccess}
        />
      )}
    </div>
  );
}
