"use client";

import * as React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TimePickerProps {
    value?: string; // Expecting "HH:mm" 24h format
    onChange?: (value: string) => void;
    className?: string;
}

export default function TimePicker({
    value,
    onChange,
    className,
}: TimePickerProps) {
    // Parse initial value
    const [hour, setHour] = React.useState<number>(12);
    const [minute, setMinute] = React.useState<number>(0);
    const [period, setPeriod] = React.useState<"AM" | "PM">("AM");

    React.useEffect(() => {
        if (value) {
            const [h, m] = value.split(":").map(Number);
            if (!isNaN(h) && !isNaN(m)) {
                if (h === 0) {
                    setHour(12);
                    setPeriod("AM");
                } else if (h === 12) {
                    setHour(12);
                    setPeriod("PM");
                } else if (h > 12) {
                    setHour(h - 12);
                    setPeriod("PM");
                } else {
                    setHour(h);
                    setPeriod("AM");
                }
                setMinute(m);
            }
        }
    }, [value]);

    const handleTimeChange = (
        newHour: number,
        newMinute: number,
        newPeriod: "AM" | "PM"
    ) => {
        setHour(newHour);
        setMinute(newMinute);
        setPeriod(newPeriod);

        if (onChange) {
            let h24 = newHour;
            if (newPeriod === "PM" && newHour !== 12) {
                h24 = newHour + 12;
            } else if (newPeriod === "AM" && newHour === 12) {
                h24 = 0;
            }
            const timeString = `${h24.toString().padStart(2, "0")}:${newMinute
                .toString()
                .padStart(2, "0")}`;
            onChange(timeString);
        }
    };

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <div className="flex items-center justify-center gap-2 border rounded-md p-4 bg-muted/20">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground uppercase font-semibold">
                        Hour
                    </span>
                    <ScrollArea className="h-48 w-16 border rounded-md bg-background">
                        <div className="flex flex-col p-1 gap-1">
                            {hours.map((h) => (
                                <Button
                                    key={h}
                                    variant={hour === h ? "default" : "ghost"}
                                    size="sm"
                                    className={cn(
                                        "w-full font-mono text-base shrink-0",
                                        hour === h && "font-bold"
                                    )}
                                    onClick={() => handleTimeChange(h, minute, period)}
                                >
                                    {h}
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                <span className="text-2xl font-bold pb-6">:</span>

                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground uppercase font-semibold">
                        Min
                    </span>
                    <ScrollArea className="h-48 w-16 border rounded-md bg-background">
                        <div className="flex flex-col p-1 gap-1">
                            {minutes.map((m) => (
                                <Button
                                    key={m}
                                    variant={minute === m ? "default" : "ghost"}
                                    size="sm"
                                    className={cn(
                                        "w-full font-mono text-base shrink-0",
                                        minute === m && "font-bold"
                                    )}
                                    onClick={() => handleTimeChange(hour, m, period)}
                                >
                                    {m.toString().padStart(2, "0")}
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                <div className="h-full flex flex-col justify-end gap-2 pb-0.5 ml-2">
                    <div className="flex flex-col border rounded-md bg-background p-1 gap-1">
                        {(["AM", "PM"] as const).map((p) => (
                            <Button
                                key={p}
                                variant={period === p ? "default" : "ghost"}
                                size="sm"
                                className={cn(
                                    "px-3 font-semibold",
                                    period === p && "font-bold"
                                )}
                                onClick={() => handleTimeChange(hour, minute, p)}
                            >
                                {p}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="text-center">
                <span className="text-sm text-muted-foreground">
                    Selected Time:{" "}
                    <span className="font-medium text-foreground">
                        {hour}:{minute.toString().padStart(2, "0")} {period}
                    </span>
                </span>
            </div>
        </div>
    );
}
