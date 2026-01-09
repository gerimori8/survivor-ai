
import React, { useState, useEffect, Suspense } from 'react';
import { LocationModule } from './components/LocationModule';
import { AppModule, LocationIntel } from './types';
import { getLocationIntel } from './services/geminiService';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useFirestoreInventory } from './hooks/useFirestoreInventory'; // Nuevo Hook
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { AuthScreen } from './components/AuthScreen';

const ScannerModule = React.lazy(() => import('./components/ScannerModule').then(m => ({ default: m.ScannerModule })));
const LiveSessionModule = React.lazy(() => import('./components/LiveSessionModule').then(m => ({ default: m.LiveSessionModule })));
const CommandCenterModule = React.lazy(() => import('./components/CommandCenterModule').then(m => ({ default: m.CommandCenterModule })));
const InventoryModule = React.lazy(() => import('./components/InventoryModule').then(m => ({ default: m.InventoryModule })));

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Authentication Listener
  useEffect(() => {
    if (!auth) {
        setAuthLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [currentModule, setCurrentModule] = useState<AppModule>(AppModule.LOCATION);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  
  // Usar Firestore para el inventario en lugar de solo LocalStorage
  const [inventory, setInventory] = useFirestoreInventory(user);
  
  // LocalStorage se mantiene para datos no críticos como la última ubicación vista
  const [locationData, setLocationData] = useLocalStorage<LocationIntel | null>('last_site_data', null);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleLocationRefresh = (lat?: number, lng?: number, address?: string) => {
      setLocationLoading(true);
      getLocationIntel({ lat, lng, manualAddress: address }, "Mi mochila")
        .then(res => setLocationData(res))
        .finally(() => setLocationLoading(false));
  };

  const handleLogout = () => {
      if (auth) signOut(auth);
  };

  if (authLoading) {
      return <div className="h-screen w-screen bg-om-navy flex items-center justify-center text-om-gold font-mono text-xs animate-pulse">INICIALIZANDO PROTOCOLOS...</div>;
  }

  if (!user) {
      return <AuthScreen />;
  }

  const navItems = [
    { id: AppModule.LOCATION, label: 'Mapa', icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path> },
    { id: AppModule.SCANNER, label: '¿Qué es?', icon: <><circle cx="12" cy="13" r="4"/><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/></> },
    { id: AppModule.INVENTORY, label: 'Mochila', icon: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></> },
    { id: AppModule.COMMAND, label: 'Chat', icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/> },
    { id: AppModule.LIVE, label: 'Video', icon: <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></> }
  ];

  return (
    <div className={`flex flex-col h-screen transition-colors duration-500 ${lowPowerMode ? 'bg-black' : 'bg-om-cream'}`}>
      <header className="h-20 flex items-center justify-between px-6 shrink-0 z-20">
         <div>
             <h1 className="font-serif text-2xl font-bold leading-none">Survivor<span className="text-om-gold">AI</span></h1>
             <p className="font-mono text-[8px] uppercase tracking-widest opacity-50 mt-1 flex items-center gap-1">
                 <span className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-green-500' : 'bg-red-500'}`}></span>
                 {user.isAnonymous ? `FANTASMA: ${user.uid.slice(0,5)}...` : user.email?.split('@')[0]}
             </p>
         </div>
         <div className="flex gap-3">
             <button onClick={handleLogout} className="p-2 text-xs font-mono border border-red-500/30 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors uppercase">
                 Salir
             </button>
             <button onClick={() => setLowPowerMode(!lowPowerMode)} className={`p-2 rounded-xl border ${lowPowerMode ? 'border-om-gold text-om-gold' : 'border-om-navy/10 text-om-navy'}`}>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="6" width="18" height="12" rx="2"/><path d="M23 13v-2"/></svg>
             </button>
         </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        <Suspense fallback={<div className="h-full flex items-center justify-center font-mono text-xs opacity-50">CARGANDO...</div>}>
            {(() => {
                switch (currentModule) {
                    case AppModule.SCANNER: return <ScannerModule inventoryItems={inventory} isLowBattery={lowPowerMode} />;
                    case AppModule.LOCATION: return <LocationModule data={locationData} loading={locationLoading} error={null} onRefresh={handleLocationRefresh} isLowBattery={lowPowerMode} onNavigate={setCurrentModule} inventoryItems={inventory} />;
                    case AppModule.INVENTORY: return <InventoryModule items={inventory} onUpdate={setInventory} isLowBattery={lowPowerMode} />;
                    case AppModule.COMMAND: return <CommandCenterModule inventoryItems={inventory} setInventory={setInventory} isLowBattery={lowPowerMode} />;
                    case AppModule.LIVE: return <LiveSessionModule isLowBattery={lowPowerMode} />;
                    default: return <LocationModule data={locationData} loading={locationLoading} error={null} onRefresh={handleLocationRefresh} isLowBattery={lowPowerMode} onNavigate={setCurrentModule} inventoryItems={inventory} />;
                }
            })()}
        </Suspense>
      </main>

      <nav className="h-24 pb-8 flex items-center justify-around shrink-0 bg-white border-t border-gray-100 px-2">
          {navItems.map(item => (
              <button key={item.id} onClick={() => setCurrentModule(item.id)} className={`flex flex-col items-center gap-1 flex-1 ${currentModule === item.id ? 'text-om-navy' : 'text-gray-400'}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{item.icon}</svg>
                  <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
              </button>
          ))}
      </nav>
    </div>
  );
}
