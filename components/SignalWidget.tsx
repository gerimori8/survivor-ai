import React, { useEffect, useState } from 'react';
import { NetworkQuality, NetworkInformation } from '../types';

export const SignalWidget: React.FC = () => {
  const [quality, setQuality] = useState<NetworkQuality>(NetworkQuality.STRONG);
  
  useEffect(() => {
    const updateNetworkStatus = () => {
      const nav = navigator as any;
      const conn: NetworkInformation = nav.connection || nav.mozConnection || nav.webkitConnection;
      
      if (!conn) {
         setQuality(navigator.onLine ? NetworkQuality.STRONG : NetworkQuality.LOST);
         return;
      }
      const downlink = conn.downlink;
      if (downlink > 5) setQuality(NetworkQuality.MAXIMUM);
      else if (downlink > 0.2) setQuality(NetworkQuality.STRONG);
      else if (downlink > 0.05) setQuality(NetworkQuality.MEDIUM);
      else setQuality(NetworkQuality.WEAK);
    };

    const nav = navigator as any;
    if (nav.connection) {
      nav.connection.addEventListener('change', updateNetworkStatus);
      updateNetworkStatus();
    }
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', () => setQuality(NetworkQuality.LOST));
    return () => {
       if (nav.connection) nav.connection.removeEventListener('change', updateNetworkStatus);
       window.removeEventListener('online', updateNetworkStatus);
       window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  return (
    <div className="border border-om-navy/20 rounded-lg p-1.5 hover:bg-om-navy/5 transition-colors cursor-help">
       {/* Icon resembling the battery/card icon in screenshot */}
       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`text-om-navy ${quality === NetworkQuality.LOST ? 'text-red-500' : ''}`}>
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
       </svg>
    </div>
  );
};
