import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AnalyticCardProps {
  title: string;
  value: string | number;
  badge?: string;
  badgeValue?: string | number;
  type?: "normal" | "highlight";
  className?: string;
}

export default function AnalyticCard({
  title,
  value,
  badge,
  badgeValue,
  type = "normal",
  className,
}: AnalyticCardProps) {
  const showMetadata = badge && badgeValue !== undefined && badgeValue !== "";

  return (
    <div
      className={cn(
        "rounded-2xl p-4 border border-primary/30 flex flex-col justify-center h-full",
        type === "highlight"
          ? "bg-[radial-gradient(circle_at_top_left,var(--color-primary-700)_0%,var(--color-primary-900)_70%)] text-primary-foreground"
          : "bg-background lg:bg-linear-to-l lg:from-primary-100 lg:to-neutral-100",
        className
      )}
    >
      <div className="flex flex-col gap-2 md:gap-4 justify-between h-full">
        <div className="flex flex-col gap-2 md:gap-4">
          <p
            className={cn(
              type === "highlight" ? "text-neutral-100" : "text-primary-900"
            )}
          >
            {title}
          </p>
          <p className="text-4xl md:text-5xl font-medium tracking-tight">
            {value}
          </p>
        </div>

        {showMetadata && (
          <div className="flex justify-between w-full items-center">
            <p
              className={cn(
                "text-xs font-medium",
                type === "normal" ? "text-primary-700" : "text-primary-100"
              )}
            >
              {badge}
            </p>
            <Badge variant={type === "highlight" ? "default" : "gradient"} className="min-w-auto px-3 text-primary-100">
              {badgeValue}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
