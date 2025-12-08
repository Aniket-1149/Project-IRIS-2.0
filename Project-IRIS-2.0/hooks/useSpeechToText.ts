import { useRef, useCallback, useState } from 'react';

// SpeechRecognition type definitions from useVoiceCommands hook
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
  results: {
    length: number;
    [index: number]: {
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

export const useSpeechToText = () => {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const listen = useCallback((): Promise<string> => {
        return new Promise((resolve, reject) => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                return reject("Speech recognition not supported by your browser.");
            }

            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }

            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;
            recognition.continuous = false; // We want to capture a single phrase
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => {
                setIsListening(false);
                recognitionRef.current = null;
            };
            recognition.onerror = (event) => {
                setIsListening(false);
                recognitionRef.current = null;
                reject(event.error === 'no-speech' ? 'Please try speaking again.' : event.error);
            };
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                resolve(transcript);
            };

            try {
                recognition.start();
            } catch (e) {
                reject("Could not start listening. Please try again.");
            }
        });
    }, []);

    const stop = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
            recognitionRef.current = null;
        }
    }, []);

    return { isListening, listen, stop };
};
