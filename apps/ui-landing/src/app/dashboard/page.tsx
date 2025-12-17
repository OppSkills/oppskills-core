import { Button } from "@/components/ui/button";
import AnalyticCard from "./_components/AnalyticCard";
import { Badge } from "@/components/ui/badge";
import { currentUser } from "@clerk/nextjs/server";
import RegistrationLineChart from "./_components/RegistrationChart";
import Alerts from "./_components/Alerts";
import DomainsChart from "./_components/DomainsChart";
import RecentListing from "./_components/RecentListing";
import { Plus } from "lucide-react";

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
          <div className="right self-end md:self-auto">
            <Button className="rounded-full px-6 h-12 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-purple-200">
              <Plus className="mr-2 h-5 w-5" />
              Host
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        <MotionContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {analyticData.map((item, index) => (
            <MotionItem key={index}>

              <AnalyticCard
                className={`${item.type === "highlight" ? "bg-[radial-gradient(circle_at_top_left,var(--color-primary-700)_0%,var(--color-primary-900)_70%)] text-primary-foreground" : "bg-background"}`}
              >
                <div className="flex flex-col md:gap-6">
                  <p className={`text-base font-medium ${item.type === "highlight" ? "text-purple-200" : "text-gray-700"}`}>
                    {item.title}
                  </p>
                  <h3 className="text-5xl font-bold tracking-tight">
                    {item.value}
                  </h3>

                  <div className="flex justify-between w-full items-center mt-auto">
                    <p
                      className={`text-xs font-medium ${item.type === "normal" ? "text-purple-700" : "text-purple-200"
                        }`}
                    >
                      {item.badge}
                    </p>
                    <Badge variant={item.type === "highlight" ? "default" : "gradient"}>
                      {item.badgeValue}
                    </Badge>
                  </div>
                </div>
              </AnalyticCard>
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
