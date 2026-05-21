"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { getHackathons, getEvents, getPayments } from "@/lib/api/actions";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface PaymentItem {
  id: string;
  user: string;
  userEmail: string;
  amount: string;
  date: string;
  status: string;
  type: "Hackathon" | "Event";
  itemName: string;
  itemSlug: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
}

type FeatureOption = { id: string; name: string; slug: string };

const NONE_VALUE = "__none__";

async function fetchAllHackathonOptions(): Promise<FeatureOption[]> {
  const out: FeatureOption[] = [];
  let cursor: string | undefined;
  let hasMore = true;
  while (hasMore) {
    const res = await getHackathons(100, cursor, false);
    const {
      data,
      nextCursor,
      hasMore: more,
    } = res.data as {
      data: FeatureOption[];
      nextCursor: string | null;
      hasMore: boolean;
    };
    out.push(...data);
    hasMore = more;
    cursor = nextCursor ?? undefined;
    if (!more) break;
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchAllEventOptions(): Promise<FeatureOption[]> {
  const out: FeatureOption[] = [];
  let cursor: string | undefined;
  let hasMore = true;
  while (hasMore) {
    const res = await getEvents(100, cursor, false);
    const {
      data,
      nextCursor,
      hasMore: more,
    } = res.data as {
      data: FeatureOption[];
      nextCursor: string | null;
      hasMore: boolean;
    };
    out.push(...data);
    hasMore = more;
    cursor = nextCursor ?? undefined;
    if (!more) break;
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export function PaymentsTable() {
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const observer = useRef<IntersectionObserver | null>(null);

  const [eventOptions, setEventOptions] = useState<FeatureOption[]>([]);
  const [hackathonOptions, setHackathonOptions] = useState<FeatureOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setOptionsLoading(true);
      try {
        const [events, hackathons] = await Promise.all([
          fetchAllEventOptions(),
          fetchAllHackathonOptions(),
        ]);
        if (!cancelled) {
          setEventOptions(events);
          setHackathonOptions(hackathons);
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load events and hackathons for filters");
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadData = useCallback(
    async (currentPage: number) => {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const response = await getPayments({
          page: currentPage,
          limit: 20,
          eventId: selectedEventId ?? undefined,
          hackathonId: selectedHackathonId ?? undefined,
        });
        const { data, further } = response.data as {
          data: PaymentItem[];
          further: boolean;
        };

        setItems((prev) => (currentPage === 1 ? data : [...prev, ...data]));
        setHasMore(further);
      } catch (error) {
        console.error("Failed to fetch payments", error);
        toast.error("Failed to load payments");
      } finally {
        setLoading(false);
      }
    },
    [selectedEventId, selectedHackathonId],
  );

  useEffect(() => {
    void loadData(page);
  }, [page, loadData]);

  const lastElementRef = useCallback(
    (node: HTMLTableRowElement) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  const handleEventSelect = (value: string) => {
    if (value === NONE_VALUE) {
      setSelectedEventId(null);
    } else {
      setSelectedEventId(value);
      setSelectedHackathonId(null);
    }
    setPage(1);
    setItems([]);
    setHasMore(true);
  };

  const handleHackathonSelect = (value: string) => {
    if (value === NONE_VALUE) {
      setSelectedHackathonId(null);
    } else {
      setSelectedHackathonId(value);
      setSelectedEventId(null);
    }
    setPage(1);
    setItems([]);
    setHasMore(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">
            View transaction history and status from all events and hackathons.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4 min-w-0 w-full sm:w-auto">
          <div className="flex flex-col gap-1.5 min-w-0 flex-1 sm:w-[220px]">
            <Label
              htmlFor="filter-event"
              className="text-xs text-muted-foreground"
            >
              Filter by event
            </Label>
            <Select
              value={selectedEventId ?? NONE_VALUE}
              onValueChange={handleEventSelect}
              disabled={optionsLoading}
            >
              <SelectTrigger id="filter-event" className="w-full">
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>All events</SelectItem>
                {eventOptions.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 min-w-0 flex-1 sm:w-[220px]">
            <Label
              htmlFor="filter-hackathon"
              className="text-xs text-muted-foreground"
            >
              Filter by hackathon
            </Label>
            <Select
              value={selectedHackathonId ?? NONE_VALUE}
              onValueChange={handleHackathonSelect}
              disabled={optionsLoading}
            >
              <SelectTrigger id="filter-hackathon" className="w-full">
                <SelectValue placeholder="All hackathons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>All hackathons</SelectItem>
                {hackathonOptions.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-semibold">User</TableHead>
              <TableHead className="font-semibold">Amount</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Source</TableHead>
              <TableHead className="font-semibold text-right">
                Details
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => {
              const isLast = index === items.length - 1;
              const statusColor =
                item.status === "CAPTURED" || item.status === "COMPLETED"
                  ? "bg-green-100 text-green-700 hover:bg-green-100/80"
                  : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80";

              return (
                <TableRow
                  key={item.id}
                  ref={isLast ? lastElementRef : null}
                  className="transition-colors hover:bg-muted/30"
                >
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{item.user}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.userEmail}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.amount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.date}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${statusColor} border-none font-medium`}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <Badge
                        variant="outline"
                        className="w-fit mb-1 text-[10px] uppercase font-bold tracking-wider py-0 px-1.5"
                      >
                        {item.type}
                      </Badge>
                      <span
                        className="text-sm truncate max-w-[150px]"
                        title={item.itemName}
                      >
                        {item.itemName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/${item.type.toLowerCase()}s/${item.itemSlug}`}
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      View {item.type}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Loading transactions...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-48 text-center text-muted-foreground"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
