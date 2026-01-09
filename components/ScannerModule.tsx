
import React, { useState } from 'react';
import { analyzeBioScanner } from '../services/geminiService';
import { ScannerResult, InventoryItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    inventoryItems: InventoryItem[];
    isLowBattery: boolean;
}

export const ScannerModule: React.FC<Props> = ({ inventoryItems, isLowBattery }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScannerResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setPreview(URL.createObjectURL(file));
      setLoading(true);
      try {
        const data = await analyzeBioScanner(file, "Equipamiento", "Posición Actual", { visualFeature: '', texture: '', environment: '', distinctiveColor: '' });
        setResult(data);
      } catch (err) {
        alert("Error en el análisis. Verifique su conexión.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={`h-full flex flex-col p-4 overflow-y-auto pb-40 ${isLowBattery ? 'bg-black' : 'bg-om-cream'}`}>
      <h2 className="font-serif text-2xl mb-2">Análisis de Especie</h2>
      <p className="font-mono text-[10px] opacity-60 mb-6 uppercase tracking-widest">Capture una imagen para identificación</p>

      {!result ? (
          <div className={`flex-1 min-h-[300px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center relative overflow-hidden ${isLowBattery ? 'border-gray-800 bg-gray-900' : 'border-om-navy/10 bg-white'}`}>
              {preview && <img src={preview} className="absolute inset-0 w-full h-full object-cover opacity-50" />}
              {loading ? (
                  <div className="z-10 flex flex-col items-center">
                      <div className="w-10 h-10 border-4 border-om-gold border-t-transparent rounded-full animate-spin mb-4"></div>
                      <span className="font-mono text-[10px] tracking-widest animate-pulse">ANALIZANDO MUESTRA...</span>
                  </div>
              ) : (
                  <div className="z-10 flex flex-col items-center">
                      <div className="w-16 h-16 bg-om-navy text-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      </div>
                      <span className="font-mono text-[10px] tracking-widest uppercase">Iniciar Captura</span>
                      <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
              )}
          </div>
      ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-3xl p-6 ${isLowBattery ? 'bg-gray-900' : 'bg-white shadow-xl'}`}>
              <div className="flex justify-between items-start mb-6">
                  <div>
                      <span className="text-3xl mb-2 block">{result.emoji}</span>
                      <h3 className="font-serif text-2xl font-bold">{result.name}</h3>
                  </div>
                  <button onClick={() => {setResult(null); setPreview(null);}} className="text-[10px] font-bold uppercase opacity-50 border px-3 py-1 rounded-full">Nueva Consulta</button>
              </div>

              <div className={`p-4 rounded-2xl mb-4 border-l-4 ${result.hazardStatus === 'SAFE' ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800'}`}>
                  <span className="font-mono text-[10px] font-bold uppercase block mb-1">Nivel de Riesgo:</span>
                  <p className="text-sm font-bold">{result.hazardStatus === 'SAFE' ? 'SEGURO / SIN RIESGO' : 'PELIGRO DETECTADO'}</p>
              </div>

              <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-2xl">
                      <span className="font-mono text-[10px] opacity-60 uppercase block mb-1">Protocolo de Preparación</span>
                      <p className="text-sm leading-relaxed">{result.preparationProtocol}</p>
                  </div>
                  {result.medicinalUtility && (
                      <div className="p-4 bg-blue-50 rounded-2xl">
                          <span className="font-mono text-[10px] text-blue-800 opacity-60 uppercase block mb-1">Aplicaciones Médicas</span>
                          <p className="text-sm text-blue-900 leading-relaxed">{result.medicinalUtility}</p>
                      </div>
                  )}
              </div>
          </motion.div>
      )}
    </div>
  );
};
