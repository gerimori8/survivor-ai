
import { GoogleGenAI, Type, LiveServerMessage, Modality, FunctionDeclaration } from "@google/genai";
import { ScannerResult, ObservationContext, LocationIntel } from "../types";
import { base64ToUint8Array, decodeAudioData } from "../utils/audioUtils";
import { getWeatherBasedTip } from "../data/staticDatabase";

const getSafeApiKey = () => {
    try {
        return process.env.API_KEY || "";
    } catch (e) {
        return "";
    }
};

const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });

const MEMORY_KEY = 'survivor_fact_memory_v2';
const getMemory = (): string => typeof window !== 'undefined' ? (window.localStorage.getItem(MEMORY_KEY) || "") : "";
const saveMemoryFact = (fact: string) => {
    if (typeof window === 'undefined') return;
    const current = getMemory();
    if (current.includes(fact)) return;
    window.localStorage.setItem(MEMORY_KEY, `${current}\n[${new Date().toLocaleDateString()}] ${fact}`);
};

export interface SurvivalContext {
    timeOfDay: string; 
    activityStatus: string; 
    lastKnownLocation: string;
}

const cleanAndParseJson = (text: string) => {
  try {
    if (!text) return null;
    let clean = text.trim();
    clean = clean.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) clean = clean.substring(firstBrace, lastBrace + 1);
    return JSON.parse(clean);
  } catch (e) {
    return null;
  }
};

async function withModelFallback<T>(primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    try { return await primary(); } catch (e) { return await fallback(); }
}

export const analyzeBioScanner = async (file: File, inventory: string, location: string, obs: ObservationContext): Promise<ScannerResult> => {
  const reader = new FileReader();
  const dataPromise = new Promise<string>((resolve) => {
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  const data = await dataPromise;
  
  const prompt = `Actúa como Fenrir, un experto en supervivencia y botánica. Identifica este espécimen. 
  Ubicación: ${location}. Inventario actual: ${inventory}. 
  Utiliza un lenguaje técnico pero comprensible. Evita modismos innecesarios.
  Responde en formato JSON con los campos: name, emoji, hazardStatus (SAFE, CAUTION, DANGEROUS), toxicityDescription, preparationProtocol (instrucciones precisas), energyKcal, medicinalUtility, confidenceScore.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      emoji: { type: Type.STRING },
      hazardStatus: { type: Type.STRING },
      toxicityDescription: { type: Type.STRING },
      energyKcal: { type: Type.INTEGER },
      preparationProtocol: { type: Type.STRING },
      medicinalUtility: { type: Type.STRING },
      confidenceScore: { type: Type.INTEGER }
    }
  };

  const generate = async (model: string) => {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data } }, { text: prompt }] },
      config: { responseMimeType: 'application/json', responseSchema: schema }
    });
    return JSON.parse(response.text || '{}');
  };

  return withModelFallback(() => generate('gemini-3-flash-preview'), () => generate('gemini-3-pro-preview'));
};

export const getLocationIntel = async (loc: { lat?: number, lng?: number, manualAddress?: string }, inventory: string): Promise<LocationIntel> => {
  const searchStr = loc.manualAddress || (loc.lat ? `${loc.lat}, ${loc.lng}` : "posición actual");
  const prompt = `Analiza la situación en "${searchStr}". 
  Identifica: temperatura actual, poblaciones cercanas, puestos de seguridad o policía, puntos de suministro de agua y centros sanitarios.
  Responde estrictamente en JSON: { "locationName": "Nombre oficial del lugar", "weather": { "temperature": "X°C", "condition": "Estado", "survivalTip": "Recomendación operativa" }, "resources": [{ "name": "Nombre", "type": "CITY|POLICE|WATER|HOSPITAL", "address": "Dirección exacta", "distance": "km aproximados" }] }`;

  const generate = async (model: string) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });
    return cleanAndParseJson(response.text || '');
  };

  const result = await withModelFallback(() => generate('gemini-3-flash-preview'), () => generate('gemini-3-pro-preview'));
  if (result && !result.weather.forecast) result.weather.forecast = [];
  return result;
};

export const sendChatMessage = async (history: any[], message: string, inventory: string, context: SurvivalContext, onUpdate: any) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    history,
    config: {
      systemInstruction: `Eres Fenrir, un operador experto en supervivencia y logística. Tu tono es profesional, calmado y eficiente. 
      Hablas de "tú" pero con respeto. Proporcionas soluciones basadas en el inventario (${inventory}) y el contexto actual (${context.activityStatus}).
      Prioriza la seguridad del usuario ante todo.`
    }
  });
  const result = await chat.sendMessage({ message });
  return result.text;
};

export const connectLiveSession = async (onAudio: any, onClose: any, onError: any, onTool: any, onSpeak: any) => {
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onmessage: async (msg: LiveServerMessage) => {
        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (audioData) {
          const buffer = await decodeAudioData(base64ToUint8Array(audioData), outputAudioContext);
          onAudio(buffer);
          const source = outputAudioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(outputAudioContext.destination);
          source.start();
        }
      },
      onclose: onClose,
      onerror: onError
    },
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: "Eres el operador Fenrir. Asiste al usuario de forma profesional basándote en la información visual recibida."
    }
  });
  return { session: await sessionPromise, outputAudioContext };
};
