"use client"
import React, { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  Calendar,
  ArrowRight,
} from "lucide-react";
import type { Swiper as SwiperType } from "swiper";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import Image from "next/image";

interface Community {
  id: number;
  bannerImage: string;
  logo: string;
  title: string;
  brief: string;
  totalMembers: number;
  location: string;
  totalEvents: number;
}

const ExploreCommunities = () => {
  const swiperRef = useRef<SwiperType | null>(null);

// Dummy data for communities
const communities: Community[] = [
    {
        id: 1,
        bannerImage:
            "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop",
        logo: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100&h=100&fit=crop",
        title: "Bangalore Tech Hub",
        brief:
            "Silicon Valley of India - developers, designers, and tech entrepreneurs building innovative solutions.",
        totalMembers: 18500,
        location: "Bangalore, Karnataka",
        totalEvents: 78,
    },
    {
        id: 2,
        bannerImage:
            "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=400&fit=crop",
        logo: "https://images.unsplash.com/photo-1633409361618-c73427e4e206?w=100&h=100&fit=crop",
        title: "Delhi AI Innovators",
        brief:
            "Leading AI and machine learning community in India's capital with top researchers and practitioners.",
        totalMembers: 12400,
        location: "New Delhi, Delhi",
        totalEvents: 56,
    },
    {
        id: 3,
        bannerImage:
            "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop",
        logo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        title: "Mumbai Startup Circle",
        brief:
            "India's financial capital bringing together ambitious entrepreneurs and startup founders.",
        totalMembers: 22100,
        location: "Mumbai, Maharashtra",
        totalEvents: 89,
    },
    {
        id: 4,
        bannerImage:
            "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=400&fit=crop",
        logo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
        title: "Pune Blockchain Builders",
        brief:
            "Decentralized innovation hub with blockchain developers and Web3 enthusiasts in IT city.",
        totalMembers: 8900,
        location: "Pune, Maharashtra",
        totalEvents: 34,
    },
    {
        id: 5,
        bannerImage:
            "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=400&fit=crop",
        logo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
        title: "Hyderabad Design Community",
        brief:
            "UX/UI designers creating world-class digital experiences from Cyberabad's creative minds.",
        totalMembers: 14200,
        location: "Hyderabad, Telangana",
        totalEvents: 67,
    },
    {
        id: 6,
        bannerImage:
            "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop",
        logo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
        title: "Chennai Data Scientists",
        brief:
            "Data professionals from Detroit of India turning complex data into business insights.",
        totalMembers: 16800,
        location: "Chennai, Tamil Nadu",
        totalEvents: 73,
    },
    {
        id: 7,
        bannerImage:
            "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop",
        logo: "https://images.unsplash.com/photo-1494790108755-2616b612b589?w=100&h=100&fit=crop",
        title: "Kolkata Cloud Engineers",
        brief:
            "Cloud infrastructure experts from the City of Joy mastering modern deployment strategies.",
        totalMembers: 9700,
        location: "Kolkata, West Bengal",
        totalEvents: 45,
    },
    {
        id: 8,
        bannerImage:
            "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop",
        logo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        title: "Gurgaon Mobile Devs",
        brief:
            "Building next-generation mobile apps for iOS and Android from India's millennium city.",
        totalMembers: 13600,
        location: "Gurgaon, Haryana",
        totalEvents: 52,
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

  return (
    <section className="py-16 sm:py-20 overflow-hidden bg-secondary">
      <div className="max-w-[90rem] mx-auto px-4">
        {/* Section Header with Navigation */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-12">
          <div className="text-left sm:mb-8 lg:mb-0">
            <Badge className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              <Users className="w-4 h-4" />
              Communities
            </Badge>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-4">
              Explore <span className="text-primary">Communities</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl lg:max-w-2xl">
              Join vibrant communities of like-minded professionals, share
              knowledge, and grow together.
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

        {/* Communities Slider */}
        <div className="relative mb-12 sm:mb-16">
          <Swiper
            onSwiper={(swiper: SwiperType) => {
              swiperRef.current = swiper;
            }}
            modules={[Navigation]}
            spaceBetween={20}
            slidesPerView={1}
            watchOverflow={true}
            loop={true}
            breakpoints={{
              480: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 24,
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 24,
              },
              1280: {
                slidesPerView: 4,
                spaceBetween: 24,
              },
            }}
            className="communities-swiper"
          >
            {communities.map((community: Community) => (
              <SwiperSlide key={community.id}>
                <div className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/20 transition-all duration-300 h-full">
                    {/* Banner Image */}
                    <div className="relative h-24 sm:h-28 overflow-hidden">
                    <Image
                      src={community.bannerImage}
                      alt={community.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="p-4">
                    {/* Logo and Title */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="relative w-12 h-12 rounded-full border-4 border-border shadow-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={community.logo}
                        alt={`${community.title} logo`}
                        fill
                        className="object-cover"
                      />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                          {community.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                          {community.brief}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Users className="w-3 h-3 text-primary" />
                        </div>
                        <div className="text-xs font-semibold text-foreground">
                          {(community.totalMembers / 1000).toFixed(1)}k
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Members
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <MapPin className="w-3 h-3 text-primary" />
                        </div>
                        <div className="text-xs font-semibold text-foreground truncate">
                          {community.location.split(",")[0]}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Location
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Calendar className="w-3 h-3 text-primary" />
                        </div>
                        <div className="text-xs font-semibold text-foreground">
                          {community.totalEvents}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Events
                        </div>
                      </div>
                    </div>

                    {/* Join Button */}
                    <Button className="w-full text-sm py-2.5">
                      Join Community
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button size="lg" className="sm:text-lg px-8 py-3 cursor-pointer">
            View All Communities
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>


    </section>
  );
};

export default ExploreCommunities;
