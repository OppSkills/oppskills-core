"use client";

import * as React from "react";
import {
  addDays,
  format,
  startOfToday,
  startOfYesterday,
  startOfWeek,
  startOfMonth,
  startOfYear,
  isSameDay,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Filter,
  Zap,
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";

const SHORTHANDS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This Week", value: "this_week" },
  { label: "This Month", value: "this_month" },
  { label: "This Year", value: "this_year" },
  { label: "All Time", value: "all_time" },
];

export function DateRangeFilter({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPeriod = searchParams.get("period") || "all_time";
  const currentFrom = searchParams.get("from");
  const currentTo = searchParams.get("to");

  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    if (currentFrom && currentTo) {
      return { from: new Date(currentFrom), to: new Date(currentTo) };
    }
    return undefined;
  });

  const [tempDate, setTempDate] = React.useState<DateRange | undefined>(date);
  const [tempPeriod, setTempPeriod] = React.useState<string | null>(
    currentPeriod,
  );

  const [isOpen, setIsOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sync state when URL or Popover opens
  React.useEffect(() => {
    if (isOpen) {
      if (currentFrom && currentTo) {
        setTempDate({ from: new Date(currentFrom), to: new Date(currentTo) });
        setTempPeriod(null);
      } else {
        setTempDate(undefined);
        setTempPeriod(currentPeriod);
      }
    }
  }, [isOpen, currentFrom, currentTo, currentPeriod]);

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (tempPeriod) {
      params.set("period", tempPeriod);
      params.delete("from");
      params.delete("to");
    } else if (tempDate?.from && tempDate?.to) {
      params.delete("period");
      params.set("from", format(tempDate.from, "yyyy-MM-dd"));
      params.set("to", format(tempDate.to, "yyyy-MM-dd"));
    }

    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  const handleShorthandClick = (val: string) => {
    setTempPeriod(val);
    setTempDate(undefined);
  };

  const displayLabel = () => {
    if (currentPeriod && currentPeriod !== "custom") {
      const found = SHORTHANDS.find((s) => s.value === currentPeriod);
      return found ? found.label : currentPeriod.replace("_", " ");
    }
    if (currentFrom && currentTo) {
      return `${format(new Date(currentFrom), "MMM dd")} - ${format(new Date(currentTo), "MMM dd")}`;
    }
    return "This Week";
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-fit justify-start text-left font-normal h-10 px-4 border-primary/20 hover:border-primary/50 transition-all duration-300 rounded-full bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-md group",
              !date && !currentPeriod && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-0 sm:mr-2 h-4 w-4 text-primary group-hover:scale-110 transition-transform duration-300" />
            <span className="hidden sm:inline-block font-medium">
              {displayLabel()}
            </span>
            <span className="inline-block sm:hidden font-medium ml-2 text-xs">
              {displayLabel()}
            </span>
            <ChevronDown
              className={cn(
                "ml-2 h-4 w-4 text-muted-foreground transition-transform duration-300",
                isOpen && "rotate-180",
              )}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 border-primary/10 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-md bg-background/95"
          align="end"
          sideOffset={8}
          collisionPadding={16}
        >
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex flex-col md:flex-row min-h-[300px]"
              >
                {/* Left Sidebar: Shorthands */}
                <div className="w-full md:w-36 border-b md:border-b-0 md:border-r border-primary/10 p-2 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible scrollbar-hide">
                  <p className="hidden md:block text-xs uppercase font-bold text-muted-foreground px-2 mb-2 tracking-widest">
                    Presets
                  </p>
                  {SHORTHANDS.map((s) => (
                    <Button
                      key={s.value}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "justify-start text-xs h-9 px-3 rounded-lg transition-all",
                        tempPeriod === s.value
                          ? "bg-primary/10 text-primary font-bold"
                          : "hover:bg-primary/5",
                      )}
                      onClick={() => handleShorthandClick(s.value)}
                    >
                      <Zap
                        className={cn(
                          "mr-2 h-3 w-3",
                          tempPeriod === s.value
                            ? "text-primary"
                            : "text-muted-foreground opacity-50",
                        )}
                      />
                      {s.label}
                    </Button>
                  ))}
                </div>

                {/* Right: Calendar */}
                <div className="p-3 flex flex-col justify-between min-w-[280px]">
                  <div>
                    <div className="flex items-center justify-between mb-4 px-2">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Filter className="h-4 w-4 text-primary" />
                        {tempPeriod ? "Preset Selected" : "Custom Range"}
                      </h4>
                      {tempDate?.from && (
                        <p className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                          {tempDate.to
                            ? `${format(tempDate.from, "MMM dd")} - ${format(tempDate.to, "MMM dd")}`
                            : format(tempDate.from, "MMM dd")}
                        </p>
                      )}
                    </div>

                    <div
                      className={cn(
                        "overflow-x-auto scrollbar-hide transition-opacity duration-300",
                        tempPeriod === "all_time" &&
                          "opacity-50 pointer-events-none",
                      )}
                    >
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={tempDate?.from || new Date()}
                        selected={tempDate}
                        onSelect={(range) => {
                          setTempDate(range);
                          setTempPeriod(null);
                        }}
                        numberOfMonths={1}
                        disabled={{ after: new Date() }}
                        className="rounded-lg [--cell-size:32px]"
                        classNames={{
                          months:
                            "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                          day_range_start:
                            "bg-primary text-primary-foreground rounded-l-full !important",
                          day_range_end:
                            "bg-primary text-primary-foreground rounded-r-full !important",
                          day_range_middle:
                            "bg-primary/10 text-accent-foreground rounded-none !important",
                          day_selected:
                            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                          day_today:
                            "bg-accent/50 text-accent-foreground font-bold",
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-primary/10">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs px-4 h-9 rounded-lg"
                      onClick={() => setIsOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="text-xs px-6 h-9 rounded-lg shadow-lg"
                      onClick={handleApply}
                      disabled={
                        !tempPeriod && (!tempDate?.from || !tempDate?.to)
                      }
                    >
                      Apply Filter
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </PopoverContent>
      </Popover>
    </div>
  );
}
