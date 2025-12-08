import { useState, useRef, useCallback } from 'react';

export const useAudioVisualizer = (stream: MediaStream | null) => {
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const isVisualizing = useRef(false);

  const cleanup = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    isVisualizing.current = false;
    setVolume(0);
  }, []);

  const draw = useCallback(() => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
      // Normalize the volume to a 0-1 range for easier use in the UI
      const normalizedVolume = Math.min(average / 128, 1);
      setVolume(normalizedVolume);
      animationFrameId.current = requestAnimationFrame(draw);
    }
  }, []);

  const setup = useCallback((audioStream: MediaStream) => {
    if (isVisualizing.current || !audioStream.getAudioTracks().length) return;
    
    cleanup();

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const source = audioContext.createMediaStreamSource(audioStream);
    sourceRef.current = source;
    
    source.connect(analyser);

    isVisualizing.current = true;
    draw();
  }, [cleanup, draw]);

  const start = useCallback(() => {
    if (stream) {
      setup(stream);
    }
  }, [stream, setup]);

  const stop = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return { volume, start, stop };
};
