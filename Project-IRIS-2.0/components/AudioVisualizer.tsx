import React from 'react';

interface AudioVisualizerProps {
  volume: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ volume }) => {
  return (
    <div className="w-full max-w-xs h-2 bg-gray-700 rounded-full overflow-hidden mx-auto">
      <div
        className="h-full bg-cyan-400 rounded-full transition-transform duration-75 ease-out"
        style={{
          transform: `scaleX(${volume})`,
          transformOrigin: 'left',
        }}
      ></div>
    </div>
  );
};
