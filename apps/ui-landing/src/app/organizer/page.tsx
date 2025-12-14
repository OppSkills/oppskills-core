import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import EventCard from '@/components/ui/derived/EventCard'
import HackathonInput from '@/components/ui/hackathon/Input'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlignLeft, Calendar, CalendarDays, ChevronDown, Clock, FileEdit, Globe, Import, IndianRupee, MapPin, Plus, Upload, Users, Wand2 } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

export default function page() {

  const InputBlock = ({ icon, label, subLabel, children, className }: { icon?: React.ReactNode, label: string, subLabel?: string, children?: React.ReactNode, className?: string }) => (
    <div className={`bg-muted-foreground/5 rounded-xl p-4 flex flex-col justify-center gap-1 hover:bg-muted/80 transition-colors cursor-pointer group ${className}`}>
      <div className='flex items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors'>
        {icon}
        <span className='font-medium text-lg'>{label}</span>
      </div>
      {subLabel && <p className='text-muted-foreground/60 text-sm pl-9'>{subLabel}</p>}
      {children}
    </div>
  )

  return (
    <div className='w-full flex justify-center py-8'>
      <div className='w-full xl:max-w-[1161px] flex flex-col lg:flex-row p-2 gap-6'>
        {/* Left Sidebar */}
        <div className='w-full lg:max-w-[371px] flex flex-col gap-6'>
          <h2 className='text-3xl font-semibold'>Hackathon Details</h2>
          <div className="w-full relative h-[220px] overflow-hidden rounded-xl flex items-center justify-center bg-muted">
            <Image
              width={371}
              height={371}
              src='/tmp/hackathon.jpg'
              alt='Hackathon Thumbnail'
              className='w-full h-full object-cover'
            />
            <div className="absolute bottom-2 right-2 rounded-full bg-background/20 backdrop-blur-xl shadow-lg ring-1 ring-white/20 hover:bg-background/40 transition-colors cursor-pointer">
              <p className="text-white px-4 py-2 flex items-center gap-2 text-xs font-medium">
                <Upload className="w-4 h-4" />
                Upload
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className='flex flex-col gap-2'>
            <p className='text-muted-foreground text-sm font-medium'>How your card will look</p>
            <div className='pointer-events-none opacity-80 hover:opacity-100 transition-opacity'>
              <EventCard thumbnail='/tmp/hackathon.jpg' title='Hackathon 1.0' location='Indian Institute of Technology, Delhi' impression={6000} registerBy='20 Dec, 2025' prizes={"1,00,000"} badges={['Online', 'Free']} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='flex-1 flex flex-col gap-6'>
          {/* Header Dropdowns */}
          <div className='flex w-full justify-between items-center'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className='cursor-pointer'>
                  <HackathonInput>
                    Individual Hackathon <ChevronDown className='w-4 h-4' />
                  </HackathonInput>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Team Hackathon</DropdownMenuLabel>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className='cursor-pointer'>
                  <HackathonInput>
                    <Globe className='w-4 h-4' /> Public <ChevronDown className='w-4 h-4' />
                  </HackathonInput>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Visibility</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Private</DropdownMenuLabel>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Form Grid */}
          <div className='flex flex-col gap-4'>

            {/* Name and Date */}
            <div className='grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-4'>
              <div className='flex items-center min-h-[100px]'>
                <input
                  className='text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 w-full'
                  placeholder='Hackathon Name'
                />
              </div>
              <InputBlock
                icon={<Calendar className='w-6 h-6' />}
                label="24 Nov 2025"
                subLabel="Hackathon Date"
                className="bg-muted"
              />
            </div>

            {/* Location and Time */}
            <div className='grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-4'>
              <InputBlock
                icon={<MapPin className='w-6 h-6' />}
                label="Add Hackathon Location"
                subLabel="Offline location or virtual link"
              />
              <InputBlock
                icon={<Clock className='w-6 h-6' />}
                label="09:00 AM"
                subLabel="Hackathon Time"
              />
            </div>

            {/* Description */}
            <InputBlock
              icon={<AlignLeft className='w-6 h-6' />}
              label="Add Description"
            />

            {/* Event Details */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <InputBlock
                icon={<Wand2 className='w-5 h-5' />}
                label="Hackathon Type"
              />
              <InputBlock
                icon={<Users className='w-5 h-5' />}
                label="Participant Type"
              />
              <InputBlock
                icon={<CalendarDays className='w-5 h-5' />}
                label="Last Date"
              />
            </div>

            {/* Registration Form Setup */}
            <InputBlock
              icon={<FileEdit className='w-6 h-6' />}
              label="Registration Form"
              subLabel="Customize registration questions"
            />

            <Button className='w-full font-semibold rounded-full' size={'lg'}>
              List Event
            </Button>

          </div>
        </div>
      </div>
    </div>
  )
}
