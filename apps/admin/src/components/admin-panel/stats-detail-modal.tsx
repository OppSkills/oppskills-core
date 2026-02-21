"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatItem {
    label: string;
    value: string | number;
    subValue?: string;
    trend?: string; // e.g., "+10%"
}

interface StatsDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    details: StatItem[];
}

export function StatsDetailModal({ open, onOpenChange, title, details }: StatsDetailModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Detailed breakdown for current period
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {details.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                                <p className="text-2xl font-bold">{item.value}</p>
                            </div>
                            {item.subValue && (
                                <div className="text-right">
                                    <p className="text-sm font-medium">{item.subValue}</p>
                                    {item.trend && (
                                        <p className={`text-xs ${item.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                                            {item.trend}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
