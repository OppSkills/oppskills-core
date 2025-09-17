"use client"
import React, { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Users,
  ArrowRight,
} from "lucide-react";
import type { Swiper as SwiperType } from "swiper";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import Image from "next/image";

interface Event {
  id: number;
  image: string;
  title: string;
  brief: string;
  date: string;
  location: string;
  registered: number;
  organizer: string;
  organizerLogo: string;
  category: string;
  tags: string[];
  status: "Open" | "Upcoming" | "Ended";
}

type StatusColorMap = {
  [K in Event["status"]]: string;
};

const UpcomingEvents = () => {
  const swiperRef = useRef<SwiperType | null>(null);

  // Indian dummy data for events
  const events: Event[] = [
    {
      id: 1,
      image:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop",
      title: "India Tech Summit 2024",
      brief:
        "Join India's biggest tech conference featuring industry leaders from TCS, Infosys, and innovative startups.",
      date: "Dec 15, 2024",
      location: "Bangalore, Karnataka",
      registered: 2500,
      organizer: "Tech India Hub",
      organizerLogo:
        "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=50&h=50&fit=crop",
      category: "Conference",
      tags: ["Tech", "Innovation", "AI"],
      status: "Open",
    },
    {
      id: 2,
      image:
        "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&h=400&fit=crop",
      title: "AI Workshop Series",
      brief:
        "Hands-on workshop covering machine learning fundamentals with IIT professors and industry experts.",
      date: "Dec 18, 2024",
      location: "Hyderabad, Telangana",
      registered: 150,
      organizer: "AI Academy India",
      organizerLogo:
        "https://images.unsplash.com/photo-1633409361618-c73427e4e206?w=50&h=50&fit=crop",
      category: "Workshop",
      tags: ["AI", "Machine Learning", "Hands-on"],
      status: "Open",
    },
    {
      id: 3,
      image:
        "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&h=400&fit=crop",
      title: "Startup Pitch Night Mumbai",
      brief:
        "Watch innovative Indian startups pitch to top VCs and angel investors from Mumbai's financial district.",
      date: "Dec 20, 2024",
      location: "Mumbai, Maharashtra",
      registered: 450,
      organizer: "Mumbai Startup Hub",
      organizerLogo:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop",
      category: "Networking",
      tags: ["Startup", "Pitch", "Investors"],
      status: "Open",
    },
    {
      id: 4,
      image:
        "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=600&h=400&fit=crop",
      title: "Web3 India Summit",
      brief:
        "Explore the future of decentralized web with blockchain experts from WazirX, CoinDCX, and Polygon.",
      date: "Dec 22, 2024",
      location: "Pune, Maharashtra",
      registered: 800,
      organizer: "Crypto India Collective",
      organizerLogo:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop",
      category: "Summit",
      tags: ["Web3", "Blockchain", "Crypto"],
      status: "Upcoming",
    },
    {
      id: 5,
      image:
        "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=600&h=400&fit=crop",
      title: "UX Design Masterclass Delhi",
      brief:
        "Learn advanced UX design principles from Flipkart, Paytm, and Zomato design teams in India's capital.",
      date: "Dec 25, 2024",
      location: "New Delhi, Delhi",
      registered: 200,
      organizer: "Design Studio India",
      organizerLogo:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop",
      category: "Masterclass",
      tags: ["UX", "Design", "UI"],
      status: "Open",
    },
    {
      id: 6,
      image:
        "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&h=400&fit=crop",
      title: "Data Science Bootcamp Chennai",
      brief:
        "Intensive bootcamp covering data analysis and ML techniques with experts from Freshworks and Zoho.",
      date: "Dec 28, 2024",
      location: "Chennai, Tamil Nadu",
      registered: 300,
      organizer: "Data Institute India",
      organizerLogo:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop",
      category: "Bootcamp",
      tags: ["Data Science", "Analytics", "ML"],
      status: "Open",
    },
  ];

  const handlePrev = (): void => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev();
    }
  };

  const handleNext = (): void => {
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    }
  };

  const getStatusColor = (status: Event["status"]): string => {
    const statusColors: StatusColorMap = {
      Open: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      Upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      Ended: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    };

    return statusColors[status];
  };

  return (
    <section className="py-16 sm:py-20 bg-background overflow-hidden">
      <div className="max-w-[90rem] mx-auto px-4">
        {/* Section Header with Navigation */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-12">
          <div className="text-left sm:mb-8 lg:mb-0">
            <Badge className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              <Calendar className="w-4 h-4" />
              Events
            </Badge>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-4">
              Upcoming <span className="text-primary">Events</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl lg:max-w-2xl">
              Discover amazing events, workshops, and conferences happening
              across India. Learn, network, and grow with industry
              professionals.
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="hidden lg:flex items-center gap-3 justify-center lg:justify-end">
            <Button
              variant="outline"
              size="icon"
              className="w-12 h-12 rounded-full"
              onClick={handlePrev}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-12 h-12 rounded-full"
              onClick={handleNext}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Events Slider */}
        <div className="relative mb-12 sm:mb-16">
          <Swiper
            onSwiper={(swiper: SwiperType) => {
              swiperRef.current = swiper;
            }}
            modules={[Navigation]}
            spaceBetween={24}
            slidesPerView={1}
            watchOverflow={true}
            loop={true}
            breakpoints={{
              640: {
                slidesPerView: 1,
                spaceBetween: 24,
              },
              768: {
                slidesPerView: 2,
                spaceBetween: 24,
              },
              1024: {
                slidesPerView: 2,
                spaceBetween: 28,
              },
              1280: {
                slidesPerView: 2,
                spaceBetween: 32,
              },
            }}
            className="events-swiper"
          >
            {events.map((event: Event) => (
              <SwiperSlide key={event.id}>
                <div className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/20 hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col sm:flex-row h-full">
                    {/* Left Side - Image */}
                    <div className="relative w-full sm:w-2/5 h-48 sm:h-auto overflow-hidden">
                      <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>

                    {/* Right Side - Content */}
                    <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
                      {/* Header Section */}
                      <div className="space-y-3">
                        {/* Organizer Info */}
                        <div className="flex items-center gap-2">
                          <Image
                            src={event.organizerLogo}
                            alt={event.organizer}
                            width={24}
                            height={24}
                            className="rounded-full object-cover"
                          />
                          <span className="text-xs text-muted-foreground font-medium">
                            {event.organizer}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {event.title}
                        </h3>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5">
                          <Badge
                            variant="secondary"
                            className="text-xs px-2 py-1"
                          >
                            {event.category}
                          </Badge>
                          {event.tags
                            .slice(0, 2)
                            .map((tag: string, index: number) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs px-2 py-1"
                              >
                                {tag}
                              </Badge>
                            ))}
                        </div>

                        {/* Brief */}
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                          {event.brief}
                        </p>
                      </div>

                      {/* Details Section */}
                      <div className="space-y-3 mt-4">
                        {/* Date and Location */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="font-medium">{event.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>{event.location}</span>
                          </div>
                        </div>

                        {/* Status and Registered */}
                        <div className="flex items-center justify-between">
                          <Badge
                            className={`text-xs px-2 py-1 ${getStatusColor(
                              event.status
                            )}`}
                          >
                            {event.status}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span>{event.registered} registered</span>
                          </div>
                        </div>

                        {/* Register Button */}
                        <Button className="w-full text-sm py-2.5 mt-3">
                          Register Now
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button size="lg" className="sm:text-lg px-8 py-3">
            View All Events
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>


    </section>
  );
};

export default UpcomingEvents;
