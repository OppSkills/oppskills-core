'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { BarcodeFormat, BrowserMultiFormatReader, DecodeHintType } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Loader2, CameraOff, RefreshCcw } from 'lucide-react';

interface WebcamQRScannerProps {
  onScan: (token: string) => void;
  disabled?: boolean;
}

export function WebcamQRScanner({
  onScan,
  disabled = false,
}: WebcamQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMounted = useRef(true);
  const lastHintTime = useRef(0);

  // Initialize code reader with QR code hints
  useEffect(() => {
    isMounted.current = true;
    console.log('[QRScanner] Component Mounted');
    
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    codeReader.current = new BrowserMultiFormatReader(hints);
    
    return () => {
      console.log('[QRScanner] Component Unmounting');
      isMounted.current = false;
      if (codeReader.current) {
        codeReader.current.reset();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startScanning = useCallback(async () => {
    if (disabled || !codeReader.current || !videoRef.current) {
      console.log('[QRScanner] Start aborted:', { disabled, hasReader: !!codeReader.current, hasVideo: !!videoRef.current });
      return;
    }

    try {
      if (isMounted.current) {
        setIsInitializing(true);
        setError(null);
      }
      
      console.log('[QRScanner] Accessing camera...');
      
      // Clean up previous stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (!isMounted.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      console.log('[QRScanner] Camera stream obtained');
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          // Play the video and handle interruption
          await videoRef.current.play();
          console.log('[QRScanner] Video element playing');
        } catch (playErr: any) {
          if (playErr.name === 'AbortError') {
            console.log('[QRScanner] Play interrupted (normal during unmount)');
          } else {
            console.error('[QRScanner] Play error:', playErr);
          }
          return;
        }
      }

      if (isMounted.current) {
        setIsScanning(true);
        setIsInitializing(false);
        setHasPermission(true);
      }

      console.log('[QRScanner] Starting ZXing decode loop...');
      
      // Use decodeFromStream for continuous scanning
      codeReader.current.decodeFromStream(
        stream,
        videoRef.current,
        (result, err) => {
          if (!isMounted.current) return;
          
          if (result) {
            const token = result.getText();
            console.log('[QRScanner] SUCCESS! QR Code Detected:', token);
            if (token && token.trim()) {
              onScan(token.trim());
              
              // Immediate cleanup to stop further scans
              if (codeReader.current) codeReader.current.reset();
              if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
              }
              if (isMounted.current) setIsScanning(false);
            }
          }

          if (err && err.name !== 'NotFoundException') {
            const now = Date.now();
            if (now - lastHintTime.current > 2000) {
              console.log('[QRScanner] Scanning hint:', err.message);
              lastHintTime.current = now;
            }
          }
        }
      );

    } catch (err: any) {
      console.error('[QRScanner] Initialization failed:', err);
      if (isMounted.current) {
        setError(err.message || 'Camera failed');
        setIsScanning(false);
        setIsInitializing(false);
        setHasPermission(false);
      }
    }
  }, [disabled, onScan]);

  useEffect(() => {
    if (!disabled) {
      startScanning();
    }
    return () => {
      if (codeReader.current) codeReader.current.reset();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [disabled, startScanning]);

  if (hasPermission === false && !isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-destructive/5 border-destructive/20 text-center">
        <CameraOff className="w-12 h-12 text-destructive mb-4" />
        <p className="font-semibold mb-1">Camera Error</p>
        <p className="text-xs text-muted-foreground mb-6 max-w-[200px]">{error}</p>
        <Button onClick={startScanning} variant="outline" size="sm">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Retry Camera
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden border-2 border-muted shadow-2xl">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          autoPlay
        />
        
        {!isInitializing && isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/40 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
            <div className="relative z-10">
              <div className="w-64 h-64 border-2 border-white/30 rounded-3xl relative overflow-hidden backdrop-blur-[1px]">
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary shadow-[0_0_20px_#8c53dc] animate-scan-line" />
              </div>
              <div className="absolute -top-3 -left-3 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-xl" />
              <div className="absolute -top-3 -right-3 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-xl" />
              <div className="absolute -bottom-3 -left-3 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-xl" />
              <div className="absolute -bottom-3 -right-3 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-xl" />
            </div>
          </div>
        )}

        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 z-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-sm font-semibold tracking-wide uppercase">Starting Camera...</p>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        {isScanning ? (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold text-primary tracking-wider uppercase">Active</span>
            </div>
            <p className="text-xs text-muted-foreground">Align QR code within the square.</p>
          </div>
        ) : !isInitializing && (
          <Button onClick={startScanning} variant="default" className="w-full">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Restart Scanner
          </Button>
        )}
      </div>

      <style jsx global>{`
        @keyframes scan-line {
          0% { transform: translateY(0); }
          100% { transform: translateY(256px); }
        }
        .animate-scan-line {
          animation: scan-line 2.5s linear infinite;
        }
      `}</style>
    </div>
  );
}
