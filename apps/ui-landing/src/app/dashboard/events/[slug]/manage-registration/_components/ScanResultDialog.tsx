'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import type { ScanResultDto } from '@oppskills/types';

interface ScanResultDialogProps {
  data: ScanResultDto;
  onClose: () => void;
}

export function ScanResultDialog({ data, onClose }: ScanResultDialogProps) {
  const { pass, wasAlreadyUsed, message } = data;
  const user = pass.user;
  const event = pass.event;

  const participantName = `${user.firstName} ${user.lastName}`.trim() || 'Unknown';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {wasAlreadyUsed ? (
              <>
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Pass Already Used
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Pass Validated
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex justify-center">
            {wasAlreadyUsed ? (
              <Badge
                variant="outline"
                className="bg-yellow-100 text-yellow-800 border-yellow-300 px-4 py-2"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Already Scanned
              </Badge>
            ) : (
              <Badge
                variant="default"
                className="bg-green-100 text-green-800 hover:bg-green-100 px-4 py-2"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Valid - Entry Granted
              </Badge>
            )}
          </div>

          {/* Participant Details */}
          <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
            <Avatar className="w-16 h-16 border-2 border-background">
              <AvatarImage
                src={user.imageUrl || undefined}
                alt={participantName}
              />
              <AvatarFallback className="text-lg">
                {participantName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div>
                <h3 className="font-semibold text-lg">{participantName}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Ticket ID:</span>
                  <p className="font-mono font-medium">{pass.ticketId}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Event:</span>
                  <p className="font-medium">{event.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Event Details
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Date:</span>
                <p className="font-medium">
                  {format(new Date(event.startDate), 'MMMM dd, yyyy')}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Time:</span>
                <p className="font-medium">
                  {format(new Date(event.startDate), 'hh:mm a')}
                </p>
              </div>
            </div>
          </div>

          {/* Scan History (if already used) */}
          {wasAlreadyUsed && pass.scannedAt && (
            <div className="space-y-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-semibold text-sm text-yellow-800 dark:text-yellow-200">
                Previous Scan Information
              </h4>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Scanned at:</span>{' '}
                  <span className="font-medium">
                    {format(new Date(pass.scannedAt), 'PPpp')}
                  </span>
                </p>
                {pass.scannedBy && (
                  <p>
                    <span className="text-muted-foreground">Scanned by:</span>{' '}
                    <span className="font-medium">{pass.scannedBy.name}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Message */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-center">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {wasAlreadyUsed && (
              <Button variant="default" onClick={onClose}>
                Allow Entry Anyway
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

