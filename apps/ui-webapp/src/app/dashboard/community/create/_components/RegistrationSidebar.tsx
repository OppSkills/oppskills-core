"use client";

import React from "react";
import Image from "next/image";

export default function RegistrationSidebar() {
    const cards = [
        {
            id: 1,
            title: "Reach Skilled Talent",
            description:
                "Connect with students, creators, developers, and builders actively looking for opportunities.",
            image: "/illustrations/community/rocket.svg",
            imageAlign: "left" as const,
        },
        {
            id: 2,
            title: "Broadcast Events & Roles",
            description:
                "Post hackathons, openings, workshops, and announcements directly to your community.",
            image: "/illustrations/community/broadcast.svg",
            imageAlign: "right" as const,
        },
        {
            id: 3,
            title: "Build Your Core Team",
            description:
                "Assign roles, manage volunteers, and organize contributors in one workspace.",
            image: "/illustrations/community/hash.svg",
            imageAlign: "left" as const,
        },
        {
            id: 4,
            title: "Gamified Community Growth",
            description:
                "Boost engagement with achievements, referrals, goals, and recognition systems.",
            image: "/illustrations/community/trophy.svg",
            imageAlign: "right" as const,
        },
    ];

    return (
        <div className="w-full max-w-lg flex flex-col gap-6 p-4 md:p-6 select-none">
            <h2 className="text-2xl font-bold text-neutral-800 leading-tight">
                Why Communities Grow<br />Faster On Oppskills
            </h2>

            <div className="flex flex-col gap-5">
                {cards.map((card) => {
                    const isLeft = card.imageAlign === "left";
                    return (
                        <div
                            key={card.id}
                            className="w-full py-4 min-h-40 bg-primary-100 border border-primary-300 rounded-2xl flex flex-row items-center justify-between gap-1 relative overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-300"
                        >
                            {isLeft && (
                                <div className="relative -left-1.25 w-28 h-28 md:w-32 md:h-32 shrink-0 flex items-center justify-center">
                                    <Image
                                        src={card.image}
                                        alt={card.title}
                                        fill
                                        className="object-contain"
                                        priority
                                    />
                                </div>
                            )}

                            <div className={`flex flex-col gap-1.5 z-10 flex-1 ${!isLeft ? "pl-4" : ""}`}>
                                <h3 className="text-neutral-900 text-lg font-bold leading-snug">
                                    {card.title}
                                </h3>
                                <p className="text-neutral-700 text-sm leading-relaxed">
                                    {card.description}
                                </p>
                            </div>

                            {!isLeft && (
                                <div className="relative -right-1.25 w-28 h-28 md:w-32 md:h-32 shrink-0 flex items-center justify-center">
                                    <Image
                                        src={card.image}
                                        alt={card.title}
                                        fill
                                        className="object-contain"
                                        priority
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <p className="italic text-sm text-primary-600 mt-2 font-medium">
                We&apos;re constantly rolling out improvements, so your community is always in good hands!
            </p>
        </div>
    );
}
