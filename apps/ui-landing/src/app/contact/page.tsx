"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mail,
  MapPin,
  Phone,
  Send,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

export default function ContactPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for form submission submission logic
    alert("Message sent! (Mock)");
  };

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20 flex flex-col items-center justify-center">
      {/* Abstract Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] mix-blend-multiply  animate-blob" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] mix-blend-multiply  animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/2 w-[500px] h-[500px] bg-pink-500/20 rounded-full blur-[120px] mix-blend-multiply  animate-blob animation-delay-4000" />
      </div>

      <div className="container px-4 md:px-6 py-12 md:py-24 mx-auto relative z-10">
        <div className="mb-16 text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary-500 text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            We're here to help
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-purple-800 to-gray-900    pb-2 font-poppins">
            Get in Touch
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
            Have questions about hackathons, events, or our platform? We'd love
            to hear from you. Our team is ready to answer all your questions.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12 items-start">
          {/* Contact Information & Newsletter */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="grid gap-4">
              <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-background/50 overflow-hidden group hover:border-primary/50 transition-colors">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100  text-purple-600  group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Visit Us</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Greater Noida,
                      <br />
                      Uttar Pradesh 201310,
                      <br />
                      India
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-background/50 overflow-hidden group hover:border-primary/50 transition-colors">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100  text-blue-600  group-hover:scale-110 transition-transform duration-300">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Email Us</h3>
                    <a
                      href="mailto:oppskills15@gmail.com"
                      className="text-muted-foreground hover:text-primary-500 transition-colors block"
                    >
                      oppskills15@gmail.com
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-background/50 overflow-hidden group hover:border-primary/50 transition-colors">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-100  text-pink-600  group-hover:scale-110 transition-transform duration-300">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Call Us</h3>
                    <p className="text-muted-foreground">
                      Mon-Fri from 9am to 6pm
                    </p>
                    <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-neutral-700">
                      <div className="p-2 border rounded-lg">
                        <a
                          href="tel:+919690752035"
                          className="text-lg font-medium hover:text-primary-500 transition-colors"
                        >
                          +91 9690752035
                        </a>
                      </div>
                      <div className="p-2 border rounded-lg">
                        <a
                          href="tel:+919935070033"
                          className="text-lg font-medium hover:text-primary-500 transition-colors"
                        >
                          +91 9935070033
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-primary-500 via-purple-600 to-blue-600 text-white mt-4">
              <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                  <MessageSquare className="h-6 w-6" />
                  Community
                </CardTitle>
                <CardDescription className="text-white/80 text-base">
                  Join our Discord server to connect with 10,000+ developers and
                  organizers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="secondary"
                  className="w-full bg-white text-primary-500 hover:bg-white/90 shadow-md font-semibold gap-2 group"
                >
                  {/* Join Discord{" "}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /> */}
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <Card className="border-border/50 shadow-2xl backdrop-blur-md bg-background/80 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full pointer-events-none -z-10"></div>

              <CardHeader className="pb-8">
                <CardTitle className="text-2xl font-bold">
                  Send a Message
                </CardTitle>
                <CardDescription className="text-base">
                  We'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="first-name"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        First name
                      </label>
                      <Input
                        id="first-name"
                        placeholder="John"
                        required
                        className="bg-muted/50 border-input/50 focus:bg-background transition-colors h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="last-name"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Last name
                      </label>
                      <Input
                        id="last-name"
                        placeholder="Doe"
                        required
                        className="bg-muted/50 border-input/50 focus:bg-background transition-colors h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      required
                      className="bg-muted/50 border-input/50 focus:bg-background transition-colors h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="subject"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Subject
                    </label>
                    <Input
                      id="subject"
                      placeholder="How can we help?"
                      required
                      className="bg-muted/50 border-input/50 focus:bg-background transition-colors h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="message"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Message
                    </label>
                    <Textarea
                      className="min-h-[150px] bg-muted/50 border-input/50 focus:bg-background transition-colors resize-none"
                      id="message"
                      placeholder="Tell us more about your inquiry..."
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-primary-500 hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 h-12 text-base"
                  >
                    <Send className="mr-2 h-4 w-4" /> Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
