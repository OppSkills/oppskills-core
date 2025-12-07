import * as React from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    side?: "top" | "right" | "bottom" | "left";
    className?: string;
}

const RTooltip: React.FC<TooltipProps> = ({
    content,
    children,
    side = "top",
    className,
}) => {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {children}
            </TooltipTrigger>
            <TooltipContent side={side} className={className}>
                {content}
            </TooltipContent>
        </Tooltip>
    );
};


export default RTooltip;
