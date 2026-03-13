"use client";

import React from 'react'
import { Calendar, CheckCircle2, Clock } from 'lucide-react'
import { ProfileStats } from '../_components/profile-stats'
import { Badge } from '@/components/ui/badge'

const OPPORTUNITIES = [
    { title: "Global AI Hackathon", type: "Hackathon", status: "Winner", date: "Mar 15, 2024", color: "bg-green-100 text-green-700" },
    { title: "Full Stack Workshop", type: "Workshop", status: "Completed", date: "Feb 20, 2024", color: "bg-blue-100 text-blue-700" },
    { title: "Design Sprint 2024", type: "Competition", status: "Applied", date: "Jan 10, 2024", color: "bg-amber-100 text-amber-700" },
    { title: "Open Source Summit", type: "Conference", status: "Participated", date: "Dec 05, 2023", color: "bg-purple-100 text-purple-700" },
]

export default function OpportunityHistoryPage() {
    return (
        <div className='flex gap-4 flex-1 h-full'>
            <div className='p-8 bg-neutral-100 rounded-3xl flex-1 overflow-y-auto'>
                <div className='space-y-4'>
                    {OPPORTUNITIES.map((o, i) => (
                        <div key={i} className='p-6 bg-white rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow'>
                            <div className='flex items-center gap-6'>
                                <div className='p-3 bg-neutral-50 rounded-xl'>
                                    {o.status === "Winner" ? <CheckCircle2 className='text-green-500' /> : <Clock className='text-neutral-400' />}
                                </div>
                                <div>
                                    <h4 className='font-bold text-xl text-neutral-800'>{o.title}</h4>
                                    <div className='flex items-center gap-2 text-neutral-500 mt-1'>
                                        <Calendar className='w-4 h-4' />
                                        <span>{o.date}</span>
                                        <span className='mx-1'>•</span>
                                        <span>{o.type}</span>
                                    </div>
                                </div>
                            </div>
                            <Badge className={`${o.color} border-none px-4 py-1.5 rounded-full text-sm font-bold`}>
                                {o.status}
                            </Badge>
                        </div>
                    ))}
                </div>
            </div>
            <ProfileStats />
        </div>
    )
}
