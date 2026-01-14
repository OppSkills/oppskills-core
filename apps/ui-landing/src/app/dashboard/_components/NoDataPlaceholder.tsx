import { BarChart3 } from "lucide-react";

interface NoDataPlaceholderProps {
    message?: string;
    className?: string; // Allow custom styling/height
}

export default function NoDataPlaceholder({
    message = "No data available yet",
    className = "h-[200px]",
}: NoDataPlaceholderProps) {
    return (
        <div
            className={`w-full bg-background rounded-[20px] p-6 border border-border flex flex-col items-center justify-center text-muted-foreground ${className}`}
        >
            <div className="bg-muted p-4 rounded-full mb-4">
                <BarChart3 className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-sm font-medium">{message}</p>
        </div>
    );
}
