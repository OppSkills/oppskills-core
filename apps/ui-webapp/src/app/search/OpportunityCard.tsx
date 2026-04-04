import { Calendar, MapPin, Award, ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { formatInTimeZone } from 'date-fns-tz'
import { formatCount } from '@/lib/tools'

interface OpportunityCardProps {
    opportunity: {
        id: string;
        slug: string;
        name: string;
        bannerImageUrl: string | null;
        startDate: string;
        registrationDeadline: string | null;
        locationAddress: string | null;
        type: 'HACKATHON' | 'EVENT';
        registrationCount?: number;
        prizeTotalWorthAmount?: number | null;
        entryFeeAmount?: number | null;
        isFree?: boolean;
        currency?: string;
    }
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
    const baseUrl = opportunity.type === 'HACKATHON' ? '/hackathons' : '/events'
    const startDate = new Date(opportunity.startDate)
    const formattedStartDate = formatInTimeZone(startDate, 'UTC', 'dd MMM yyyy')

    const formattedDeadline = opportunity.registrationDeadline
        ? formatInTimeZone(new Date(opportunity.registrationDeadline), 'UTC', 'dd MMM yyyy')
        : 'N/A'

    const feeDisplay = opportunity.isFree
        ? 'Free'
        : `Paid ${opportunity.currency === "INR" ? "₹" : opportunity.currency} ${Number(opportunity.entryFeeAmount ?? 0).toLocaleString()}`

    return (
        <Link href={`${baseUrl}/${opportunity.slug}`} className="block">
            <div className='flex w-full flex-col gap-4 relative'>
                <div className='group relative rounded-2xl overflow-hidden aspect-video bg-neutral-100'>
                    {opportunity.bannerImageUrl ? (
                        <Image
                            src={opportunity.bannerImageUrl}
                            alt={opportunity.name}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-200/60 group-hover:bg-neutral-200 transition-colors duration-300">
                            <span className="text-neutral-400 font-bold text-4xl opacity-50">
                                {opportunity.name.charAt(0)}
                            </span>
                        </div>
                    )}
                    <div className='absolute bottom-2 left-2'>
                        <div className='flex bg-neutral-100 text-neutral-900 rounded-full px-2 py-1'>
                            <span className='text-xs'>{formattedStartDate}</span>
                        </div>
                    </div>
                </div>
                <div className='flex-1'>
                    <h3 className='text-xl text-neutral-900 font-semibold'>{opportunity.name}</h3>
                    <p className='text-xs text-neutral-600'>{opportunity.locationAddress || "OppSkills"}</p>
                </div>
                <div className='flex w-full justify-between'>
                    <div>
                        <p className='text-xs text-neutral-500'>Register By</p>
                        <p className='text-base text-neutral-700'>{formattedDeadline}</p>
                    </div>
                    <div>
                        <p className='text-xs text-neutral-500'>Entry Fee</p>
                        <p className='text-base text-neutral-700'>{feeDisplay}</p>
                    </div>
                </div>
            </div>
        </Link>
    )
}


