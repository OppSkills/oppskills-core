"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock Data
const admins = [
    {
        id: "1",
        name: "Vijay Kumar",
        email: "vijay@example.com",
        role: "Super Admin",
        status: "Active",
        lastActive: "2 mins ago",
    },
    {
        id: "2",
        name: "Rahul Sharma",
        email: "rahul@example.com",
        role: "Admin",
        status: "Active",
        lastActive: "1 hour ago",
    },
    {
        id: "3",
        name: "Priya Singh",
        email: "priya@example.com",
        role: "Editor",
        status: "Inactive",
        lastActive: "2 days ago",
    },
    {
        id: "4",
        name: "Amit Patel",
        email: "amit@example.com",
        role: "Admin",
        status: "Active",
        lastActive: "5 hours ago",
    },
    {
        id: "5",
        name: "Sneha Gupta",
        email: "sneha@example.com",
        role: "Viewer",
        status: "Active",
        lastActive: "1 day ago",
    },
]

export function AdminList() {
    return (
        <div className="rounded-md border bg-card w-full overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {admins.map((admin) => (
                        <TableRow key={admin.id}>
                            <TableCell className="font-medium">{admin.name}</TableCell>
                            <TableCell>{admin.email}</TableCell>
                            <TableCell>{admin.role}</TableCell>
                            <TableCell>
                                <Badge variant={admin.status === "Active" ? "default" : "secondary"}>
                                    {admin.status}
                                </Badge>
                            </TableCell>
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
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() => console.log(`Delete admin ${admin.id}`)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
