
import React, { useState, useEffect, useRef } from 'react';
import { analyzeBioScanner } from '../services/geminiService';
import { ScannerResult, InventoryItem, ObservationContext } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    inventoryItems: InventoryItem[];
    isLowBattery: boolean;
}

type Step = 'CAPTURE' | 'CONTEXT' | 'ANALYZING' | 'RESULT';
type Tab = 'SCAN' | 'HISTORY';

export const ScannerModule: React.FC<Props> = ({ inventoryItems, isLowBattery }) => {
  const [activeTab, setActiveTab] = useState<Tab>('SCAN');
  const [step, setStep] = useState<Step>('CAPTURE');
  
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // 4 CRITICAL QUESTIONS (Refined for Flora & Fauna)
  const [qVisual, setQVisual] = useState('');
  const [qTexture, setQTexture] = useState('');
  const [qEnv, setQEnv] = useState('');
  const [qColor, setQColor] = useState('');

  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');

  const [result, setResult] = useState<ScannerResult | null>(null);
  const [history, setHistory] = useLocalStorage<ScannerResult[]>('scanner_history_v4', []);

  const bgClass = isLowBattery ? 'bg-black text-gray-500' : 'bg-om-cream text-om-navy';
  const cardBg = isLowBattery ? 'bg-gray-900 border-gray-700' : 'bg-white border-om-gold/30';
  const activeTabClass = isLowBattery ? 'border-white text-white' : 'border-om-navy text-om-navy';

  // --- ANIMATED PROGRESS LOGIC ---
  useEffect(() => {
    let interval: number;
    if (step === 'ANALYZING') {
        setProgress(0);
        setProgressStage('INICIANDO ENLACE...');
        
        let counter = 0;
        interval = window.setInterval(() => {
            counter++;
            // Simulate realistic stages
            if (counter < 20) {
                setProgress(prev => Math.min(prev + 2, 30));
                setProgressStage('SUBIENDO IMAGEN ENCRIPTADA...');
            } else if (counter < 50) {
                setProgress(prev => Math.min(prev + 1, 60));
                setProgressStage('EXTRAYENDO VECTORES BIOLÓGICOS...');
            } else if (counter < 80) {
                setProgress(prev => Math.min(prev + 0.5, 85));
                setProgressStage('CONSULTANDO BASE DE DATOS TÁCTICA...');
            } else {
                setProgress(prev => Math.min(prev + 0.2, 95));
                setProgressStage('GENERANDO ESTRATEGIA DE SUPERVIVENCIA...');
            }
        }, 100);
    }
    return () => clearInterval(interval);
  }, [step]);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
      setResult(null);
      setStep('CONTEXT'); // Go to questions first
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setStep('ANALYZING');
    
    // CHANGE: Unified empty inventory string
    const invString = inventoryItems.length > 0 
        ? inventoryItems.map(i => `${i.quantity}x ${i.name}`).join(', ')
        : "INVENTARIO VACÍO (Sin equipos)";

    // Generic Observation Context
    const obsContext: ObservationContext = {
        visualFeature: qVisual || 'No definido',
        texture: qTexture || 'No definida',
        environment: qEnv || 'Estándar',
        distinctiveColor: qColor || 'No visible',
    };

    try {
      const data = await analyzeBioScanner(file, invString, "Ubicación Actual", obsContext);
      setProgress(100);
      setProgressStage('ANÁLISIS COMPLETADO');
      setTimeout(() => {
          setResult(data);
          setHistory(prev => [data, ...prev].slice(0, 50)); // Keep last 50
          setStep('RESULT');
      }, 500); // Small delay to show 100%
    } catch (err) {
      console.error(err);
      setStep('CAPTURE'); 
      alert("ERROR DE ENLACE. INTENTE NUEVAMENTE.");
    }
  };

  const resetScanner = () => {
      setStep('CAPTURE');
      setFile(null);
      setImagePreview(null);
      setQVisual(''); setQTexture(''); setQEnv(''); setQColor('');
      setResult(null);
  };

  // --- VISUAL COMPONENTS ---

  const renderProgressScreen = () => (
      <div className="absolute inset-0 z-20 bg-black/90 flex flex-col items-center justify-center p-8">
          
          {/* VISUAL SCANNING BEAM ANIMATION */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
             <div className="w-full h-1 bg-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.8)] absolute top-0 animate-[scanline_2s_linear_infinite]"></div>
             <div className="absolute inset-0 border-[40px] border-black/80"></div>
          </div>

          <div className="w-full max-w-xs mb-6 relative h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
              <div 
                className="h-full bg-om-gold shadow-[0_0_15px_#C5A059] transition-all duration-100 ease-linear relative"
                style={{ width: `${progress}%` }}
              >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
          </div>
          <div className="font-mono text-om-gold text-xs tracking-widest uppercase text-center animate-pulse">
              {progressStage}
          </div>
          <div className="mt-2 text-white font-serif text-2xl font-bold">{Math.round(progress)}%</div>
          
          <div className="absolute bottom-10 font-mono text-[8px] text-gray-500">PROCESAMIENTO NEURONAL TÁCTICO // V.1.3</div>
      </div>
  );

  const renderContextForm = () => (
      <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm p-4 flex flex-col justify-center animate-fade-in-up overflow-y-auto">
          <div className={`p-6 rounded-lg border shadow-2xl ${isLowBattery ? 'bg-gray-900 border-gray-700' : 'bg-white border-om-gold'}`}>
              <h3 className="font-serif text-xl font-bold mb-1 text-center">Análisis Visual</h3>
              <p className="font-mono text-[9px] text-center opacity-60 mb-6 uppercase tracking-widest">Ayuda a la IA si la imagen es difusa.</p>
              
              <div className="space-y-4 mb-6">
                  {/* Q1: Feature */}
                  <div>
                      <label className="text-[10px] font-bold block mb-1 uppercase opacity-80">1. Característica Clave</label>
                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                          {['Desconocido', 'Hojas Serradas', 'Pelaje/Pelo', 'Escamas', 'Espinas'].map((opt, i) => (
                              <button key={opt} onClick={() => setQVisual(opt)} className={`flex-1 py-2 text-[9px] border rounded min-w-[70px] whitespace-nowrap px-2 ${qVisual === opt ? 'bg-om-navy text-white' : i === 0 ? 'border-om-gold/50 opacity-100 font-bold' : 'border-gray-400 opacity-60'}`}>{opt}</button>
                          ))}
                      </div>
                  </div>
                   {/* Q2: Texture */}
                   <div>
                      <label className="text-[10px] font-bold block mb-1 uppercase opacity-80">2. Textura Superficie</label>
                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                          {['Desconocido', 'Lisa/Cera', 'Rugosa', 'Pegajosa', 'Peluda'].map((opt, i) => (
                              <button key={opt} onClick={() => setQTexture(opt)} className={`flex-1 py-2 text-[9px] border rounded min-w-[70px] whitespace-nowrap px-2 ${qTexture === opt ? 'bg-om-navy text-white' : i === 0 ? 'border-om-gold/50 opacity-100 font-bold' : 'border-gray-400 opacity-60'}`}>{opt}</button>
                          ))}
                      </div>
                  </div>
                  {/* Q3: Environment */}
                  <div>
                      <label className="text-[10px] font-bold block mb-1 uppercase opacity-80">3. Entorno</label>
                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                          {['Desconocido', 'Sombra/Bosque', 'Roca/Seco', 'Agua/Húmedo'].map((opt, i) => (
                              <button key={opt} onClick={() => setQEnv(opt)} className={`flex-1 py-2 text-[9px] border rounded min-w-[70px] whitespace-nowrap px-2 ${qEnv === opt ? 'bg-om-navy text-white' : i === 0 ? 'border-om-gold/50 opacity-100 font-bold' : 'border-gray-400 opacity-60'}`}>{opt}</button>
                          ))}
                      </div>
                  </div>
                   {/* Q4: Color */}
                   <div>
                      <label className="text-[10px] font-bold block mb-1 uppercase opacity-80">4. Color Distintivo</label>
                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                          {['Desconocido', 'Verde Intenso', 'Rojo/Naranja', 'Marrón/Pardo', 'Blanco'].map((opt, i) => (
                              <button key={opt} onClick={() => setQColor(opt)} className={`flex-1 py-2 text-[9px] border rounded min-w-[70px] whitespace-nowrap px-2 ${qColor === opt ? 'bg-om-navy text-white' : i === 0 ? 'border-om-gold/50 opacity-100 font-bold' : 'border-gray-400 opacity-60'}`}>{opt}</button>
                          ))}
                      </div>
                  </div>
              </div>

              <button 
                onClick={handleAnalyze} 
                className="w-full bg-om-gold text-om-navy font-bold py-3 text-xs tracking-[0.2em] shadow-lg hover:bg-black hover:text-om-gold transition-colors uppercase"
              >
                  EJECUTAR ESCÁNER
              </button>
          </div>
      </div>
  );

  const renderResultReport = (data: ScannerResult) => {
      // Logic for status bar color and threat level
      let barColor = 'bg-gray-800';
      let statusText = 'ANÁLISIS COMPLETADO';
      
      if (data.hazardStatus === 'SAFE') {
          barColor = 'bg-green-700';
          statusText = 'SEGURO / COMESTIBLE';
      } else if (data.hazardStatus === 'CAUTION') {
          barColor = 'bg-yellow-600';
          statusText = 'PRECAUCIÓN';
      } else if (data.hazardStatus === 'DANGEROUS' || data.hazardStatus === 'DEADLY') {
          barColor = 'bg-red-800';
          statusText = 'AMENAZA DETECTADA';
      }

      // Helper to split description into bullet-like points for the alert box
      const threatPoints = data.toxicityDescription 
          ? data.toxicityDescription.split('.').filter(s => s.trim().length > 3)
          : [];

      return (
      <div className={`flex flex-col h-full bg-om-paper overflow-hidden relative ${isLowBattery ? 'bg-black text-gray-200' : 'bg-[#FAF9F6] text-om-navy'}`}>
          
          {/* TOP SEVERITY BAR */}
          <div className={`${barColor} text-white text-[10px] font-bold font-mono text-center py-1.5 uppercase tracking-[0.3em] shadow-md z-10 shrink-0`}>
             NIVEL CRÍTICO // {statusText}
          </div>

          <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 pb-32">
              
              {/* HEADER SECTION */}
              <div className="relative">
                  <div className="flex justify-between items-start mb-2">
                      <span className="border border-gray-300 text-gray-500 rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-white/50">
                         {data.emoji} BIO-ENTIDAD
                      </span>
                      <button 
                        onClick={resetScanner} 
                        className="text-[10px] font-mono border border-gray-300 rounded-full px-4 py-1 hover:bg-om-navy hover:text-white transition-colors uppercase tracking-widest bg-white"
                      >
                          CERRAR
                      </button>
                  </div>

                  <h1 className="font-serif text-3xl md:text-4xl font-bold text-om-navy leading-tight mb-3">
                      {data.name}
                  </h1>

                  {/* QUOTE / INTRO */}
                  <div className="text-gray-600 font-serif italic border-l-2 border-om-gold pl-4 text-sm md:text-base leading-relaxed">
                      "{data.criticalFact || "Identificación completada. Sin datos narrativos adicionales."}"
                  </div>
              </div>

              {/* 1. THREAT BOX (RED) - Conditionally Rendered */}
              {(data.hazardStatus === 'DANGEROUS' || data.hazardStatus === 'DEADLY' || data.hazardStatus === 'CAUTION') && (
                  <div className={`rounded-r-lg border-l-4 p-5 shadow-sm ${
                      data.hazardStatus === 'CAUTION' ? 'bg-orange-50 border-orange-400' : 'bg-red-50 border-red-600'
                  }`}>
                      <div className="flex items-center gap-2 mb-3">
                          <svg className={`w-5 h-5 ${data.hazardStatus === 'CAUTION' ? 'text-orange-600' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className={`font-bold text-xs uppercase tracking-[0.15em] ${
                              data.hazardStatus === 'CAUTION' ? 'text-orange-800' : 'text-red-800'
                          }`}>
                              {data.hazardStatus === 'CAUTION' ? 'PRECAUCIÓN REQUERIDA' : 'AMENAZA DETECTADA'}
                          </span>
                      </div>
                      
                      <div className="mb-3">
                          <span className="font-bold text-sm text-om-navy">Nivel de Toxicidad: </span>
                          <span className={`font-bold text-sm ${data.hazardStatus === 'CAUTION' ? 'text-orange-700' : 'text-red-700'}`}>
                              {data.hazardStatus === 'DEADLY' ? 'MORTAL' : data.toxicityLevel + '/5'}
                          </span>
                      </div>

                      <div className="space-y-2">
                          {threatPoints.length > 0 ? threatPoints.map((point, idx) => (
                              <div key={idx} className="flex gap-2 items-start text-sm text-gray-800 leading-snug">
                                  <span className={`font-bold shrink-0 mt-px ${data.hazardStatus === 'CAUTION' ? 'text-orange-500' : 'text-red-500'}`}>!</span>
                                  <span>{point.trim()}.</span>
                              </div>
                          )) : (
                              <p className="text-sm text-gray-800">{data.toxicityDescription}</p>
                          )}
                      </div>
                  </div>
              )}

              {/* 2. MEDICAL BOX (BLUE) - Conditionally Rendered */}
              {data.medicinalUtility && (
                  <div className="rounded-r-lg border-l-4 border-blue-500 bg-blue-50 p-5 shadow-sm">
                      <h4 className="font-bold text-blue-800 text-xs uppercase tracking-[0.15em] mb-3">
                          RECURSO MÉDICO
                      </h4>
                      <p className="text-sm text-blue-900 leading-relaxed font-medium">
                          {data.medicinalUtility}
                      </p>
                  </div>
              )}

              {/* 3. PROTOCOL BOX (NEUTRAL) */}
              <div className="rounded-lg bg-white border border-gray-100 p-6 shadow-md">
                  <h4 className="font-bold text-gray-700 text-xs uppercase tracking-[0.15em] mb-4 border-b border-gray-100 pb-2">
                      PROTOCOLO GENERAL
                  </h4>
                  <p className="text-sm md:text-base text-om-navy leading-7 font-medium whitespace-pre-line">
                      {data.preparationProtocol}
                  </p>
              </div>

              {/* 4. ALTERNATIVE/NOTES BOX (BEIGE) */}
              <div className="rounded-lg bg-[#F5F2EA] border border-[#E5E0D0] p-5">
                   <h4 className="font-bold text-om-gold text-[10px] uppercase tracking-[0.2em] mb-2">
                       USOS ALTERNATIVOS
                   </h4>
                   <p className="text-sm text-om-navy/80 font-serif leading-relaxed">
                       {data.energyInfo || "No hay datos de uso energético alternativo."} 
                       {data.energyKcal ? <span className="font-bold not-italic ml-2 block mt-1 text-xs font-mono">⚡ APORTE: ~{data.energyKcal} kcal/100g</span> : ''}
                   </p>
              </div>
              
              <div className="text-[9px] font-mono text-gray-300 text-center uppercase tracking-widest mt-8">
                  CONFIANZA IA: {data.confidenceScore ? data.confidenceScore + '%' : 'N/A'}
              </div>
          </div>
      </div>
  )};

  // Sort history by date descending
  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className={`h-full flex flex-col p-4 md:p-6 overflow-hidden ${bgClass}`}>
      
      {/* HEADER ONLY VISIBLE IN SCAN/HISTORY LIST, HIDDEN IN RESULT VIEW */}
      {!result && (
          <div className="shrink-0">
            <h2 className="font-serif text-2xl mb-2 tracking-wide">Bio-Análisis</h2>
            <div className="flex border-b border-gray-700/20 mb-4 shrink-0">
                <button onClick={() => setActiveTab('SCAN')} className={`flex-1 py-3 font-mono text-[10px] tracking-widest border-b-2 transition-colors ${activeTab === 'SCAN' ? activeTabClass : 'border-transparent opacity-50'}`}>ESCÁNER</button>
                <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 py-3 font-mono text-[10px] tracking-widest border-b-2 transition-colors ${activeTab === 'HISTORY' ? activeTabClass : 'border-transparent opacity-50'}`}>REGISTROS ({sortedHistory.length})</button>
            </div>
          </div>
      )}

      <div className="flex-1 min-h-0 relative"> 
        {activeTab === 'HISTORY' && (
             <div className="space-y-2 h-full overflow-y-auto pb-10 pr-1">
                {sortedHistory.length === 0 && (
                    <div className="text-center font-mono text-xs opacity-40 py-10 border border-dashed border-current">
                        SIN REGISTROS DE CAMPO
                    </div>
                )}
                {sortedHistory.map(h => {
                    const date = new Date(h.timestamp);
                    const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
                    const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                        <div key={h.id} className={`flex gap-3 p-3 border-l-2 cursor-pointer transition-all active:scale-[0.98] ${
                            h.hazardStatus === 'SAFE' ? 'border-green-500' : h.hazardStatus === 'DEADLY' ? 'border-red-600' : 'border-yellow-500'
                        } ${cardBg} shadow-sm group`} onClick={() => setResult(h)}>
                             {/* Date Column */}
                             <div className="flex flex-col items-end justify-center w-12 border-r border-gray-500/10 pr-2 pt-1">
                                 <span className="font-mono text-[9px] font-bold opacity-60">{dateStr}</span>
                                 <span className="font-mono text-[9px] opacity-40">{timeStr}</span>
                             </div>
                             
                             {/* Main Content */}
                             <div className="flex-1 min-w-0 flex flex-col justify-center">
                                 <div className="flex justify-between items-center mb-0.5">
                                     <span className="font-serif font-bold text-sm truncate text-om-navy dark:text-gray-200">{h.name}</span>
                                     <span className="text-lg">{h.emoji}</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                     <span className={`text-[8px] px-1.5 py-0.5 rounded-sm uppercase tracking-wide ${
                                         h.hazardStatus === 'SAFE' ? 'bg-green-100 text-green-900' : 
                                         h.hazardStatus === 'DEADLY' ? 'bg-red-100 text-red-900' : 'bg-yellow-100 text-yellow-900'
                                     }`}>{h.hazardStatus}</span>
                                 </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
        
        {activeTab === 'SCAN' && !result && (
            <div className="h-full flex flex-col relative">
                
                {/* 1. VIEWFINDER */}
                <div className={`relative flex-1 rounded-sm overflow-hidden mb-4 border-2 group transition-all duration-300 ${
                    step === 'ANALYZING' ? 'border-om-gold bg-black' : isLowBattery ? 'border-gray-700 bg-gray-900' : 'border-om-paper bg-gray-100'
                }`}>
                    {imagePreview ? (
                        <img src={imagePreview} className={`w-full h-full object-cover transition-opacity duration-1000 ${step === 'ANALYZING' ? 'opacity-20 scale-105' : 'opacity-100'}`} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-40">
                             <div className="border border-current w-16 h-16 flex items-center justify-center rounded-full mb-2">
                                 <div className="w-1 h-1 bg-current rounded-full"></div>
                             </div>
                             <span className="font-mono text-[10px] tracking-widest">SENSOR ÓPTICO ACTIVO</span>
                        </div>
                    )}

                    {/* INPUT HIDDEN */}
                    {step === 'CAPTURE' && (
                         <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer z-30" onChange={handleCapture} />
                    )}

                    {/* OVERLAYS */}
                    {step === 'CONTEXT' && renderContextForm()}
                    {step === 'ANALYZING' && renderProgressScreen()}
                    
                    {step === 'CAPTURE' && !imagePreview && (
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
                            <div className="bg-om-navy text-white px-6 py-3 text-xs font-mono tracking-widest rounded-sm shadow-lg border border-om-gold/30 animate-bounce">
                                [ CAPTURAR OBJETIVO ]
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* FULL SCREEN RESULT OVERLAY */}
        {result && (
             <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="absolute inset-0 z-50">
                 {renderResultReport(result)}
             </motion.div>
        )}
      </div>
    </div>
  );
};
