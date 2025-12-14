"use client"
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, AlignLeft, CalendarDays, ChevronDown, Clock, FileEdit, Globe, Import, IndianRupee, Lock, MapPin, Plus, University, Upload, Users, Wand2 } from 'lucide-react'
import EventCard from '@/components/ui/derived/EventCard'
import HackathonInput from '@/components/ui/hackathon/Input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import RichTextEditor from '@/components/ui/editor/RichtextEditor'
import { format } from 'date-fns'
import Image from 'next/image'
import React, { useState } from 'react'
import { toast } from 'sonner'

export default function page() {

  const InputBlock = ({ icon, label, subLabel, children, className }: { icon?: React.ReactNode, label: React.ReactNode, subLabel?: string, children?: React.ReactNode, className?: string }) => (
    <div className={`bg-muted-foreground/5 rounded-xl p-4 flex flex-col justify-center gap-1 hover:bg-muted/80 transition-colors cursor-pointer group ${className}`}>
      <div className='flex items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors'>
        {icon}
        <span className='font-medium text-lg'>{label}</span>
      </div>
      {subLabel && <p className='text-muted-foreground/60 text-sm pl-9'>{subLabel}</p>}
      {children}
    </div>
  )

  interface FormData {
    eventFestName: string;
    eventFestVisibility: string;
    eventName: string;
    eventDate: Date | undefined;
    eventLocation: string;
    eventTimeFrom: string;
    eventDescription: string;
    eventThumbnail: string;
    eventRegisterBy: any;
    hackathonType: string;
    participantType: string;
  }

  const [formData, setFormData] = useState<FormData>({
    eventFestName: "",
    eventFestVisibility: "",
    eventName: "",
    eventDate: undefined,
    eventLocation: "",
    eventTimeFrom: "",
    eventDescription: "",
    eventThumbnail: "",
    hackathonType: "",
    participantType: "",
    eventRegisterBy: ""
  });

  const [showFestivalModal, setShowFestivalModal] = useState(false);

  interface FestivalFormData {
    poster: string;
    website: string;
    name: string;
    location: string;
    description: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
  }

  const [festivalFormData, setFestivalFormData] = useState<FestivalFormData>({
    poster: "",
    website: "",
    name: "",
    location: "",
    description: "",
    startDate: undefined,
    endDate: undefined
  });

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
              <EventCard thumbnail={formData.eventThumbnail} title={formData.eventName} location={formData.eventLocation} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='flex-1 flex flex-col gap-6'>
          {/* Header Dropdowns */}
          <div className='flex w-full justify-between items-center'>
            {/* Event Context Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className='cursor-pointer'>
                  <HackathonInput>
                    {formData.eventFestName || "Individual Hackathon"} <ChevronDown className='w-4 h-4' />
                  </HackathonInput>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[300px]">
                <DropdownMenuLabel>Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  {
                    title: "Individual Hackathon",
                    description: "Doesn’t show up under any festivals.",
                    value: "Individual Hackathon"
                  },
                  {
                    title: "E-Summit 2025",
                    description: "Events will be shown under E-Summit 2025.",
                    value: "E-Summit 2025"
                  }
                ].map((item) => (
                  <DropdownMenuItem
                    key={item.value}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                    onClick={() => setFormData({ ...formData, eventFestName: item.value })}
                  >
                    <span className="font-medium text-base">{item.title}</span>
                    <span className="text-muted-foreground text-xs">{item.description}</span>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="p-2 cursor-pointer focus:bg-transparent"
                  onClick={() => setShowFestivalModal(true)}
                >
                  <div className='flex items-center gap-2 text-primary font-medium w-full'>
                    <span className='font-semibold text-base py-1'>Create New Festival</span>
                    <Plus className='w-4 h-4 ml-auto' />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Visibility Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className='cursor-pointer'>
                  <HackathonInput>
                    {formData.eventFestVisibility === 'Public' ? <Globe className='w-4 h-4' /> : formData.eventFestVisibility === 'Private' ? <Lock className='w-4 h-4' /> : <University className='w-4 h-4' />}
                    {formData.eventFestVisibility || 'Public'} <ChevronDown className='w-4 h-4' />
                  </HackathonInput>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[300px]">
                <DropdownMenuLabel>Visibility</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  {
                    title: "Public",
                    description: "Shown on platform any one can register for the event.",
                    value: "Public"
                  },
                  {
                    title: "Private",
                    description: "Unlisted. Only with People with link can register",
                    value: "Private"
                  },
                  {
                    title: "University only",
                    description: "Only students from your college can register for the event.",
                    value: "University only"
                  }
                ].map((item) => (
                  <DropdownMenuItem
                    key={item.value}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                    onClick={() => setFormData({ ...formData, eventFestVisibility: item.value })}
                  >
                    <span className="font-medium text-base">{item.title}</span>
                    <span className="text-muted-foreground text-xs">{item.description}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Form Grid */}
          <div className='flex flex-col gap-4'>

            {/* Name and Date */}
            <div className='grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-4'>
              <div className='flex items-center min-h-[100px]'>
                <input
                  value={formData.eventName}
                  onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                  className='text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 w-full'
                  placeholder='Hackathon Name'
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <div className='h-full'>
                    <InputBlock
                      icon={<CalendarIcon className='w-6 h-6' />}
                      label={formData.eventDate ? format(formData.eventDate, "PPP") : "Select Date"}
                      subLabel="Hackathon Date"
                      className="bg-muted h-full"
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Event Date</label>

                    <div className="not-prose border rounded-md p-2">
                      <Calendar
                        mode="single"
                        selected={formData.eventDate}
                        onSelect={(date) =>
                          setFormData({ ...formData, eventDate: date })
                        }
                      />
                    </div>
                  </div>


                </PopoverContent>
              </Popover>
            </div>

            {/* Location and Time */}
            <div className='grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-4'>
              <Dialog>
                <DialogTrigger asChild>
                  <div className='h-full'>
                    <InputBlock
                      icon={<MapPin className='w-6 h-6' />}
                      label={formData.eventLocation || "Add Hackathon Location"}
                      subLabel="Offline location or virtual link"
                      className="h-full"
                    />
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Event Location</DialogTitle>
                    <DialogDescription>
                      Enter the location where the event will take place.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.eventLocation}
                        onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
                        placeholder="e.g. San Francisco, CA or https://zoom.us/..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className='bg-muted-foreground/5 rounded-xl p-4 flex flex-col justify-center gap-1 hover:bg-muted/80 transition-colors cursor-pointer group'>
                <div className='flex items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors'>
                  <Clock className='w-6 h-6' />
                  <input
                    type="time"
                    value={formData.eventTimeFrom}
                    onChange={(e) => setFormData({ ...formData, eventTimeFrom: e.target.value })}
                    className="bg-transparent border-none p-0 text-lg font-medium focus:ring-0 outline-none text-foreground w-full cursor-pointer"
                  />
                </div>
                <p className='text-muted-foreground/60 text-sm pl-9'>Hackathon Time</p>
              </div>
            </div>

            {/* Description */}
            <Dialog>
              <DialogTrigger asChild>
                <div className='h-full'>
                  <InputBlock
                    icon={<AlignLeft className='w-6 h-6' />}
                    label={formData.eventDescription ? "Description" : "Add Description"}
                    subLabel={formData.eventDescription ? formData.eventDescription.replace(/<[^>]*>?/gm, '') + (formData.eventDescription.length > 50 ? "..." : "") : undefined}
                    className="h-full"
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-3xl flex flex-col">
                <DialogHeader>
                  <DialogTitle>Event Description</DialogTitle>
                </DialogHeader>
                <div className="overflow-auto">
                  <RichTextEditor
                    value={formData.eventDescription}
                    onChange={(content: any) => {
                      setFormData({ ...formData, eventDescription: content })
                    }}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={() => { /* It's already in state */ }}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Event Details */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className='h-full'>
                    <InputBlock
                      icon={<Wand2 className='w-5 h-5' />}
                      label="Hackathon Type"
                      subLabel={formData.hackathonType}
                      className="h-full"
                    />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[250px]">
                  {[
                    "Coding Hackathon",
                    "Idea Hackathon",
                    "Case Study Competition",
                    "Design Hackathon",
                    "Open Hackathon"
                  ].map((type) => (
                    <DropdownMenuItem
                      key={type}
                      className="cursor-pointer py-2 font-medium"
                      onClick={() => setFormData({ ...formData, hackathonType: type })}
                    >
                      {type}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className='h-full'>
                    <InputBlock
                      icon={<Users className='w-5 h-5' />}
                      label="Participant Type"
                      subLabel={formData.participantType}
                      className="h-full"
                    />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[250px]">
                  {[
                    "Individual Participants",
                    "Team of 2",
                    "Team of 3",
                    "Team of 4",
                    "Team of 5",
                    "Team of 6",
                    "More than 6"
                  ].map((type) => (
                    <DropdownMenuItem
                      key={type}
                      className="cursor-pointer py-2 font-medium"
                      onClick={() => setFormData({ ...formData, participantType: type })}
                    >
                      {type}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Popover>
                <PopoverTrigger asChild>
                  <div className='h-full'>
                    <InputBlock
                      icon={<CalendarDays className='w-5 h-5' />}
                      label={formData.eventRegisterBy ? format(formData.eventRegisterBy, "PPP") : "Select Date"}
                      subLabel="Last Date"
                      className="bg-muted h-full"
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.eventRegisterBy}
                    onSelect={(date) => setFormData({ ...formData, eventRegisterBy: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Registration Form Setup */}
            <InputBlock
              icon={<FileEdit className='w-6 h-6' />}
              label="Registration Form"
              subLabel="Customize registration questions"
            />

            <Button
              className='w-full font-semibold rounded-full'
              size={'lg'}
              onClick={() => {
                if (!formData.eventName) {
                  toast.error("Event Name is required");
                  return;
                }
                if (!formData.eventDate) {
                  toast.error("Event Date is required");
                  return;
                }
                if (!formData.eventLocation) {
                  toast.error("Event Location is required");
                  return;
                }
                if (!formData.eventRegisterBy) {
                  toast.error("Registration Last Date is required");
                  return;
                }

                // Validate dates
                if (formData.eventRegisterBy > formData.eventDate) {
                  toast.error("Registration Last Date must be before the Event Date");
                  return;
                }

                toast.success("Event Listed Successfully!");
                console.log("Form Data:", formData);
              }}
            >
              List Event
            </Button>

          </div>
        </div>
      </div>
      {/* Create Festival Modal */}
      <Dialog open={showFestivalModal} onOpenChange={setShowFestivalModal}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Festivals Details</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-8 mt-4">
            {/* Left Column */}
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Add Festival Poster</Label>
                <div className="relative w-full aspect-video bg-muted rounded-xl overflow-hidden group cursor-pointer border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors">
                  {festivalFormData.poster ? (
                    <Image src={festivalFormData.poster} alt="Poster" fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                      <Image src="/tmp/hackathon.jpg" alt="Preview" fill className="object-cover opacity-50" />
                      <div className="absolute inset-0 bg-black/40" />
                      <div className="z-10 bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium border border-white/20">
                        <Upload className="w-4 h-4" /> Upload
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Input
                placeholder="Website"
                className="rounded-full h-12 px-6 bg-muted/50 border-transparent focus:bg-background transition-colors"
                value={festivalFormData.website}
                onChange={(e) => setFestivalFormData({ ...festivalFormData, website: e.target.value })}
              />
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-4">
              <div>
                <Label className="text-muted-foreground mb-1 block">Festival Name</Label>
                <input
                  value={festivalFormData.name}
                  onChange={(e) => setFestivalFormData({ ...festivalFormData, name: e.target.value })}
                  className='text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 w-full'
                  placeholder='Festival Name'
                />
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <div>
                    <InputBlock
                      icon={<MapPin className='w-6 h-6' />}
                      label={festivalFormData.location || "Add Festival Location"}
                      subLabel="Offline location or virtual link"
                    />
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Festival Location</DialogTitle></DialogHeader>
                  <Input
                    value={festivalFormData.location}
                    onChange={(e) => setFestivalFormData({ ...festivalFormData, location: e.target.value })}
                    placeholder="Enter location"
                  />
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <div>
                    <InputBlock
                      icon={<AlignLeft className='w-6 h-6' />}
                      label={festivalFormData.description ? "Description" : "Add Description"}
                      subLabel={festivalFormData.description ? festivalFormData.description.replace(/<[^>]*>?/gm, '').substring(0, 50) + "..." : undefined}
                    />
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                  <DialogHeader><DialogTitle>Festival Description</DialogTitle></DialogHeader>
                  <div className="flex-1 overflow-auto border rounded-md">
                    <RichTextEditor
                      value={festivalFormData.description}
                      onChange={(content: string) => setFestivalFormData({ ...festivalFormData, description: content })}
                    />
                  </div>
                  <DialogFooter><Button>Save</Button></DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="grid grid-cols-2 gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <div>
                      <InputBlock
                        icon={<CalendarIcon className='w-6 h-6' />}
                        label={festivalFormData.startDate ? format(festivalFormData.startDate, "PPP") : "Start Date"}
                        subLabel="Start Date"
                        className="bg-muted"
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={festivalFormData.startDate} onSelect={(date) => setFestivalFormData({ ...festivalFormData, startDate: date })} />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <div>
                      <InputBlock
                        icon={<CalendarIcon className='w-6 h-6' />}
                        label={festivalFormData.endDate ? format(festivalFormData.endDate, "PPP") : "End Date"}
                        subLabel="End Date"
                        className="bg-muted"
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={festivalFormData.endDate} onSelect={(date) => setFestivalFormData({ ...festivalFormData, endDate: date })} />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                className="w-full rounded-full mt-4 font-semibold text-lg h-12"
                onClick={() => {
                  console.log("Festival Data:", festivalFormData);
                  toast.success("Festival Listed!");
                  setShowFestivalModal(false);
                }}
              >
                List Festival
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
