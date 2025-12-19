"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RichTextEditor from "@/components/ui/editor/RichtextEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Bell } from "lucide-react";

export default function NotificationsPage() {
  const [recipientGroup, setRecipientGroup] = React.useState<string>("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [notifications, setNotifications] = React.useState<
    {
      id: string;
      subject: string;
      message: string;
      group: string;
      date: Date;
      status: "Sent" | "Draft";
    }[]
  >([]);

  const handleSend = () => {
    if (!recipientGroup || !subject || !message) {
      alert("Please fill all fields");
      return;
    }

    const newNotification = {
      id: crypto.randomUUID(),
      subject,
      message,
      group: recipientGroup,
      date: new Date(),
      status: "Sent" as const,
    };

    setNotifications([newNotification, ...notifications]);
    setSubject("");
    setMessage("");
    setRecipientGroup("");
    alert("Notification Sent!");
  };

  return (
    <div className="w-full bg-neutral-200 min-h-screen p-6 flex flex-col items-center gap-6">
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
            <Select value={recipientGroup} onValueChange={setRecipientGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Select who sees this message" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Attendees">All Attendees</SelectItem>
                <SelectItem value="Ticket Holders">
                  Ticket Holders Only
                </SelectItem>
                <SelectItem value="Waitlist">Waitlist</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Input
              placeholder="Enter notification title..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <RichTextEditor
              placeholder="Type your message here..."
              value={message}
              onChange={(content) => setMessage(content)}
            />

            <p className="text-xs text-muted-foreground text-right">
              {message.length}/500 characters
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline">Save Draft</Button>
            <Button className="gap-2" onClick={handleSend}>
              <Send className="w-4 h-4" /> Send Broadcast
            </Button>
          </div>
        </div>
      </div>

      {/* History Section */}
      {notifications.length > 0 && (
        <div className="w-full max-w-3xl bg-background rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Past Notifications</h3>
          <div className="flex flex-col gap-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-4 border rounded-xl flex justify-between items-start"
              >
                <div>
                  <h4 className="font-medium">{notif.subject}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {notif.message}
                  </p>
                  <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 bg-secondary/30 rounded-full text-secondary-foreground">
                      {notif.group}
                    </span>
                    <span>• {notif.date.toLocaleDateString()}</span>
                  </div>
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {notif.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
