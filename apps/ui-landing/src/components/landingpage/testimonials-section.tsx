import React from "react";
import { Badge } from "@/components/ui/badge";
import { Star, Quote } from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  review: string;
  rating: number;
  badge: string;
}

type BadgeColorMap = {
  [key: string]: string;
};

const TestimonialsSection = () => {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Priya Sharma",
      role: "Frontend Developer",
      company: "Flipkart",
      review:
        "OppSkills helped me connect with amazing developers across India and land my dream job at Flipkart. The community support is incredible!",
      rating: 5,
      badge: "Community Leader",
    },
    {
      id: 2,
      name: "Arjun Reddy",
      role: "Full Stack Engineer",
      company: "Swiggy",
      review:
        "The hackathons here are top-notch. I've improved my coding skills tremendously and won ₹5L in prizes last year at various Indian hackathons.",
      rating: 5,
      badge: "Hackathon Winner",
    },
    {
      id: 3,
      name: "Ananya Gupta",
      role: "Data Scientist",
      company: "Zomato",
      review:
        "Amazing platform for networking in the Indian tech ecosystem. I've attended 20+ events and each taught me something valuable for my career.",
      rating: 5,
      badge: "Event Regular",
    },
    {
      id: 4,
      name: "Vikram Singh",
      role: "Backend Developer",
      company: "Paytm",
      review:
        "The quality of events and workshops is outstanding. I've learned more here in 6 months than in 2 years at other Indian platforms.",
      rating: 5,
      badge: "Skill Builder",
    },
    {
      id: 5,
      name: "Sneha Patel",
      role: "DevOps Engineer",
      company: "Razorpay",
      review:
        "Love the community aspect! The mentorship opportunities from senior engineers at top Indian startups have been game-changing.",
      rating: 5,
      badge: "Mentor",
    },
    {
      id: 6,
      name: "Rohit Kumar",
      role: "Mobile Developer",
      company: "PhonePe",
      review:
        "Found my current job through connections made here. The networking opportunities in the Indian fintech space are unmatched.",
      rating: 5,
      badge: "Networker",
    },
    {
      id: 7,
      name: "Kavya Nair",
      role: "UI/UX Designer",
      company: "Byju's",
      review:
        "The design workshops helped me transition from development to design. Grateful for this supportive Indian tech community!",
      rating: 5,
      badge: "Career Changer",
    },
    {
      id: 8,
      name: "Aditya Mehta",
      role: "Cloud Architect",
      company: "Freshworks",
      review:
        "Excellent platform for staying updated with latest tech trends in India. The expert-led sessions by IIT alumni are worth every minute.",
      rating: 5,
      badge: "Tech Explorer",
    },
  ];

  const getBadgeColor = (badge: string): string => {
    const colors: BadgeColorMap = {
      "Community Leader":
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "Hackathon Winner":
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "Event Regular":
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "Skill Builder":
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "Mentor":
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      "Networker":
        "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      "Career Changer":
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      "Tech Explorer":
        "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
    };
    
    return colors[badge] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  };

  const renderTestimonialCard = (testimonial: Testimonial, keyPrefix: string) => (
    <div
      key={`${keyPrefix}-${testimonial.id}`}
      className="flex-shrink-0 w-80 sm:w-96 bg-card rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      {/* Rating */}
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: testimonial.rating }, (_, index: number) => (
          <Star
            key={index}
            className="w-4 h-4 fill-yellow-400 text-yellow-400"
          />
        ))}
      </div>

      {/* Review */}
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6 line-clamp-4">
        &ldquo;{testimonial.review}&rdquo;
      </p>

      {/* User Info */}
      <div className="space-y-3">
        <div>
          <h4 className="font-semibold text-foreground text-sm sm:text-base">
            {testimonial.name}
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {testimonial.role} at {testimonial.company}
          </p>
        </div>

        {/* Badge */}
        <Badge
          className={`text-xs px-2 py-1 ${getBadgeColor(testimonial.badge)}`}
        >
          {testimonial.badge}
        </Badge>
      </div>
    </div>
  );

  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-28 bg-background relative overflow-hidden">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12">
          <Badge className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
            <Quote className="w-4 h-4" />
            Testimonials
          </Badge>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            What our community{" "}
            <span className="text-primary">says about us</span>
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
            Join thousands of professionals who have transformed their careers
            through our platform across India.
          </p>
        </div>

        {/* Auto-scrolling testimonials */}
        <div className="relative">
          <div className="overflow-hidden">
            <div className="flex animate-scroll gap-6">
              {/* First set */}
              {testimonials.map((testimonial: Testimonial) =>
                renderTestimonialCard(testimonial, "first")
              )}

              {/* Duplicate set for seamless loop */}
              {testimonials.map((testimonial: Testimonial) =>
                renderTestimonialCard(testimonial, "second")
              )}
            </div>
          </div>

          {/* Gradient overlays for smooth fade effect */}
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
      </div>

    </section>
  );
};

export default TestimonialsSection;