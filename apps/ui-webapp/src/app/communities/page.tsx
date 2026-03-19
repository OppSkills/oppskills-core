"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Home, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CommunitiesPage() {
  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20 flex flex-col items-center justify-center overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] mix-blend-multiply animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-blue-500/10 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-4000" />
      </div>

      <div className="container px-4 md:px-6 py-12 flex flex-col items-center text-center relative z-10">
        {/* Animated Badge */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Badge
            variant="outline"
            className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary-500 text-sm font-medium gap-2 mb-8 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Something Big is Brewing
          </Badge>
        </div>

        {/* Mascot Image with Float Animation */}
        <div className="relative mb-8 animate-in zoom-in duration-1000">
          <div className="absolute inset-0 bg-primary-500/20 blur-[80px] rounded-full scale-75 animate-pulse" />
          <img
            src="/illustrations/communities-mascot.png"
            alt="Communities Mascot"
            className="relative w-64 md:w-80 h-auto object-contain animate-float drop-shadow-2xl"
          />
        </div>

        {/* Heading and Content */}
        <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground/90 to-foreground/40 pb-2 font-poppins">
            Communities <br />
            <span className="text-primary-500">Coming Soon</span>
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-2xl mx-auto inter">
            We're building a vibrant space for hackers, learners, and dreamers to connect, collaborate, and grow together. Stay tuned for the ultimate community experience!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
            <Button asChild size="lg" className="rounded-full px-8 h-14 text-base font-semibold group shadow-lg shadow-primary-500/20">
              <Link href="/">
                <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Back to Home
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-base font-semibold border-primary/20 bg-primary/5 hover:bg-primary/10 group">
              <Link href="/events" className="flex items-center">
                Explore Events
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Micro-Interaction Text */}
        <p className="mt-16 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground opacity-50">
          Follow us for updates @oppskills
        </p>
      </div>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
