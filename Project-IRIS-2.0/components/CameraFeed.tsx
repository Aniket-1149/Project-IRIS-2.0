
import React from 'react';

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({ videoRef }) => {
  return (
    <video
      ref={videoRef}
      className="absolute top-0 left-0 w-full h-full object-cover transform scaleX-[-1]"
      playsInline
      muted
      autoPlay
    ></video>
  );
};
