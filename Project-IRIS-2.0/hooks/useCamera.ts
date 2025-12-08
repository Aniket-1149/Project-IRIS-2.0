
import { useState, useEffect, RefObject } from 'react';

export const useCamera = (videoRef: RefObject<HTMLVideoElement>) => {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let localStream: MediaStream | null = null;
    const enableCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera API is not supported by your browser.');
        return;
      }

      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment' // Prefer rear camera
          },
          audio: true // Request audio for visualizer
        });
        setStream(localStream);

        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsCameraReady(true);
          };
        }
      } catch (err) {
        if (err instanceof DOMException) {
            if(err.name === "NotAllowedError" || err.name === "PermissionDeniedError"){
                 setError('Camera and Microphone permission denied.');
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError"){
                 setError('No camera or microphone found.');
            } else {
                 setError(`An error occurred: ${err.name}`);
            }
        } else {
            setError('An unknown error occurred while accessing the camera/microphone.');
        }
        console.error("Media device access error:", err);
      }
    };

    enableCamera();

    return () => {
      // Cleanup: stop the stream and tracks when the component unmounts
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef]);

  return { isCameraReady, error, stream };
};