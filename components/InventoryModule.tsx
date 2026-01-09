
import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { SyncStatus } from '../hooks/useFirestoreInventory';

interface Props {
    items: InventoryItem[];
    onUpdate: (items: InventoryItem[]) => void;
    isLowBattery: boolean;
    syncStatus?: SyncStatus;
}

export const InventoryModule: React.FC<Props> = ({ items, onUpdate, isLowBattery, syncStatus = 'LOCAL_ONLY' }) => {
    const [newItemName, setNewItemName] = useState('');

    const addItem = () => {
        if (!newItemName.trim()) return;
        const newItem: InventoryItem = {
            id: Date.now().toString(),
            name: newItemName,
            quantity: 1
        };
        onUpdate([...items, newItem]);
        setNewItemName('');
    };

    const updateQuantity = (id: string, delta: number) => {
        const updated = items.map(item => {
            if (item.id === id) {
                return { ...item, quantity: Math.max(0, item.quantity + delta) };
            }
            return item;
        }).filter(item => item.quantity > 0);
        onUpdate(updated);
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(items, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "inventario_activos.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const transitionConfig = isLowBattery ? { duration: 0 } : { duration: 0.3 };

    const getStatusIcon = () => {
        switch (syncStatus) {
            case 'SYNCED': 
                return <span className="text-green-500 flex items-center gap-1">● NUBE</span>;
            case 'SYNCING': 
                return <span className="text-yellow-500 flex items-center gap-1">◌ SYNC</span>;
            case 'ERROR': 
                return <span className="text-red-500 flex items-center gap-1">× ERROR</span>;
            case 'LOCAL_ONLY': 
            default:
                return <span className="text-gray-400 flex items-center gap-1">○ LOCAL</span>;
        }
    };

    return (
        <div className={`h-full flex flex-col p-6 overflow-y-auto pb-40 ${isLowBattery ? 'bg-black text-gray-300' : 'bg-om-cream text-om-navy'}`}>
            <div className="flex justify-between items-end mb-8 border-b border-current pb-4">
                <div>
                    <h2 className="font-serif text-3xl font-bold">Mochila</h2>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="font-mono text-[10px] uppercase tracking-widest opacity-60">
                            Inventario Táctico
                        </p>
                        <div className="font-mono text-[9px] font-bold border border-current px-2 py-0.5 rounded-full uppercase">
                            {getStatusIcon()}
                        </div>
                    </div>
                </div>
                <button onClick={handleExport} className="text-[10px] font-mono border border-current px-3 py-1 hover:bg-om-navy hover:text-white transition-colors uppercase">
                    Exportar
                </button>
            </div>

            <div className="space-y-3 mb-8">
                <AnimatePresence>
                    {items.map(item => (
                        <motion.div 
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={transitionConfig}
                            className={`p-4 flex justify-between items-center rounded-lg border ${isLowBattery ? 'bg-gray-900 border-gray-700' : 'bg-white border-om-navy/5 shadow-sm'}`}
                        >
                            <span className="font-serif font-bold">{item.name}</span>
                            <div className="flex items-center gap-3">
                                <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center border border-current rounded hover:bg-red-500/10">-</button>
                                <span className="font-mono w-6 text-center font-bold">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center border border-current rounded hover:bg-green-500/10">+</button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {items.length === 0 && (
                    <div className="text-center py-10 opacity-40 font-mono text-xs uppercase border-2 border-dashed border-current rounded-lg">
                        Contenedor Vacío
                    </div>
                )}
            </div>

            <div className={`p-4 rounded-xl border ${isLowBattery ? 'bg-gray-900 border-gray-700' : 'bg-om-paper border-om-gold'}`}>
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest block mb-2 opacity-60">Añadir Recurso</span>
                <div className="flex gap-2">
                    <input 
                        value={newItemName}
                        onChange={e => setNewItemName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addItem()}
                        placeholder="Ej: Baterías AA, Agua 1L..."
                        className={`flex-1 bg-transparent border-b border-current p-2 font-serif outline-none ${isLowBattery ? 'placeholder-gray-600' : 'placeholder-gray-400'}`}
                    />
                    <button onClick={addItem} className="bg-om-navy text-white px-4 rounded font-mono text-xs uppercase hover:bg-om-gold transition-colors">
                        Añadir
                    </button>
                </div>
            </div>
        </div>
    );
};
