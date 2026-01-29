import React from 'react'
import { Card } from '../ui/card'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function PromoPoster() {
    return (
        <div className='bg-accent-pink-100 md:p-8 rounded-xl md:flex w-full relative'>
            <div className='lg:w-[500px] h-full bg-[url("/illustrations/lines.svg")] bg-no-repeat bg-cover absolute top-0 right-0'></div>
            <div className='w-full p-4 font-semibold text-foreground flex flex-col gap-16'>
                <h3 className='text-3xl lg:max-w-2/5'>List Your College Opportunities Easily on Oppskills</h3>
                <div className='grid gap-4 grid-cols-1 md:grid-cols-3 w-1/2'>
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
                                <Card className='flex flex-col gap-6 py-2 px-3 min-h-[100px] w-full items-end bg-neutral-100 group hover:cursor-pointer shadow-[0_2px_12px_0_rgba(0,0,0,0.10),inset_0_0_4px_2px_rgba(69,69,69,0.16)]'>
                                    <div className='w-full flex-1'>
                                        <h2 className='text-neutral-800'>{e.text}</h2>
                                    </div>
                                    <ArrowRight className='text-accent-pink-500 group-hover:scale-120 w-6 h-6' />
                                </Card>
                            </Link>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}
