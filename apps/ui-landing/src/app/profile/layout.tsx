"use client"
import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ProfileLeftSidebar, ProfileNavContent } from './_components/profile-left-sidebar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function Layout({ children }: { children: React.ReactNode }) {
    const [activePage, setActivePage] = useState("Profile");
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    return (
        <div className='flex flex-col lg:flex-row gap-4 p-2 lg:p-4 bg-neutral-200 min-h-screen'>
            {/* Mobile Header */}
            <header className="lg:hidden flex items-center justify-between p-4 bg-neutral-100 rounded-2xl mb-2">
                <Link href="/">
                    <Image
                        src="/logo.svg"
                        alt="OppSkills"
                        width={120}
                        height={24}
                    />
                </Link>
                <div className="flex items-center gap-4">
                    <h3 className='font-semibold text-lg text-neutral-800'>{activePage}</h3>
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <button className="p-2 hover:bg-neutral-200 rounded-lg transition-colors">
                                <Menu className="w-6 h-6 text-neutral-700" />
                            </button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] p-8 pt-12 bg-neutral-100 border-r-0">
                            <ProfileNavContent 
                                setActivePage={setActivePage} 
                                onItemClick={() => setOpen(false)} 
                            />
                        </SheetContent>
                    </Sheet>
                </div>
            </header>

            <ProfileLeftSidebar setActivePage={setActivePage} />
            
            <div className='flex-1 flex flex-col gap-4 min-w-0'>
                <div className='hidden lg:block p-6 bg-neutral-100 rounded-3xl shadow-sm'>
                    <h3 className='font-bold text-2xl tracking-tight text-neutral-800'>{activePage}</h3>
                </div>
                
                <div className="flex-1">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={pathname}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="h-full"
                    >
                      {children}
                    </motion.div>
                  </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
