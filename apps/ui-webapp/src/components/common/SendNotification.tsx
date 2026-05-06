"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import RichTextEditor from "@/components/ui/editor/RichtextEditor";
import { Send, CheckCircle2, Loader2, Clock, AlertCircle, RefreshCw, Info } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { sendBulkEmail } from "@/lib/api/sendEmail";
import {
  getNotificationsForEvent,
  getNotificationsForHackathon,
  NotificationRecord
} from "@/lib/api/notificationApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export interface SendNotificationProps {
  type: "event" | "hackathon";
  id: string | null;
  name: string;
  endDate: Date | null;
}

export function SendNotification({ type, id, name, endDate }: SendNotificationProps) {
  const { getToken } = useAuth();

  const [message, setMessage] = useState("");
  const [whenToSend, setWhenToSend] = useState("Immediately");
  const [customDateTime, setCustomDateTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<NotificationRecord | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!id) return;
    try {
      setFetchingHistory(true);
      const token = await getToken();
      let data: NotificationRecord[] = [];
      if (type === "event") {
        data = await getNotificationsForEvent(token, id);
      } else {
        data = await getNotificationsForHackathon(token, id);
      }
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notification history", error);
    } finally {
      setFetchingHistory(false);
    }
  }, [id, type, getToken]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Poll for updates if there are any processing or queued notifications
  useEffect(() => {
    const hasActive = notifications.some(n => n.status === "PROCESSING" || n.status === "QUEUED");
    if (!hasActive) return;

    const interval = setInterval(() => {
      fetchHistory();
    }, 5000);

    return () => clearInterval(interval);
  }, [notifications, fetchHistory]);

  const now = new Date();
  const minDateTime = now.toISOString().slice(0, 16);

  let maxDateTime = "";
  if (endDate) {
    const d = new Date(endDate);
    d.setDate(d.getDate() + 7);
    d.setHours(0, 0, 0, 0);
    maxDateTime = d.toISOString().slice(0, 16);
  } else {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    maxDateTime = d.toISOString().slice(0, 16);
  }

  useEffect(() => {
    if (!customDateTime) {
      setCustomDateTime(minDateTime);
    }
  }, [minDateTime]);

  const handleSend = async () => {
    if (!message || message === "<p></p>") {
      toast.error("Please enter a message body");
      return;
    }
    if (!id) {
      toast.error(`${type === "event" ? "Event" : "Hackathon"} ID not found. Please refresh.`);
      return;
    }

    if (whenToSend === "Custom Time" && !customDateTime) {
      toast.error("Please specify a custom date and time.");
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      await sendBulkEmail(token, {
        eventId: type === "event" ? id : undefined,
        hackathonId: type === "hackathon" ? id : undefined,
        htmlBody: message,
        scheduledAt: whenToSend === "Custom Time" ? customDateTime : undefined,
      });

      setSuccess(true);
      setMessage("");
      toast.success("Broadcast initiated successfully!");
      fetchHistory();
    } catch (error) {
      console.error("Failed to send broadcast", error);
      toast.error("Failed to send broadcast. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Completed</Badge>;
      case "PROCESSING":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 animate-pulse">Processing</Badge>;
      case "QUEUED":
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Queued</Badge>;
      case "FAILED":
        return <Badge className="bg-red-100 text-red-700 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderLogMeta = (meta: any) => {
    if (!meta) return null;
    try {
      const data = typeof meta === "string" ? JSON.parse(meta) : meta;

      // 1. Handle Resend Error Format
      if (data.error && data.error.message) {
        return (
          <div className="mt-1.5 flex flex-col gap-1.5">
            <p className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
              {data.error.message}
            </p>
            {data.recipients && data.recipients.length > 0 && (
              <p className="text-[10px] text-neutral-500">
                <span className="font-bold">Affected:</span> {data.recipients.map((r: any) => r.email).join(", ")}
              </p>
            )}
          </div>
        );
      }

      // 2. Handle Creation/Enqueued Log
      if (data.delay !== undefined && data.expectedFinishAt) {
        return (
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-neutral-500">
            <span className="flex items-center gap-1">
              <span className="font-bold">Delay:</span> {data.delay}ms
            </span>
            <span className="flex items-center gap-1">
              <span className="font-bold">Expected Finish:</span> {new Date(data.expectedFinishAt).toLocaleTimeString()}
            </span>
            <span className="flex items-center gap-1">
              <span className="font-bold">Total Recipients:</span> {data.totalRecipients}
            </span>
          </div>
        );
      }

      // 3. Handle Completion Summary
      if (data.successCount !== undefined && data.failedCount !== undefined) {
        return (
          <div className="mt-1.5 flex gap-4 text-[10px] font-bold">
            <span className="text-green-600">SUCCESS: {data.successCount}</span>
            <span className="text-red-600">FAILED: {data.failedCount}</span>
            <span className="text-neutral-500">TOTAL: {data.processedCount}</span>
          </div>
        );
      }

      // 4. Handle Success Recipients List
      if (data.recipients && Array.isArray(data.recipients)) {
        return (
          <p className="text-[10px] text-neutral-500 mt-1 italic">
             Broadcasted to: {data.recipients.map((r: any) => r.email).join(", ")}
          </p>
        );
      }

      // 5. Generic Object Renderer (No more raw JSON blocks)
      if (typeof data === "object" && data !== null) {
        return (
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(data).map(([key, val]) => (
              <div key={key} className="bg-neutral-50 px-2 py-0.5 rounded border border-neutral-100 text-[9px]">
                <span className="text-neutral-400 font-bold uppercase mr-1">{key}:</span>
                <span className="text-neutral-600">{String(val)}</span>
              </div>
            ))}
          </div>
        );
      }

      return (
        <div className="mt-1 text-[10px] text-neutral-500 font-mono">
          {String(data)}
        </div>
      );
    } catch (e) {
      return (
        <div className="mt-1 text-[10px] text-neutral-500 font-mono">
          {String(meta)}
        </div>
      );
    }
  };

  if (success) {
    return (
      <div className="w-full bg-neutral-100 min-h-screen p-4 flex flex-col items-center justify-center gap-6">
        <div className="w-full max-w-md bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-neutral-100 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-poppins text-neutral-800">Broadcast Initiated!</h2>
          <p className="text-muted-foreground text-sm">
            Your email broadcast has been queued and will be circulated to all registered participants shortly.
          </p>
          <div className="text-sm bg-neutral-50 p-4 rounded-xl border border-neutral-100 w-full mt-2 text-left">
            <p className="font-medium text-neutral-700">What happens next?</p>
            <ul className="text-neutral-500 mt-2 list-disc list-inside space-y-1">
              <li>The system will process recipients in batches.</li>
              <li>You can track progress in the history panel.</li>
              <li>Success and failure counts will update in real-time.</li>
            </ul>
          </div>
          <Button onClick={() => setSuccess(false)} variant="outline" className="w-full mt-2 rounded-xl">Send Another</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-neutral-100 text-neutral-800 pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT CONTENT AREA (65%) */}
          <div className="lg:col-span-8 py-4 md:py-8 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-neutral-800 font-poppins">Send Notification</h1>
                <p className="text-neutral-500 text-sm mt-1">Send email to participants about {type === "event" ? "events" : "hackathons"}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchHistory}
                disabled={fetchingHistory}
                className="text-neutral-500"
              >
                {fetchingHistory ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span className="ml-2">Refresh</span>
              </Button>
            </div>

            {/* FLEXIBLE TWO COLUMN SCHEDULE AREA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-400 font-medium tracking-wide">When to send</label>
                <Select value={whenToSend} onValueChange={(val) => setWhenToSend(val)}>
                  <SelectTrigger className="rounded-full">
                    <SelectValue placeholder="Immediately" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-neutral-200 bg-white shadow-md">
                    <SelectItem value="Immediately" className="rounded-lg text-sm text-neutral-700">Immediately</SelectItem>
                    <SelectItem value="Custom Time" className="rounded-lg text-sm text-neutral-700">Custom Time</SelectItem>
                  </SelectContent>
                </Select>
                {whenToSend === "Immediately" && (
                  <div className="flex items-center gap-1.5 text-[11px] text-green-600 mt-1 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Notifications will be sent immediately</span>
                  </div>
                )}
              </div>

              {whenToSend === "Custom Time" && (
                <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                  <label className="text-xs text-neutral-400 font-medium tracking-wide">Custom Date & Time</label>
                  <input
                    type="datetime-local"
                    value={customDateTime}
                    onChange={(e) => setCustomDateTime(e.target.value)}
                    min={minDateTime}
                    max={maxDateTime}
                    className="w-full bg-transparent border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-neutral-700 font-medium"
                  />
                  <div className="flex items-center gap-1.5 text-[11px] text-green-600 mt-1 font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Will be sent at your custom scheduled time</span>
                  </div>
                </div>
              )}
            </div>

            {/* MAIN BODY */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-neutral-400 font-medium tracking-wide">Main Body</label>
              <div className="border border-neutral-100 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 bg-white">
                <RichTextEditor
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(content) => setMessage(content)}
                  className="min-h-[300px]"
                />
              </div>
            </div>

            {/* SEND BUTTON */}
            <div className="mt-4">
              <Button
                onClick={handleSend}
                disabled={loading || !id}
                className="w-full bg-primary-700 hover:bg-primary-800 text-neutral-100 font-medium h-12 rounded-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" /> Send / Schedule Notifications
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* RIGHT SIDEBAR - PREVIOUS NOTIFICATIONS (35%) */}
          <div className="lg:col-span-4 py-4 md:py-8 h-fit">
            <h3 className="text-lg font-bold text-neutral-800 font-poppins mb-6">Notification History</h3>

            <div className="flex flex-col gap-4">
              {notifications.length === 0 && !fetchingHistory && (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-neutral-300">
                  <Info className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">No notifications sent yet.</p>
                </div>
              )}

              {notifications.map((notif) => {
                const progress = notif.totalRecipients > 0
                  ? Math.round((notif.processedCount / notif.totalRecipients) * 100)
                  : 0;

                // Strip HTML for a cleaner plain-text preview
                const plainTextContent = notif.content.replace(/<[^>]*>/g, "");

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      setSelectedNotif(notif);
                      setIsSheetOpen(true);
                    }}
                    className="px-4 py-4 border-l-4 border-accent-yellow-300 hover:bg-accent-yellow-100/30 cursor-pointer rounded-lg flex flex-col gap-2 transition-colors bg-white/50"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-neutral-500">
                        Sent on{" "}
                        {new Date(notif.createdAt).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                      {getStatusBadge(notif.status)}
                    </div>

                    <p className="text-lg text-neutral-700 line-clamp-4 font-poppins">
                      {plainTextContent.slice(0, 300)}{plainTextContent.length > 300 ? "..." : ""}
                    </p>

                    {(notif.status === "PROCESSING" || notif.status === "QUEUED") && (
                      <div className="flex flex-col gap-1.5 mt-1">
                        <div className="flex justify-between text-[10px] font-bold text-neutral-400">
                          <span>PROGRESS</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1 bg-neutral-100" />
                      </div>
                    )}

                    {notif.status === "FAILED" && (
                      <div className="flex items-center gap-1.5 text-[10px] text-red-500 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Errors occurred during transmission</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* DETAIL SHEET */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-md md:max-w-xl p-0 flex flex-col h-full border-l border-neutral-200 overflow-hidden bg-white">
          {selectedNotif && (
            <>
              <SheetHeader className="p-6 bg-white border-b border-neutral-100 shrink-0">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <SheetTitle className="text-xl font-bold font-poppins text-neutral-800">Broadcast Details</SheetTitle>
                    <SheetDescription className="text-xs mt-1">
                      Initiated on {new Date(selectedNotif.createdAt).toLocaleString()}
                    </SheetDescription>
                  </div>
                  {getStatusBadge(selectedNotif.status)}
                </div>
              </SheetHeader>

              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <ScrollArea className="h-full">
                  <div className="p-6 flex flex-col gap-8 pb-12">
                    
                    {/* ANALYTICS CARD */}
                    <div className="bg-neutral-900 rounded-2xl p-6 text-white shadow-xl shadow-neutral-200/50 shrink-0">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Total</span>
                          <span className="text-2xl font-bold">{selectedNotif.totalRecipients}</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l border-neutral-800">
                          <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest text-center">Success</span>
                          <span className="text-2xl font-bold">{selectedNotif.successCount}</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l border-neutral-800">
                          <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Failed</span>
                          <span className="text-2xl font-bold">{selectedNotif.failedCount}</span>
                        </div>
                      </div>

                      {selectedNotif.status === "PROCESSING" && (
                        <div className="mt-6 pt-6 border-t border-neutral-800">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Processing Progress</span>
                            <span className="text-lg font-bold">{Math.round((selectedNotif.processedCount / selectedNotif.totalRecipients) * 100)}%</span>
                          </div>
                          <Progress 
                            value={(selectedNotif.processedCount / selectedNotif.totalRecipients) * 100} 
                            className="h-2 bg-neutral-800"
                          />
                        </div>
                      )}
                    </div>

                    {/* CONTENT PREVIEW */}
                    <div className="flex flex-col gap-3">
                      <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                        <Info className="w-3 h-3" />
                        Broadcast Message
                      </h4>
                      <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 text-sm text-neutral-700 leading-relaxed max-h-[250px] overflow-auto">
                        <div dangerouslySetInnerHTML={{ __html: selectedNotif.content }} />
                      </div>
                    </div>

                    <Separator className="bg-neutral-100" />

                    {/* LOG TRAIL */}
                    <div className="flex flex-col gap-4">
                      <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        System Log Trail
                      </h4>
                      
                      <div className="flex flex-col gap-3">
                        {selectedNotif.logs && selectedNotif.logs.length > 0 ? (
                          selectedNotif.logs.map((log) => (
                            <div key={log.id} className="flex gap-4 group">
                              <div className="flex flex-col items-center gap-1">
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                  log.level === "ERROR" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : 
                                  log.level === "INFO" ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : 
                                  "bg-neutral-300"
                                }`} />
                                <div className="w-px flex-1 bg-neutral-100" />
                              </div>
                              <div className="flex-1 pb-4">
                                <div className="flex justify-between items-start gap-2">
                                  <p className={`text-sm font-medium ${log.level === "ERROR" ? "text-red-700" : "text-neutral-800"}`}>
                                    {log.message}
                                  </p>
                                  <span className="text-[10px] text-neutral-400 font-medium whitespace-nowrap pt-0.5">
                                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                {log.meta && renderLogMeta(log.meta)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-neutral-400 italic text-xs">
                            No logs recorded yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
              
              <div className="p-6 bg-neutral-50 border-t border-neutral-100 shrink-0">
                 <Button variant="outline" className="w-full rounded-xl" onClick={() => setIsSheetOpen(false)}>
                   Close Details
                 </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
