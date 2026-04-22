import Image from 'next/image'
import React from 'react'
import { Marquee } from "@/components/ui/marquee"
import { cn } from "@/lib/utils"

const logos = [
    "iith.png", "iitd.png", "sharda.png", "krrc.png", "gla.png",
    'abes.png', 'gl_bajaj.png', 'ibs.png', 'iilm.png', 'jcby_ymca.png',
    'lpu.png', 'mait.png', 'newton.png', 'newton_school.png', 'nit_d.png',
    'niu.png', 'rishihood.png', 'thoughtworks.png', 'tiips.png'
];

const firstRow = logos.slice(0, Math.ceil(logos.length / 2));
const secondRow = logos.slice(Math.ceil(logos.length / 2));

const LogoCard = ({ img }: { img: string }) => {
    return (
        <div className={cn(
            "relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center overflow-hidden rounded-full border p-6",
            "bg-white hover:bg-neutral-50 transition-all duration-300",
            "border-neutral-200/60 hover:border-primary/40",
            "group/card cursor-pointer hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
        )}>
            <Image
                src={`/logos/${img}`}
                alt={img}
                width={80}
                height={80}
                className="object-contain w-full h-full transition-transform duration-500 group-hover/card:scale-110"
            />
        </div>
    );
};

export default function TrustedBy() {
    return (
        <section className='pb-20 flex flex-col gap-10 overflow-hidden'>
            <div className="flex flex-col gap-3 px-4 sm:px-6">
                <h2 className='text-3xl sm:text-4xl font-bold tracking-tight'>Trusted By</h2>
                <p className='text-neutral-500 text-lg sm:text-xl max-w-2xl'>
                    Top colleges and institutions choose OppSkills to power their premier events and competitions.
                </p>
            </div>

            <div className="relative flex flex-col gap-6 w-full">
                <Marquee pauseOnHover className="[--duration:30s] [--gap:1.5rem]">
                    {firstRow.map((logo) => (
                        <LogoCard key={logo} img={logo} />
                    ))}
                </Marquee>
                <Marquee reverse pauseOnHover className="[--duration:35s] [--gap:1.5rem]">
                    {secondRow.map((logo) => (
                        <LogoCard key={logo} img={logo} />
                    ))}
                </Marquee>

                {/* Gradient Fades */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10"></div>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10"></div>
            </div>
        </section>
    )
}
