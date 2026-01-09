
import React, { useState } from 'react';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInAnonymously,
    AuthError
} from "firebase/auth";
import { auth } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';

export const AuthScreen: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) {
            setError("Error de configuración: Firebase no inicializado.");
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err: any) {
            const code = (err as AuthError).code;
            
            // Manejo específico de errores para UI limpia y sin logs rojos innecesarios
            if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
                setError("Credenciales no válidas. Verifique email y contraseña.");
            } else if (code === 'auth/email-already-in-use') {
                setError("Este identificador ya está registrado en el sistema.");
            } else if (code === 'auth/weak-password') {
                setError("Protocolo de seguridad: La contraseña es muy débil.");
            } else if (code === 'auth/invalid-email') {
                setError("Formato de identificador inválido.");
            } else if (code === 'auth/network-request-failed') {
                setError("Sin conexión al servidor central.");
            } else {
                // Solo loguear errores desconocidos/inesperados
                console.error("Auth Error:", err); 
                setError("Error desconocido en el enlace de autenticación.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAnonymous = async () => {
        if (!auth) return;
        setLoading(true);
        try {
            await signInAnonymously(auth);
        } catch (err) {
            setError("No se pudo establecer enlace anónimo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen bg-om-navy text-om-cream flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 scanlines opacity-10 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-om-gold opacity-50"></div>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10"
            >
                <div className="text-center mb-10">
                    <h1 className="font-serif text-4xl font-bold mb-2 tracking-tight">Survivor<span className="text-om-gold">AI</span></h1>
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-60">Sistema de Supervivencia Táctica v2.0</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-2xl">
                    <div className="flex mb-6 border-b border-white/10">
                        <button 
                            onClick={() => { setIsLogin(true); setError(null); }}
                            className={`flex-1 pb-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors ${isLogin ? 'text-om-gold border-b-2 border-om-gold' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Identificarse
                        </button>
                        <button 
                            onClick={() => { setIsLogin(false); setError(null); }}
                            className={`flex-1 pb-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors ${!isLogin ? 'text-om-gold border-b-2 border-om-gold' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Reclutamiento
                        </button>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-mono uppercase tracking-widest opacity-60 mb-1">Identificador (Email)</label>
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm focus:border-om-gold outline-none transition-colors text-white"
                                placeholder="operador@base.com"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono uppercase tracking-widest opacity-60 mb-1">Clave de Acceso</label>
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm focus:border-om-gold outline-none transition-colors text-white"
                                placeholder="••••••••"
                            />
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-red-900/30 border border-red-500/30 p-2 rounded text-red-200 text-xs text-center font-mono"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-om-gold text-om-navy font-bold py-3 rounded-lg uppercase tracking-widest text-xs hover:bg-white transition-colors disabled:opacity-50 mt-4"
                        >
                            {loading ? 'Procesando...' : (isLogin ? 'Acceder al Sistema' : 'Crear Credenciales')}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-2 bg-[#1A202C] text-gray-500 font-mono">OPCIONES ALTERNATIVAS</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleAnonymous}
                        disabled={loading}
                        className="w-full border border-white/20 text-gray-300 py-3 rounded-lg uppercase tracking-widest text-xs hover:bg-white/5 transition-colors font-mono flex items-center justify-center gap-2"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        Acceso Fantasma (Anónimo)
                    </button>
                </div>

                <p className="text-center mt-6 text-[9px] text-gray-600 font-mono">
                    USO EXCLUSIVO PARA PERSONAL AUTORIZADO.<br/>
                    ID DE TERMINAL: {navigator.userAgent.slice(0, 20)}...
                </p>
            </motion.div>
        </div>
    );
};
