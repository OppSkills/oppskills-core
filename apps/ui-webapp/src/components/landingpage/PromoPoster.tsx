"use client"
import { Card } from '../ui/card'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'

export default function PromoPoster() {
    const items = [
        { text: "Competitions", link: "/organize/hackathon" },
        { text: "Events", link: "/organize/event" },
        { text: "Festivals", link: "#" },
    ];

    return (
        <div className='bg-accent-green-100 py-4 md:px-8 md:py-8 sm:rounded-xl md:flex w-full relative'>
            <div className='w-[500px] h-full bg-[url("/illustrations/lines.svg")] bg-no-repeat bg-cover absolute top-0 right-0 z-10 opacity-50 lg:opacity-100'></div>
            <div className='w-full p-4 font-semibold text-foreground flex flex-col gap-12 lg:gap-16 z-20 relative'>
                <h3 className='text-3xl lg:max-w-2/5'>List Your College Opportunities Easily on Oppskills</h3>
                <div className="w-full lg:w-1/2 grid grid-cols-3 gap-4">
                    {items.map((e, i) => (
                        <Link href={e.link} key={i}>
                            <Card className="flex flex-col gap-6 py-2 px-3 min-h-[50px] sm:min-h-[75px] md:min-h-[100px] w-full items-end bg-neutral-100 group hover:cursor-pointer shadow-[0_2px_12px_0_rgba(0,0,0,0.10),inset_0_0_4px_2px_rgba(69,69,69,0.16)]">
                                <div className="w-full flex-1">
                                    <h2 className="text-neutral-800 text-xs sm:text-sm md:text-base lg:text-lg">
                                        {e.text}
                                    </h2>
                                </div>

                                <ArrowRight className="text-accent-green-500 group-hover:scale-125 transition-transform w-6 h-6" />
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
