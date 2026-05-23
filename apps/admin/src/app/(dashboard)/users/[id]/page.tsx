"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserDetail } from "@/lib/api/actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  ChevronLeft,
  Mail,
  Calendar,
  Award,
  Briefcase,
  MapPin,
  GraduationCap,
  Smartphone,
  DollarSign,
  Activity,
  Zap,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface UserDetailData {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
    accessLevel: string;
    onboarded: boolean;
    createdAt: string;
    onboardingProfile?: {
      gender?: string;
      userCategory: string;
      schoolName?: string;
      schoolClass?: string;
      schoolAddress?: string;
      college?: {
        name: string;
        city: string;
        state: string;
      };
      collegeCurrentYear?: string;
      collegePassoutYear?: number;
      companyName?: string;
      jobTitle?: string;
      locationCoords?: string;
      locationState?: string;
      locationCountry?: string;
      interests: string[];
      skills: string[];
    };
  };
  stats: {
    totalSpent: number;
    eventCount: number;
    hackathonCount: number;
  };
  events: {
    id: string;
    name: string;
    slug: string;
    joinedAt: string;
    startDate: string;
  }[];
  hackathons: {
    id: string;
    name: string;
    slug: string;
    joinedAt: string;
    startDate: string;
  }[];
  graphData: {
    month: string;
    count: number;
  }[];
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getUserDetail(params.id as string);
        setData(response.data);
      } catch (err) {
        console.error("Failed to fetch user details", err);
        toast.error("Failed to load user details");
        router.push("/users");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const { user, stats, events, hackathons, graphData } = data;
  const fullName = user.firstName
    ? `${user.firstName} ${user.lastName || ""}`
    : "Unregistered User";

  // Simple SVG Line Chart Calculation
  const maxCount = Math.max(...graphData.map((d) => d.count), 5);
  const chartHeight = 120;
  const chartWidth = 600;
  const padding = 20;

  const points = graphData
    .map((d, i) => {
      const x =
        (i / (graphData.length - 1 || 1)) * (chartWidth - padding * 2) +
        padding;
      const y =
        chartHeight -
        ((d.count / maxCount) * (chartHeight - padding * 2) + padding);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full shadow-sm hover:shadow-md transition-all"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {fullName}
            </h1>
            <Badge
              variant="outline"
              className="bg-primary/5 text-primary border-primary/20 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
            >
              {user.accessLevel}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Mail className="h-3.5 w-3.5" />
            {user.email}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="py-0 bg-linear-to-br from-blue-50/50 to-indigo-50/50 border-blue-100/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-blue-600/10 text-blue-600 rounded-xl">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-blue-900 opacity-70 uppercase tracking-wider">
                Total Spending
              </p>
              <h3 className="text-3xl font-bold text-blue-900 tracking-tight">
                ₹{stats.totalSpent.toLocaleString()}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="py-0 bg-linear-to-br from-emerald-50/50 to-teal-50/50 border-emerald-100/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-emerald-600/10 text-emerald-600 rounded-xl">
                <Zap className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-emerald-900 opacity-70 uppercase tracking-wider">
                Hackathons
              </p>
              <h3 className="text-3xl font-bold text-emerald-900 tracking-tight">
                {stats.hackathonCount}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="py-0 bg-linear-to-br from-violet-50/50 to-purple-50/50 border-violet-100/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-violet-600/10 text-violet-600 rounded-xl">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-violet-900 opacity-70 uppercase tracking-wider">
                Events Joined
              </p>
              <h3 className="text-3xl font-bold text-violet-900 tracking-tight">
                {stats.eventCount}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="py-0 border-border/40 overflow-hidden shadow-sm">
            <CardHeader className="bg-primary/5 py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                User Profile
              </CardTitle>
              <CardDescription>
                Onboarding details and background
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {!user.onboardingProfile ? (
                <p className="text-center py-6 text-muted-foreground italic text-sm">
                  No onboarding profile available.
                </p>
              ) : (
                <>
                  <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="p-2 bg-background rounded-md shadow-sm border border-border/50">
                      <Briefcase className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1.5">
                        Category
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {user.onboardingProfile.userCategory.replace("_", " ")}
                      </p>
                    </div>
                  </div>

                  {user.onboardingProfile.college && (
                    <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                      <div className="p-2 bg-background rounded-md shadow-sm border border-border/50">
                        <GraduationCap className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1.5">
                          Education
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {user.onboardingProfile.college.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {user.onboardingProfile.college.city},{" "}
                          {user.onboardingProfile.college.state}
                        </p>
                      </div>
                    </div>
                  )}

                  {(user.onboardingProfile.companyName ||
                    user.onboardingProfile.jobTitle) && (
                    <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                      <div className="p-2 bg-background rounded-md shadow-sm border border-border/50">
                        <Briefcase className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1.5">
                          Work
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {user.onboardingProfile.jobTitle || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          at {user.onboardingProfile.companyName || "N/A"}
                        </p>
                      </div>
                    </div>
                  )}

                  {(user.onboardingProfile.locationCoords ||
                    user.onboardingProfile.locationCountry) && (
                    <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                      <div className="p-2 bg-background rounded-md shadow-sm border border-border/50">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1.5">
                          Location
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {[
                            user.onboardingProfile.locationCoords,
                            user.onboardingProfile.locationState,
                            user.onboardingProfile.locationCountry,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-3">
                      Skills & Interests
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {user.onboardingProfile.skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="bg-primary/5 text-primary border-primary/10 text-[10px] px-2 py-0.5 font-medium"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {user.onboardingProfile.interests.map((interest) => (
                        <Badge
                          key={interest}
                          variant="outline"
                          className="text-[10px] font-medium px-2 py-0.5 border-border/50"
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Graph and Joined Entities */}
        <div className="lg:col-span-2 space-y-8">
          {/* Activity Graph Card */}
          <Card className="py-0 border-border/40 shadow-sm">
            <CardHeader className="py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Activity History</CardTitle>
                <CardDescription>Monthly registration activity</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                All History
              </Button>
            </CardHeader>
            <CardContent>
              <div className="relative h-48 w-full mt-4 group">
                {graphData.length > 0 ? (
                  <>
                    <svg
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                      className="w-full h-full preserve-3d"
                    >
                      {/* Grid Lines */}
                      <line
                        x1={padding}
                        y1={chartHeight - padding}
                        x2={chartWidth - padding}
                        y2={chartHeight - padding}
                        stroke="currentColor"
                        strokeWidth="0.5"
                        className="text-muted-foreground/20"
                      />
                      <line
                        x1={padding}
                        y1={padding}
                        x2={chartWidth - padding}
                        y2={padding}
                        stroke="currentColor"
                        strokeWidth="0.5"
                        className="text-muted-foreground/10"
                        strokeDasharray="4 4"
                      />

                      {/* Area Gradient (Simplified) */}
                      <path
                        d={`M ${padding},${chartHeight - padding} ${points} L ${chartWidth - padding},${chartHeight - padding} Z`}
                        className="fill-primary/5 group-hover:fill-primary/10 transition-colors"
                      />

                      {/* Line */}
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        points={points}
                        className="text-primary group-hover:stroke-[3px] transition-all"
                      />

                      {/* Data Points */}
                      {graphData.map((d, i) => {
                        const x =
                          (i / (graphData.length - 1 || 1)) *
                            (chartWidth - padding * 2) +
                          padding;
                        const y =
                          chartHeight -
                          ((d.count / maxCount) * (chartHeight - padding * 2) +
                            padding);
                        return (
                          <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="3.5"
                            className="fill-background stroke-primary stroke-2 hover:r-5 transition-all cursor-pointer"
                          />
                        );
                      })}
                    </svg>

                    {/* X-Axis Labels */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4">
                      {graphData.map((d, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-bold text-muted-foreground uppercase opacity-70"
                        >
                          {new Date(d.month).toLocaleString("default", {
                            month: "short",
                          })}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">
                    No activity recorded yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Engagements */}
          <Card className="py-0 border-border/40 shadow-sm overflow-hidden">
            <Tabs defaultValue="hackathons" className="w-full">
              <div className="px-6 pt-6 flex items-center justify-between">
                <CardTitle className="text-lg">Platforms Engagements</CardTitle>
                <TabsList className="bg-muted/50 p-1 border border-border/50 rounded-xl">
                  <TabsTrigger
                    value="hackathons"
                    className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
                  >
                    Hackathons ({stats.hackathonCount})
                  </TabsTrigger>
                  <TabsTrigger
                    value="events"
                    className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
                  >
                    Events ({stats.eventCount})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="hackathons" className="mt-4">
                <ScrollArea className="h-80">
                  <div className="px-6 pb-6 space-y-3">
                    {hackathons.length > 0 ? (
                      hackathons.map((item) => (
                        <div
                          key={item.id}
                          className="group flex items-center justify-between p-4 rounded-xl border border-border/40 hover:border-primary/20 hover:bg-primary/5 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-background shadow-sm group-hover:scale-110 transition-transform">
                              <Zap className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                                {item.name}
                              </h4>
                              <div className="flex items-center gap-3 mt-1.5">
                                <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3" />
                                  Joined:{" "}
                                  {new Date(item.joinedAt).toLocaleDateString()}
                                </p>
                                <div className="w-1 h-1 bg-muted-foreground/20 rounded-full" />
                                <p className="text-[11px] font-medium text-emerald-600">
                                  Active
                                </p>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shadow-none opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              window.open(`/hackathons/${item.slug}`, "_blank")
                            }
                          >
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-12 text-muted-foreground italic text-sm border-2 border-dashed border-border/50 rounded-2xl">
                        No hackathons joined yet.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="events" className="mt-4">
                <ScrollArea className="h-80">
                  <div className="px-6 pb-6 space-y-3">
                    {events.length > 0 ? (
                      events.map((item) => (
                        <div
                          key={item.id}
                          className="group flex items-center justify-between p-4 rounded-xl border border-border/40 hover:border-primary/20 hover:bg-primary/5 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-background shadow-sm group-hover:scale-110 transition-transform">
                              <Calendar className="h-5 w-5 text-indigo-500" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                                {item.name}
                              </h4>
                              <div className="flex items-center gap-3 mt-1.5">
                                <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3" />
                                  Joined:{" "}
                                  {new Date(item.joinedAt).toLocaleDateString()}
                                </p>
                                <div className="w-1 h-1 bg-muted-foreground/20 rounded-full" />
                                <p className="text-[11px] font-medium text-indigo-600">
                                  Upcoming
                                </p>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shadow-none opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              window.open(`/events/${item.slug}`, "_blank")
                            }
                          >
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-12 text-muted-foreground italic text-sm border-2 border-dashed border-border/50 rounded-2xl">
                        No events joined yet.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
