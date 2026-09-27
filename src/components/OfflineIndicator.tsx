import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/90 border border-amber-400 text-slate-950 px-3 py-1.5 text-xs font-semibold shadow-2xl backdrop-blur-md animate-bounce">
      <WifiOff className="w-4 h-4" />
      <span>Offline Mode — Cached data and offline engine active.</span>
    </div>
  );
};
