"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Users, Globe, Zap } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center space-y-16 py-12 md:py-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 flex items-center">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Empowering the Next Generation of{" "}
              <span className="text-primary">Builders</span>
            </h1>
            <p className="mt-4 max-w-[700px] text-muted-foreground md:text-xl">
              OppSkills is the premier platform for discovering hackathons,
              connecting with like-minded innovators, and showcasing your skills
              to the world.
            </p>
          </div>
        </div>

        {/* Abstract Background Element */}
        <div className="absolute -top-24 -z-10 h-full w-full opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-500 via-background to-background"></div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="relative aspect-video overflow-hidden rounded-xl border bg-muted/50 shadow-xl">
              {/* Placeholder until we have a real image */}
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
                alt="Team working together"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center space-y-4">
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
                Our Mission
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Bridging the Gap Between Talent and Opportunity
              </h2>
              <p className="text-muted-foreground md:text-lg">
                We believe that every developer, designer, and innovator
                deserves a stage to shine. Our mission is to democratize access
                to opportunities by aggregating the best competitions and
                communities in one seamless ecosystem.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Curated list of global hackathons</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Real-time team formation tools</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Verified skill credentials</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Why We Exist
            </h2>
            <p className="mt-4 text-muted-foreground md:text-lg">
              Our core values drive everything we do.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="bg-background border-none shadow-sm">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Community First</h3>
                <p className="mt-2 text-muted-foreground">
                  We build for the community, with the community. Collaboration
                  is at the heart of innovation.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-background border-none shadow-sm">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Global Access</h3>
                <p className="mt-2 text-muted-foreground">
                  Talent is universal, but opportunity is not. We are here to
                  change that by going global.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-background border-none shadow-sm">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Innovation</h3>
                <p className="mt-2 text-muted-foreground">
                  We are constantly pushing boundaries to provide the best tools
                  for our users.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Start Your Journey?
              </h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Join thousands of developers and designers who are building
                their future on OppSkills.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/hackathons">
                <Button size="lg" className="px-8">
                  Explore Competitions <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="px-8">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
