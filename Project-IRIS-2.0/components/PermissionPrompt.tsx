import React, { useState, useEffect } from 'react';
import { usePWAStatus, requestMicrophonePermission, requestCameraPermission } from '../hooks/usePWAStatus';

export const PermissionPrompt: React.FC = () => {
  const pwaStatus = usePWAStatus();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Show prompt if there are permission issues
    if (pwaStatus.errors.length > 0 || 
        pwaStatus.hasMicrophonePermission === false || 
        pwaStatus.hasCameraPermission === false) {
      setShowPrompt(true);
    }
  }, [pwaStatus]);

  const handleRequestPermissions = async () => {
    setIsRequesting(true);
    
    try {
      // Request microphone if needed
      if (pwaStatus.hasMicrophonePermission !== true) {
        const micGranted = await requestMicrophonePermission();
        if (!micGranted) {
          alert('Microphone permission is required for voice commands. Please enable it in your browser settings.');
        }
      }

      // Request camera if needed
      if (pwaStatus.hasCameraPermission !== true) {
        const cameraGranted = await requestCameraPermission();
        if (!cameraGranted) {
          alert('Camera permission is required for vision assistance. Please enable it in your browser settings.');
        }
      }

      // Reload status
      window.location.reload();
    } catch (error) {
      console.error('Error requesting permissions:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  if (!showPrompt || pwaStatus.errors.length === 0 && 
      pwaStatus.hasMicrophonePermission === true && 
      pwaStatus.hasCameraPermission === true) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-md rounded-lg shadow-lg p-4 border border-yellow-400/30">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-2">Permissions Required</h3>
          
          {!pwaStatus.isHTTPS && (
            <p className="text-white/90 text-sm mb-2">
              ⚠️ HTTPS connection required for voice commands
            </p>
          )}
          
          {!pwaStatus.isSpeechRecognitionSupported && (
            <p className="text-white/90 text-sm mb-2">
              ⚠️ Speech recognition not supported in your browser. Try Chrome or Edge.
            </p>
          )}
          
          {pwaStatus.hasMicrophonePermission === false && (
            <p className="text-white/90 text-sm mb-2">
              🎤 Microphone access is required for voice commands
            </p>
          )}
          
          {pwaStatus.hasCameraPermission === false && (
            <p className="text-white/90 text-sm mb-2">
              📷 Camera access is required for vision assistance
            </p>
          )}

          {pwaStatus.hasMicrophonePermission === null && (
            <p className="text-white/90 text-sm mb-2">
              🎤 Microphone permission not yet requested
            </p>
          )}

          {pwaStatus.hasCameraPermission === null && (
            <p className="text-white/90 text-sm mb-2">
              📷 Camera permission not yet requested
            </p>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleRequestPermissions}
              disabled={isRequesting}
              className="px-4 py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors disabled:opacity-50"
            >
              {isRequesting ? 'Requesting...' : 'Grant Permissions'}
            </button>
            
            <button
              onClick={() => setShowPrompt(false)}
              className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
            >
              Dismiss
            </button>
          </div>

          {pwaStatus.isStandalone && (
            <p className="text-white/70 text-xs mt-2">
              ✓ Running as installed PWA
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
