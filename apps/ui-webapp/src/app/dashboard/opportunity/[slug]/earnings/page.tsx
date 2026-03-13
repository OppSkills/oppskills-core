"use client";

import { useParams } from "next/navigation";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  DollarSign,
  CreditCard,
  MoreHorizontal,
  RefreshCw,
  Search,
  Download,
  Filter,
} from "lucide-react";
import {
  useHackathonEarnings,
  useHackathonPayments,
  useRequestRefund,
} from "@/hooks/usePayments";
import { toast } from "sonner";
import { useState } from "react";

export default function EarningsPage() {
  const params = useParams();
  const slugParam = params?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: earnings,
    isLoading: isLoadingEarnings,
    refetch: refetchEarnings,
  } = useHackathonEarnings(slug ?? "");

  const {
    data: payments,
    isLoading: isLoadingPayments,
    refetch: refetchPayments,
  } = useHackathonPayments(slug ?? "");

  const requestRefundMutation = useRequestRefund(slug ?? "");

  if (!slug) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Invalid hackathon</p>
      </div>
    );
  }

  const handleRefund = async (paymentId: string) => {
    if (
      confirm(
        "Are you sure you want to refund this payment? This action cannot be undone.",
      )
    ) {
      try {
        await requestRefundMutation.mutateAsync({
          paymentId,
          reason: "Refund requested by organizer",
        });
        toast.success("Refund initiated successfully");
      } catch (error) {
        toast.error("Failed to initiate refund");
        console.error(error);
      }
    }
  };

  const filteredPayments = payments?.filter((payment) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      payment.payerName?.toLowerCase().includes(searchLower) ||
      payment.payerEmail?.toLowerCase().includes(searchLower) ||
      payment.id.toLowerCase().includes(searchLower)
    );
  });

  const isLoading = isLoadingEarnings || isLoadingPayments;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Earnings & Transactions
          </h1>
          <p className="text-muted-foreground">
            Monitor your revenue and manage transaction details.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            refetchEarnings();
            refetchPayments();
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {earnings?.currency} {earnings?.totalGross}
            </div>
            <p className="text-xs text-muted-foreground">
              Gross volume from {earnings?.capturedPaymentsCount} payments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Earnings</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {earnings?.currency} {earnings?.totalOrganizerShare}
            </div>
            <p className="text-xs text-muted-foreground">
              After platform fees ({earnings?.totalPlatformFee})
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transactions
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {earnings?.capturedPaymentsCount}
            </div>
            <p className="text-xs text-muted-foreground">Successful payments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            A list of all payments and refunds for this hackathon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-4">
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Net Share</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments && filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="font-medium">{payment.payerName}</div>
                        <div className="text-sm text-muted-foreground">
                          {payment.payerEmail}
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.capturedAt
                          ? format(new Date(payment.capturedAt), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {payment.currency} {payment.grossAmount}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {payment.currency} {payment.organizerShareAmount}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.paymentStatus === "CAPTURED"
                              ? "default"
                              : payment.paymentStatus === "REFUNDED"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {payment.paymentStatus}
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
                              onClick={() =>
                                navigator.clipboard.writeText(payment.id)
                              }
                            >
                              Copy Payment ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {payment.paymentStatus === "CAPTURED" && (
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleRefund(payment.id)}
                              >
                                Issue Refund
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No payments found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
