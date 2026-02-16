import { dashboardStats } from "@/lib/mock-data";
import { StatsCard } from "@/components/admin-panel/stats-card";
import { Card, CardContent } from "@/components/ui/card";
import * as Icons from "lucide-react";
import { Users, DollarSign, Calendar, UserPlus } from "lucide-react";

// Map icon strings to components if needed, or update mock data to use components directly if passing from server component?
// Since mock-data.ts exports objects with icon names strings (e.g. "Users"), I need to map them.
// Actually, in this case, I'll just hardcode the icon logic or update mock data logic.
// Simpler: I will import the specific icons here and map them.

const iconMap: Record<string, any> = {
  Users: Users,
  DollarSign: DollarSign,
  Calendar: Calendar,
  UserPlus: UserPlus,
};

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-2">Welcome back, Admin. Here is what is happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => {
          const Icon = iconMap[stat.icon] || Users;
          return (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              icon={Icon}
            />
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Placeholder for charts or recent activity */}
        <div className="h-96">
          <Card className="h-full flex items-center justify-center text-muted-foreground">
            <CardContent>User Growth Chart Placeholder</CardContent>
          </Card>
        </div>
        <div className="h-96">
          <Card className="h-full flex items-center justify-center text-muted-foreground">
            <CardContent>Revenue Overview Placeholder</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
