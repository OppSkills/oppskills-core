import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Bell, BellIcon } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

export default function FlowCard({
    title,
    description,
    image,
    step
}: {
    title: string;
    description: string;
    image: string;
    step: number;
}) {
    return (
        <Card className='p-2'>
            <div className='flex flex-col gap-4 w-full h-full'>
                <div className='w-full h-[220px] flex justify-center items-center bg-[url("/illustrations/bg.svg")] bg-cover bg-center overflow-hidden rounded-lg'>
                    <Image alt={`Step-${step} Oppskills Flow`} src={`/illustrations/${image}`} width={100} height={100} />
                </div>
                <p className='text-[#A77800] text-xs'>STEP {step}</p>
                <p className='text-xl font-semibold text-neutral-800'>{title}</p>
                <p className='text-neutral-600'>{description}</p>
            </div>
        </Card>
    )
}
