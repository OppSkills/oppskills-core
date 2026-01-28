import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Bell, BellIcon } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

export default function FlowCard({
    title,
    description,
    image
}: {
    title: string;
    description: string;
    image: string;
}) {
    return (
        <Card className='p-4'>
            <div className='flex w-full h-full'>
                <div className='flex flex-col gap-6 w-2/3'>
                    <h2 className='font-semibold text-2xl text-foreground'>{title}</h2>
                    <p className='text-neutral-600'>{description}</p>
                    <div>
                        <Button className='rounded-full'>
                            <BellIcon />
                            Notify
                        </Button>
                    </div>
                </div>
                <div className='w-1/3'>
                    <Image
                        src={`/illustrations/${image}`}
                        alt="Flow Card"
                        width={500}
                        height={500}
                    />
                </div>
            </div>
        </Card>
    )
}
