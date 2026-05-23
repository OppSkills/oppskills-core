"use client";

import { useState } from "react";
import { deleteAdmin } from "@/lib/api/actions";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Admin {
  id: string;
  name: string;
  email: string;
  immutable: boolean;
  isFirstLogin: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminListProps {
  initialAdmins: Admin[];
  currentUserImmutable: boolean;
  onRefresh?: () => void;
}

export function AdminList({
  initialAdmins,
  currentUserImmutable,
  onRefresh,
}: AdminListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAdmin(id);
      toast.success("Admin deleted successfully");
      onRefresh?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete admin");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-md border bg-card w-full overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            {currentUserImmutable && (
              <TableHead className="text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialAdmins.map((admin) => (
            <TableRow
              key={admin.id}
              className={cn(
                admin.immutable &&
                  "bg-yellow-50/50 hover:bg-yellow-50/80 border-l-4 border-l-yellow-400",
              )}
            >
              <TableCell className="font-medium">
                <span
                  className={cn(
                    admin.immutable && "text-yellow-700 font-semibold",
                  )}
                >
                  {admin.name}
                </span>
              </TableCell>
              <TableCell>{admin.email}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    admin.immutable && "text-yellow-600 font-medium",
                  )}
                >
                  {admin.immutable ? "Super Admin" : "Admin"}
                </span>
              </TableCell>
              <TableCell>
                <Badge
                  variant={admin.immutable ? "outline" : "default"}
                  className={cn(
                    admin.immutable &&
                      "border-yellow-200 bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
                  )}
                >
                  {admin.isFirstLogin ? "Inactive" : "Active"}
                </Badge>
              </TableCell>
              {currentUserImmutable && (
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => console.log(`Edit admin ${admin.id}`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />

                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuLabel>Are you sure?</DropdownMenuLabel>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(admin.id);
                            }}
                            disabled={deletingId === admin.id}
                          >
                            <AlertCircle className="mr-2 h-4 w-4" />
                            {deletingId === admin.id
                              ? "Deleting..."
                              : "Confirm Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
