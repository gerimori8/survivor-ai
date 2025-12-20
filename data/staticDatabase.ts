
// Static Offline Intelligence Database
// Fallback protocols when Gemini API is unreachable

export const OFFLINE_PROTOCOL_KEYWORDS: Record<string, string[]> = {
    MEDICAL: ['sangre', 'herida', 'sangrado', 'roto', 'fractura', 'quemadura', 'dolor', 'botiquin', 'medico', 'bleed', 'wound', 'pain', 'burn'],
    WATER: ['agua', 'sed', 'hidratacion', 'rio', 'lago', 'purificar', 'hervir', 'filtro', 'water', 'thirst'],
    SHELTER: ['frio', 'calor', 'refugio', 'dormir', 'lluvia', 'nieve', 'shelter', 'cold', 'rain'],
    FIRE: ['fuego', 'leña', 'encender', 'mechero', 'fire', 'wood'],
    NAVIGATION: ['perdido', 'norte', 'mapa', 'brujula', 'donde', 'lost', 'north']
};

// NEW: Categorized tips for deterministic fallback generation
export const FALLBACK_TIPS_BY_WEATHER: Record<string, string[]> = {
    RAIN: [
        "Lluvia inminente: Impermeabiliza el refugio y recolecta agua potable.",
        "Suelo mojado: Aísla tu cama del suelo para evitar la pérdida de calor.",
        "Visibilidad reducida: Mantén la posición y asegura el perímetro.",
        "Riesgo de hipotermia por humedad: Mantén la ropa seca a toda costa."
    ],
    HEAT: [
        "Calor extremo: Limita el movimiento a las horas nocturnas o amanecer.",
        "Riesgo de deshidratación: Bebe agua a sorbos pequeños y constantes.",
        "Busca sombra densa y cubre tu cabeza y cuello del sol directo.",
        "No comas en exceso durante el día para reducir el calor metabólico."
    ],
    COLD: [
        "Bajas temperaturas: Mantén el fuego encendido y pequeño para no llamar la atención.",
        "Hipotermia: Prioriza refugio seco, pequeño y aislado del viento.",
        "Come alimentos grasos o dulces antes de dormir para generar calor corporal.",
        "No duermas directamente sobre el suelo frío."
    ],
    GENERAL: [
        "Mantén la calma. La mente es tu mejor herramienta de supervivencia.",
        "Asegura tu perímetro y recolecta leña antes de que anochezca.",
        "Identifica rutas de escape en tu campamento siempre.",
        "Regla de 3: 3 min sin aire, 3 días sin agua, 3 semanas sin comida."
    ]
};

export const FALLBACK_SURVIVAL_TIPS = FALLBACK_TIPS_BY_WEATHER.GENERAL;

// NEW: Intelligent generator based on available data
export const getWeatherBasedTip = (tempStr: string, conditionStr: string): string => {
    const temp = parseInt(tempStr) || 20;
    const cond = (conditionStr || "").toLowerCase();

    let category = 'GENERAL';

    if (cond.includes("lluvi") || cond.includes("tormenta") || cond.includes("nieve") || cond.includes("rain")) {
        category = 'RAIN';
    } else if (temp > 28 || cond.includes("sol") || cond.includes("calor") || cond.includes("sun")) {
        category = 'HEAT';
    } else if (temp < 12 || cond.includes("frio") || cond.includes("helada") || cond.includes("cold")) {
        category = 'COLD';
    }

    const tips = FALLBACK_TIPS_BY_WEATHER[category];
    return tips[Math.floor(Math.random() * tips.length)];
};

export const OFFLINE_PROTOCOLS: Record<string, string> = {
    MEDICAL: `[PROTOCOLO OFFLINE - MÉDICO]
1. DETENER HEMORRAGIA: Presión directa con tela estéril. Elevar extremidad. Usar torniquete SOLO si hay peligro de muerte.
2. FRACTURAS: Inmovilizar articulación por encima y debajo. No realinear el hueso.
3. QUEMADURAS: Enfriar con agua (no hielo) 10 min. Cubrir con tela limpia que no se pegue.
4. SHOCK: Tumbar boca arriba, elevar pies. Mantener caliente. No dar líquidos.`,

    WATER: `[PROTOCOLO OFFLINE - HIDRATACIÓN]
1. NUNCA beber agua sin tratar de fuentes naturales.
2. HERVIR: Llevar a ebullición fuerte al menos 1 minuto (3 min en altura).
3. QUÍMICO: Usar tabletas de Yodo o Cloro si tienes (esperar 30 min).
4. FILTRACIÓN: Usar tela para quitar sedimentos, luego filtrar con equipo o arena.
5. ¿SIN EQUIPO?: Recolectar agua de lluvia o rocío matutino.`,

    SHELTER: `[PROTOCOLO OFFLINE - REFUGIO]
1. UBICACIÓN: Terreno elevado, lejos de viento y cauces de agua.
2. AISLAMIENTO: El suelo roba calor. Haz una cama de hojas/hierba (30cm grosor).
3. ESTRUCTURA: Usa un marco en "A" con una viga resistente. Cubre con lona o escombros.
4. CALOR: Fuego pequeño cerca de la entrada con pared reflectora detrás.`,

    FIRE: `[PROTOCOLO OFFLINE - FUEGO]
1. TRIÁNGULO: Oxígeno, Combustible, Calor.
2. YESCA: Hierba seca, corteza, algodón, pelusa. Debe estar 100% seca.
3. RAMITAS: Ramas muy finas para iniciar.
4. COMBUSTIBLE: Troncos más grandes.
5. ESTRUCTURA: Tipo "Tipi" o "Cabaña" para permitir flujo de aire.`,

    NAVIGATION: `[PROTOCOLO OFFLINE - NAVEGACIÓN]
1. PARAR: Siéntate, Piensa, Observa, Planifica.
2. SOL: Sale por el Este, se pone por el Oeste. Al mediodía está al Sur (Hemisferio N).
3. REFERENCIAS: Busca puntos altos. Sigue el agua corriente abajo (suele llevar a civilización).
4. BRÚJULA: Usa la brújula digital del módulo de Localización.`
};

export const getOfflineResponse = (input: string): string | null => {
    const lowerInput = input.toLowerCase();
    
    for (const [category, keywords] of Object.entries(OFFLINE_PROTOCOL_KEYWORDS)) {
        if (keywords.some(k => lowerInput.includes(k))) {
            return OFFLINE_PROTOCOLS[category];
        }
    }
    
    return null;
};
