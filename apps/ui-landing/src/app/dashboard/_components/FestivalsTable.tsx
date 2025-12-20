"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import ActionDropdown from "./ActionDropdown";

export interface FestivalItem {
  id: string;
  name: string;
  description?: string;
  tag: string;
  status: "Completed" | "In Progress" | "Upcoming";
  startDate: string | Date;
  endDate: string | Date;
  candidates: number;
  registrationOpen: boolean;
}

interface FestivalsTableProps {
  data: FestivalItem[];
  onToggleRegistration?: (id: string, isOpen: boolean) => void;
  onEdit?: (id: string) => void;
}

export default function FestivalsTable({
  data,
  onToggleRegistration,
  onEdit,
}: FestivalsTableProps) {
  return (
    <div className="w-full bg-background rounded-xl border overflow-hidden">
      <Table>
        <TableHeader className="bg-primary text-primary-foreground hover:bg-primary/95">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="text-primary-foreground/90 font-medium w-[80px]">
              S. No.
            </TableHead>
            <TableHead className="text-primary-foreground/90 font-medium">
              Name
            </TableHead>
            <TableHead className="text-primary-foreground/90 font-medium">
              Status
            </TableHead>
            <TableHead className="text-primary-foreground/90 font-medium">
              Start Date
            </TableHead>
            <TableHead className="text-primary-foreground/90 font-medium">
              End Date
            </TableHead>
            <TableHead className="text-primary-foreground/90 font-medium">
              Candidates
            </TableHead>
            <TableHead className="text-primary-foreground/90 font-medium">
              Registration
            </TableHead>
            <TableHead className="text-primary-foreground/90 font-medium text-right pr-6">
              Edit
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={item.id} className="group">
              <TableCell className="font-medium text-muted-foreground pl-4">
                {index + 1}
              </TableCell>
              <TableCell className="py-4">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-base">{item.name}</span>
                  {item.description && (
                    <span className="text-muted-foreground text-xs">
                      {item.description}
                    </span>
                  )}
                  <div className="mt-1">
                    <span className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-sm font-medium">
                      {item.tag}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn(
                    "font-normal pointer-events-none",
                    item.status === "Completed" &&
                      "bg-purple-100 text-purple-700 hover:bg-purple-100",
                    item.status === "In Progress" &&
                      "bg-purple-100 text-purple-700 hover:bg-purple-100", // Matches the screenshot color roughly
                    item.status === "Upcoming" &&
                      "bg-blue-100 text-blue-700 hover:bg-blue-100"
                  )}
                >
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-sm">
                  <span className="font-medium text-foreground">
                    {format(new Date(item.startDate), "dd MMM yy")}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {format(new Date(item.startDate), "hh:mm a")} IST
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-sm">
                  <span className="font-medium text-foreground">
                    {format(new Date(item.endDate), "dd MMM yy")}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {format(new Date(item.endDate), "hh:mm a")} IST
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium text-lg">
                  {item.candidates.toLocaleString()}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={item.registrationOpen}
                    onCheckedChange={(checked) =>
                      onToggleRegistration?.(item.id, checked)
                    }
                    className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
                  />
                  <Badge
                    variant={item.registrationOpen ? "default" : "destructive"}
                    className={cn(
                      "font-normal text-[10px] px-1.5 py-0 h-5",
                      item.registrationOpen
                        ? "bg-green-100 text-green-700 hover:bg-green-100 border-none"
                        : "bg-red-100 text-red-700 hover:bg-red-100 border-none"
                    )}
                  >
                    {item.registrationOpen ? "Open" : "Closed"}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-right pr-4">
                <ActionDropdown
                  onEdit={() => onEdit?.(item.id)}
                  className="border-none hover:bg-muted"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
