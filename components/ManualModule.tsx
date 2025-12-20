
import React, { useState } from 'react';
import { MEDICAL_DECISION_TREE, DecisionNode } from '../data/medicalProtocols';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    isLowBattery: boolean;
}

export const ManualModule: React.FC<Props> = ({ isLowBattery }) => {
    const [currentNodeId, setCurrentNodeId] = useState<string>('ROOT');
    const [history, setHistory] = useState<string[]>([]);

    const currentNode = MEDICAL_DECISION_TREE[currentNodeId];

    const handleOptionClick = (nextId: string) => {
        setHistory(prev => [...prev, currentNodeId]);
        setCurrentNodeId(nextId);
    };

    const handleBack = () => {
        if (history.length === 0) return;
        const prevId = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));
        setCurrentNodeId(prevId);
    };

    const handleReset = () => {
        setHistory([]);
        setCurrentNodeId('ROOT');
    };

    const bgClass = isLowBattery ? 'bg-black text-gray-400' : 'bg-om-cream text-om-navy';
    const cardClass = isLowBattery ? 'bg-gray-900 border-gray-700' : 'bg-white border-om-gold/20 shadow-lg';
    
    const getSeverityColor = (severity: string) => {
        if (isLowBattery) return 'text-white border-white';
        switch (severity) {
            case 'CRITICAL': return 'text-red-600 border-red-200 bg-red-50';
            case 'WARNING': return 'text-orange-600 border-orange-200 bg-orange-50';
            default: return 'text-blue-600 border-blue-200 bg-blue-50';
        }
    };

    return (
        <div className={`h-full flex flex-col p-6 overflow-y-auto pb-24 ${bgClass}`}>
            <div className="mb-6 flex justify-between items-end border-b border-current pb-4">
                <div>
                    <h2 className="font-serif text-2xl font-bold tracking-tight leading-none">Lógica Médica</h2>
                    <p className="font-mono text-[10px] uppercase tracking-widest mt-1 opacity-60">
                        DIAGNÓSTICO OFFLINE v3.1
                    </p>
                </div>
                {history.length > 0 && (
                    <button onClick={handleReset} className="text-xs font-mono border border-current px-2 py-1 hover:bg-white hover:text-black transition-colors uppercase">
                        REINICIO
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                <motion.div 
                    key={currentNodeId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1"
                >
                    <div className={`p-6 rounded-lg border-2 mb-6 ${cardClass}`}>
                        {history.length > 0 && (
                             <button onClick={handleBack} className="text-[10px] font-mono opacity-50 mb-4 hover:opacity-100 flex items-center gap-1">
                                 ← ATRÁS
                             </button>
                        )}
                        
                        <h3 className={`font-serif text-xl md:text-2xl font-bold mb-6 leading-relaxed ${isLowBattery ? 'text-gray-100' : 'text-om-navy'}`}>
                            {currentNode.question}
                        </h3>

                        <div className="grid gap-3">
                            {currentNode.options.map((opt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionClick(opt.nextId)}
                                    className={`w-full text-left p-4 rounded border transition-all active:scale-[0.98] font-mono text-sm font-bold tracking-wide
                                        ${isLowBattery 
                                            ? 'bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-200' 
                                            : opt.style === 'danger' 
                                                ? 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100 hover:border-red-300'
                                                : opt.style === 'safe'
                                                    ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100'
                                                    : 'bg-white border-gray-200 text-gray-700 hover:border-om-gold hover:text-om-navy'
                                        }
                                    `}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {currentNode.result && (
                            <div className={`mt-2 p-6 rounded border-l-4 ${getSeverityColor(currentNode.result.severity)}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="font-mono font-bold text-xs uppercase tracking-[0.2em] border px-2 py-1 rounded">
                                        {currentNode.result.severity}
                                    </span>
                                    <span className="font-serif font-bold text-xl">{currentNode.result.title}</span>
                                </div>
                                <div className="font-sans whitespace-pre-wrap leading-7 text-sm opacity-90 mb-6">
                                    {currentNode.result.content}
                                </div>
                                <div className="text-center">
                                    <div className={`inline-block px-6 py-3 font-mono font-bold text-lg border-2 uppercase tracking-widest ${isLowBattery ? 'border-white text-white' : 'border-current'}`}>
                                        {currentNode.result.actionItem}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
            
            <div className="mt-auto text-center opacity-40 font-mono text-[9px] pt-4">
                PROTOCOLO: TCCC / ESTÁNDAR CRUZ ROJA. NO SUSTITUYE ATENCIÓN PROFESIONAL.
            </div>
        </div>
    );
};
