
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
                            <li><strong>PROCESO:</strong> Raciono como un experto en supervivencia militar.</li>
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
                            Tengo acceso a mapas globales, clima en tiempo real y análisis botánico avanzado.
                        </div>
                        <div className="bg-red-900/30 border border-red-500/30 p-2 rounded">
                            <strong className="text-red-400 block mb-1">● OFFLINE</strong>
                            Activo mi "Memoria de Emergencia". Solo protocolos médicos básicos y guías estáticas.
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
                    <p className="mb-2">Interruptor táctico para situaciones de baja energía o riesgo de detección.</p>
                    <ul className="list-disc list-inside opacity-80">
                        <li><strong>Ahorro de Batería:</strong> Apaga los píxeles negros en pantallas OLED.</li>
                        <li><strong>Disciplina de Luz:</strong> Evita que el brillo de tu pantalla delate tu posición en la oscuridad.</li>
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
                        <p>No solo te digo "hace 10°C". Analizo la humedad y el viento para advertirte: <em>"Riesgo de hipotermia en 2 horas. Busca refugio seco ahora."</em></p>
                    </div>
                    <p>También localizo recursos críticos cercanos: Comisarías, Hospitales y Fuentes de agua.</p>
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
                    <p>¿Es esa baya comestible o te matará? No adivines.</p>
                    <ul className="list-disc list-inside opacity-80">
                        <li><strong>Acción:</strong> Saca una foto a plantas, insectos u hongos.</li>
                        <li><strong>Resultado:</strong> Recibe una ficha técnica con semáforo de riesgo (SAFE/DANGER), calorías estimadas y método de preparación seguro.</li>
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
                    <p className="mb-2">Sistema de inventario persistente. Lo que anotas aquí, se guarda en la base de datos remota.</p>
                    <p className="mb-2"><strong>¿Por qué es vital?</strong></p>
                    <p>Cuando chateas conmigo, <strong>leo tu mochila</strong>. Si preguntas <em>"¿Tengo frío, qué hago?"</em>, sabré si tienes un mechero o una manta térmica y te daré la solución basada en TUS recursos reales.</p>
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
                    <div className="bg-white/5 p-2 rounded italic text-gray-400 border-l-2 border-om-gold">
                        "Estoy herido en la pierna y solo tengo una camiseta."
                    </div>
                    <p>Al recibir ese mensaje, cruzaré protocolos médicos (TCCC) con tu inventario para guiarte paso a paso en la creación de un torniquete improvisado.</p>
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
                    <p>La herramienta definitiva. Transmisión de vídeo y audio en tiempo real.</p>
                    <p><strong>Uso Manos Libres:</strong> Ideal cuando estás reparando algo, cocinando o curando una herida y no puedes tocar la pantalla. Yo "miraré" a través de tu cámara y te hablaré por el altavoz guiándote en vivo.</p>
                </div>
            ),
            position: 'top'
        },
        {
            title: "CALIBRACIÓN COMPLETADA",
            description: (
                <div className="text-center space-y-4">
                    <p>Los sistemas están operativos. La interfaz está lista.</p>
                    <div className="p-4 border border-om-gold/50 rounded-lg bg-om-gold/10">
                        <p className="font-serif font-bold text-om-gold text-lg">REGLA Nº1</p>
                        <p className="italic">"La tecnología falla. Tu instinto no. Úsame como herramienta, no como muleta."</p>
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

        // Delay para permitir renderizado y listeners de resize/scroll
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

    // Lógica de posicionamiento responsive
    // Si la posición es 'top', lo ponemos un poco por encima del elemento (bottom-nav)
    // Si es 'bottom', lo ponemos debajo del elemento (header)
    const getPositionClasses = () => {
        if (currentStep.position === 'center') return 'top-1/2 -translate-y-1/2';
        // En móvil, 'top' significa que queremos que el cuadro esté en la parte superior del área visible disponible,
        // o "encima" del elemento resaltado (que suele estar abajo, como el nav).
        if (currentStep.position === 'top') return 'bottom-28 mb-safe'; 
        if (currentStep.position === 'bottom') return 'top-24 mt-safe';
        return 'top-1/2';
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden text-om-cream font-sans touch-none h-[100dvh]">
            {/* BACKDROP CON SPOTLIGHT (Visual Only) */}
            {rect ? (
                <div 
                    className="absolute rounded-xl transition-all duration-300 ease-out border-2 border-om-gold box-content shadow-[0_0_0_9999px_rgba(0,0,0,0.85)]"
                    style={{
                        top: rect.top - 4,
                        left: rect.left - 4,
                        width: rect.width + 8,
                        height: rect.height + 8,
                    }}
                />
            ) : (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
            )}

            {/* CONTENEDOR DE TEXTO RESPONSIVE */}
            <AnimatePresence mode="wait">
                <motion.div 
                    key={stepIndex}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute w-full px-4 flex justify-center pointer-events-none ${getPositionClasses()}`}
                >
                    <div className="pointer-events-auto bg-om-navy/95 border border-om-gold/30 rounded-2xl shadow-2xl w-full max-w-sm backdrop-blur-md flex flex-col overflow-hidden max-h-[65vh]">
                        
                        {/* HEADER DE LA TARJETA */}
                        <div className="flex justify-between items-center p-4 border-b border-white/10 shrink-0 bg-black/20">
                            <h3 className="text-om-gold font-mono font-bold text-xs tracking-widest uppercase">
                                // FASE {stepIndex + 1}/{steps.length}
                            </h3>
                            <button onClick={onComplete} className="text-[10px] text-gray-400 hover:text-white uppercase font-bold tracking-wider px-2 py-1 rounded hover:bg-white/5">
                                SALTAR
                            </button>
                        </div>
                        
                        {/* CUERPO SCROLLEABLE (Clave para móvil) */}
                        <div className="p-5 overflow-y-auto">
                            <h2 className="text-lg font-serif font-bold mb-4 text-white tracking-wide leading-tight">
                                {currentStep.title}
                            </h2>
                            <div className="font-mono text-xs leading-relaxed text-gray-300">
                                {currentStep.description}
                            </div>
                        </div>

                        {/* FOOTER ACCIONES */}
                        <div className="p-4 border-t border-white/10 shrink-0 bg-black/20 flex justify-end">
                            <button 
                                onClick={handleNext}
                                className="bg-om-gold text-om-navy px-6 py-3 rounded font-bold text-xs uppercase tracking-wider hover:bg-white transition-colors shadow-lg active:scale-95 w-full sm:w-auto text-center"
                            >
                                {stepIndex === steps.length - 1 ? 'INICIAR SUPERVIVENCIA' : 'ENTENDIDO >'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
