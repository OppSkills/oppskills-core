import { LucideIcon } from "lucide-react";

interface StatsCardProps {
    title: string;
    value: string;
    change: string;
    icon: LucideIcon;
}

export function StatsCard({ title, value, change, icon: Icon }: StatsCardProps) {
    const isPositive = change.startsWith("+");

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className="text-2xl font-bold mt-1 text-gray-900">{value}</h3>
                <p className={`text-xs mt-1 font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
                    {change} from last month
                </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                <Icon size={24} />
            </div>
        </div>
    );
}
