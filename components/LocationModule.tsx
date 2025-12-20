
import React, { useEffect, useState } from 'react';
import { LocationIntel, MapResource, InventoryItem, AppModule } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { FALLBACK_SURVIVAL_TIPS } from '../data/staticDatabase';

interface Props {
    inventoryItems: InventoryItem[];
    isLowBattery: boolean;
    onNavigate: (module: AppModule) => void;
    data: LocationIntel | null;
    loading: boolean;
    error: string | null;
    onRefresh: (lat?: number, lng?: number, address?: string) => void;
}

// Internal Component for Weather Effects
const WeatherEffects = ({ condition }: { condition: string }) => {
    const c = condition.toLowerCase();
    
    // Rain Effect
    if (c.includes('lluvia') || c.includes('rain') || c.includes('tormenta') || c.includes('llovizna')) {
        return (
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-40">
                {/* Simulated Rain via CSS gradient animation would be ideal, using framer for drops here */}
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: -20, x: Math.random() * 100 + '%' }}
                        animate={{ y: '120%' }}
                        transition={{ 
                            repeat: Infinity, 
                            duration: 0.8 + Math.random(), 
                            ease: "linear",
                            delay: Math.random() * 2
                        }}
                        className="absolute top-0 w-[1px] h-6 bg-blue-200/60"
                        style={{ left: `${Math.random() * 100}%` }}
                    />
                ))}
            </div>
        );
    }

    // Sunny Effect
    if (c.includes('sol') || c.includes('sun') || c.includes('despejado') || c.includes('clear') || c.includes('calor')) {
        return (
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <motion.div 
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-10 -right-10 w-40 h-40 bg-orange-400/20 rounded-full blur-3xl"
                />
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-yellow-500/10 to-transparent" />
            </div>
        );
    }

    // Snow Effect
    if (c.includes('nieve') || c.includes('snow') || c.includes('helada')) {
        return (
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-60">
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: -10, x: Math.random() * 100 + '%' }}
                        animate={{ y: '110%', x: `${(Math.random() - 0.5) * 50}%` }} // Drift
                        transition={{ 
                            repeat: Infinity, 
                            duration: 3 + Math.random() * 2, 
                            ease: "linear",
                            delay: Math.random() * 3
                        }}
                        className="absolute top-0 w-1 h-1 bg-white rounded-full blur-[1px]"
                    />
                ))}
            </div>
        );
    }
    
    // Cloud/Fog Effect
    if (c.includes('nube') || c.includes('cloud') || c.includes('niebla') || c.includes('fog')) {
        return (
             <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                 <motion.div 
                    animate={{ x: ['-10%', '10%', '-10%'] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-400/10 to-transparent opacity-50 blur-xl"
                 />
             </div>
        );
    }

    return null;
};

export const LocationModule: React.FC<Props> = ({ 
    inventoryItems, 
    isLowBattery, 
    onNavigate,
    data,
    loading,
    error,
    onRefresh
}) => {
  const [mode, setMode] = useState<'GPS' | 'MANUAL'>('GPS');
  const [manualInput, setManualInput] = useState('');
  const [heading, setHeading] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  
  // Client-side tip calculation to ensure UI is never empty
  const getDisplayTip = () => {
      if (!data?.weather?.survivalTip || data.weather.survivalTip.trim().length < 5) {
          return FALLBACK_SURVIVAL_TIPS[0];
      }
      return data.weather.survivalTip;
  };

  const handleGPS = () => {
    if (data && !isManualOverride) return;

    setMode('GPS');
    setIsManualOverride(false);
    
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            onRefresh(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => onRefresh(undefined, undefined, "ERROR_GPS_LOST"),
        { enableHighAccuracy: true }
    );
  };

  const handleManual = () => {
      if (!manualInput.trim()) return;
      setIsManualOverride(false);
      onRefresh(undefined, undefined, manualInput);
  };

  // Function to open Google Maps with Directions
  const openMapRoute = (address: string) => {
      // "dir" mode with no origin defaults to Current Location in most apps
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=walking`;
      window.open(url, '_blank');
  };

  // Function for Automatic Emergency Call
  const handleEmergencyCall = () => {
      window.location.href = "tel:112";
  };

  useEffect(() => {
     if (!data && !loading && !error) {
         handleGPS();
     }
     
     const updateNetworkStatus = () => setIsOnline(navigator.onLine);
     window.addEventListener('online', updateNetworkStatus);
     window.addEventListener('offline', updateNetworkStatus);

     const handleOrientation = (event: DeviceOrientationEvent) => {
         if (event.alpha !== null) {
             setHeading(event.alpha);
         } else if ((event as any).webkitCompassHeading) {
              setHeading((event as any).webkitCompassHeading);
         }
     };

     if (window.DeviceOrientationEvent) {
         window.addEventListener('deviceorientation', handleOrientation, true);
     }

     return () => {
         window.removeEventListener('online', updateNetworkStatus);
         window.removeEventListener('offline', updateNetworkStatus);
         window.removeEventListener('deviceorientation', handleOrientation, true);
     };
  }, []);

  const mapCardClass = isLowBattery 
    ? 'bg-black border border-gray-800' 
    : 'bg-[#15151a] shadow-2xl border border-gray-800/50 rounded-xl'; 

  const resourceCardClass = isLowBattery
    ? 'bg-gray-900 border border-gray-800 text-gray-400'
    : 'bg-[#FDFBF7] border border-[#E2E8F0] shadow-sm rounded-lg text-om-navy';

  const transitionConfig = isLowBattery ? { duration: 0 } : { duration: 0.4 };
  const showInputForm = error || isManualOverride || (mode === 'MANUAL' && !data);

  return (
    <div className={`h-full flex flex-col px-4 py-4 overflow-y-auto pb-48 ${isLowBattery ? 'bg-black' : 'bg-om-cream'}`}>
      
      {/* 1. MAP CARD (DYNAMIC & ANIMATED) */}
      <div 
        className={`relative w-full shrink-0 ${mapCardClass} overflow-hidden flex flex-col items-center justify-center p-4 mb-6 group transition-all duration-500`}
        style={{ height: '350px' }} 
      >
          {/* BACKGROUND LAYERS */}
          <div className="absolute inset-0 z-0 bg-black">
             {/* Base Gradient */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-90"></div>
             
             {/* Grid Overlay */}
             <div className="absolute inset-0 grid-bg opacity-20"></div>
             
             {/* DYNAMIC WEATHER EFFECTS */}
             {!loading && data && !isLowBattery && (
                 <WeatherEffects condition={data.weather.condition} />
             )}

             {/* RADAR SWEEP ANIMATION (Only when not loading) */}
             {!loading && (
                 <div className="absolute inset-0 overflow-hidden rounded-xl opacity-30">
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(transparent_0deg,transparent_270deg,rgba(34,197,94,0.2)_360deg)] animate-[spin_4s_linear_infinite] rounded-full"></div>
                 </div>
             )}

             {/* LOADING PULSE */}
             {loading && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-green-500/20 rounded-full animate-ping opacity-30"></div>
             )}
             
             {/* STATIC RINGS */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] border border-gray-700/30 rounded-full"></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] h-[140px] border border-gray-700/30 rounded-full"></div>
             
             {/* YOU ARE HERE MARKER */}
             {!loading && !showInputForm && (
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center justify-center animate-fade-in-up">
                     <div className="relative">
                         {/* Blinking Dot */}
                         <div className="w-4 h-4 bg-om-gold rounded-full shadow-[0_0_15px_#C5A059] relative z-20 animate-pulse"></div>
                         {/* Expanding Ring */}
                         <div className="absolute inset-0 rounded-full border border-om-gold/50 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                     </div>
                     <div className="mt-2 bg-black/80 border border-om-gold/40 px-2 py-0.5 rounded text-[8px] font-mono text-om-gold uppercase tracking-widest backdrop-blur-sm whitespace-nowrap">
                         UBICACIÓN ACTUAL
                     </div>
                 </div>
             )}
          </div>
          
          {/* TOP CONTROLS */}
          <div className="absolute top-3 right-3 flex space-x-2 z-20">
              <button onClick={() => { setMode('MANUAL'); setIsManualOverride(true); }} className="p-2 border border-white/20 rounded hover:bg-white/10 text-om-gold bg-black/60 backdrop-blur-md active:scale-95">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </button>
              <button onClick={() => { setIsManualOverride(false); handleGPS(); }} className="p-2 border border-white/20 rounded hover:bg-white/10 text-pink-500 bg-black/60 backdrop-blur-md active:scale-95">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
          </div>
          
          {/* COORDINATES DISPLAY */}
          <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-1 max-w-[70%]">
               <div className="bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded-sm">
                   <span className="text-[8px] font-mono text-gray-400 uppercase tracking-widest block">COORDS</span>
                   <span className="text-[10px] font-mono text-om-gold font-bold">
                       {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "BUSCANDO..."}
                   </span>
               </div>
               {data?.locationName && (
                   <div className="bg-om-gold/10 backdrop-blur-md border border-om-gold/30 px-2 py-1 rounded-sm mt-1">
                       <span className="text-[10px] font-serif text-white font-bold uppercase tracking-wide truncate block max-w-[150px]">
                           {data.locationName}
                       </span>
                   </div>
               )}
          </div>

          <AnimatePresence mode='wait'>
            {loading ? (
                <motion.div transition={transitionConfig} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col items-center z-10 text-white/80 bg-black/60 p-6 rounded-xl backdrop-blur-sm border border-om-gold/30 w-full h-full justify-center absolute inset-0">
                     <div className="relative mb-2">
                        <div className="w-12 h-12 border-2 border-om-gold/20 rounded-full animate-spin"></div>
                        <div className="w-12 h-12 border-t-2 border-om-gold rounded-full animate-spin absolute top-0 left-0"></div>
                     </div>
                     <span className="font-mono text-[10px] tracking-widest text-om-gold animate-pulse">ESCANEANDO SATÉLITES...</span>
                </motion.div>
            ) : showInputForm ? (
                <motion.div transition={transitionConfig} initial={{opacity:0, scale: 0.95}} animate={{opacity:1, scale: 1}} className="flex flex-col items-center text-center z-10 w-full max-w-sm px-4 bg-black/60 p-6 rounded-xl backdrop-blur-md border border-white/10 shadow-2xl">
                    <h3 className="text-om-gold font-serif font-bold text-xs mb-2 uppercase tracking-[0.15em]">
                        {error ? "SEÑAL PERDIDA" : "COORDENADAS MANUALES"}
                    </h3>
                    <div className="flex w-full gap-2 mt-2">
                        <input 
                            value={manualInput} 
                            onChange={(e) => setManualInput(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && handleManual()}
                            className="bg-black/40 border border-white/20 text-white text-xs p-2 flex-1 outline-none focus:border-om-gold font-mono rounded-sm"
                            placeholder="Ciudad o Lat/Long..."
                            autoFocus
                        />
                        <button onClick={handleManual} className="bg-om-gold text-om-navy px-3 font-bold text-xs uppercase hover:bg-white transition-colors rounded-sm">
                            SET
                        </button>
                    </div>
                </motion.div>
            ) : data ? (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center z-10 w-full px-2 flex flex-col items-center justify-center h-full overflow-hidden">
                    <div className="mb-2 transform hover:scale-105 transition-transform duration-500 w-full">
                        <div className="text-om-gold font-serif text-5xl mb-1 font-bold tracking-tighter text-shadow-sm">{data.weather.temperature}</div>
                        <div className="inline-block bg-om-navy/80 border border-om-navy text-white px-2 py-0.5 rounded-full font-mono text-[9px] tracking-[0.2em] uppercase backdrop-blur-sm shadow-lg">
                            {data.weather.condition}
                        </div>
                    </div>
                </motion.div>
            ) : null}
          </AnimatePresence>
      </div>
      
      {/* EMERGENCY SOS BUTTON */}
      <button 
          onClick={handleEmergencyCall}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg shadow-lg mb-6 border-2 border-red-500 animate-pulse flex items-center justify-center gap-2 group transition-all"
      >
          <span className="w-3 h-3 bg-white rounded-full animate-ping"></span>
          <span className="tracking-[0.2em] font-mono text-sm">SOS: LLAMADA AUTOMÁTICA (112)</span>
      </button>

      {/* 2. FORECAST & TIPS (NEW SECTION) */}
      {data && (
          <>
            {/* 3-Day Forecast Grid */}
            <div className="grid grid-cols-3 gap-2 w-full mb-6">
                 {data.weather.forecast.map((day, i) => (
                     <div key={i} className={`${resourceCardClass} p-3 flex flex-col items-center text-center shadow-sm`}>
                         <span className="text-[9px] font-mono opacity-60 uppercase tracking-wider mb-1 block border-b border-current/10 w-full pb-1">{day.day}</span>
                         <span className={`font-serif font-bold text-lg my-1 ${isLowBattery ? 'text-white' : 'text-om-navy'}`}>{day.temp}</span>
                         <span className="text-[9px] leading-tight opacity-80">{day.condition}</span>
                     </div>
                 ))}
                 {data.weather.forecast.length === 0 && (
                     <div className="col-span-3 text-center text-[10px] font-mono opacity-50 py-2">PREVISIÓN NO DISPONIBLE</div>
                 )}
            </div>

            {/* SURVIVAL TIP CARD - REDESIGNED FOR VISIBILITY & WRAPPING */}
            <div className={`mb-8 p-6 rounded-lg relative transition-all duration-300 shadow-sm ${
                isLowBattery 
                ? 'bg-gray-900 border border-gray-700' 
                : 'bg-[#EFECE4] border border-om-gold/40' // Fondo más oscuro para contraste
            }`}>
                {/* Accent Bar */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-om-gold rounded-l-lg"></div>
                
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                     <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_red]"></span>
                     <p className="text-om-gold text-[10px] font-mono tracking-widest uppercase font-bold">
                        PROTOCOLO DE SUPERVIVENCIA
                     </p>
                </div>

                {/* Content with strict breaking rules */}
                <div className={`text-sm md:text-base font-serif italic leading-relaxed break-words whitespace-pre-wrap ${
                    isLowBattery ? 'text-gray-300' : 'text-om-navy'
                }`}>
                    "{getDisplayTip()}"
                </div>
            </div>
          </>
      )}

      {/* COMPASS WIDGET */}
      {heading !== null && (
          <div className={`${resourceCardClass} p-3 mb-6 flex items-center justify-between`}>
              <div className="flex flex-col">
                  <span className="font-mono text-[10px] uppercase tracking-widest opacity-60">BRÚJULA</span>
                  <span className={`font-serif text-xl font-bold ${isLowBattery ? 'text-white' : 'text-om-navy'}`}>{Math.round(heading)}°</span>
              </div>
              <div className="relative w-10 h-10 rounded-full border border-current flex items-center justify-center bg-white/5">
                  <div className="absolute top-0 text-[7px] font-bold opacity-50">N</div>
                  <div 
                    className="w-0.5 h-5 bg-red-500 absolute top-2 transition-transform duration-300 ease-out origin-bottom shadow-sm"
                    style={{ transform: `rotate(${-heading}deg)` }}
                  ></div>
              </div>
          </div>
      )}

      {/* 3. RESOURCES LIST */}
      <div className={`${resourceCardClass} p-5 mb-6 relative transition-colors`}>
         
         {/* SECTION: NEAREST CITY */}
         <div className="mb-6">
             <div className="flex items-center space-x-2 mb-3">
                 <div className={`w-2 h-2 rounded-full bg-orange-400 ${isLowBattery ? '' : 'animate-pulse'}`}></div>
                 <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] font-bold opacity-80">
                     CIVILIZACIÓN / CIUDAD
                 </h3>
             </div>
             {data && (
                 <div className="space-y-2">
                     {data.resources.filter(r => r.type === 'CITY').length > 0 ? (
                         data.resources.filter(r => r.type === 'CITY').map((res, i) => (
                            <div key={i} className={`flex justify-between items-center py-2 border-b ${isLowBattery ? 'border-gray-800' : 'border-gray-100'} last:border-0`}>
                                <div className="flex-1 min-w-0 pr-2">
                                    <span className={`font-serif font-bold text-sm block ${isLowBattery ? 'text-gray-200' : 'text-om-navy'}`}>{res.name}</span>
                                    <span className="text-[9px] opacity-60 font-mono mt-0.5 block truncate">{res.address}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-[10px] font-mono text-om-gold">{res.distance}</span>
                                    <button 
                                        onClick={() => openMapRoute(res.address)}
                                        className={`p-2 rounded border transition-colors ${
                                            isLowBattery 
                                            ? 'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white' 
                                            : 'border-om-navy/10 text-om-navy hover:bg-om-gold hover:text-white hover:border-om-gold'
                                        }`}
                                        title="Navegar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                         ))
                     ) : (
                         <div className="text-center py-2 text-[10px] font-mono opacity-50">SIN DATOS DE CIUDAD</div>
                     )}
                 </div>
             )}
         </div>

         {/* SECTION: POLICE */}
         <div className="mb-6">
             <div className="flex items-center space-x-2 mb-3">
                 <div className={`w-2 h-2 rounded-full bg-blue-600 ${isLowBattery ? '' : 'animate-pulse'}`}></div>
                 <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] font-bold opacity-80">
                     POLICÍA / SEGURIDAD
                 </h3>
             </div>
             {data && (
                 <div className="space-y-2">
                     {data.resources.filter(r => r.type === 'POLICE').length > 0 ? (
                         data.resources.filter(r => r.type === 'POLICE').map((res, i) => (
                            <div key={i} className={`flex justify-between items-center py-2 border-b ${isLowBattery ? 'border-gray-800' : 'border-gray-100'} last:border-0`}>
                                <div className="flex-1 min-w-0 pr-2">
                                    <span className={`font-serif font-bold text-sm block ${isLowBattery ? 'text-gray-200' : 'text-om-navy'}`}>{res.name}</span>
                                    <span className="text-[9px] opacity-60 font-mono mt-0.5 block truncate">{res.address}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-[10px] font-mono text-om-gold">{res.distance}</span>
                                    <button 
                                        onClick={() => openMapRoute(res.address)}
                                        className={`p-2 rounded border transition-colors ${
                                            isLowBattery 
                                            ? 'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white' 
                                            : 'border-om-navy/10 text-om-navy hover:bg-om-gold hover:text-white hover:border-om-gold'
                                        }`}
                                        title="Navegar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                         ))
                     ) : (
                         <div className="text-center py-2 text-[10px] font-mono opacity-50">SIN COMISARÍAS CERCANAS</div>
                     )}
                 </div>
             )}
         </div>

         {/* SECTION A: WATER */}
         <div className="mb-6">
             <div className="flex items-center space-x-2 mb-3">
                 <div className={`w-2 h-2 rounded-full bg-cyan-400 ${isLowBattery ? '' : 'animate-pulse'}`}></div>
                 <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] font-bold opacity-80">
                     HIDRATACIÓN
                 </h3>
             </div>

             {!data ? (
                 <div className="text-center py-4 opacity-50 text-xs italic font-serif">Esperando satélites...</div>
             ) : (
                 <div className="space-y-2">
                     {data.resources.filter(r => r.type === 'WATER').length > 0 ? (
                         data.resources.filter(r => r.type === 'WATER').map((res, i) => (
                            <div key={i} className={`flex justify-between items-center py-2 border-b ${isLowBattery ? 'border-gray-800' : 'border-gray-100'} last:border-0`}>
                                <div className="flex-1 min-w-0 pr-2">
                                    <span className={`font-serif font-bold text-sm block ${isLowBattery ? 'text-gray-200' : 'text-om-navy'}`}>{res.name}</span>
                                    <span className="text-[9px] opacity-60 font-mono mt-0.5 block truncate">{res.address}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-[10px] font-mono text-om-gold">{res.distance}</span>
                                    <button 
                                        onClick={() => openMapRoute(res.address)}
                                        className={`p-2 rounded border transition-colors ${
                                            isLowBattery 
                                            ? 'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white' 
                                            : 'border-om-navy/10 text-om-navy hover:bg-om-gold hover:text-white hover:border-om-gold'
                                        }`}
                                        title="Navegar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                         ))
                     ) : (
                         <div className="text-center py-2 text-[10px] font-mono opacity-50">SIN FUENTES CERCANAS</div>
                     )}
                 </div>
             )}
         </div>

         {/* SECTION B: MEDICAL */}
         <div>
             <div className="flex items-center space-x-2 mb-3">
                 <div className={`w-2 h-2 rounded-full bg-red-500 ${isLowBattery ? '' : 'animate-pulse'}`}></div>
                 <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] font-bold opacity-80">
                     MÉDICO / URGENCIAS
                 </h3>
             </div>

             {data && (
                 <div className="space-y-2">
                     {data.resources.filter(r => r.type === 'HOSPITAL').length > 0 ? (
                         data.resources.filter(r => r.type === 'HOSPITAL').map((res, i) => (
                            <div key={i} className={`flex justify-between items-center py-2 border-b ${isLowBattery ? 'border-gray-800' : 'border-gray-100'} last:border-0`}>
                                <div className="flex-1 min-w-0 pr-2">
                                    <span className={`font-serif font-bold text-sm block ${isLowBattery ? 'text-gray-200' : 'text-om-navy'}`}>{res.name}</span>
                                    <span className="text-[9px] opacity-60 font-mono mt-0.5 block truncate">{res.address}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-[10px] font-mono text-om-gold">{res.distance}</span>
                                    <button 
                                        onClick={() => openMapRoute(res.address)}
                                        className={`p-2 rounded border transition-colors ${
                                            isLowBattery 
                                            ? 'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white' 
                                            : 'border-om-navy/10 text-om-navy hover:bg-om-gold hover:text-white hover:border-om-gold'
                                        }`}
                                        title="Navegar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                         ))
                     ) : (
                         <div className="text-center py-2 text-[10px] font-mono opacity-50">SIN HOSPITALES CERCANOS</div>
                     )}
                 </div>
             )}
         </div>
      </div>

      <div className={`${resourceCardClass} p-3 flex justify-between items-center mb-6`}>
           <span className="font-mono text-[10px] uppercase tracking-widest opacity-60">RED SATELITAL</span>
           <div className="flex items-center space-x-2">
               <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${isOnline ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.4)]' : 'bg-red-500 animate-pulse'}`}></div>
               <span className={`font-mono text-[10px] font-bold transition-colors duration-300 ${!isOnline ? 'text-red-500' : isLowBattery ? 'text-gray-300' : 'text-om-navy'}`}>
                  {isOnline ? 'CONECTADO' : 'OFFLINE'}
               </span>
           </div>
      </div>
    </div>
  );
};
