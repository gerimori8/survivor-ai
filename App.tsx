
import React, { useState, useEffect, Suspense, useRef } from 'react';
import { LocationModule } from './components/LocationModule';
import { AppModule, InventoryItem, BatteryManager, LocationIntel } from './types';
import { getLocationIntel } from './services/geminiService';
import { useLocalStorage } from './hooks/useLocalStorage';

// Lazy Load heavy components for better initial performance
const ScannerModule = React.lazy(() => import('./components/ScannerModule').then(module => ({ default: module.ScannerModule })));
const LiveSessionModule = React.lazy(() => import('./components/LiveSessionModule').then(module => ({ default: module.LiveSessionModule })));
const CommandCenterModule = React.lazy(() => import('./components/CommandCenterModule').then(module => ({ default: module.CommandCenterModule })));
const InventoryModule = React.lazy(() => import('./components/InventoryModule').then(module => ({ default: module.InventoryModule })));
const ManualModule = React.lazy(() => import('./components/ManualModule').then(module => ({ default: module.ManualModule })));

export default function App() {
  const [currentModule, setCurrentModule] = useState<AppModule>(AppModule.LOCATION);
  const [inventory, setInventory] = useLocalStorage<InventoryItem[]>('survivor_inventory', []);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const manualPowerOverride = useRef(false);
  const [locationData, setLocationData] = useLocalStorage<LocationIntel | null>('survivor_location_data', null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
      const checkBattery = async () => {
          if ('getBattery' in navigator) {
              const battery = await (navigator as any).getBattery() as BatteryManager;
              const updatePowerMode = () => {
                  if (manualPowerOverride.current) return; 
                  if (battery.level < 0.15) setLowPowerMode(true);
              };
              updatePowerMode();
              battery.addEventListener('levelchange', updatePowerMode);
          }
      };
      checkBattery();
  }, []);

  const togglePowerMode = () => {
      manualPowerOverride.current = true;
      setLowPowerMode(prev => !prev);
  };

  const handleLocationRefresh = (lat?: number, lng?: number, address?: string) => {
      setLocationLoading(true);
      setLocationError(null);
      
      const invString = inventory.map(i => `${i.quantity}x ${i.name}`).join(', ');

      // CHANGE: Removed "Kit Básico" fallback. Explicitly state empty inventory.
      getLocationIntel({ lat, lng, manualAddress: address }, invString || "INVENTARIO VACÍO (Sin equipos)")
        .then(res => setLocationData(res))
        .catch((err) => {
            console.error(err);
            setLocationError("CONEXIÓN FALLIDA");
        })
        .finally(() => setLocationLoading(false));
  };

  const renderModule = () => {
    const LoadingState = () => (
       <div className={`h-full flex flex-col items-center justify-center space-y-4 ${lowPowerMode ? 'bg-black' : 'bg-om-cream'}`}>
          <div className="w-8 h-8 border-2 border-om-gold border-t-transparent rounded-full animate-spin"></div>
          <span className="font-mono text-xs tracking-widest text-om-gold animate-pulse">CARGANDO...</span>
       </div>
    );

    return (
      <Suspense fallback={<LoadingState />}>
        {(() => {
          switch (currentModule) {
            case AppModule.SCANNER: return <ScannerModule inventoryItems={inventory} isLowBattery={lowPowerMode} />;
            case AppModule.LOCATION: 
                return <LocationModule 
                          inventoryItems={inventory} 
                          isLowBattery={lowPowerMode} 
                          onNavigate={setCurrentModule}
                          data={locationData}
                          loading={locationLoading}
                          error={locationError}
                          onRefresh={handleLocationRefresh}
                       />;
            case AppModule.LIVE: return <LiveSessionModule isLowBattery={lowPowerMode} />;
            case AppModule.COMMAND: return <CommandCenterModule inventoryItems={inventory} setInventory={setInventory} isLowBattery={lowPowerMode} />;
            case AppModule.INVENTORY: return <InventoryModule items={inventory} onUpdate={setInventory} isLowBattery={lowPowerMode} />;
            case AppModule.MANUAL: return <ManualModule isLowBattery={lowPowerMode} />;
            default: return <LocationModule 
                          inventoryItems={inventory} 
                          isLowBattery={lowPowerMode} 
                          onNavigate={setCurrentModule}
                          data={locationData}
                          loading={locationLoading}
                          error={locationError}
                          onRefresh={handleLocationRefresh}
                       />;
          }
        })()}
      </Suspense>
    );
  };

  // Styles
  const bgClass = lowPowerMode ? 'bg-black text-gray-500' : 'bg-om-cream text-om-navy';
  const headerClass = lowPowerMode ? 'bg-black border-gray-800' : 'bg-om-cream border-gray-200/50';
  const navClass = lowPowerMode ? 'bg-black border-gray-800' : 'bg-white border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]';

  return (
    <div className={`flex flex-col h-[100dvh] transition-colors duration-500 font-sans ${bgClass}`}>
      
      {/* HEADER */}
      <header className={`h-20 flex items-center justify-between px-6 border-b z-20 shrink-0 ${headerClass}`}>
         <div className="w-10"></div> 
         
         <div className="flex flex-col items-center justify-center pt-1">
             <h1 className={`font-serif text-2xl font-bold tracking-tight leading-none ${lowPowerMode ? 'text-gray-400' : 'text-om-navy'}`}>
                Survivor<span className="text-om-gold italic">AI</span>
             </h1>
             <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-gray-400 mt-1">Version V.1.3 ES</span>
             <span className="font-serif text-[11px] text-om-gold font-bold italic tracking-widest mt-1">Creado por Darío y Gerard</span>
         </div>
         
         <div className="w-10 flex justify-end">
            <button 
                onClick={togglePowerMode}
                className={`p-2 rounded-lg border transition-all active:scale-95 ${
                    lowPowerMode 
                    ? 'border-om-gold text-om-gold bg-om-gold/10 shadow-[0_0_10px_rgba(197,160,89,0.2)]' 
                    : 'border-om-navy/20 text-om-navy/60 hover:bg-om-navy/5'
                }`}
                title="Modo Ahorro"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                   <rect x="1" y="6" width="18" height="12" rx="2" ry="2" />
                   <path d="M23 13v-2" />
                   {lowPowerMode && <path d="M7 10l2 4l2-4" strokeWidth="2" />} 
                </svg>
            </button>
         </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 relative overflow-hidden">
        {!lowPowerMode && (
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none"></div>
        )}
        <div className={`absolute inset-0 scanlines pointer-events-none z-10 ${lowPowerMode ? 'opacity-20' : 'opacity-[0.02]'}`}></div>
        {renderModule()}
      </main>

      {/* BOTTOM NAVIGATION */}
      <nav className={`h-24 pb-8 flex items-center justify-around z-20 shrink-0 ${navClass}`}>
        <button onClick={() => setCurrentModule(AppModule.LOCATION)} className="flex flex-col items-center gap-1 group">
             <div className={`p-3 rounded-xl transition-colors ${currentModule === AppModule.LOCATION && !lowPowerMode ? 'bg-[#F3F0E6]' : ''}`}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={currentModule === AppModule.LOCATION ? 'text-om-navy' : 'text-gray-400'}>
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>
                 </svg>
             </div>
             {currentModule === AppModule.LOCATION && <span className="text-[9px] font-bold uppercase tracking-wider">Inicio</span>}
        </button>

        <button onClick={() => setCurrentModule(AppModule.SCANNER)} className={`p-3 transition-colors ${currentModule === AppModule.SCANNER ? 'text-om-navy' : 'text-gray-400'}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </button>

        <button onClick={() => setCurrentModule(AppModule.INVENTORY)} className={`p-3 transition-colors ${currentModule === AppModule.INVENTORY ? 'text-om-navy' : 'text-gray-400'}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        </button>

        <button onClick={() => setCurrentModule(AppModule.COMMAND)} className={`p-3 transition-colors ${currentModule === AppModule.COMMAND ? 'text-om-navy' : 'text-gray-400'}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>

        <button onClick={() => setCurrentModule(AppModule.LIVE)} className={`p-3 transition-colors ${currentModule === AppModule.LIVE ? 'text-om-navy' : 'text-gray-400'}`}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
        </button>
      </nav>
    </div>
  );
}
