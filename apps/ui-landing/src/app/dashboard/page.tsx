import { Button } from "@/components/ui/button";
import Image from "next/image";
import AnalyticCard from "./_components/AnalyticCard";
import { Badge } from "@/components/ui/badge";
import { currentUser } from "@clerk/nextjs/server";
import RegistrationLineChart from "./_components/RegistrationChart";
import Alerts from "./_components/Alerts";
import RoundStats from "./_components/RoundStats";
import DomainsChart from "./_components/DomainsChart";
import GenderDiversityChart from "./_components/GenderDiversityChart";
import ImpressionsChart from "./_components/ImpressionsChart";
import {
  MotionContainer,
  MotionItem,
} from "@/components/ui/derived/MotionWrapper";

export default async function page() {
  const user = await currentUser();
  const analyticData = [
    {
      type: "highlight",
      title: "Completed Registration",
      value: "232",
      badge: "Total Registrations",
      badgeValue: "340",
    },
    {
      type: "normal",
      title: "Total Impressions",
      value: "43,000",
      badge: "Last 24 Hours",
      badgeValue: "1,243",
    },
    {
      type: "normal",
      title: "Total Views",
      value: "12,030",
      badge: "Last 24 Hours",
      badgeValue: "600",
    },
    {
      type: "normal",
      title: "Rating & Reviews",
      value: "10",
      badge: "Last Week",
      badgeValue: "4",
    },
  ];
  return (
    <div className="flex justify-center w-full bg-surface">
      <div className="w-full max-w-[1150px] bg-background p-4 sm:p-6 my-4 rounded-[20px] flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
          <div className="left">
            <h1 className="font-semibold text-[24px] md:text-[28px] break-words">
              Welcome back, {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-sm md:text-[16px] text-muted-foreground pt-1 md:pt-2">
              View all the details for Hackverse Hackathon
            </p>
          </div>
          <div className="right self-end md:self-auto">
            <Button className="rounded-full">
              <Image
                src="/icons/share.svg"
                alt="Share"
                width={16}
                height={16}
              />{" "}
              Share
            </Button>
          </div>
        </div>
        {/* Analytics */}
        <MotionContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 justify-between">
          {analyticData.map((item, index) => (
            <MotionItem key={index}>
              <AnalyticCard
                className={`${item.type === "highlight" ? "bg-[radial-gradient(circle_at_top_left,var(--color-primary)_0%,var(--color-foreground)_50%)] text-primary-foreground" : "bg-background"}`}
              >
                <p className="text-[16px] xl:text-[20px]">{item.title}</p>
                <h3 className="text-3xl xl:text-4xl font-semibold py-4 xl:py-5">
                  {item.value}
                </h3>
                <div className="flex justify-between w-full items-center">
                  <p
                    className={`text-xs ${item.type === "normal" ? "text-primary" : "text-primary-foreground"}`}
                  >
                    {item.badge}
                  </p>
                  <Badge
                    className={`min-w-[42px] text-xs rounded-full bg-linear-to-r border-0 ${item.type === "normal" ? "from-primary to-foreground" : "from-primary/20 to-foreground/50"}`}
                  >
                    {item.badgeValue}
                  </Badge>
                </div>
              </AnalyticCard>
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
