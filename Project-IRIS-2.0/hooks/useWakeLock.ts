import { useEffect, useRef } from 'react';

// Wake Lock API to prevent screen from sleeping during voice commands
export const useWakeLock = (isActive: boolean) => {
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    if (!isActive) {
      // Release wake lock when not active
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Wake lock released');
      }
      return;
    }

    // Request wake lock when active
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          console.log('Wake lock acquired');

          wakeLockRef.current.addEventListener('release', () => {
            console.log('Wake lock was released');
          });
        }
      } catch (err: any) {
        console.error(`Wake lock error: ${err.name}, ${err.message}`);
      }
    };

    requestWakeLock();

    // Re-acquire wake lock on visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden && isActive && wakeLockRef.current === null) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, [isActive]);

  return wakeLockRef.current !== null;
};
