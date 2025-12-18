"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="w-full bg-neutral-200 min-h-screen p-6 flex justify-center">
      <div className="w-full max-w-3xl bg-background rounded-2xl p-6 shadow-sm flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Bell className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-semibold font-poppins">
              Send Notification
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Broadcast messages to your event attendees via email or push
            notification.
          </p>
        </div>

        <div className="space-y-4 border-t border-border pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Recipient Group</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select who sees this message" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Attendees</SelectItem>
                <SelectItem value="ticket-holders">
                  Ticket Holders Only
                </SelectItem>
                <SelectItem value="waitlist">Waitlist</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Input placeholder="Enter notification title..." />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              placeholder="Type your message here..."
              className="min-h-[200px]"
            />
            <p className="text-xs text-muted-foreground text-right">
              0/500 characters
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline">Save Draft</Button>
            <Button className="gap-2">
              <Send className="w-4 h-4" /> Send Broadcast
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
