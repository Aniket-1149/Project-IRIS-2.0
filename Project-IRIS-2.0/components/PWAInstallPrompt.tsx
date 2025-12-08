import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-cyan-600 text-white p-4 rounded-lg shadow-2xl z-50 flex items-center justify-between animate-slide-up">
      <div className="flex-1">
        <h3 className="font-bold text-lg">Install IRIS 2.0</h3>
        <p className="text-sm opacity-90">Add to home screen for offline access</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleDismiss}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-semibold"
        >
          Later
        </button>
        <button
          onClick={handleInstallClick}
          className="px-4 py-2 bg-white text-cyan-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-semibold"
        >
          Install
        </button>
      </div>
    </div>
  );
};
