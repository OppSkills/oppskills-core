"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { getHackathonBySlug } from "@/lib/api/hackathonApi";
import { SendNotification } from "@/components/common/SendNotification";

export default function NotificationsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { getToken } = useAuth();

  const [hackathonId, setHackathonId] = useState<string | null>(null);
  const [hackathonName, setHackathonName] = useState("");
  const [hackathonEndDate, setHackathonEndDate] = useState<Date | null>(null);
  const [fetchingHackathon, setFetchingHackathon] = useState(true);

  useEffect(() => {
    const fetchHackathon = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const hackathonData: any = await getHackathonBySlug(token, slug);
        if (hackathonData && hackathonData.id) {
          setHackathonId(hackathonData.id);
          setHackathonName(hackathonData.name || "Hackathon");
          if (hackathonData.endDate) {
            setHackathonEndDate(new Date(hackathonData.endDate));
          }
        } else {
          toast.error("Could not load hackathon details.");
        }
      } catch (error) {
        console.error("Failed to fetch hackathon", error);
        toast.error("Failed to load hackathon details.");
      } finally {
        setFetchingHackathon(false);
      }
    };

    if (slug) {
      fetchHackathon();
    }
  }, [slug, getToken]);

  if (fetchingHackathon) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SendNotification
      type="hackathon"
      id={hackathonId}
      name={hackathonName}
      endDate={hackathonEndDate}
    />
  );
}
