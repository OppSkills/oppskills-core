"use client"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'
import React from 'react'

export default function ContactForm() {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Placeholder for form submission submission logic
        alert("Message sent! (Mock)");
    };
    return (
        <div className="lg:col-span-7">
            <Card className="border-neutral-300 py-6 shadow-sm bg-neutral-200 relative overflow-hidden">
                <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-medium">
                        Please Enter Your Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label
                                    htmlFor="first-name"
                                    className="text-xs text-neutral-600"
                                >
                                    First Name *
                                </label>
                                <Input
                                    id="first-name"
                                    placeholder="John"
                                    required
                                    className="border-neutral-400 bg-neutral-100 rounded-full h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <label
                                    htmlFor="last-name"
                                    className="text-xs text-neutral-600"
                                >
                                    Last Name *
                                </label>
                                <Input
                                    id="last-name"
                                    placeholder="Doe"
                                    required
                                    className="border-neutral-400 bg-neutral-100 rounded-full h-10"
                                />
                            </div>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">

                            <div className="space-y-2">
                                <label
                                    htmlFor="email"
                                    className="text-xs text-neutral-600"
                                >
                                    Email *
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    required
                                    className="border-neutral-400 bg-neutral-100 rounded-full h-10"
                                />
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="phone"
                                    className="text-xs text-neutral-600"
                                >
                                    Phone *
                                </label>
                                <Input
                                    id="phone"
                                    type="phone"
                                    placeholder="+91 9695X XXXXX"
                                    required
                                    className="border-neutral-400 bg-neutral-100 rounded-full h-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="subject"
                                className="text-xs text-neutral-600"
                            >
                                Subject *
                            </label>
                            <Input
                                id="subject"
                                placeholder="How can we help?"
                                required
                                className="border-neutral-400 bg-neutral-100 rounded-full h-10"
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="message"
                                className="text-xs text-neutral-600"
                            >
                                Message *
                            </label>
                            <Textarea
                                className="min-h-[100px] border-neutral-400 rounded-2xl resize-none p-2 sm:p-3 lg:p-4"
                                id="message"
                                placeholder="Tell us more about your inquiry..."
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full bg-primary-700 hover:bg-primary-800 text-neutral-100 text-base font-medium rounded-full"
                        >
                            <Send className="mr-2 h-4 w-4" /> Send Message
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>)
}
