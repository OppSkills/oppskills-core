'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@clerk/nextjs';
import { scanEventPass } from '@/lib/api/eventApi';
import { toast } from 'sonner';
import { Loader2, QrCode, Keyboard } from 'lucide-react';
import { ScanResultDialog } from './ScanResultDialog';
import type { ScanResultDto } from '@oppskills/types';
import dynamic from 'next/dynamic';

// Dynamically import WebcamQRScanner to avoid SSR issues
const WebcamQRScanner = dynamic(
  () => import('./WebcamQRScanner').then((mod) => mod.WebcamQRScanner),
  { ssr: false }
);

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventSlug: string;
}

export function QRScannerModal({
  isOpen,
  onClose,
  eventId,
  eventSlug,
}: QRScannerModalProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [scannedData, setScannedData] = useState<ScanResultDto | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const { getToken } = useAuth();

  const handleScan = useCallback(
    async (token: string) => {
      console.log('[QRScannerModal] handleScan called with token:', token);
      if (!token.trim()) {
        toast.error('Please enter a valid token');
        return;
      }

      setIsScanning(true);
      try {
        const authToken = await getToken();
        if (!authToken) {
          toast.error('Authentication required');
          return;
        }

        const result = await scanEventPass(authToken, eventId, token.trim());
        setScannedData(result);
        setManualToken(''); // Clear manual input after successful scan
      } catch (error: any) {
        console.error('Error scanning pass:', error);
        toast.error(
          error.response?.data?.message ||
            error.message ||
            'Failed to scan pass. Please try again.'
        );
      } finally {
        setIsScanning(false);
      }
    },
    [eventId, getToken]
  );

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(manualToken);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Scan Event Pass QR Code</DialogTitle>
          </DialogHeader>

          <Tabs value={mode} onValueChange={(v) => setMode(v as 'camera' | 'manual')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera" className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                Camera Scanner
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Keyboard className="w-4 h-4" />
                Manual Entry
              </TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="mt-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Point your camera at the QR code on the event pass
                </p>
                <WebcamQRScanner onScan={handleScan} disabled={isScanning} />
              </div>
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="token-input"
                    className="text-sm font-medium mb-2 block"
                  >
                    Enter Pass Token
                  </label>
                  <Input
                    id="token-input"
                    type="text"
                    placeholder="Paste or type the pass token here"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    disabled={isScanning}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    The token is the unique code embedded in the QR code
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={!manualToken.trim() || isScanning}
                  className="w-full"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Validating...
                    </>
                  ) : (
                    'Validate Token'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {scannedData && (
        <ScanResultDialog
          data={scannedData}
          onClose={() => {
            setScannedData(null);
            onClose();
          }}
        />
      )}
    </>
  );
}

