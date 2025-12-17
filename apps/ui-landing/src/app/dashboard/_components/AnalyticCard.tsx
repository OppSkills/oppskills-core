import { cn } from "@/lib/utils";

export default function AnalyticCard({ type = "normal", children, className }: { type?: String, children: React.ReactNode, className?: String }) {
    return (
        <div className={cn("rounded-[20px] bg-linear-to-l from-primary-100 to-neutral-100 p-4 border border-primary/30", className)}>
            {children}
        </div>
    )
}
