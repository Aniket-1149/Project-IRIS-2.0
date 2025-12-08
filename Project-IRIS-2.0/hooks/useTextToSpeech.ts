import { useState, useCallback, useEffect } from 'react';

export const useTextToSpeech = (language: 'en-US' | 'hi-IN') => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synth = window.speechSynthesis;

  useEffect(() => {
    const getVoices = () => {
      const voiceList = synth.getVoices();
      setVoices(voiceList);
    };

    // Voices are loaded asynchronously.
    getVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = getVoices;
    }
  }, [synth]);

  const speak = useCallback((text: string) => {
    if (synth.speaking) {
      synth.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;

    if (language === 'hi-IN') {
      // Find all available Hindi voices.
      const hindiVoices = voices.filter(voice => voice.lang === 'hi-IN');

      if (hindiVoices.length > 0) {
        // Prefer a "Google" voice as they are often higher quality, but fall back to the first available.
        const preferredVoice = 
          hindiVoices.find(voice => voice.name.includes('Google')) || 
          hindiVoices.find(voice => voice.name.includes('Female')) || 
          hindiVoices.find(voice => voice.name.includes('female')) || 
          hindiVoices[0];
          
        utterance.voice = preferredVoice;
      }
      // If no hi-IN voice is found, the browser will try to use the default voice for the language,
      // which may or may not work depending on the browser and OS setup.
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synth.speak(utterance);
  }, [synth, language, voices]);

  const cancel = useCallback(() => {
    if (synth.speaking) {
      synth.cancel();
      setIsSpeaking(false);
    }
  }, [synth]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if(synth) {
        synth.cancel();
      }
    }
  }, [synth]);

  return { speak, cancel, isSpeaking };
};
