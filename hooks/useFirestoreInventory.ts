
import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { InventoryItem } from '../types';
import { User } from 'firebase/auth';

export type SyncStatus = 'SYNCED' | 'SYNCING' | 'LOCAL_ONLY' | 'ERROR';

export function useFirestoreInventory(user: User | null) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [status, setStatus] = useState<SyncStatus>('SYNCING');

  useEffect(() => {
    // 1. Carga inicial rápida desde caché local (Offline First)
    if (typeof window !== 'undefined') {
        const cached = window.localStorage.getItem('mochila_data');
        if (cached) {
            try {
                setInventory(JSON.parse(cached));
            } catch (e) {
                console.warn("Error parsing local cache");
            }
        }
    }

    if (!user || !db) {
        setStatus('LOCAL_ONLY');
        return;
    }

    // 2. Suscripción a Firestore (Realtime Database)
    const userDocRef = doc(db, 'users', user.uid);
    
    // Flag to avoid setting state on unmounted component
    let mounted = true;

    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (!mounted) return;
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.inventory) {
            setInventory(data.inventory);
            window.localStorage.setItem('mochila_data', JSON.stringify(data.inventory));
            setStatus('SYNCED');
        }
      } else {
          // Si el usuario es nuevo en la nube, intentar inicializar
          const currentLocal = window.localStorage.getItem('mochila_data');
          if (currentLocal) {
               setDoc(userDocRef, { inventory: JSON.parse(currentLocal) }, { merge: true })
                .then(() => { if(mounted) setStatus('SYNCED'); })
                .catch(e => {
                    if (mounted) {
                        if (e.code === 'permission-denied') setStatus('LOCAL_ONLY');
                        else setStatus('ERROR');
                    }
                });
          } else {
              setStatus('SYNCED'); // Nothing to sync yet, but connected
          }
      }
    }, (error) => {
        if (!mounted) return;
        
        // MANEJO SILENCIOSO DE ERRORES DE PERMISOS
        if (error.code === 'permission-denied') {
            // No spammeamos la consola, simplemente cambiamos el estado UI
            setStatus('LOCAL_ONLY');
        } else {
            console.error("Firestore Error:", error.message);
            setStatus('ERROR');
        }
    });

    return () => {
        mounted = false;
        unsubscribe();
    };
  }, [user]);

  // Función de actualización híbrida (Optimistic UI)
  const updateInventory = async (newItems: InventoryItem[]) => {
      // 1. Actualizar UI inmediatamente
      setInventory(newItems);
      // 2. Guardar en disco local
      window.localStorage.setItem('mochila_data', JSON.stringify(newItems));
      
      // 3. Sincronizar con nube silenciosamente si no estamos en modo solo-local forzado
      if (user && db && status !== 'LOCAL_ONLY') {
          setStatus('SYNCING');
          try {
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, { inventory: newItems }, { merge: true });
            setStatus('SYNCED');
          } catch (e: any) {
              if (e.code === 'permission-denied') {
                  setStatus('LOCAL_ONLY');
              } else {
                  console.warn("Sync error, kept local");
              }
          }
      }
  };

  return [inventory, updateInventory, status] as const;
}
