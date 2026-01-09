
import React, { useEffect, useState } from 'react';
import { LocationIntel, AppModule } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    isLowBattery: boolean;
    onNavigate: (module: AppModule) => void;
    data: LocationIntel | null;
    loading: boolean;
    error: string | null;
    onRefresh: (lat?: number, lng?: number, address?: string) => void;
}

export const LocationModule: React.FC<Props> = ({ isLowBattery, data, loading, error, onRefresh }) => {
  const [manualInput, setManualInput] = useState('');
  
  const handleGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
        (pos) => onRefresh(pos.coords.latitude, pos.coords.longitude),
        () => onRefresh()
    );
  };

  const resourceLabels: Record<string, { label: string, color: string }> = {
    'CITY': { label: 'POBLACIONES CERCANAS', color: 'bg-orange-500' },
    'POLICE': { label: 'SEGURIDAD Y POLICÍA', color: 'bg-blue-600' },
    'WATER': { label: 'SUMINISTRO DE AGUA', color: 'bg-cyan-500' },
    'HOSPITAL': { label: 'CENTROS SANITARIOS', color: 'bg-red-500' }
  };

  return (
    <div className={`h-full flex flex-col px-4 py-4 overflow-y-auto pb-48 ${isLowBattery ? 'bg-black' : 'bg-om-cream'}`}>
      
      {/* CARD CLIMA */}
      <div className={`relative w-full shrink-0 rounded-2xl p-6 mb-6 overflow-hidden min-h-[220px] flex flex-col justify-center items-center ${isLowBattery ? 'bg-gray-900 border border-gray-800' : 'bg-om-navy text-white shadow-xl'}`}>
          {loading ? (
              <div className="animate-pulse flex flex-col items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full mb-4"></div>
                  <span className="font-mono text-[10px] tracking-widest opacity-60">SINCRONIZANDO POSICIÓN...</span>
              </div>
          ) : data ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center z-10">
                  <span className="text-om-gold font-mono text-[10px] tracking-[0.3em] uppercase block mb-2">{data.locationName}</span>
                  <div className="text-6xl font-serif font-bold mb-2">{data.weather.temperature}</div>
                  <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest inline-block">{data.weather.condition.toUpperCase()}</div>
              </motion.div>
          ) : (
              <button onClick={handleGPS} className="bg-om-gold text-om-navy px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider">Localizar</button>
          )}
      </div>

      {/* INPUT CIUDAD MANUAL */}
      <div className="flex gap-2 mb-8">
          <input 
            value={manualInput} 
            onChange={e => setManualInput(e.target.value)}
            placeholder="Introducir ubicación manualmente..." 
            className={`flex-1 p-3 rounded-xl border text-sm font-sans outline-none ${isLowBattery ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-om-navy/10 focus:border-om-gold'}`}
          />
          <button onClick={() => onRefresh(undefined, undefined, manualInput)} className="bg-om-gold text-om-navy px-4 rounded-xl font-bold text-xs uppercase">Consultar</button>
      </div>

      {/* RECOMENDACIÓN OPERATIVA */}
      {data?.weather?.survivalTip && (
          <div className={`p-5 rounded-2xl border-l-4 mb-8 ${isLowBattery ? 'bg-gray-900 border-gray-800' : 'bg-om-paper border-om-gold shadow-sm'}`}>
              <span className="text-om-gold font-mono text-[9px] font-bold tracking-widest block mb-2 uppercase">RECOMENDACIÓN FENRIR:</span>
              <p className="font-serif italic text-sm md:text-base leading-relaxed">"{data.weather.survivalTip}"</p>
          </div>
      )}

      {/* LISTAS DE RECURSOS */}
      {data?.resources && Object.keys(resourceLabels).map(type => {
          const items = data.resources.filter(r => r.type === type);
          if (items.length === 0) return null;
          return (
              <div key={type} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                      <div className={`w-2 h-2 rounded-full ${resourceLabels[type].color}`}></div>
                      <h3 className="font-mono text-[10px] font-bold tracking-widest opacity-60 uppercase">{resourceLabels[type].label}</h3>
                  </div>
                  <div className="space-y-3">
                      {items.map((res, i) => (
                          <div key={i} className={`p-4 rounded-xl flex justify-between items-center ${isLowBattery ? 'bg-gray-900' : 'bg-white border border-om-navy/5 shadow-sm'}`}>
                              <div className="flex-1 pr-4">
                                  <span className="font-serif font-bold text-sm block">{res.name}</span>
                                  <span className="text-[10px] opacity-60 truncate block">{res.address}</span>
                              </div>
                              <span className="text-om-gold font-mono text-[10px] font-bold shrink-0">{res.distance}</span>
                          </div>
                      ))}
                  </div>
              </div>
          );
      })}

      <button onClick={() => window.location.href = "tel:112"} className="w-full bg-red-600 text-white font-bold py-4 rounded-2xl shadow-lg border-2 border-red-500 flex items-center justify-center gap-2 mb-10 uppercase tracking-widest text-xs">
          <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
          <span>Llamar Emergencias (112)</span>
      </button>
    </div>
  );
};
