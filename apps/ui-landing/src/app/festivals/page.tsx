"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFestivals } from "@/lib/api/festivalApi";

/**
 * Festivals listing page.
 *
 * This exists both as a useful UI and to keep Next.js route type-generation in sync.
 * (Some builds/type generators expect `/festivals` to exist.)
 */
export default function FestivalsPage() {
  const { getToken } = useAuth();

  type FestivalRow = {
    id: string;
    name: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  };

  const [items, setItems] = useState<ReadonlyArray<FestivalRow>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Type guard: checks if a value is a non-null object.
   */
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

  /**
   * Safely reads a string field from a record.
   */
  const getString = (obj: Record<string, unknown>, key: string): string | undefined => {
    const value = obj[key];
    return typeof value === "string" && value.trim().length > 0 ? value : undefined;
  };

  /**
   * Extracts festival rows from API responses that may be either:
   * - an array directly, OR
   * - an object with a `data` array.
   */
  const extractFestivals = (data: unknown): ReadonlyArray<FestivalRow> => {
    const raw = Array.isArray(data)
      ? data
      : isRecord(data) && Array.isArray(data["data"])
        ? data["data"]
        : [];

    return raw
      .map((row): FestivalRow | null => {
        if (!isRecord(row)) return null;
        const id = getString(row, "id");
        const name = getString(row, "name");
        if (!id || !name) return null;
        return {
          id,
          name,
          startDate: getString(row, "startDate"),
          endDate: getString(row, "endDate"),
          status: getString(row, "status"),
        };
      })
      .filter((v): v is FestivalRow => v !== null);
  };

  useEffect(() => {
    const run = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const token = await getToken();
        if (typeof token !== "string" || token.trim().length === 0) {
          setItems([]);
          return;
        }
        const res = await getFestivals(token);
        setItems(extractFestivals(res));
      } catch (err: unknown) {
        setItems([]);
        toast.error("Failed to load festivals.");
        // eslint-disable-next-line no-console
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return <p className="p-6 text-center">Loading festivals...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-6">
      {items.length === 0 ? (
        <p className="p-6 text-center text-muted-foreground">No festivals found.</p>
      ) : (
        items.map((festival) => (
          <Card key={festival.id} className="shadow-md border border-gray-200">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">{festival.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Start:</span>
                <Badge variant="secondary">{festival.startDate ?? "N/A"}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">End:</span>
                <Badge variant="secondary">{festival.endDate ?? "N/A"}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <Badge className="capitalize">{festival.status ?? "N/A"}</Badge>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}


