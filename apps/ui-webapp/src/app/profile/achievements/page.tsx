"use client";

import { Trophy, Award, Star, Zap } from 'lucide-react'

const ACHIEVEMENTS = [
    { title: "First Hackathon", date: "Jan 12, 2024", icon: Award, color: "text-amber-500", bg: "bg-amber-100" },
    { title: "10 Days Streak", date: "Feb 05, 2024", icon: Zap, color: "text-blue-500", bg: "bg-blue-100" },
    { title: "Top 10% Contributor", date: "Mar 01, 2024", icon: Star, color: "text-purple-500", bg: "bg-purple-100" },
    { title: "Problem Solver", date: "Recent", icon: Trophy, color: "text-green-500", bg: "bg-green-100" },
]

export default function AchievementsPage() {
    return (
        <div className='flex gap-4 flex-1 h-full'>
            <div className='p-0 flex-1 overflow-y-auto'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {ACHIEVEMENTS.map((a, i) => (
                        <div key={i} className='p-6 bg-white rounded-2xl flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow'>
                            <div className={`p-4 ${a.bg} rounded-2xl`}>
                                <a.icon className={`w-8 h-8 ${a.color}`} />
                            </div>
                            <div>
                                <h4 className='font-bold text-xl text-neutral-800'>{a.title}</h4>
                                <p className='text-neutral-500'>{a.date}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className='mt-12'>
                    <h4 className='font-bold text-2xl mb-6 text-neutral-800'>Certificates</h4>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        {[1, 2, 3].map(i => (
                            <div key={i} className='aspect-video bg-white border-2 border-dashed border-neutral-300 rounded-2xl flex flex-col items-center justify-center p-4 text-center group cursor-pointer hover:border-primary-400 transition-colors'>
                                <Award className='w-10 h-10 text-neutral-300 group-hover:text-primary-400 mb-2' />
                                <p className='text-neutral-400 group-hover:text-primary-600 font-medium'>Course Certificate #{i}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    )
}
