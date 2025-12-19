"use client";

import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trophy, CalendarDays, ArrowRight } from "lucide-react";

export default function OrganizePage() {
  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="max-w-4xl w-full flex flex-col items-center gap-8 md:gap-12 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">
            What would you like to organize?
          </h1>
          <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto">
            Choose the type of engagement you want to create and manage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Opportunity Card */}
          <Link href="/organize/opportunity" className="group cursor-pointer">
            <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-slate-200 hover:border-orange-200 relative overflow-hidden bg-white">
              <div className="absolute z-10 top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                <ArrowRight className="w-6 h-6 text-orange-500" />
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

              <CardHeader className="text-center md:text-left pt-10 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mb-6 group-hover:bg-orange-500 transition-colors duration-300 mx-auto md:mx-0 shadow-sm">
                  <Trophy className="w-8 h-8 text-orange-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                  Opportunity
                </CardTitle>
                <CardDescription className="text-base text-slate-500 mt-2">
                  Launch hackathons, coding competitions, hiring challenges, and
                  more.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <ul className="space-y-3 text-sm text-slate-500">
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    Hackathons & Competitions
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    Quizzes & Assessments
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    Hiring Challenges
                  </li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          {/* Event Card */}
          <Link href="/organize/event" className="group cursor-pointer">
            <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-slate-200 hover:border-blue-200 relative overflow-hidden bg-white">
              <div className="absolute z-10 top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                <ArrowRight className="w-6 h-6 text-blue-500" />
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

              <CardHeader className="text-center md:text-left pt-10 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 group-hover:bg-blue-500 transition-colors duration-300 mx-auto md:mx-0 shadow-sm">
                  <CalendarDays className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Event
                </CardTitle>
                <CardDescription className="text-base text-slate-500 mt-2">
                  Host conferences, workshops, webinars, and meetups.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <ul className="space-y-3 text-sm text-slate-500">
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    Conferences & Summits
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    Workshops & Bootcamps
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    Webinars & Meetups
                  </li>
                </ul>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
