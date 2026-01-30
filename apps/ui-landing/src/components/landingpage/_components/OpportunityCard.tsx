import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OpportunityCardProps {
    href: string;
    imageSrc: string | null;
    title: string;
    organizationName?: string | null;
    isFree?: boolean;
    mode?: string;
    topRightBadge?: React.ReactNode;
    overlayContent?: React.ReactNode;
    footerContent: React.ReactNode;
}

export function OpportunityCard({
    href,
    imageSrc,
    title,
    organizationName = "OppSkills",
    isFree = false,
    mode = "Online",
    topRightBadge,
    overlayContent,
    footerContent,
}: OpportunityCardProps) {
    return (
        <Link href={href} prefetch={false} className="h-full block">
            <Card className="group h-full flex flex-col overflow-hidden border-border/50 bg-card hover:shadow-lg transition-all duration-300 rounded-3xl">
                {/* Image Section */}
                <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-muted flex-shrink-0">
                    {imageSrc ? (
                        <Image
                            src={imageSrc}
                            alt={title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                            <span className="text-white font-bold opacity-20 text-4xl">
                                {title.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                    {/* Top Right Badge (e.g. Type) */}
                    {topRightBadge && (
                        <div className="absolute top-2 right-2 z-10">
                            {topRightBadge}
                        </div>
                    )}

                    {/* Bottom Left Badge (Common Style) */}
                    <div className="absolute -bottom-0.5 left-0 flex items-center">
                        <div className="py-1 pr-3 pl-5 bg-background text-primary-500 text-xs rounded-tr-lg flex gap-2 items-center">
                            <span>{isFree ? "Free" : "Paid"}</span>
                            <span className="text-[6px]">  ●  </span>
                            <span>{mode}</span>
                        </div>
                        <div className="relative -left-[0.5px] -top-[0.5px] self-stretch w-5  flex-1 overflow-hidden">
                            <Image
                                src="/illustrations/curve.svg"
                                alt="curve"
                                fill
                                className="object-cover object-right"
                            />
                        </div>
                    </div>

                    {overlayContent && (
                        <div className="absolute inset-0 p-2 flex flex-col justify-end">
                            {overlayContent}
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="relative bg-card pt-4 px-5 pb-5 flex flex-col flex-1 min-h-[140px]">
                    <div className="flex-1 flex flex-col">
                        <h3 className="text-xl text-neutral-900 font-semibold line-clamp-2 leading-tight tracking-tight min-h-[3.25rem]">
                            {title}
                        </h3>

                        {(organizationName) && (
                            <p className="text-neutral-600 text-xs line-clamp-1 mt-1">
                                {organizationName}
                            </p>
                        )}
                    </div>

                    <div className="mt-auto">
                        {footerContent}
                    </div>
                </div>
            </Card>
        </Link>
    );
}
