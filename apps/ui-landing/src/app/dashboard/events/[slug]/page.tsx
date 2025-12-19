"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import GenderDiversityChart from "@/app/dashboard/_components/GenderDiversityChart";
import ImpressionsChart from "@/app/dashboard/_components/ImpressionsChart";
import {
  MotionContainer,
  MotionItem,
} from "@/components/ui/derived/MotionWrapper";
import AnalyticCard from "@/app/dashboard/_components/AnalyticCard";
import RegistrationLineChart from "@/app/dashboard/_components/RegistrationChart";
import Alerts from "@/app/dashboard/_components/Alerts";
import RoundStats from "@/app/dashboard/_components/RoundStats";
import DomainsChart from "@/app/dashboard/_components/DomainsChart";

export default function EventDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(params);
  const [analyticData] = useState([
    {
      type: "highlight",
      title: "Tickets Sold",
      value: "1,204",
      badge: "Total Sales",
      badgeValue: "1,500",
    },
    {
      type: "normal",
      title: "Page Views",
      value: "15,400",
      badge: "Last 24 Hours",
      badgeValue: "850",
    },
    {
      type: "normal",
      title: "Revenue",
      value: "$24,050",
      badge: "Last 24 Hours",
      badgeValue: "$1,200",
    },
    {
      type: "normal",
      title: "Interested",
      value: "450",
      badge: "Last Week",
      badgeValue: "45",
    },
  ]);

  return (
    <div className="flex justify-center w-full min-h-screen">
      <div className="w-full bg-background p-4 sm:p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
          <div className="left">
            <h1 className="font-semibold text-[24px] md:text-[28px] break-words">
              Event Dashboard
            </h1>
            <p className="text-sm md:text-[16px] text-muted-foreground pt-1 md:pt-2">
              Overview for {slug}
            </p>
          </div>
          <div className="right self-end md:self-auto">
            <Button className="rounded-full">
              <Image
                src="/icons/share.svg"
                alt="Share"
                width={16}
                height={16}
                className="mr-2"
              />
              Share Event
            </Button>
          </div>
        </div>
        {/* Analytics */}
        <MotionContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 justify-between">
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
        {/*CHARTS*/}
        <MotionContainer className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <MotionItem>
            <RegistrationLineChart />
          </MotionItem>
          <MotionItem>
            <Alerts />
          </MotionItem>
          <MotionItem>
            <RoundStats />
          </MotionItem>
          <MotionItem>
            <DomainsChart />
          </MotionItem>
          <MotionItem>
            <GenderDiversityChart />
          </MotionItem>
          <MotionItem>
            <ImpressionsChart />
          </MotionItem>
        </MotionContainer>
      </div>
    </div>
  );
}
