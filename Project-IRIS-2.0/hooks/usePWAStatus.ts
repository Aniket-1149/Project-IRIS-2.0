import { useEffect, useState } from 'react';

interface PWAStatus {
  isHTTPS: boolean;
  hasMicrophonePermission: boolean | null;
  hasCameraPermission: boolean | null;
  isSpeechRecognitionSupported: boolean;
  isStandalone: boolean;
  errors: string[];
}

export const usePWAStatus = () => {
  const [status, setStatus] = useState<PWAStatus>({
    isHTTPS: false,
    hasMicrophonePermission: null,
    hasCameraPermission: null,
    isSpeechRecognitionSupported: false,
    isStandalone: false,
    errors: [],
  });

  useEffect(() => {
    const checkStatus = async () => {
      const errors: string[] = [];
      
      // Check HTTPS
      const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      if (!isHTTPS) {
        errors.push('Voice commands require HTTPS (secure connection)');
      }

      // Check if running as standalone PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;

      // Check Speech Recognition support
      const isSpeechRecognitionSupported = 
        'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
      if (!isSpeechRecognitionSupported) {
        errors.push('Speech recognition is not supported in your browser');
      }

      // Check microphone permission
      let hasMicrophonePermission: boolean | null = null;
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        hasMicrophonePermission = permissionStatus.state === 'granted';
        if (permissionStatus.state === 'denied') {
          errors.push('Microphone permission has been denied. Please enable it in your browser settings.');
        }
      } catch (error) {
        // Permissions API might not be supported
        console.warn('Could not check microphone permission:', error);
      }

      // Check camera permission
      let hasCameraPermission: boolean | null = null;
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
        hasCameraPermission = permissionStatus.state === 'granted';
        if (permissionStatus.state === 'denied') {
          errors.push('Camera permission has been denied. Please enable it in your browser settings.');
        }
      } catch (error) {
        console.warn('Could not check camera permission:', error);
      }

      setStatus({
        isHTTPS,
        hasMicrophonePermission,
        hasCameraPermission,
        isSpeechRecognitionSupported,
        isStandalone,
        errors,
      });
    };

    checkStatus();
  }, []);

  return status;
};

export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately after permission is granted
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
};

export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    // Stop the stream immediately after permission is granted
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Camera permission denied:', error);
    return false;
  }
};
