import React from 'react'
import { Card } from '../ui/card'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function PromoPoster() {
    return (
        <div className='bg-accent-pink-100 md:p-8 rounded-xl md:flex w-full relative'>
            <div className='lg:w-[500px] h-full bg-[url("/illustrations/lines.svg")] bg-no-repeat bg-cover absolute top-0 right-0'></div>
            <div className='w-full md:w-2/3 p-4 font-semibold text-foreground flex flex-col gap-16'>
                <h3 className='text-3xl lg:max-w-2/5'>List Your College Opportunities Easily on Oppskills</h3>
                <div className='grid gap-4 grid-cols-1 md:grid-cols-3'>
                    {
                        [
                            {
                                text: "Competitions",
                                link: "/opportunities"
                            },
                            {
                                text: "Events",
                                link: "/events"
                            },
                            {
                                text: "Festivals",
                                link: "/festivals"
                            },
                        ].map((e, i) => (
                            <Link href={e.link} key={i}>
                                <Card className='flex flex-col gap-6 p-2 w-full items-end bg-neutral-100 group hover:cursor-pointer'>
                                    <h2 className='text-neutral-800 w-full'>{e.text}</h2>
                                    <Link href={e.link} className='text-sm relative scale-100 group-hover:scale-120'>
                                    </Link>
                                    <ArrowRight className='text-accent-pink-500 group-hover:scale-120' />

                                </Card>
                            </Link>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}
