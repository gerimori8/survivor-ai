
import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { motion } from 'framer-motion';

interface Props {
    items: InventoryItem[];
    onUpdate: (items: InventoryItem[]) => void;
    isLowBattery: boolean;
}

export const InventoryModule: React.FC<Props> = ({ items, onUpdate, isLowBattery }) => {
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
        link.download = "survivor_intel_export.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const transitionConfig = isLowBattery ? { duration: 0 } : { duration: 0.3 };

    return (
        <div className={`h-full flex flex-col p-6 overflow-y-auto pb-24 ${isLowBattery ? 'bg-black text-gray-500' : 'bg-om-cream text-om-navy'}`}>
            <div className="flex justify-between items-center mb-2 border-b border-om-gold pb-2">
                <h2 className="font-serif text-2xl tracking-wide">Inventario Táctico</h2>
                <button onClick={handleExport} className="text-[10px] font-mono border border-current px-2 py-1 hover:bg-om-gold hover:text-white transition-colors uppercase" title="Exportar Datos">
                    EXPORTAR
                </button>
            </div>
            <p className="font-mono text-xs opacity-60 mb-6">LOGÍSTICA Y SUMINISTROS</p>

            <div className="flex gap-2 mb-8">
                <input 
                    type="text" 
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="AÑADIR EQUIPO..."
                    className={`flex-1 p-3 font-mono text-sm outline-none border transition-colors ${
                        isLowBattery 
                        ? 'bg-gray-900 border-gray-700 text-gray-300' 
                        : 'bg-white border-om-navy/20 text-om-navy focus:border-om-gold'
                    }`}
                />
                <button 
                    onClick={addItem}
                    className={`px-6 font-bold font-mono text-sm tracking-wider ${
                        isLowBattery ? 'bg-gray-800 text-gray-400' : 'bg-om-navy text-white hover:bg-om-gold transition-colors'
                    }`}
                >
                    AÑADIR
                </button>
            </div>

            <div className="space-y-3">
                {items.length === 0 && (
                    <div className="text-center font-mono text-xs opacity-40 py-10 border border-dashed border-current">
                        SIN ACTIVOS REGISTRADOS
                    </div>
                )}
                {items.map(item => (
                    <motion.div 
                        key={item.id}
                        transition={transitionConfig}
                        initial={{ opacity: 0, x: isLowBattery ? 0 : -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex justify-between items-center p-4 border-l-2 ${
                            isLowBattery 
                            ? 'bg-gray-900/50 border-gray-600' 
                            : 'bg-white shadow-sm border-om-gold'
                        }`}
                    >
                        <span className="font-sans font-semibold tracking-wide uppercase">{item.name}</span>
                        <div className="flex items-center space-x-4">
                            <button onClick={() => updateQuantity(item.id, -1)} className="hover:text-om-gold px-2">-</button>
                            <span className="font-mono w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="hover:text-om-gold px-2">+</button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
