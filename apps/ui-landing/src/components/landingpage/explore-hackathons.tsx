"use client";
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
  Trophy,
  ArrowRight,
  Clock,
  Zap,
} from "lucide-react";
import type { Swiper as SwiperType } from "swiper";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import Image from "next/image";

interface Hackathon {
  id: number;
  image: string;
  title: string;
  brief: string;
  startDate: string;
  endDate: string;
  location: string;
  participants: number;
  organizer: string;
  organizerLogo: string;
  category: string;
  tags: string[];
  status: "Open" | "Upcoming" | "Ended";
  prizePool: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
}

type StatusColorMap = {
  [K in Hackathon["status"]]: string;
};

type DifficultyColorMap = {
  [K in Hackathon["difficulty"]]: string;
};

const ExploreHackathons = () => {
  const swiperRef = useRef<SwiperType | null>(null);

  // Indian dummy data for hackathons
  const hackathons: Hackathon[] = [
    {
      id: 1,
      image:
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=400&fit=crop",
      title: "AI Innovation Hackathon India",
      brief:
        "Build revolutionary AI solutions with IIT mentors and industry experts from TCS and Wipro. 48 hours of intense innovation.",
      startDate: "Jan 15, 2025",
      endDate: "Jan 17, 2025",
      location: "Bangalore, Karnataka",
      participants: 800,
      organizer: "TechCorp India",
      organizerLogo:
        "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=50&h=50&fit=crop",
      category: "AI/ML",
      tags: ["AI", "Machine Learning", "Innovation"],
      status: "Open",
      prizePool: "₹15L",
      duration: "48 hours",
      difficulty: "Advanced",
    },
    {
      id: 2,
      image:
        "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=600&h=400&fit=crop",
      title: "Web3 DeFi Challenge Mumbai",
      brief:
        "Create decentralized finance applications with support from WazirX and CoinDCX teams to revolutionize Indian fintech.",
      startDate: "Jan 20, 2025",
      endDate: "Jan 22, 2025",
      location: "Mumbai, Maharashtra",
      participants: 550,
      organizer: "CryptoLab India",
      organizerLogo:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop",
      category: "Blockchain",
      tags: ["Web3", "DeFi", "Blockchain"],
      status: "Open",
      prizePool: "₹25L",
      duration: "54 hours",
      difficulty: "Expert",
    },
    {
      id: 3,
      image:
        "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop",
      title: "Climate Tech Hackathon Pune",
      brief:
        "Develop sustainable technology solutions for Indian environmental challenges with guidance from Mahindra and Tata groups.",
      startDate: "Feb 01, 2025",
      endDate: "Feb 03, 2025",
      location: "Pune, Maharashtra",
      participants: 600,
      organizer: "GreenTech India",
      organizerLogo:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop",
      category: "ClimaTech",
      tags: ["Climate", "Sustainability", "Environment"],
      status: "Upcoming",
      prizePool: "₹12L",
      duration: "60 hours",
      difficulty: "Intermediate",
    },
    {
      id: 4,
      image:
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop",
      title: "HealthTech Innovation Delhi",
      brief:
        "Build healthcare solutions for rural India with Apollo Hospitals and AIIMS Delhi mentors improving patient outcomes.",
      startDate: "Feb 10, 2025",
      endDate: "Feb 12, 2025",
      location: "New Delhi, Delhi",
      participants: 450,
      organizer: "MedTech Hub India",
      organizerLogo:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop",
      category: "HealthTech",
      tags: ["Health", "Medical", "Innovation"],
      status: "Open",
      prizePool: "₹18L",
      duration: "48 hours",
      difficulty: "Intermediate",
    },
    {
      id: 5,
      image:
        "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=600&h=400&fit=crop",
      title: "Mobile App Challenge Hyderabad",
      brief:
        "Create innovative mobile apps for Bharat with Google India and Microsoft mentors solving everyday Indian problems.",
      startDate: "Feb 20, 2025",
      endDate: "Feb 22, 2025",
      location: "Hyderabad, Telangana",
      participants: 650,
      organizer: "Mobile Devs India",
      organizerLogo:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop",
      category: "Mobile",
      tags: ["Mobile", "iOS", "Android"],
      status: "Open",
      prizePool: "₹10L",
      duration: "48 hours",
      difficulty: "Beginner",
    },
    {
      id: 6,
      image:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop",
      title: "Fintech Revolution Chennai",
      brief:
        "Disrupt Indian banking with innovative fintech solutions supported by ICICI Bank and Paytm engineering teams.",
      startDate: "Mar 01, 2025",
      endDate: "Mar 03, 2025",
      location: "Chennai, Tamil Nadu",
      participants: 520,
      organizer: "FinTech Labs India",
      organizerLogo:
        "https://images.unsplash.com/photo-1494790108755-2616b612b589?w=50&h=50&fit=crop",
      category: "FinTech",
      tags: ["Finance", "Banking", "Innovation"],
      status: "Upcoming",
      prizePool: "₹20L",
      duration: "54 hours",
      difficulty: "Advanced",
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

  const getStatusColor = (status: Hackathon["status"]): string => {
    const statusColors: StatusColorMap = {
      Open: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      Upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      Ended: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    };

    return statusColors[status];
  };

  const getDifficultyColor = (difficulty: Hackathon["difficulty"]): string => {
    const difficultyColors: DifficultyColorMap = {
      Beginner:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
      Intermediate:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      Advanced:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      Expert: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };

    return difficultyColors[difficulty];
  };

  return (
    <section className="py-16 sm:py-20 bg-secondary overflow-hidden">
      <div className="max-w-[90rem] mx-auto px-4">
        {/* Section Header with Navigation */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-12">
          <div className="text-left sm:mb-8 lg:mb-0">
            <Badge className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              Hackathons
            </Badge>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-4">
              Explore <span className="text-primary">Hackathons</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl lg:max-w-2xl">
              Join intense coding competitions across India, build innovative
              solutions, and compete for amazing prizes while networking with
              top developers.
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

        {/* Hackathons Slider */}
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
            className="hackathons-swiper"
          >
            {hackathons.map((hackathon: Hackathon) => (
              <SwiperSlide key={hackathon.id}>
                <div className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/20 hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col sm:flex-row h-full">
                    {/* Left Side - Image */}
                    <div className="relative w-full sm:w-2/5 h-48 sm:h-auto overflow-hidden">
                      <Image
                        src={hackathon.image}
                        alt={hackathon.title}
                        width={600}
                        height={400}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                      {/* Prize Pool */}
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-primary text-primary-foreground text-xs font-bold">
                          <Trophy className="w-3 h-3 mr-1" />
                          {hackathon.prizePool}
                        </Badge>
                      </div>
                    </div>

                    {/* Right Side - Content */}
                    <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
                      {/* Header Section */}
                      <div className="space-y-3">
                        {/* Organizer Info */}
                        <div className="flex items-center gap-2">
                          <Image
                            src={hackathon.organizerLogo}
                            alt={hackathon.organizer}
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-xs text-muted-foreground font-medium">
                            {hackathon.organizer}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {hackathon.title}
                        </h3>

                        {/* Tags & Difficulty */}
                        <div className="flex flex-wrap gap-1.5">
                          <Badge
                            variant="secondary"
                            className="text-xs px-2 py-1"
                          >
                            {hackathon.category}
                          </Badge>
                          <Badge
                            className={`text-xs px-2 py-1 ${getDifficultyColor(
                              hackathon.difficulty
                            )}`}
                          >
                            {hackathon.difficulty}
                          </Badge>
                          {hackathon.tags
                            .slice(0, 1)
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
                          {hackathon.brief}
                        </p>
                      </div>

                      {/* Details Section */}
                      <div className="space-y-3 mt-4">
                        {/* Date and Duration */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="font-medium">
                              {hackathon.startDate} - {hackathon.endDate}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 text-primary" />
                            <span>{hackathon.duration}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>{hackathon.location}</span>
                          </div>
                        </div>

                        {/* Status and Participants */}
                        <div className="flex items-center justify-between">
                          <Badge
                            className={`text-xs px-2 py-1 ${getStatusColor(
                              hackathon.status
                            )}`}
                          >
                            {hackathon.status}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span>{hackathon.participants} participants</span>
                          </div>
                        </div>

                        {/* Register Button */}
                        <Button className="w-full text-sm py-2.5 mt-3 bg-primary hover:bg-primary/90">
                          {hackathon.status === "Open"
                            ? "Register Now"
                            : "View Details"}
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
            View All Hackathons
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ExploreHackathons;
