
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppModule } from '../types';

interface TutorialStep {
    targetId?: string;
    title: string;
    description: React.ReactNode;
    module?: AppModule;
    position?: 'top' | 'bottom' | 'center';
}

interface Props {
    onComplete: () => void;
    onModuleChange: (mod: AppModule) => void;
}

export const TutorialOverlay: React.FC<Props> = ({ onComplete, onModuleChange }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [rect, setRect] = useState<DOMRect | null>(null);

    // Textos altamente detallados y didácticos
    const steps: TutorialStep[] = [
        {
            title: "SISTEMA TÁCTICO FENRIR",
            description: (
                <div className="space-y-3">
                    <p>Bienvenido, Operador. Has iniciado el protocolo <strong>Survivor AI</strong>.</p>
                    <p>No soy una simple base de datos. Soy una Inteligencia Artificial Generativa conectada a la nube de Google Gemini.</p>
                    <div className="bg-white/5 p-3 rounded border border-white/10">
                        <p className="font-bold text-om-gold mb-1">¿CÓMO FUNCIONO?</p>
                        <ul className="list-disc list-inside opacity-80 space-y-1">
                            <li><strong>INPUT:</strong> Veo lo que tú ves (Cámara, GPS, Texto).</li>
                            <li><strong>PROCESO:</strong> Razono como un experto en supervivencia militar.</li>
                            <li><strong>OUTPUT:</strong> Te doy instrucciones precisas para mantenerte con vida.</li>
                        </ul>
                    </div>
                </div>
            ),
            position: 'center'
        },
        {
            targetId: 'header-status',
            title: "ESTADO DEL ENLACE",
            description: (
                <div className="space-y-2">
                    <p>Monitoriza aquí tu conexión con el cerebro central.</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] mt-2">
                        <div className="bg-green-900/30 border border-green-500/30 p-2 rounded">
                            <strong className="text-green-400 block mb-1">● ONLINE</strong>
                            Acceso total a mapas y análisis.
                        </div>
                        <div className="bg-red-900/30 border border-red-500/30 p-2 rounded">
                            <strong className="text-red-400 block mb-1">● OFFLINE</strong>
                            Solo protocolos de emergencia locales.
                        </div>
                    </div>
                </div>
            ),
            position: 'bottom'
        },
        {
            targetId: 'header-actions',
            title: "MODO SIGILO (OLED)",
            description: (
                <>
                    <p className="mb-2">Interruptor táctico para situaciones de baja energía.</p>
                    <ul className="list-disc list-inside opacity-80">
                        <li><strong>Ahorro:</strong> Apaga píxeles en pantallas OLED.</li>
                        <li><strong>Sigilo:</strong> Reduce tu firma lumínica en la oscuridad.</li>
                    </ul>
                </>
            ),
            position: 'bottom'
        },
        {
            targetId: 'nav-LOCATION',
            module: AppModule.LOCATION,
            title: "INTELIGENCIA DE TERRENO",
            description: (
                <div className="space-y-2">
                    <p>Convierte tu GPS en un estratega.</p>
                    <div className="bg-om-gold/10 p-2 rounded border border-om-gold/20">
                        <strong className="text-om-gold block text-[10px] uppercase tracking-wider mb-1">Tu Ventaja:</strong>
                        <p>No solo te digo la temperatura. Analizo humedad y viento para predecir riesgos reales como la hipotermia.</p>
                    </div>
                </div>
            ),
            position: 'top'
        },
        {
            targetId: 'nav-SCANNER',
            module: AppModule.SCANNER,
            title: "BIO-ANALIZADOR VISUAL",
            description: (
                <div className="space-y-2">
                    <p>¿Es comestible o venenoso? No adivines.</p>
                    <ul className="list-disc list-inside opacity-80">
                        <li><strong>Acción:</strong> Saca una foto a plantas u hongos.</li>
                        <li><strong>Resultado:</strong> Ficha técnica con nivel de riesgo y preparación segura.</li>
                    </ul>
                </div>
            ),
            position: 'top'
        },
        {
            targetId: 'nav-INVENTORY',
            module: AppModule.INVENTORY,
            title: "MOCHILA EN LA NUBE",
            description: (
                <>
                    <p className="mb-2">Inventario persistente sincronizado.</p>
                    <p><strong>Vital:</strong> Leo tu mochila al chatear. Si preguntas qué hacer, te daré soluciones basadas en lo que REALMENTE tienes.</p>
                </>
            ),
            position: 'top'
        },
        {
            targetId: 'nav-COMMAND',
            module: AppModule.COMMAND,
            title: "CHAT CONTEXTUAL",
            description: (
                <div className="space-y-2">
                    <p>Canal directo con el Núcleo Fenrir.</p>
                    <p>Tengo conciencia de tu ubicación, hora y equipo. Pídeme recetas, estrategias de caza o primeros auxilios tácticos.</p>
                </div>
            ),
            position: 'top'
        },
        {
            targetId: 'nav-LIVE',
            module: AppModule.LIVE,
            title: "ENLACE DE VÍDEO (BETA)",
            description: (
                <div className="space-y-2">
                    <p>Transmisión de vídeo en tiempo real.</p>
                    <p><strong>Manos Libres:</strong> Yo "miraré" por tu cámara y te guiaré por voz mientras usas tus manos para trabajar.</p>
                </div>
            ),
            position: 'top'
        },
        {
            title: "CALIBRACIÓN COMPLETADA",
            description: (
                <div className="text-center space-y-4">
                    <p>Sistemas operativos. Interfaz lista.</p>
                    <div className="p-3 border border-om-gold/50 rounded bg-om-gold/10">
                        <p className="italic text-sm">"La tecnología falla. Tu instinto no. Úsame como herramienta."</p>
                    </div>
                    <p>Buena suerte, Operador.</p>
                </div>
            ),
            position: 'center',
            module: AppModule.LOCATION
        }
    ];

    const currentStep = steps[stepIndex];

    useEffect(() => {
        if (currentStep.module) {
            onModuleChange(currentStep.module);
        }

        const updateRect = () => {
            if (currentStep.targetId) {
                const el = document.getElementById(currentStep.targetId);
                if (el) {
                    setRect(el.getBoundingClientRect());
                }
            } else {
                setRect(null);
            }
        };

        const timer = setTimeout(updateRect, 150);
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true);
        
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
        };
    }, [stepIndex, currentStep]);

    const handleNext = () => {
        if (stepIndex < steps.length - 1) {
            setStepIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    // SOLUCIÓN RESPONSIVE: Usar Flexbox para garantizar visibilidad
    // En lugar de posiciones absolutas frágiles, usamos el contenedor flex para empujar
    // la tarjeta a la zona segura opuesta al elemento resaltado.
    const getLayoutClasses = () => {
        if (currentStep.position === 'center') return 'justify-center items-center';
        // Si el objetivo está abajo (Nav), empujamos el contenido arriba (justify-end) pero dejamos espacio (pb-32)
        if (currentStep.position === 'top') return 'justify-end pb-36'; 
        // Si el objetivo está arriba (Header), empujamos el contenido abajo (justify-start) pero dejamos espacio (pt-28)
        if (currentStep.position === 'bottom') return 'justify-start pt-28';
        return 'justify-center items-center';
    };

    return (
        <div className={`fixed inset-0 z-50 flex flex-col pointer-events-none p-4 h-[100dvh] ${getLayoutClasses()}`}>
            
            {/* BACKDROP CON SPOTLIGHT (Visual Only) */}
            {rect ? (
                <div 
                    className="absolute rounded-xl transition-all duration-300 ease-out border-2 border-om-gold box-content shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] z-0"
                    style={{
                        top: rect.top - 4,
                        left: rect.left - 4,
                        width: rect.width + 8,
                        height: rect.height + 8,
                    }}
                />
            ) : (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-0" />
            )}

            {/* CONTENEDOR DE LA TARJETA */}
            <AnimatePresence mode="wait">
                <motion.div 
                    key={stepIndex}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-sm z-10 pointer-events-auto flex flex-col relative"
                    style={{ maxHeight: '70vh' }} // Limite duro para asegurar que no se salga
                >
                    <div className="bg-om-navy/95 border border-om-gold/30 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden w-full">
                        
                        {/* HEADER */}
                        <div className="flex justify-between items-center p-3 border-b border-white/10 shrink-0 bg-black/20">
                            <h3 className="text-om-gold font-mono font-bold text-[10px] tracking-widest uppercase">
                                // FASE {stepIndex + 1}/{steps.length}
                            </h3>
                            <button onClick={onComplete} className="text-[10px] text-gray-400 hover:text-white uppercase font-bold tracking-wider px-2 py-1 rounded hover:bg-white/5">
                                SALTAR
                            </button>
                        </div>
                        
                        {/* BODY SCROLLEABLE */}
                        <div className="p-4 overflow-y-auto">
                            <h2 className="text-lg font-serif font-bold mb-2 text-white tracking-wide leading-tight">
                                {currentStep.title}
                            </h2>
                            <div className="font-mono text-xs leading-relaxed text-gray-300">
                                {currentStep.description}
                            </div>
                        </div>

                        {/* FOOTER (SIEMPRE VISIBLE) */}
                        <div className="p-3 border-t border-white/10 shrink-0 bg-black/20 flex justify-end">
                            <button 
                                onClick={handleNext}
                                className="bg-om-gold text-om-navy px-6 py-3 rounded font-bold text-xs uppercase tracking-wider hover:bg-white transition-colors shadow-lg active:scale-95 w-full text-center"
                            >
                                {stepIndex === steps.length - 1 ? 'INICIAR MISIÓN' : 'SIGUIENTE >'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
