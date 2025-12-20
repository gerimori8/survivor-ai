
export enum AppModule {
  LOCATION = 'LOCATION', // Default
  SCANNER = 'SCANNER',
  LIVE = 'LIVE',
  COMMAND = 'COMMAND',
  INVENTORY = 'INVENTORY',
  MANUAL = 'MANUAL'
}

export enum NetworkQuality {
  MAXIMUM = 'MAXIMUM', 
  STRONG = 'STRONG',   
  MEDIUM = 'MEDIUM',   
  WEAK = 'WEAK',       
  LOST = 'LOST'        
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
}

export interface ObservationContext {
  // Generic questions valid for both Flora and Fauna
  visualFeature: string; // "Pelaje", "Escamas", "Hojas Serradas"...
  texture: string;       // "Rugoso", "Viscoso", "Liso"...
  environment: string;   // "Sombra", "Agua", "Roca"...
  distinctiveColor: string; // "Rojo brillante", "Moteado"...
  
  // Legacy fields for compatibility
  smell?: string;    
  sap?: string;      
  structure?: string;
  state?: string;    
}

export interface ScannerResult {
  id: string;
  timestamp: number;
  name: string;
  emoji: string; // [ICONO]
  hazardStatus: 'SAFE' | 'CAUTION' | 'DANGEROUS' | 'DEADLY'; // [INDICADOR VISUAL]
  toxicityLevel: number; // 1-5 (Internal logic)
  toxicityDescription: string; // ☠️ TOXICIDAD
  energyInfo?: string; // Descripción texto
  energyKcal?: number; // 📊 DATO NUMÉRICO NUEVO
  isEdible: boolean;
  preparationProtocol: string; // 🍳 CÓMO PREPARARLO SEGURO (Using inventory OR primitive crafting)
  medicinalUtility?: string; // ⚕️ USO MEDICINAL
  criticalFact?: string; // 💡 DATO IMPORTANTE
  notes?: string;
  confidenceScore?: number; // 0-100
  thumbnail?: string; 
}

export interface WeatherForecast {
  day: string;
  temp: string;
  condition: string;
}

export interface WeatherData {
  temperature: string;
  condition: string;
  wind: string;
  precipitation: string;
  survivalTip: string;
  forecast: WeatherForecast[]; // PREVISIÓN 3 DÍAS
}

export interface MapResource {
  name: string;
  type: 'HOSPITAL' | 'WATER' | 'POLICE' | 'CITY';
  address: string;
  distance?: string;
  uri?: string;
}

export interface LocationIntel {
  weather: WeatherData;
  resources: MapResource[];
  locationName: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface NetworkInformation extends EventTarget {
  readonly downlink: number;
  readonly effectiveType: string;
  readonly rtt: number;
  readonly saveData: boolean;
  onchange: EventListener;
}

export interface BatteryManager extends EventTarget {
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    level: number;
    onchargingchange: EventListener | null;
    onchargingtimechange: EventListener | null;
    ondischargingtimechange: EventListener | null;
    onlevelchange: EventListener | null;
}
