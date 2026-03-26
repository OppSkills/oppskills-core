"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Users,
  Sparkles,
  Clock,
  Loader2,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/nextjs";
import { format } from "date-fns";
import { getDeterministicPseudoImpressions } from "@/lib/opportunity-utils";

export interface OpportunitySidebarData {
  id: string;
  slug: string;
  type: "HACKATHON" | "EVENT" | "FESTIVAL";
  title: string;
  thumbnail: string;
  startDate?: Date;
  endDate?: Date;
  venueName?: string;
  venueAddress?: string;
  featuredIn?: string;
  websiteUrl?: string | null;
  
  // Registration Related
  isFree?: boolean;
  entryFeeAmount?: number | null;
  currency?: string;
  feeBearer?: "ORGANISER" | "PARTICIPANT";
  registrationDeadline?: string;
  registrationDeadlineDate?: Date | null;
  isRegistrationPaused?: boolean;
  
  // Stats
  registrationCount?: number;
  maxParticipants?: number | null; // maxTeams or maxUsers
  participantTypeLabel?: string; // "Team of 2-4" or "Individual"
  impressions?: number;
  createdAt: Date;
}

interface OpportunitySidebarProps {
  data: OpportunitySidebarData;
  isSignedIn: boolean;
  isRegistered: boolean;
  isCheckingRegistration?: boolean;
  isActionLoading?: boolean;
  onActionClick: () => void;
  // Specific for team registration
  myTeam?: any | null;
}

export function OpportunitySidebar({
  data,
  isSignedIn,
  isRegistered,
  isCheckingRegistration = false,
  isActionLoading = false,
  onActionClick,
  myTeam,
}: OpportunitySidebarProps) {
  
  // Check if registration is closed
  const isRegistrationClosed =
    data.isRegistrationPaused ||
    (data.registrationDeadlineDate &&
      new Date() > data.registrationDeadlineDate);

  const isMaxReached =
    data.maxParticipants !== null &&
    data.maxParticipants !== undefined &&
    data.registrationCount !== undefined &&
    data.registrationCount >= data.maxParticipants;

  const renderRegisterButton = () => {
    // If checking registration status
    if (isCheckingRegistration) {
      return (
        <Button
          className="w-full bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded-full h-[52px] font-semibold text-base shadow-sm"
          disabled
        >
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Checking...
        </Button>
      );
    }

    // If already registered
    if (isRegistered) {
      return (
        <Button
          className="w-full bg-green-600 text-white rounded-full h-[52px] font-semibold text-base shadow-sm"
          disabled
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Registered
        </Button>
      );
    }

    // If registration is closed
    if (isRegistrationClosed) {
      return (
        <Button
          className="w-full bg-zinc-400 text-white rounded-full h-[52px] font-semibold text-base shadow-sm cursor-not-allowed"
          disabled
        >
          Registration Closed
        </Button>
      );
    }

    // If max reached
    if (isMaxReached) {
      return (
        <Button
          className="w-full bg-zinc-400 text-white rounded-full h-[52px] font-semibold text-base shadow-sm cursor-not-allowed"
          disabled
        >
          {data.type === "HACKATHON" ? "Teams Full" : "Event Full"}
        </Button>
      );
    }

    const baseAmount = data.entryFeeAmount || 0;
    const isPaid = data.isFree === false && baseAmount > 0;
    const processingFee = Math.ceil(baseAmount * 0.0236 * 100) / 100;
    const totalAmount = data.feeBearer === "PARTICIPANT"
      ? baseAmount + processingFee
      : baseAmount;
    const currency = data.currency || "INR";
    const registerLabel = isPaid
      ? `Register for ${currency} ${totalAmount.toFixed(2)}`
      : "Register for free";

    // If not signed in, show sign-in button
    if (!isSignedIn) {
      return (
        <div className="space-y-2">
          <SignInButton mode="modal">
            <Button className="w-full bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded-full h-[52px] font-semibold text-base shadow-sm">
              {registerLabel}
            </Button>
          </SignInButton>
          {isPaid && data.feeBearer === "PARTICIPANT" && (
            <div className="text-center space-y-0.5">
              <p className="text-xs text-neutral-500">
                ₹{baseAmount.toFixed(2)} + ₹{processingFee.toFixed(2)} Transaction Charges
              </p>
            </div>
          )}
        </div>
      );
    }

    // For Festivals, we might not have a direct registration button
    if (data.type === "FESTIVAL") {
      return (
        <Button
          className="w-full bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded-full h-[52px] font-semibold text-base shadow-sm"
          onClick={onActionClick}
          disabled={isActionLoading}
        >
          {isActionLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            "Explore Events"
          )}
        </Button>
      );
    }

    // Default: show action button
    return (
      <div className="space-y-2">
        <Button
          className="w-full bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded-full h-[52px] font-semibold text-base shadow-sm"
          onClick={onActionClick}
          disabled={isActionLoading}
        >
          {isActionLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            registerLabel
          )}
        </Button>
        {isPaid && data.feeBearer === "PARTICIPANT" && !isActionLoading && (
          <div className="text-center space-y-0.5">
            <p className="text-xs text-neutral-500">
              ₹{baseAmount.toFixed(2)} + ₹{processingFee.toFixed(2)} Transaction Charges
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Featured In Pill */}
      {data.featuredIn && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-200 rounded-md text-sm text-neutral-600">
          <span className="font-normal text-neutral-600">Featured in</span>
          <span className="font-semibold text-neutral-800">
            {data.featuredIn}
          </span>
          <ChevronRight className="w-4 h-4 text-neutral-800" />
        </div>
      )}

      {/* Banner */}
      <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl shadow-sm border border-neutral-100">
        <Image
          src={data.thumbnail || (data.type === "HACKATHON" ? "/competition_placeholder.png" : data.type === "FESTIVAL" ? "/festival_placeholder.png" : "/event_placeholder.png")}
          alt={data.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Info Card */}
      <div className="bg-background rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <p className="text-neutral-600 text-[15px] mb-6">
          Welcome! to join {data.type.toLowerCase()} please register below.
        </p>

        <div className="space-y-5">
          {/* Date Row */}
          <div className="flex gap-4 items-center">
            <div className="shrink-0 w-12 h-12 rounded-xl border border-neutral-400 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase text-neutral-500 font-medium leading-none mb-0.5">
                {data.startDate ? format(data.startDate, "MMM") : "TBD"}
              </span>
              <span className="text-lg font-bold text-neutral-900 leading-none">
                {data.startDate ? format(data.startDate, "dd") : "--"}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 text-[15px]">
                {(() => {
                  if (data.startDate && data.endDate) {
                    const isSameDay = data.startDate.toDateString() === data.endDate.toDateString();
                    if (isSameDay) {
                      return format(data.startDate, "EEEE, d MMMM yyyy");
                    } else {
                      return `${format(data.startDate, "MMM d")} - ${format(data.endDate, "MMM d, yyyy")}`;
                    }
                  }
                  return "Date TBD";
                })()}
              </h4>
              <p className="text-sm text-neutral-500">
                {data.startDate && data.endDate ? 
                  `${format(data.startDate, "h:mm a")} - ${format(data.endDate, "h:mm a")}` 
                  : "Time TBD"}
              </p>
            </div>
          </div>

          {/* Location Row */}
          <div className="flex gap-4 items-center">
            <div className="shrink-0 w-12 h-12 rounded-xl border border-neutral-400 flex items-center justify-center shadow-sm">
              <MapPin className="w-5 h-5 text-neutral-700" />
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 text-[15px]">
                {data.venueName || "Venue Name"}
              </h4>
              <p className="text-sm text-neutral-500">
                {data.venueAddress || "Location Details"}
              </p>
            </div>
          </div>

          {/* Action Button */}
          {renderRegisterButton()}

          {/* Team Status Card (specifically for hackathons) */}
          {isRegistered && myTeam && (
            <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-green-800">
                  Your Team
                </span>
                <Link
                  href={`/hackathons/${data.slug}/team`}
                  className="text-xs text-green-700 hover:text-green-900 underline"
                >
                  View Details
                </Link>
              </div>
              <div className="flex items-center gap-3">
                {/* Team avatar logic simplified here for the generic component */}
                <div className="flex -space-x-2">
                  {myTeam.leader && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-green-600 flex items-center justify-center text-white text-xs font-medium overflow-hidden">
                      {myTeam.leader.imageUrl ? (
                        <Image src={myTeam.leader.imageUrl} alt="Leader" width={32} height={32} />
                      ) : (myTeam.leader.firstName?.[0] || "L").toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">
                    {myTeam.name}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-neutral-100 w-full my-2" />

          {/* Stats List */}
          <div className="space-y-4">
            {/* Participant Type / Size */}
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl border border-neutral-400 flex items-center justify-center shadow-sm">
                <Users className="w-5 h-5 text-neutral-800" />
              </div>
              <div>
                <div className="font-semibold text-neutral-900 text-sm">
                  {data.participantTypeLabel || (data.type === "HACKATHON" ? "Team Participation" : "Individual Entry")}
                </div>
                <div className="text-xs text-neutral-500">Participation</div>
              </div>
            </div>

            {/* Impressions */}
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl border border-neutral-400 flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-neutral-800" />
              </div>
              <div>
                <div className="font-semibold text-neutral-900 text-sm">
                  {(data.impressions || getDeterministicPseudoImpressions(data.registrationCount, data.createdAt)).toLocaleString()}
                </div>
                <div className="text-xs text-neutral-500">Impressions</div>
              </div>
            </div>

            {/* Deadline / Website */}
            {data.type === "FESTIVAL" && data.websiteUrl ? (
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-10 h-10 rounded-xl border border-neutral-400 flex items-center justify-center shadow-sm">
                  <Clock className="w-5 h-5 text-neutral-800" />
                </div>
                <div className="flex flex-col min-w-0">
                  <a 
                    href={data.websiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="font-semibold text-primary-600 text-sm truncate hover:underline"
                  >
                    {data.websiteUrl.replace(/^https?:\/\//, "")}
                  </a>
                  <div className="text-xs text-neutral-500">Official Website</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-10 h-10 rounded-xl border border-neutral-400 flex items-center justify-center shadow-sm">
                  <Clock className="w-5 h-5 text-neutral-800" />
                </div>
                <div>
                  <div className="font-semibold text-neutral-900 text-sm">
                    {data.registrationDeadline || "Open"}
                  </div>
                  <div className="text-xs text-neutral-500">Registration Deadline</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
