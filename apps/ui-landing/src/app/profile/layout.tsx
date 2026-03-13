"use client"
import React, { useState } from 'react'
import { ProfileLeftSidebar } from './_components/profile-left-sidebar'

export default function Layout({ children }: { children: React.ReactNode }) {
    const [activePage, setActivePage] = useState("Profile");
    return (
        <div className='flex gap-4 p-4 bg-neutral-200 h-screen'>
            <ProfileLeftSidebar setActivePage={setActivePage} />
            <div className='flex-1 flex flex-col gap-4'>
                <div className='p-6 bg-neutral-100 rounded-3xl'>
                    <h3 className='font-semibold text-2xl'>{activePage}</h3>
                </div>
                {children}
            </div>
        </div>
    )
}
