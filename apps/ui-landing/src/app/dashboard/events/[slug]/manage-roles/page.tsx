"use client";

import React from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { UserPlus, Trash2, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type RoleUser = {
  id: string;
  name: string;
  email: string;
  role: "Organizer" | "Moderator" | "Check-in Staff";
  avatarUrl?: string;
};

const MOCK_USERS: RoleUser[] = [
  {
    id: "1",
    name: "John Admin",
    email: "john@oppskills.com",
    role: "Organizer",
  },
  {
    id: "2",
    name: "Sarah Staff",
    email: "sarah@oppskills.com",
    role: "Check-in Staff",
  },
  {
    id: "3",
    name: "Mike Moderator",
    email: "mike@oppskills.com",
    role: "Moderator",
  },
];

const columnHelper = createColumnHelper<RoleUser>();

const columns = [
  columnHelper.accessor("name", {
    header: "User",
    cell: (info) => (
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={info.row.original.avatarUrl} />
          <AvatarFallback>{info.row.original.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium">{info.getValue()}</span>
          <span className="text-xs text-muted-foreground">
            {info.row.original.email}
          </span>
        </div>
      </div>
    ),
  }),
  columnHelper.accessor("role", {
    header: "Role",
    cell: (info) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: () => (
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
        >
          <Mail className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    ),
  }),
];

export default function ManageRolesPage() {
  const [data] = React.useState(MOCK_USERS);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full bg-neutral-200 min-h-screen p-6 flex justify-center">
      <div className="w-full max-w-4xl bg-background rounded-2xl p-6 shadow-sm flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold font-poppins">
              Manage Roles
            </h1>
            <p className="text-muted-foreground text-sm">
              Assign roles and permissions to your team.
            </p>
          </div>
          <Button className="rounded-full gap-2">
            <UserPlus className="w-4 h-4" /> Invite Member
          </Button>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground font-medium">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="p-4">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-muted/10 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
