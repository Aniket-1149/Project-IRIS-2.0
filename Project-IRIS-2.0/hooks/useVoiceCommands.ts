import { useState, useEffect, useCallback, useRef } from 'react';

// Type definitions for the Web Speech API
interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
        confidence?: number;
      };
    };
  };
}
interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
}
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

interface UseVoiceCommandsProps {
  onTranscript: (transcript: string, isFinal: boolean, confidence: number) => void;
  language: 'en-US' | 'hi-IN';
}

export const useVoiceCommands = ({ onTranscript, language }: UseVoiceCommandsProps) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;
  const isStoppedManually = useRef(false);
  const restartTimerRef = useRef<number | null>(null);
  const isPaused = useRef(false);
  const isMobileRef = useRef(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

  useEffect(() => {
    if (!SpeechRecognition) {
      setError("Voice recognition is not supported by your browser.");
      return;
    }

    // Request microphone permission explicitly for PWA
    const requestMicrophonePermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        console.error("Microphone permission denied:", err);
        setError("Microphone access is required for voice commands. Please grant permission.");
      }
    };

    requestMicrophonePermission();

    const recognition = new SpeechRecognition();
    // On mobile, continuous mode is unreliable, so we use manual restart
    recognition.continuous = !isMobileRef.current;
    recognition.interimResults = true;
    recognition.lang = language;
    
    // Mobile-specific: increase max alternatives for better recognition
    if (isMobileRef.current) {
      (recognition as any).maxAlternatives = 3;
    }

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended, paused:', isPaused.current, 'stopped:', isStoppedManually.current);
      setIsListening(false);
      
      // Clear any existing restart timer
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
      
      // Only restart if not manually stopped and not paused
      if (!isStoppedManually.current && !isPaused.current) {
        // Mobile needs more aggressive restart with longer delay
        const restartDelay = isMobileRef.current ? 500 : 250;
        
        restartTimerRef.current = window.setTimeout(() => {
          // Double check state before restarting
          if (!isStoppedManually.current && !isPaused.current) {
            try { 
              console.log('Auto-restarting speech recognition');
              recognitionRef.current?.start(); 
            } catch (e) {
              if (e instanceof DOMException && e.name === 'InvalidStateError') {
                console.log('Recognition already starting, ignoring error');
              } else {
                console.warn("Could not restart recognition:", e);
              }
            }
          }
        }, restartDelay);
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'audio-capture' && event.error !== 'aborted') {
        setError(`Speech Error: ${event.error}`);
        console.error('Speech recognition error:', event.error);
      }
    };

    recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript.trim().toLowerCase();
      const confidence = lastResult[0].confidence || 0;
      
      if (lastResult.isFinal && transcript && onTranscriptRef.current) {
        onTranscriptRef.current(transcript, true, confidence); // Pass final transcript
      } else if (!lastResult.isFinal && transcript && onTranscriptRef.current) {
        onTranscriptRef.current(transcript, false, confidence); // Pass interim transcript
      }
    };

    recognitionRef.current = recognition;

    // Handle visibility change for mobile PWA
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('App hidden, pausing recognition');
        // App went to background, pause recognition
        if (recognitionRef.current && isListening) {
          isPaused.current = true;
          try {
            recognitionRef.current.stop();
          } catch (e) {
            console.warn('Error stopping on visibility change:', e);
          }
        }
      } else {
        console.log('App visible, resuming recognition');
        // App came to foreground, resume if it was active
        if (recognitionRef.current && !isStoppedManually.current) {
          isPaused.current = false;
          setTimeout(() => {
            try {
              if (!isStoppedManually.current) {
                recognitionRef.current?.start();
              }
            } catch (e) {
              console.warn('Error resuming on visibility change:', e);
            }
          }, 300);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      isStoppedManually.current = true;
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [language]);

  const startListening = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
    }
    if (recognitionRef.current && !isListening) {
      isStoppedManually.current = false;
      isPaused.current = false;
      try {
        recognitionRef.current.start();
      } catch (e) {
        // This can happen if start is called while it's already starting
        console.warn("Could not start voice commands listener:", e);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
    }
    if (recognitionRef.current) {
      isStoppedManually.current = true;
      isPaused.current = false;
      recognitionRef.current.stop();
    }
  }, []);

  const restartListening = useCallback(() => {
    if (recognitionRef.current) {
      isStoppedManually.current = false;
      isPaused.current = false;
      // Use a short timeout to avoid race conditions if the recognition is still in the process of stopping.
      setTimeout(() => {
        try {
          recognitionRef.current?.start();
        } catch (e) {
          // It might fail if it's already starting, which is fine.
          if (e instanceof DOMException && e.name === 'InvalidStateError') {
            // Silently ignore.
          } else {
            console.warn("Could not force restart recognition.", e);
          }
        }
      }, 100);
    }
  }, []);

  const pauseListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      isPaused.current = true;
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resumeListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      isPaused.current = false;
      // Add a small delay to ensure the recognition engine has fully stopped before restarting.
      setTimeout(() => {
        try {
          recognitionRef.current?.start();
        } catch (e) {
          if (e instanceof DOMException && e.name === 'InvalidStateError') {
            // This can still happen in rare race conditions, so we'll log it but not crash.
            console.warn("Could not resume listening, it was likely already starting.", e);
          } else {
            console.error("Could not resume voice commands listener:", e);
          }
        }
      }, 100); // 100ms delay
    }
  }, [isListening]);

  return { isListening, error, startListening, stopListening, pauseListening, resumeListening, restartListening };
};