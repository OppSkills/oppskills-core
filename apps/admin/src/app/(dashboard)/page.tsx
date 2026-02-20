"use client";

import { StatsCard } from "@/components/admin-panel/stats-card";
import { AdminLogsCard } from "@/components/admin-panel/admin-logs-card";
import { StatsDetailModal } from "@/components/admin-panel/stats-detail-modal";
import { getMe } from "@/lib/api/actions";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, DollarSign, Calendar, Activity, Zap } from "lucide-react";
import { getDashboardOverview } from "@/lib/api/dashboard";
import { Loader2 } from "lucide-react";

interface DashboardData {
  userStats: {
    total: number;
    thisyear: number;
    lastYear: number;
  };
  revenue: {
    hackathon: {
      total: number;
      thisYear: number;
      lastYear: number;
    };
    event: {
      total: number;
      lastYear: number;
      thisYear: number;
    };
  };
  activeEntities: {
    hackathon: {
      total: number;
      lastMonth: number;
      thisMonth: number;
    };
    event: {
      total: number;
      lastMonth: number;
      thisMonth: number;
    };
  };
  users: {
    total: number;
    thisMonth: number;
    lastMonth: number;
  };
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ name?: string } | null>(null);
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedStat, setSelectedStat] = useState<{
    title: string;
    details: { label: string; value: string | number; subValue?: string; trend?: string }[];
  } | null>(null);

  useEffect(() => {
    Promise.all([
      getMe().then(res => setUser(res.data)).catch(err => console.error(err)),
      getDashboardOverview().then(res => setStats(res.data)).catch(err => console.error(err))
    ]).finally(() => setLoading(false));
  }, []);

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const percent = ((current - previous) / previous) * 100;
    return `${percent > 0 ? "+" : ""}${percent.toFixed(1)}%`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleStatClick = (type: 'users' | 'revenue' | 'hackathon' | 'event') => {
    if (!stats) return;

    let details: { label: string; value: string | number; subValue?: string; trend?: string }[] = [];
    let title = "";

    switch (type) {
      case 'users':
        title = "User Statistics";
        details = [
          {
            label: "Total Users",
            value: stats.userStats.total,
            subValue: "All registered users"
          },
          {
            label: "New This Month",
            value: stats.users.thisMonth,
            trend: calculateChange(stats.users.thisMonth, stats.users.lastMonth),
            subValue: "vs Last Month"
          },
          {
            label: "New This Year",
            value: stats.userStats.thisyear, // Note: lowercase 'thisyear' in interface
            subValue: `Last Year: ${stats.userStats.lastYear}`
          }
        ];
        break;
      case 'revenue':
        title = "Revenue Overview";
        details = [
          {
            label: "Total Revenue",
            value: formatCurrency(stats.revenue.hackathon.total + stats.revenue.event.total),
            subValue: "Combined Hackathons & Events"
          },
          {
            label: "Hackathon Revenue",
            value: formatCurrency(stats.revenue.hackathon.total),
            trend: calculateChange(stats.revenue.hackathon.thisYear, stats.revenue.hackathon.lastYear),
            subValue: `This Year: ${formatCurrency(stats.revenue.hackathon.thisYear)}`
          },
          {
            label: "Event Revenue",
            value: formatCurrency(stats.revenue.event.total),
            trend: calculateChange(stats.revenue.event.thisYear, stats.revenue.event.lastYear),
            subValue: `This Year: ${formatCurrency(stats.revenue.event.thisYear)}`
          }
        ];
        break;
      case 'hackathon':
        title = "Hackathon Statistics";
        details = [
          {
            label: "Active Hackathons",
            value: stats.activeEntities.hackathon.total,
            subValue: "Currently running"
          },
          {
            label: "Created This Month",
            value: stats.activeEntities.hackathon.thisMonth,
            trend: calculateChange(stats.activeEntities.hackathon.thisMonth, stats.activeEntities.hackathon.lastMonth),
            subValue: "vs Last Month"
          }
        ];
        break;
      case 'event':
        title = "Event Statistics";
        details = [
          {
            label: "Active Events",
            value: stats.activeEntities.event.total,
            subValue: "Currently running"
          },
          {
            label: "Created This Month",
            value: stats.activeEntities.event.thisMonth,
            trend: calculateChange(stats.activeEntities.event.thisMonth, stats.activeEntities.event.lastMonth),
            subValue: "vs Last Month"
          }
        ];
        break;
    }

    setSelectedStat({ title, details });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = stats ? [
    {
      title: "Total Users",
      value: stats.userStats.total.toString(),
      change: calculateChange(stats.users.thisMonth, stats.users.lastMonth),
      icon: Users,
      onClick: () => handleStatClick('users')
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.revenue.hackathon.total + stats.revenue.event.total),
      change: calculateChange(
        stats.revenue.hackathon.thisYear + stats.revenue.event.thisYear,
        stats.revenue.hackathon.lastYear + stats.revenue.event.lastYear
      ),
      icon: DollarSign,
      onClick: () => handleStatClick('revenue')
    },
    {
      title: "Active Hackathons",
      value: stats.activeEntities.hackathon.total.toString(),
      change: calculateChange(stats.activeEntities.hackathon.thisMonth, stats.activeEntities.hackathon.lastMonth),
      icon: Zap,
      onClick: () => handleStatClick('hackathon')
    },
    {
      title: "Active Events",
      value: stats.activeEntities.event.total.toString(),
      change: calculateChange(stats.activeEntities.event.thisMonth, stats.activeEntities.event.lastMonth),
      icon: Calendar,
      onClick: () => handleStatClick('event')
    }
  ] : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-2">Welcome back, {user?.name || 'Admin'}. Here is what is happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            onClick={stat.onClick}
          />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Placeholder for charts or recent activity */}
        <div className="max-h-96">
          <AdminLogsCard />
        </div>
        <div className="h-96">
          <Card className="h-full flex items-center justify-center text-muted-foreground">
            <CardContent>Revenue Overview Placeholder</CardContent>
          </Card>
        </div>
      </div>

      <StatsDetailModal
        open={!!selectedStat}
        onOpenChange={(open: boolean) => !open && setSelectedStat(null)}
        title={selectedStat?.title || ""}
        details={selectedStat?.details || []}
      />
    </div>
  );
}
