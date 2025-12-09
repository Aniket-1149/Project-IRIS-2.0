import { useRef, useEffect, useCallback, useState } from 'react';
import { detectCollisionRisk } from '../services/geminiService';

interface CollisionAlert {
  hasRisk: boolean;
  alert: string;
  severity: 'critical' | 'warning' | 'safe';
  timestamp: number;
}

interface UseCollisionDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isEnabled: boolean;
  onAlert: (alert: string, severity: 'critical' | 'warning' | 'safe') => void;
  checkInterval?: number; // milliseconds between checks (default: 2000ms)
}

export const useCollisionDetection = ({ 
  videoRef, 
  isEnabled, 
  onAlert,
  checkInterval = 2000 
}: UseCollisionDetectionProps) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastAlert, setLastAlert] = useState<CollisionAlert | null>(null);
  const intervalRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);
  const previousFrameDataRef = useRef<string | null>(null);
  const alertCooldownRef = useRef<{ [key: string]: number }>({});
  const lastAlertRef = useRef<CollisionAlert | null>(null);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.warn('[Collision Detection] Video not ready for capture');
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.warn('[Collision Detection] Failed to get canvas context');
      return null;
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg', 0.85); // Higher quality for better detection
    
    console.log('[Collision Detection] Frame captured:', {
      width: canvas.width,
      height: canvas.height,
      dataSize: `${(imageData.length / 1024).toFixed(1)} KB`
    });
    
    return imageData;
  }, [videoRef]);

  const calculateFrameDifference = useCallback((frame1: string, frame2: string): number => {
    // Simple pixel difference calculation
    // In a real implementation, you might want to use a more sophisticated algorithm
    const data1 = frame1.split(',')[1];
    const data2 = frame2.split(',')[1];
    
    if (!data1 || !data2) return 0;
    
    let differences = 0;
    const sampleSize = Math.min(data1.length, data2.length, 1000); // Sample for performance
    
    for (let i = 0; i < sampleSize; i += 10) {
      if (data1[i] !== data2[i]) {
        differences++;
      }
    }
    
    return (differences / (sampleSize / 10)) * 100; // Percentage of difference
  }, []);

  const shouldAlert = useCallback((alertKey: string, severity: 'critical' | 'warning' | 'safe'): boolean => {
    const now = Date.now();
    const lastAlertTime = alertCooldownRef.current[alertKey] || 0;
    
    // Critical alerts can repeat every 3 seconds
    // Warning alerts every 10 seconds
    // Safe alerts not repeated
    const cooldownPeriod = severity === 'critical' ? 3000 : severity === 'warning' ? 10000 : 999999;
    
    return now - lastAlertTime > cooldownPeriod;
  }, []);

  const checkForCollision = useCallback(async () => {
    if (isProcessingRef.current || !isEnabled) {
      if (isProcessingRef.current) {
        console.log('[Collision Detection] Already processing, skipping check');
      }
      return;
    }
    
    isProcessingRef.current = true;
    setIsDetecting(true);
    console.log('[Collision Detection] Starting check...');

    try {
      const currentFrame = captureFrame();
      if (!currentFrame) {
        console.warn('[Collision Detection] Failed to capture frame');
        isProcessingRef.current = false;
        setIsDetecting(false);
        return;
      }

      // Check for significant frame change (sudden movement)
      let frameChange = 0;
      const isFirstCheck = !previousFrameDataRef.current;
      
      if (previousFrameDataRef.current) {
        frameChange = calculateFrameDifference(previousFrameDataRef.current, currentFrame);
      }
      previousFrameDataRef.current = currentFrame;

      // Always analyze on first check, or if there's significant change
      // Skip only if: not first check AND small change AND last result was safe
      const lastSeverity = lastAlertRef.current?.severity;
      if (!isFirstCheck && frameChange < 15 && lastSeverity === 'safe') {
        console.log(`[Collision Detection] Frame change too small (${frameChange.toFixed(1)}%), skipping analysis`);
        isProcessingRef.current = false;
        setIsDetecting(false);
        return;
      }

      console.log(`[Collision Detection] Analyzing frame (change: ${frameChange.toFixed(1)}%, first: ${isFirstCheck})`);
      
      // DEBUG: Allow viewing captured image
      if ((window as any).__debugCollision) {
        console.log('[Collision Detection] DEBUG: Opening captured image in new tab');
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(`<img src="${currentFrame}" style="max-width:100%"/><p>This is what Gemini sees</p>`);
        }
      }
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('API timeout after 10 seconds')), 10000);
      });
      
      const result = await Promise.race([
        detectCollisionRisk(currentFrame),
        timeoutPromise
      ]);
      
      console.log('[Collision Detection] API Response:', result);
      
      const alert: CollisionAlert = {
        hasRisk: result.hasRisk,
        alert: result.alert,
        severity: result.severity,
        timestamp: Date.now()
      };

      // Update both state and ref
      lastAlertRef.current = alert;
      setLastAlert(alert);

      // Only trigger callback if it's a new alert or passed cooldown
      if (result.hasRisk) {
        const alertKey = `${result.severity}-${result.alert.substring(0, 30)}`;
        
        if (shouldAlert(alertKey, result.severity)) {
          console.log(`[Collision Detection] ${result.severity.toUpperCase()}: ${result.alert}`);
          onAlert(result.alert, result.severity);
          alertCooldownRef.current[alertKey] = Date.now();
        } else {
          console.log(`[Collision Detection] Alert suppressed (cooldown): ${result.alert}`);
        }
      } else {
        console.log(`[Collision Detection] No collision risk detected`);
      }
    } catch (error) {
      console.error('[Collision Detection] Error occurred:', error);
      // On error, reset to allow next check
      lastAlertRef.current = null;
    } finally {
      console.log('[Collision Detection] Check complete, resetting processing flag');
      isProcessingRef.current = false;
      setIsDetecting(false);
    }
  }, [isEnabled, captureFrame, calculateFrameDifference, onAlert, shouldAlert]); // Removed lastAlert dependency!

  useEffect(() => {
    if (isEnabled) {
      console.log('[Collision Detection] Starting collision detection');
      
      // Initial check immediately
      checkForCollision();
      
      // Then periodic checks
      intervalRef.current = window.setInterval(() => {
        checkForCollision();
      }, checkInterval);
    } else {
      console.log('[Collision Detection] Stopping collision detection');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      previousFrameDataRef.current = null;
      lastAlertRef.current = null;
      alertCooldownRef.current = {};
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isEnabled, checkForCollision, checkInterval]);

  const forceCheck = useCallback(() => {
    if (!isProcessingRef.current) {
      checkForCollision();
    }
  }, [checkForCollision]);

  return {
    isDetecting,
    lastAlert,
    forceCheck
  };
};
