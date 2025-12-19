import { Button } from "@/components/ui/button";
import AnalyticCard from "./_components/AnalyticCard";

import { currentUser } from "@clerk/nextjs/server";
import RegistrationLineChart from "./_components/RegistrationChart";
import Alerts from "./_components/Alerts";
import DomainsChart from "./_components/DomainsChart";
import RecentListing from "./_components/RecentListing";
import { Link, Plus } from "lucide-react";

import {
  MotionContainer,
  MotionItem,
} from "@/components/ui/derived/MotionWrapper";

export default async function page() {
  const user = await currentUser();

  // Mock data to match the image
  const analyticData = [
    {
      type: "highlight", // Dark purple card
      title: "Total Candidates",
      value: "12,300",
      badge: "Registered last month",
      badgeValue: "1,200",
    },
    {
      type: "normal", // Light card
      title: "Active Opportunities",
      value: "12",
      badge: "Newly launched",
      badgeValue: "4",
      themeColor: "bg-secondary/40", // Using global secondary color with opacity
    },
    {
      type: "normal",
      title: "Completed Opportunities",
      value: "48",
      badge: "Participants engaged",
      badgeValue: "3400",
      themeColor: "bg-secondary/40",
    },
    {
      type: "normal",
      title: "Team Submissions",
      value: "90",
      badge: "Received this week",
      badgeValue: "30",
      themeColor: "bg-secondary/40",
    },
  ];

  return (
    <div className="flex justify-center w-full min-h-screen bg-[#FAFAFA]">
      <div className="w-full max-w-[1600px] p-6 lg:p-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
          <div className="left space-y-2">
            <h1 className="font-bold text-3xl md:text-4xl text-foreground">
              Welcome Back, E-Cell NoC
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Here is the summary of overall performance
            </p>
          </div>
          <div className="right self-end md:self-auto w-full sm:w-auto">
            <Link href="/dashboard/host">
              <Button className="w-full rounded-full px-6 h-12 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-purple-200">
                <Plus className="mr-2 h-5 w-5" />
                Host
              </Button>
            </Link>
          </div>
        </div>

        {/* Analytics Cards */}
        <MotionContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {analyticData.map((item, index) => (
            <MotionItem key={index}>
              <AnalyticCard
                type={(item.type as "normal" | "highlight") || "normal"}
                title={item.title}
                value={item.value}
                badge={item.badge}
                badgeValue={item.badgeValue}
              />
            </MotionItem>
          ))}
        </MotionContainer>

        {/* Charts Row */}
        <MotionContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <MotionItem className="w-full">
            <RegistrationLineChart />
          </MotionItem>
          <MotionItem className="w-full">
            <DomainsChart />
          </MotionItem>
        </MotionContainer>

        {/* Bottom Row: Recent Listings and Alerts */}
        <MotionContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full pb-10">
          <MotionItem className="w-full">
            <RecentListing />
          </MotionItem>
          <MotionItem className="w-full">
            <Alerts />
          </MotionItem>
        </MotionContainer>
      </div>
    </div>
  );
}
