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

  useEffect(() => {
    if (!SpeechRecognition) {
      setError("Voice recognition is not supported by your browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true; // Enable interim results
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Debounced auto-restart logic to prevent race conditions.
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
      if (!isStoppedManually.current && !isPaused.current) {
        restartTimerRef.current = window.setTimeout(() => {
          try { 
            recognitionRef.current?.start(); 
          } catch (e) {
            // This error is expected if start() is called when already starting. Ignore it.
            if (e instanceof DOMException && e.name === 'InvalidStateError') {
              // Silently ignore.
            } else {
              console.warn("Could not restart recognition, it was likely stopped.", e);
            }
          }
        }, 250);
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
      
      if (lastResult.isFinal && transcript && onTranscriptRef.current) {
        onTranscriptRef.current(transcript, true); // Pass final transcript
      } else if (!lastResult.isFinal && transcript && onTranscriptRef.current) {
        onTranscriptRef.current(transcript, false); // Pass interim transcript
      }
    };

    recognitionRef.current = recognition;

    return () => {
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