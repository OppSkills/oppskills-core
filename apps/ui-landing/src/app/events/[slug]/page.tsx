"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { EventSidebar } from "./_components/EventSidebar";
import { EventRegistrationCard } from "./_components/EventRegistrationCard";
import { EventTabs } from "./_components/EventTabs";
import { EventDetails } from "./_components/types";
import Image from "next/image";
import { Mail, Phone, Globe, Linkedin, Twitter, MapPin } from "lucide-react";

// Mock Data
const MOCK_EVENT: EventDetails = {
  id: "1",
  slug: "karan-aujla-music-concery",
  title: "Karan Aujla - It Was All A Dream (World Tour)",
  thumbnail:
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2670&auto=format&fit=crop",
  date: "Sunday, 15 Dec 2024",
  time: "6:00 PM Onwards",
  venueName: "JLN Stadium",
  venueAddress: "Delhi, India",
  tickets: [
    {
      id: "t1",
      name: "Standard Ticket",
      price: 0,
      description:
        "Get ready for the ultimate musical experience as Karan Aujla, the global Punjabi sensation, takes over India with the P Pop Culture Tour in a free entry zone!",
    },
    {
      id: "t2",
      name: "Deluxe Ticket",
      price: 4000,
      description:
        "Get ready for the ultimate musical experience as Karan Aujla, the global Punjabi sensation, takes over India with the P Pop Culture Tour. VIP Access.",
    },
  ],
  about: `
    <p>Get ready for the ultimate musical experience as Karan Aujla, the global Punjabi sensation, takes over India with the <b>It Was All A Dream</b> World Tour! Known for his chart-topping hits and electrifying stage presence, Karan Aujla is set to deliver a performance like never before.</p>
    <br/>
    <p>This massive tour will span multiple cities, bringing fans closer to the magic of his music. Expect high-energy performances, stunning visuals, and an atmosphere buzzing with excitement. Whether you're a die-hard fan or just love great music, this is one event you don't want to miss!</p>
    <br/>
    <p><b>Highlights:</b></p>
    <ul>
      <li>Live performance by Karan Aujla</li>
      <li>State-of-the-art stage setup & audio-visuals</li>
      <li>Exclusive merchandise stalls</li>
      <li>Food & Beverage zones</li>
    </ul>
  `,
  contact: {
    email: "contact@eventmanager.com",
    phone: "+91 98765 43210",
    website: "https://karanaujlatour.com",
  },
  speakers: [
    {
      id: "s1",
      name: "Someone Famous",
      role: "Main Artist",
      company: "Geetan Di Machine",
      avatar:
        "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=800&auto=format&fit=crop&q=60",
    },
  ],
  organizers: [
    {
      id: "o1",
      name: "Event Co.",
      role: "Organizer",
    },
  ],
};

export default function EventDetailsPage() {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState("About Event");

  // In a real app, fetch data based on slug.
  const event = MOCK_EVENT;
  const TABS = ["About Event", "Contact Details", "Speaker"];

  return (
    <div className="min-h-screen bg-transparent py-8 font-sans">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* TOP HEADER SECTION */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-full text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-normal text-muted-foreground">
                Featured in
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                FestName
              </span>
              <span className="text-zinc-400">&gt;</span>
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-6 poppins tracking-tight">
            {event.title}
          </h1>

          <div className="flex flex-wrap gap-6 md:gap-12">
            {/* Date Row */}
            <div className="flex gap-4 items-center">
              <div className="flex-shrink-0 w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 flex flex-col items-center justify-center">
                <span className="text-[10px] uppercase text-zinc-500 font-medium leading-none mb-0.5">
                  Jan
                </span>
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-none">
                  05
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-[15px]">
                  {event.date}
                </h4>
                <p className="text-sm text-zinc-500">{event.time}</p>
              </div>
            </div>

            {/* Location Row */}
            <div className="flex gap-4 items-center">
              <div className="flex-shrink-0 w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-[15px]">
                  {event.venueName}
                </h4>
                <p className="text-sm text-zinc-500">{event.venueAddress}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative items-start">
          {/* Left Column: Image, Tabs, Content */}
          <div className="lg:col-span-2 order-2 lg:order-1 space-y-8">
            {/* Thumbnail */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-sm">
              <Image
                src={event.thumbnail}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Tabs */}
            <EventTabs
              tabs={TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Scrollable Content Sections */}
            <div className="space-y-16">
              {/* ABOUT SECTION */}
              <section id="about-event" className="scroll-mt-48">
                <h2 className="text-2xl font-bold mb-4 text-foreground poppins">
                  About Event
                </h2>
                <div className="prose dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-300 inter">
                  <div dangerouslySetInnerHTML={{ __html: event.about }} />
                </div>
              </section>

              {/* CONTACT DETAILS SECTION */}
              <section id="contact-details" className="scroll-mt-48">
                <h2 className="text-2xl font-bold mb-6 text-foreground poppins">
                  Contact Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Owner Cards Mockup */}
                  <div className="p-4 bg-[#FDF2FF] dark:bg-[#3E1A45]/30 rounded-xl border border-purple-100 dark:border-purple-900/50 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#5B2E63] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                      TM
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">Owner Name</h4>
                      <p className="text-xs text-zinc-500">+91 99999 99999</p>
                      <p className="text-xs text-zinc-500">
                        {event.contact.email}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-[#FDF2FF] dark:bg-[#3E1A45]/30 rounded-xl border border-purple-100 dark:border-purple-900/50 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#5B2E63] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                      TM
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">Owner Name</h4>
                      <p className="text-xs text-zinc-500">+91 99999 99999</p>
                      <p className="text-xs text-zinc-500">
                        {event.contact.email}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* SPEAKER SECTION */}
              <section id="speaker" className="scroll-mt-48">
                <h2 className="text-2xl font-bold mb-6 text-foreground poppins">
                  Speaker&rsquo;s
                </h2>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center">
                  <div className="relative w-32 h-40 rounded-xl overflow-hidden flex-shrink-0">
                    <Image
                      src={event.speakers[0].avatar}
                      alt={event.speakers[0].name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-1">
                      Someone Famous
                    </h3>
                    <p className="text-zinc-500 text-sm mb-4">Speaker</p>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                      Known for his chart-topping hits and electrifying stage
                      presence, Karan Aujla is set to deliver a performance like
                      never before.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Right Column: Registration (Sticky) */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 order-1 lg:order-2 h-fit">
            <EventRegistrationCard tickets={event.tickets} />
          </div>
        </div>
      </div>
    </div>
  );
}
