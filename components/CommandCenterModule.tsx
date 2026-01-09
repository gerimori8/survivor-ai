
import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage, SurvivalContext } from '../services/geminiService';
import { ChatMessage, InventoryItem } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getOfflineResponse } from '../data/staticDatabase';

interface Props {
    inventoryItems: InventoryItem[];
    setInventory: (items: InventoryItem[]) => void;
    isLowBattery: boolean;
}

export const CommandCenterModule: React.FC<Props> = ({ inventoryItems, setInventory, isLowBattery }) => {
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>('survivor_chat_history', [
      { id: '0', sender: 'ai', text: 'Canal de comunicación operativo. Soy el operador Fenrir. Indique su situación actual o requerimiento técnico.', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const lastPosRef = useRef<{lat: number, lng: number, time: number} | null>(null);
  const activityRef = useRef<string>("Estacionario");

  useEffect(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
      if (!navigator.geolocation) return;
      
      const watchId = navigator.geolocation.watchPosition((pos) => {
          const now = Date.now();
          if (lastPosRef.current) {
              const dist = getDistance(lastPosRef.current.lat, lastPosRef.current.lng, pos.coords.latitude, pos.coords.longitude);
              const timeDiff = (now - lastPosRef.current.time) / 1000; 
              const speedMps = dist / timeDiff;
              
              if (speedMps > 1.5) activityRef.current = "Movimiento rápido";
              else if (speedMps > 0.3) activityRef.current = "Marcha";
              else activityRef.current = "Estacionario";
          }
          lastPosRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude, time: now };
      }, (err) => {
          console.warn("Context GPS Error", err);
      }, { enableHighAccuracy: false, maximumAge: 30000 }); 

      return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
     const R = 6371e3; 
     const φ1 = lat1 * Math.PI/180;
     const φ2 = lat2 * Math.PI/180;
     const Δφ = (lat2-lat1) * Math.PI/180;
     const Δλ = (lon2-lon1) * Math.PI/180;
     const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
     return R * c;
  };

  const getContext = (): SurvivalContext => {
      const hour = new Date().getHours();
      const timeStr = hour < 6 ? "Madrugada" : hour < 12 ? "Mañana" : hour < 18 ? "Tarde" : "Noche";
      
      return {
          timeOfDay: timeStr,
          activityStatus: activityRef.current,
          lastKnownLocation: lastPosRef.current ? `${lastPosRef.current.lat.toFixed(4)}, ${lastPosRef.current.lng.toFixed(4)}` : "Ubicación desconocida"
      };
  };

  const handleInventoryTool = async (action: 'add' | 'remove', itemName: string, quantity: number): Promise<boolean> => {
      try {
          let updatedItems = [...inventoryItems];
          const existingIndex = updatedItems.findIndex(i => i.name.toLowerCase() === itemName.toLowerCase());
          
          if (action === 'add') {
             if (existingIndex >= 0) {
                 updatedItems[existingIndex].quantity += quantity;
             } else {
                 updatedItems.push({ id: Date.now().toString(), name: itemName, quantity });
             }
          } else {
             if (existingIndex >= 0) {
                 updatedItems[existingIndex].quantity = Math.max(0, updatedItems[existingIndex].quantity - quantity);
                 if (updatedItems[existingIndex].quantity === 0) {
                     updatedItems = updatedItems.filter(i => i.quantity > 0);
                 }
             }
          }
          setInventory(updatedItems);
          return true;
      } catch (e) {
          return false;
      }
  };

  const handleSend = async () => {
      if (!input.trim()) return;
      
      const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: input, timestamp: Date.now() };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setLoading(true);

      const invString = inventoryItems.map(i => `${i.quantity}x ${i.name}`).join(', ');

      if (!navigator.onLine) {
          setTimeout(() => {
              const offlineReply = getOfflineResponse(userMsg.text);
              const replyText = offlineReply || "CONEXIÓN OFFLINE: Se recomienda consultar los protocolos médicos locales hasta restablecer señal.";
              
              const aiMsg: ChatMessage = { id: (Date.now()+1).toString(), sender: 'ai', text: replyText, timestamp: Date.now() };
              setMessages(prev => [...prev, aiMsg]);
              setLoading(false);
          }, 500);
          return;
      }

      try {
          const history = messages.map(m => ({
              role: m.sender === 'ai' ? 'model' : 'user',
              parts: [{ text: m.text }]
          }));

          const responseText = await sendChatMessage(
              history, 
              userMsg.text, 
              invString || "Inventario vacío",
              getContext(),
              handleInventoryTool
          );
          
          const aiMsg: ChatMessage = { id: (Date.now()+1).toString(), sender: 'ai', text: responseText || "Mensaje recibido y procesado.", timestamp: Date.now() };
          
          setMessages(prev => [...prev, aiMsg]);
      } catch (e) {
          setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: "Error en la transmisión. Intente de nuevo.", timestamp: Date.now() }]);
      } finally {
          setLoading(false);
      }
  };

  return (
      <div className={`h-full flex flex-col ${isLowBattery ? 'bg-black' : 'bg-om-cream'}`}>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24" ref={scrollRef}>
              {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 text-sm shadow-sm whitespace-pre-line ${
                          m.sender === 'user' 
                          ? 'bg-om-gold text-white rounded-tl-lg rounded-bl-lg rounded-br-lg' 
                          : isLowBattery 
                             ? 'bg-gray-900 border border-gray-800 text-gray-400 rounded-tr-lg rounded-bl-lg rounded-br-lg'
                             : 'bg-white border border-om-paper text-om-navy rounded-tr-lg rounded-bl-lg rounded-br-lg'
                      }`}>
                          <p className={`leading-relaxed ${m.sender === 'ai' ? 'font-serif' : 'font-sans'}`}>{m.text}</p>
                      </div>
                  </div>
              ))}
              {loading && <div className="text-xs font-mono text-om-gold animate-pulse pl-4 uppercase tracking-widest">Transmitiendo consulta...</div>}
          </div>

          <div className={`p-4 border-t pb-safe mb-20 ${isLowBattery ? 'bg-black border-gray-800' : 'bg-om-cream border-om-gold/20'} flex gap-2 fixed bottom-0 left-0 right-0 z-10`}>
              <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="ENVIAR COMUNICACIÓN..."
                  className={`flex-1 p-3 font-mono text-sm outline-none border rounded-sm ${
                      isLowBattery 
                      ? 'bg-gray-900 border-gray-700 text-gray-300' 
                      : 'bg-white border-om-navy/10 text-om-navy focus:border-om-gold'
                  }`}
              />
              <button 
                  onClick={handleSend}
                  disabled={loading}
                  className="bg-om-navy text-white font-bold px-6 py-2 font-mono hover:bg-om-gold transition-colors disabled:opacity-50 rounded-sm"
              >
                  ENVIAR
              </button>
          </div>
      </div>
  );
};
