
export interface DecisionNode {
    id: string;
    question: string;
    options: { label: string; nextId: string; style?: 'danger' | 'safe' | 'neutral' }[];
    result?: {
        title: string;
        severity: 'CRITICAL' | 'WARNING' | 'INFO';
        content: string;
        actionItem: string;
    };
}

export const MEDICAL_DECISION_TREE: Record<string, DecisionNode> = {
    'ROOT': {
        id: 'ROOT',
        question: "EVALUACIÓN PRIMARIA: ¿Cuál es la situación más evidente?",
        options: [
            { label: "No estoy seguro / Evaluación General", nextId: 'PRIMARY_SURVEY', style: 'neutral' },
            { label: "Sangrado Masivo / Trauma", nextId: 'BLEEDING_CHECK', style: 'danger' },
            { label: "Inconsciente / No Respira", nextId: 'AIRWAY_CHECK', style: 'danger' },
            { label: "Quemaduras (Fuego/Química)", nextId: 'BURN_CHECK', style: 'danger' },
            { label: "Huesos Rotos / Golpe Cabeza", nextId: 'TRAUMA_CHECK', style: 'neutral' },
            { label: "Reacción Alérgica / Hinchazón", nextId: 'ALLERGY_CHECK', style: 'danger' },
            { label: "Clima (Frío/Calor Extremo)", nextId: 'ENV_CHECK', style: 'neutral' },
            { label: "Picadura / Veneno", nextId: 'TOXIN_CHECK', style: 'neutral' }
        ]
    },
    'PRIMARY_SURVEY': {
        id: 'PRIMARY_SURVEY',
        question: "Protocolo de Evaluación General (XABCDE)",
        options: [],
        result: {
            title: "REGLA X-A-B-C",
            severity: "WARNING",
            content: "Sigue este orden estricto:\n1. X (Exsanguination): Busca y para sangrados masivos primero.\n2. A (Airway): ¿Vía aérea abierta? (Háblale).\n3. B (Breathing): ¿Respira? (Mira el pecho).\n4. C (Circulation): ¿Tiene pulso?\n5. D (Disability): ¿Se mueve o habla?",
            actionItem: "CHEQUEAR X-A-B-C"
        }
    },
    
    // --- RAMA SANGRADO (MARCH Protocol) ---
    'BLEEDING_CHECK': {
        id: 'BLEEDING_CHECK',
        question: "¿El sangrado es en una extremidad y sale a chorros?",
        options: [
            { label: "Desconocido / No distingo", nextId: 'PRESSURE_APPLY', style: 'neutral' },
            { label: "SÍ, rojo brillante/pulsátil", nextId: 'TOURNIQUET_APPLY', style: 'danger' },
            { label: "NO, es continuo/oscuro", nextId: 'PRESSURE_APPLY', style: 'neutral' },
            { label: "Es en el Torso/Cuello/Ingle", nextId: 'PACKING_CHECK', style: 'danger' }
        ]
    },
    'TOURNIQUET_APPLY': {
        id: 'TOURNIQUET_APPLY',
        question: "Arteria comprometida.",
        options: [],
        result: {
            title: "APLICAR TORNIQUETE",
            severity: "CRITICAL",
            content: "1. Coloca el torniquete 5-7 cm POR ENCIMA de la herida (nunca en articulación).\n2. Aprieta hasta que el sangrado PARE totalmente.\n3. Escribe la hora en la frente.\n4. NO lo aflojes.",
            actionItem: "APLICAR AHORA"
        }
    },
    'PRESSURE_APPLY': {
        id: 'PRESSURE_APPLY',
        question: "Sangrado controlable.",
        options: [],
        result: {
            title: "PRESIÓN DIRECTA",
            severity: "WARNING",
            content: "1. Aplica presión fuerte sobre la herida con tela limpia.\n2. Mantén 10 min sin levantar.\n3. Venda compresivo.\n4. Eleva la extremidad si es posible.",
            actionItem: "PRESIONAR"
        }
    },
    'PACKING_CHECK': {
        id: 'PACKING_CHECK',
        question: "¿Herida en zona de unión (cuello, axila, ingle)?",
        options: [
            { label: "Desconocido", nextId: 'WOUND_PACKING', style: 'neutral' },
            { label: "SÍ (Unión)", nextId: 'WOUND_PACKING', style: 'danger' },
            { label: "Es en el Pecho/Espalda", nextId: 'CHEST_SEAL', style: 'danger' }
        ]
    },
    'WOUND_PACKING': {
        id: 'WOUND_PACKING',
        question: "Empaquetamiento.",
        options: [],
        result: {
            title: "EMPAQUETAR HERIDA",
            severity: "CRITICAL",
            content: "1. Mete gasa/tela DENTRO del agujero hasta tocar hueso.\n2. Rellena a tope.\n3. Presiona encima con fuerza (3-10 min).\n4. NO empaquetar en pecho ni abdomen.",
            actionItem: "RELLENAR HERIDA"
        }
    },
    'CHEST_SEAL': {
        id: 'CHEST_SEAL',
        question: "Neumotórax.",
        options: [],
        result: {
            title: "SELLO TORÁCICO",
            severity: "CRITICAL",
            content: "1. Tapa el agujero con plástico al exhalar.\n2. Pega 3 lados (deja 1 libre para salida de aire).\n3. Busca herida de salida en espalda.",
            actionItem: "SELLAR TÓRAX"
        }
    },

    // --- RAMA QUEMADURAS ---
    'BURN_CHECK': {
        id: 'BURN_CHECK',
        question: "¿Origen y gravedad de la quemadura?",
        options: [
            { label: "Desconocido / Duda", nextId: 'BURN_COOL', style: 'neutral' },
            { label: "Fuego / Calor (Piel roja/ampollas)", nextId: 'BURN_COOL', style: 'neutral' },
            { label: "Química (Líquido/Polvo)", nextId: 'BURN_CHEM', style: 'danger' },
            { label: "Ropa pegada a la piel", nextId: 'BURN_STUCK', style: 'danger' }
        ]
    },
    'BURN_COOL': {
        id: 'BURN_COOL',
        question: "Quemadura térmica.",
        options: [],
        result: {
            title: "ENFRIAR ZONA",
            severity: "WARNING",
            content: "1. Aplica agua templada/fría (NO HELADA) por 20 min.\n2. Cubre con film transparente o tela limpia húmeda.\n3. NO rompas ampollas.\n4. NO apliques cremas ni dentífrico.",
            actionItem: "IRRIGAR AGUA"
        }
    },
    'BURN_CHEM': {
        id: 'BURN_CHEM',
        question: "Quemadura química.",
        options: [],
        result: {
            title: "LAVADO MASIVO",
            severity: "CRITICAL",
            content: "1. Si es polvo, cepilla antes de mojar.\n2. Lava con chorro de agua continuo durante 30-60 min.\n3. Retira ropa contaminada con cuidado.\n4. Protege tus ojos.",
            actionItem: "LAVAR 30 MIN"
        }
    },
    'BURN_STUCK': {
        id: 'BURN_STUCK',
        question: "Ropa adherida.",
        options: [],
        result: {
            title: "NO TIRAR",
            severity: "WARNING",
            content: "1. NO arranques la ropa pegada (arrancarás piel).\n2. Corta la ropa alrededor de la zona pegada.\n3. Enfría sobre la ropa.\n4. Cubre sin presionar.",
            actionItem: "CORTAR ALREDEDOR"
        }
    },

    // --- RAMA TRAUMA / HUESOS ---
    'TRAUMA_CHECK': {
        id: 'TRAUMA_CHECK',
        question: "¿Tipo de Trauma?",
        options: [
            { label: "Desconocido", nextId: 'HEAD_TRAUMA', style: 'neutral' },
            { label: "Golpe en la Cabeza / Confusión", nextId: 'HEAD_TRAUMA', style: 'danger' },
            { label: "Hueso asoma (Fractura Abierta)", nextId: 'OPEN_FRACTURE', style: 'danger' },
            { label: "Deformidad / Dolor extremidad", nextId: 'CLOSED_FRACTURE', style: 'neutral' },
            { label: "Lesión en Ojo", nextId: 'EYE_TRAUMA', style: 'neutral' }
        ]
    },
    'HEAD_TRAUMA': {
        id: 'HEAD_TRAUMA',
        question: "Traumatismo Craneoencefálico (TCE).",
        options: [],
        result: {
            title: "VIGILANCIA TCE",
            severity: "CRITICAL",
            content: "1. Si inconsciente: Posición lateral (si no hay daño cuello).\n2. Controla vómitos.\n3. Pupilas desiguales = Peligro extremo.\n4. NO dejar dormir si hay confusión progresiva.",
            actionItem: "MONITORIZAR CONSCIENCIA"
        }
    },
    'EYE_TRAUMA': {
        id: 'EYE_TRAUMA',
        question: "Trauma Ocular.",
        options: [],
        result: {
            title: "PROTEGER OJO",
            severity: "WARNING",
            content: "1. Si hay objeto clavado: NO LO SAQUES.\n2. Cubre AMBOS ojos (para evitar que mueva el malo).\n3. Si es químico: lavar 15 min.\n4. No frotar.",
            actionItem: "CUBRIR AMBOS"
        }
    },
    'OPEN_FRACTURE': {
        id: 'OPEN_FRACTURE',
        question: "Hueso expuesto.",
        options: [],
        result: {
            title: "FRACTURA ABIERTA",
            severity: "CRITICAL",
            content: "1. NO meter el hueso.\n2. Controlar sangrado alrededor.\n3. Cubrir con apósito húmedo.\n4. Inmovilizar como se encuentre.",
            actionItem: "INMOVILIZAR"
        }
    },
    'CLOSED_FRACTURE': {
        id: 'CLOSED_FRACTURE',
        question: "Fractura cerrada.",
        options: [],
        result: {
            title: "FERULIZAR",
            severity: "INFO",
            content: "1. Inmoviliza articulación por encima y debajo.\n2. Usa ramas/cartón y venda.\n3. Comprueba pulso/color dedos cada 15 min.",
            actionItem: "ENTABLILLAR"
        }
    },

    // --- RAMA ALERGIA ---
    'ALLERGY_CHECK': {
        id: 'ALLERGY_CHECK',
        question: "¿Dificultad respiratoria o hinchazón de cara/lengua?",
        options: [
            { label: "Desconocido / Leve picor", nextId: 'ALLERGY_MILD', style: 'neutral' },
            { label: "SÍ (Anafilaxia)", nextId: 'ANAPHYLAXIS', style: 'danger' },
            { label: "Solo ronchas en piel", nextId: 'ALLERGY_MILD', style: 'neutral' }
        ]
    },
    'ANAPHYLAXIS': {
        id: 'ANAPHYLAXIS',
        question: "Shock Anafiláctico.",
        options: [],
        result: {
            title: "USAR EPI-PEN",
            severity: "CRITICAL",
            content: "1. Si tiene autoinyector (Adrenalina), ÚSALO YA en muslo externo.\n2. Posición: Tumbado piernas arriba (si respira bien) o sentado (si se ahoga).\n3. Si no mejora en 5 min, segunda dosis.",
            actionItem: "ADRENALINA YA"
        }
    },
    'ALLERGY_MILD': {
        id: 'ALLERGY_MILD',
        question: "Alergia leve.",
        options: [],
        result: {
            title: "ANTIHISTAMÍNICO",
            severity: "INFO",
            content: "1. Alejar del alérgeno.\n2. Tomar antihistamínico oral si disponible.\n3. Vigilar respiración por si empeora.\n4. Compresas frías para picor.",
            actionItem: "OBSERVAR"
        }
    },

    // --- RAMA RESPIRACION ---
    'AIRWAY_CHECK': {
        id: 'AIRWAY_CHECK',
        question: "¿Responde a la voz o dolor?",
        options: [
            { label: "Desconocido", nextId: 'BREATHING_LOOK', style: 'neutral' },
            { label: "SÍ responde", nextId: 'RECOVERY_POS', style: 'safe' },
            { label: "NO responde", nextId: 'BREATHING_LOOK', style: 'danger' }
        ]
    },
    'BREATHING_LOOK': {
        id: 'BREATHING_LOOK',
        question: "¿El pecho se mueve? ¿Sientes aire?",
        options: [
            { label: "No estoy seguro", nextId: 'RECOVERY_POS', style: 'neutral' },
            { label: "SÍ respira", nextId: 'RECOVERY_POS', style: 'safe' },
            { label: "NO respira / Boquea", nextId: 'START_CPR', style: 'danger' }
        ]
    },
    'START_CPR': {
        id: 'START_CPR',
        question: "Paro Cardíaco.",
        options: [],
        result: {
            title: "RCP (30:2)",
            severity: "CRITICAL",
            content: "1. Centro del pecho.\n2. Comprime fuerte y rápido (100-120/min).\n3. Hunde 5cm el pecho.\n4. NO PARES hasta que reviva o llegue ayuda.",
            actionItem: "COMPRIMIR PECHO"
        }
    },
    'RECOVERY_POS': {
        id: 'RECOVERY_POS',
        question: "Inconsciente pero respira.",
        options: [],
        result: {
            title: "POSICIÓN LATERAL",
            severity: "INFO",
            content: "1. Tumba de lado para que no se ahogue con vómito.\n2. Extiende cuello.\n3. Revisa respiración cada minuto.",
            actionItem: "PROTEGER VÍA AÉREA"
        }
    },

    // --- RAMA AMBIENTAL ---
    'ENV_CHECK': {
        id: 'ENV_CHECK',
        question: "Exposición Térmica.",
        options: [
            { label: "Desconocido", nextId: 'GENERAL_STABILIZE', style: 'neutral' },
            { label: "Frío / Hipotermia", nextId: 'HYPOTHERMIA', style: 'neutral' },
            { label: "Calor / Golpe de Calor", nextId: 'HEATSTROKE', style: 'neutral' }
        ]
    },
    'GENERAL_STABILIZE': {
        id: 'GENERAL_STABILIZE',
        question: "Entorno.",
        options: [],
        result: {
            title: "REFUGIO",
            severity: "INFO",
            content: "1. Aísla del suelo.\n2. Protege del viento/lluvia.\n3. Mantén temperatura estable.",
            actionItem: "ESTABILIZAR"
        }
    },
    'HYPOTHERMIA': {
        id: 'HYPOTHERMIA',
        question: "Hipotermia.",
        options: [],
        result: {
            title: "CALOR PASIVO",
            severity: "WARNING",
            content: "1. Quitar ropa mojada.\n2. Piel con piel.\n3. Bebida tibia (si consciente).\n4. NO frotar.",
            actionItem: "CALENTAR LENTO"
        }
    },
    'HEATSTROKE': {
        id: 'HEATSTROKE',
        question: "¿Piel seca y muy caliente?",
        options: [
            { label: "Desconocido", nextId: 'HEAT_EXHAUST', style: 'neutral' },
            { label: "SÍ (No suda)", nextId: 'HEATSTROKE_ACT', style: 'danger' },
            { label: "NO (Suda mucho)", nextId: 'HEAT_EXHAUST', style: 'neutral' }
        ]
    },
    'HEATSTROKE_ACT': {
        id: 'HEATSTROKE_ACT',
        question: "Golpe de Calor.",
        options: [],
        result: {
            title: "ENFRIAR RÁPIDO",
            severity: "CRITICAL",
            content: "1. Agua en cuerpo.\n2. Abanicar.\n3. Hielo en axilas/ingles.\n4. EVACUAR.",
            actionItem: "BAJAR TEMP"
        }
    },
    'HEAT_EXHAUST': {
        id: 'HEAT_EXHAUST',
        question: "Agotamiento.",
        options: [],
        result: {
            title: "HIDRATAR",
            severity: "WARNING",
            content: "1. Sombra.\n2. Agua con sal a sorbos.\n3. Elevar piernas.",
            actionItem: "DESCANSAR"
        }
    },
    
    // --- RAMA TOXINAS ---
    'TOXIN_CHECK': {
        id: 'TOXIN_CHECK',
        question: "Contacto Tóxico.",
        options: [
            { label: "Desconocido", nextId: 'GENERAL_TOXIN', style: 'neutral' },
            { label: "Picadura (Serpiente/Araña)", nextId: 'BITE_TREAT', style: 'danger' },
            { label: "Ingesta", nextId: 'POISON_INGEST', style: 'danger' }
        ]
    },
    'BITE_TREAT': {
        id: 'BITE_TREAT',
        question: "Venenos.",
        options: [],
        result: {
            title: "INMOVILIZAR",
            severity: "WARNING",
            content: "1. NO chupar.\n2. Miembro bajo nivel corazón.\n3. Lavar herida.\n4. Marcar hinchazón.",
            actionItem: "QUIETO"
        }
    },
    'POISON_INGEST': {
        id: 'POISON_INGEST',
        question: "Ingestión.",
        options: [],
        result: {
            title: "NO VOMITAR",
            severity: "WARNING",
            content: "1. NO provocar vómito.\n2. Guardar muestra.\n3. Carbón activado si hay.",
            actionItem: "DILUIR"
        }
    },
    'GENERAL_TOXIN': {
        id: 'GENERAL_TOXIN',
        question: "General.",
        options: [],
        result: {
            title: "SOPORTE",
            severity: "INFO",
            content: "1. Lavar zona.\n2. Vigilar respiración.\n3. Retirar joyas.",
            actionItem: "OBSERVAR"
        }
    }
};
