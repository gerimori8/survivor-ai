
import { GoogleGenAI, Type, Schema, LiveServerMessage, Modality, FunctionDeclaration } from "@google/genai";
import { ScannerResult, WeatherData, MapResource, ObservationContext, LocationIntel } from "../types";
import { base64ToUint8Array, decodeAudioData } from "../utils/audioUtils";
import { getWeatherBasedTip } from "../data/staticDatabase";

const API_KEY = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- MEMORY SYSTEM ---
const MEMORY_KEY = 'survivor_long_term_memory_v1';

const getMemory = (): string => {
    if (typeof window === 'undefined') return "";
    return window.localStorage.getItem(MEMORY_KEY) || "";
};

const saveMemoryFact = (fact: string) => {
    if (typeof window === 'undefined') return;
    const current = getMemory();
    if (current.includes(fact)) return;
    const timestamp = new Date().toLocaleDateString();
    const newEntry = `[${timestamp}] ${fact}`;
    window.localStorage.setItem(MEMORY_KEY, current ? `${current}\n${newEntry}` : newEntry);
};

// --- Context Interface ---
export interface SurvivalContext {
    timeOfDay: string; 
    activityStatus: string; 
    lastKnownLocation: string;
}

// --- Helper for reliable JSON parsing ---
const cleanAndParseJson = (text: string) => {
  try {
    if (!text) return null;
    let clean = text.trim();
    // Remove markdown code blocks
    clean = clean.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
        clean = clean.substring(firstBrace, lastBrace + 1);
    }
    
    return JSON.parse(clean);
  } catch (e) {
    console.error("JSON Parse Error", e, text);
    return null;
  }
};

// --- Helper: Retry Logic ---
async function withModelFallback<T>(
    primaryOperation: () => Promise<T>, 
    fallbackOperation: () => Promise<T>
): Promise<T> {
    try {
        return await primaryOperation();
    } catch (primaryError: any) {
        console.warn("Primary Model Failed. Switching to Fallback...", primaryError.message);
        try {
            return await fallbackOperation();
        } catch (fallbackError: any) {
            console.error("Critical: Both models failed.", fallbackError);
            throw fallbackError;
        }
    }
}

// --- Helper: Compress Image for API ---
const compressImage = async (base64Str: string, maxWidth = 1024): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = maxWidth / Math.max(img.width, img.height);
            const finalScale = scale < 1 ? scale : 1;
            
            canvas.width = img.width * finalScale;
            canvas.height = img.height * finalScale;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(base64Str); return; }
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.8)); 
        };
        img.onerror = () => resolve(base64Str);
    });
};

// --- 1.1 Scanner Module ---
export const analyzeBioScanner = async (
  imageFile: File,
  inventory: string,
  location: string,
  observations: ObservationContext
): Promise<ScannerResult> => {
  const rawBase64 = await fileToBase64(imageFile);
  // Scanner uses slight optimization to ensure fast JSON analysis
  const optimizedBase64 = await compressImage(rawBase64, 1024);
  const data = optimizedBase64.split(',')[1];
  
  const prompt = `
  Eres el sistema de análisis TÁCTICO de la app Survivor AI.
  IDIOMA OBLIGATORIO: ESPAÑOL DE ESPAÑA (Castellano).
  
  SITUACIÓN REAL: Supervivencia extrema en ${location}.
  OBJETIVO: Analizar la imagen (Flora o Fauna) para obtener recursos vitales.
  
  CONTEXTO VISUAL:
  - Característica: ${observations.visualFeature}
  - Textura: ${observations.texture}
  - Entorno: ${observations.environment}
  - Color: ${observations.distinctiveColor}
  - Inventario: [${inventory}]
  
  MEMORIA APRENDIDA (PREFERENCIAS USUARIO):
  ${getMemory()}
  
  INSTRUCCIONES:
  1. Identifica Especie.
  2. Nivel de Peligro (1-5).
  3. Valor Energético.
  4. PROTOCOLO DE CONSUMO Y CRAFTEO (Usa inventario o crea herramientas).
  
  Responde ESTRICTAMENTE en este formato JSON.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      emoji: { type: Type.STRING },
      hazardStatus: { type: Type.STRING, enum: ['SAFE', 'CAUTION', 'DANGEROUS', 'DEADLY'] },
      toxicityLevel: { type: Type.INTEGER },
      toxicityDescription: { type: Type.STRING },
      energyInfo: { type: Type.STRING },
      energyKcal: { type: Type.INTEGER },
      isEdible: { type: Type.BOOLEAN },
      preparationProtocol: { type: Type.STRING },
      medicinalUtility: { type: Type.STRING },
      criticalFact: { type: Type.STRING },
      confidenceScore: { type: Type.INTEGER }
    },
    required: ["name", "emoji", "hazardStatus", "toxicityLevel", "energyKcal", "isEdible", "preparationProtocol", "confidenceScore"]
  };

  const generate = async (modelName: string) => {
      const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data } },
              { text: prompt }
            ]
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
          }
      });
      const result = JSON.parse(response.text || '{}') as ScannerResult;
      result.id = Date.now().toString();
      result.timestamp = Date.now();
      result.thumbnail = await compressImage(rawBase64, 200);
      return result;
  };

  return withModelFallback(
      () => generate('gemini-2.5-flash'),
      () => generate('gemini-3-flash-preview')
  );
};

// --- 1.2 Location Intel ---
export const getLocationIntel = async (
  locationData: { lat?: number, lng?: number, manualAddress?: string },
  inventory: string
): Promise<LocationIntel> => {
  
  // FIXED: Explicitly prioritize manual address if provided
  const searchLocation = locationData.manualAddress 
    ? locationData.manualAddress
    : locationData.lat && locationData.lng 
        ? `${locationData.lat}, ${locationData.lng}`
        : "Ubicación desconocida";

  const prompt = `
    Eres el OFICIAL DE INTELIGENCIA de Survivor AI.
    UBICACIÓN OBJETIVO: "${searchLocation}".
    
    TAREA CRÍTICA:
    1. USA 'googleSearch' para buscar EXACTAMENTE: "tiempo temperatura actual en ${searchLocation}".
    2. USA 'googleSearch' para buscar: "hospitales policía agua potable cerca de ${searchLocation}".
    3. NO inventes el clima. Extrae el dato numérico real de la búsqueda.
    
    SI LA UBICACIÓN ES MANUAL ("${locationData.manualAddress}"), ÚSALA como nombre de ubicación.

    Responde SOLO JSON válido con este esquema:
    {
      "locationName": "Nombre Ciudad/Zona",
      "weather": {
        "temperature": "Ej: 24°C",
        "condition": "Ej: Soleado",
        "survivalTip": "Consejo breve basado en clima"
      },
      "resources": [
        { "name": "Nombre", "type": "HOSPITAL"|"POLICE"|"WATER"|"CITY", "address": "Dirección", "distance": "Ej: 1.2km" }
      ]
    }
  `;
  
  try {
    const result = await withModelFallback(
        async () => {
             // FIXED: Using gemini-3-pro-preview for better search reasoning as requested ("utilize google search")
             const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash', // Using 2.5 flash which is reliable with tools
                contents: prompt,
                config: { 
                    // We explicitly enable googleSearch
                    tools: [{ googleSearch: {} }] 
                }
            });

            // Parse output. Note: responseMimeType JSON sometimes conflicts with Search tools in some models,
            // so we parse the text manually using our helper.
            const parsed = cleanAndParseJson(response.text || '');
            if (parsed) return parsed;
            
            throw new Error("Respuesta inválida o vacía");
        },
        async () => {
            // Fallback: Gemini 3 Flash Preview often handles search + JSON well
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                    responseMimeType: 'application/json'
                }
            });
            const parsed = JSON.parse(response.text || '{}');
            if(parsed) return parsed;
            throw new Error("Fallback response invalid");
        }
    );

    if (!result) throw new Error("Parsed result is null");
    
    // Fallback Logic for empty fields
    if (!result.locationName || result.locationName === "Ubicación Desconocida") {
        result.locationName = locationData.manualAddress || "Ubicación Detectada";
    }
    
    if (!result.weather) result.weather = { temperature: "--", condition: "Sin Datos" };

    // Fill missing tip
    if (!result.weather.survivalTip || typeof result.weather.survivalTip !== 'string' || result.weather.survivalTip.length < 5) {
        const temp = result.weather.temperature || "20°C";
        const cond = result.weather.condition || "Nublado";
        result.weather.survivalTip = getWeatherBasedTip(temp, cond);
    }
    
    // Generate simple forecast if missing (Search usually returns current, not forecast JSON easily)
    if (!result.weather.forecast) {
        const baseTemp = parseInt(result.weather.temperature) || 20;
        result.weather.forecast = [
            { day: "Hoy", temp: `${baseTemp}°C`, condition: result.weather.condition },
            { day: "Mañana", temp: `${baseTemp}°C`, condition: "Similar" },
            { day: "Pasado", temp: `${baseTemp}°C`, condition: "Variable" }
        ];
    }

    if (!result.resources) result.resources = [];
    
    return result as LocationIntel;

  } catch (error) {
    console.error("Location Intel Error", error);
    const offlineTip = getWeatherBasedTip("20", "Offline");
    return {
        locationName: locationData.manualAddress || "Sin Conexión",
        weather: { 
            temperature: "--", 
            condition: "Offline", 
            wind: "--", 
            precipitation: "--", 
            survivalTip: offlineTip,
            forecast: []
        },
        resources: []
    };
  }
};

// --- 1.4 Chat Module ---
export const sendChatMessage = async (
  history: any[], 
  message: string, 
  inventory: string,
  context: SurvivalContext,
  onUpdateInventory?: (action: 'add' | 'remove', item: string, quantity: number) => Promise<boolean>
) => {
  
  const updateInventoryTool: FunctionDeclaration = {
    name: "updateInventory",
    description: "DETECTA CAMBIO EN INVENTARIO.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ["add", "remove"] },
        item: { type: Type.STRING },
        quantity: { type: Type.NUMBER }
      },
      required: ["action", "item", "quantity"]
    }
  };

  const saveMemoryTool: FunctionDeclaration = {
      name: "saveMemory",
      description: "GUARDA HECHOS PERMANENTES SOBRE EL USUARIO.",
      parameters: {
          type: Type.OBJECT,
          properties: {
              fact: { type: Type.STRING, description: "El dato a recordar." }
          },
          required: ["fact"]
      }
  };

  const systemInstruction = `Eres Fenrir, operador TÁCTICO.
  
  ROL: Experto en supervivencia. Humano, pragmático, español.
  
  MEMORIA A LARGO PLAZO:
  ${getMemory()}
  
  CONTEXTO: Inventario: [${inventory}].
  
  REGLAS:
  1. Si hay datos nuevos del usuario, USA 'saveMemory'.
  2. Filtra consejos por inventario real.`;

  const runChat = async (modelName: string) => {
      const chat = ai.chats.create({
        model: modelName,
        history: history,
        config: {
            systemInstruction: systemInstruction,
            tools: [{ functionDeclarations: [updateInventoryTool, saveMemoryTool] }]
        }
      });

      const result = await chat.sendMessage({ message });
      
      const calls = result.functionCalls;
      if (calls && calls.length > 0) {
          for (const call of calls) {
              if (call.name === 'updateInventory' && onUpdateInventory) {
                  const { action, item, quantity } = call.args as any;
                  await onUpdateInventory(action, item, quantity);
              } else if (call.name === 'saveMemory') {
                  const { fact } = call.args as any;
                  saveMemoryFact(fact);
              }
          }
          
          const response = await chat.sendMessage({
            message: calls.map(call => ({
                functionResponse: {
                    name: call.name,
                    response: { result: "Operación completada." },
                    id: call.id
                }
            }))
          });
          return response.text;
      }
      return result.text;
  };

  return withModelFallback(
      () => runChat('gemini-2.5-flash'),
      () => runChat('gemini-3-flash-preview')
  );
};

// --- 1.3 Live Session Setup ---
export const connectLiveSession = async (
  onAudioData: (buffer: AudioBuffer) => void,
  onClose: () => void,
  onError: (err: any) => void,
  onToolCall?: (toolName: string) => Promise<void>,
  onAiSpeakingStateChange?: (isSpeaking: boolean) => void
) => {
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  
  // FORCE RESUME: Crucial for fixing silence issues
  if (outputAudioContext.state === 'suspended') {
      try {
        await outputAudioContext.resume();
      } catch (e) {
        console.warn("Audio Context resume pending user interaction");
      }
  }

  let nextStartTime = 0;
  let session: any = null;

  const snapshotTool: FunctionDeclaration = {
      name: "takeSnapshot",
      description: "USA ESTA HERRAMIENTA CUANDO NECESITES VER.",
  };

  const saveMemoryTool: FunctionDeclaration = {
      name: "saveMemory",
      description: "Guarda datos importantes.",
      parameters: {
          type: Type.OBJECT,
          properties: { fact: { type: Type.STRING } },
          required: ["fact"]
      }
  };
  
  // SYSTEM PROMPT FIX: Explicitly instructing NOT to be silent
  const systemInstruction = `
  ERES FENRIR. OPERADOR TÁCTICO ESPAÑOL.
  
  REGLA DE ORO (AUDIO):
  - JAMÁS TE QUEDES CALLADO. 
  - Si estás procesando o mirando, DILO: "Déjame ver...", "Analizando...", "Un segundo...".
  - Si el usuario te enseña algo y ejecutas 'takeSnapshot', SIGUE HABLANDO mientras esperas la foto.
  
  VISIÓN:
  - La imagen que recibas reemplaza a la anterior. Describe lo que ves AHORA.
  
  MEMORIA:
  ${getMemory()}
  `;

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: () => console.log("Live Session Connected"),
      onmessage: async (message: LiveServerMessage) => {
        // Handle Audio
        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
           if (nextStartTime < outputAudioContext.currentTime) {
               nextStartTime = outputAudioContext.currentTime;
           }
           
           if (onAiSpeakingStateChange) onAiSpeakingStateChange(true);

           const audioBuffer = await decodeAudioData(
             base64ToUint8Array(base64Audio),
             outputAudioContext
           );
           onAudioData(audioBuffer); 
           
           const source = outputAudioContext.createBufferSource();
           source.buffer = audioBuffer;
           source.connect(outputAudioContext.destination);
           
           source.onended = () => {
               if (onAiSpeakingStateChange && outputAudioContext.currentTime >= nextStartTime - 0.1) {
                   onAiSpeakingStateChange(false);
               }
           };

           source.start(nextStartTime);
           nextStartTime += audioBuffer.duration;
        }

        // Handle Tool Calls
        if (message.toolCall) {
            console.log("AI requested tool execution:", message.toolCall);
            for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'takeSnapshot' && onToolCall) {
                    await onToolCall('takeSnapshot');
                    
                    const timeStamp = new Date().toLocaleTimeString();
                    sessionPromise.then((s) => {
                        s.sendToolResponse({
                            functionResponses: {
                                id: fc.id,
                                name: fc.name,
                                response: { result: `FOTOGRAMA ACTUALIZADO A LAS ${timeStamp}. NO TE QUEDES CALLADO. Di lo que ves ahora.` }
                            }
                        });
                    });
                } else if (fc.name === 'saveMemory') {
                    const { fact } = fc.args as any;
                    saveMemoryFact(fact);
                    sessionPromise.then((s) => {
                        s.sendToolResponse({
                            functionResponses: {
                                id: fc.id,
                                name: fc.name,
                                response: { result: "Dato guardado." }
                            }
                        });
                    });
                }
            }
        }
      },
      onclose: () => {
        onClose();
      },
      onerror: (err) => {
        if (onError) onError(err);
      },
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } 
      },
      systemInstruction: systemInstruction,
      tools: [{ functionDeclarations: [snapshotTool, saveMemoryTool] }]
    }
  });

  session = await sessionPromise;
  return { session, outputAudioContext };
};


const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
