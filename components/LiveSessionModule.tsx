
import React, { useEffect, useRef, useState } from 'react';
import { connectLiveSession } from '../services/geminiService';
import { createPcmBlob, getAudioWorkletUrl } from '../utils/audioUtils';

interface Props {
    isLowBattery: boolean;
}

export const LiveSessionModule: React.FC<Props> = ({ isLowBattery }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState("EN ESPERA");
  
  // UI States
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  
  const sessionRef = useRef<any>(null); 
  const isSpeakingRef = useRef(false);
  const silenceCounterRef = useRef(0);
  
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  // SNAPSHOT: NATIVE RESOLUTION & NO COMPRESSION
  const captureAndSendSnapshot = async (label: string) => {
    if (canvasRef.current && videoRef.current && sessionRef.current) {
         const ctx = canvasRef.current.getContext('2d');
         if (ctx) {
             // Ensure we grab the exact resolution of the video stream
             const width = videoRef.current.videoWidth;
             const height = videoRef.current.videoHeight;
             
             // Check if video is actually ready
             if (width === 0 || height === 0) return;

             canvasRef.current.width = width;
             canvasRef.current.height = height;
             
             ctx.drawImage(videoRef.current, 0, 0, width, height);
             
             // QUALITY 1.0 = NO COMPRESSION (NATIVE)
             const base64 = canvasRef.current.toDataURL('image/jpeg', 1.0).split(',')[1];
             
             console.log(`[SNAPSHOT] Native Send: ${width}x${height} - ${label}`);
             
             // Send as RealtimeInput
             await sessionRef.current.sendRealtimeInput({
                media: { mimeType: 'image/jpeg', data: base64 }
             });
         }
     }
  };

  const startSession = async () => {
    setStatus(`CONECTANDO...`);
    
    // SETUP AUDIO CONTEXTS IMMEDIATELY ON CLICK
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const inputAudioContext = new AudioContextClass({ sampleRate: 16000 });
    const outputAudioContextPlaceholder = new AudioContextClass({ sampleRate: 24000 });
    
    // CRITICAL FIX: Resume immediately on user gesture
    await inputAudioContext.resume();
    await outputAudioContextPlaceholder.resume();
    // We close placeholder, actual output context comes from service, but this wakes up the audio engine
    outputAudioContextPlaceholder.close();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
              facingMode: "environment",
              width: { ideal: 4096 }, // Try for max resolution available
              height: { ideal: 2160 } 
          }, 
          audio: {
              channelCount: 1,
              sampleRate: 16000,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
          }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.log("Video play error:", e));
      }

      inputAudioContextRef.current = inputAudioContext;
      
      const realSampleRate = inputAudioContext.sampleRate;
      const workletUrl = getAudioWorkletUrl();
      await inputAudioContext.audioWorklet.addModule(workletUrl);
      
      const source = inputAudioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(inputAudioContext, 'pcm-processor');
      workletNodeRef.current = workletNode;

      const { session, outputAudioContext } = await connectLiveSession(
         () => { }, // audio playback handled in service
         () => stopSession(),
         (err) => setStatus(`ERROR: ${err.message || 'CONEXIÓN'}`),
         async (toolName) => {
             if (toolName === 'takeSnapshot') {
                 setStatus("ENVIANDO VÍDEO...");
                 // Small delay to ensure the video frame represents the POST-utterance reality
                 setTimeout(async () => {
                     await captureAndSendSnapshot("AI_REQUEST");
                     setStatus("ENLACE ACTIVO");
                 }, 150); 
             }
         },
         (isSpeaking) => {
             setAiSpeaking(isSpeaking);
         }
      );
      
      sessionRef.current = session;
      outputAudioContextRef.current = outputAudioContext;
      
      // Resume the REAL output context from service
      if (outputAudioContext.state === 'suspended') {
          await outputAudioContext.resume();
      }

      setActive(true);
      setStatus(`ENLACE ACTIVO`);

      const SEND_BUFFER_SIZE = 512;
      let audioBuffer: Float32Array[] = [];
      let currentBufferLength = 0;
      
      const SPEECH_THRESHOLD = 0.02; // Slightly more sensitive
      const SILENCE_TIMEOUT_CHUNKS = 25; 

      workletNode.port.onmessage = (event) => {
          const inputData = event.data as Float32Array;
          
          // Simple RMS for UI indicator
          let sum = 0;
          for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
          const rms = Math.sqrt(sum / inputData.length);
          
          if (rms > SPEECH_THRESHOLD) {
              if (!isSpeakingRef.current) {
                  isSpeakingRef.current = true;
                  setUserSpeaking(true);
              }
              silenceCounterRef.current = 0;
          } else {
              if (isSpeakingRef.current) {
                  silenceCounterRef.current++;
                  if (silenceCounterRef.current > SILENCE_TIMEOUT_CHUNKS) {
                      isSpeakingRef.current = false;
                      setUserSpeaking(false);
                  }
              }
          }

          audioBuffer.push(inputData);
          currentBufferLength += inputData.length;

          if (currentBufferLength >= SEND_BUFFER_SIZE) {
              const fullBuffer = new Float32Array(currentBufferLength);
              let offset = 0;
              for (const chunk of audioBuffer) {
                  for (let i = 0; i < chunk.length; i++) fullBuffer[offset + i] = chunk[i];
                  offset += chunk.length;
              }
              
              if (sessionRef.current) {
                  const blob = createPcmBlob(fullBuffer, realSampleRate);
                  sessionRef.current.sendRealtimeInput({ media: blob });
              }
              audioBuffer = [];
              currentBufferLength = 0;
          }
      };

      source.connect(workletNode);

    } catch (e: any) {
      console.error(e);
      setStatus(`FALLO: ${e.message}`);
    }
  };

  const stopSession = () => {
     if (sessionRef.current) sessionRef.current = null;
     
     if (workletNodeRef.current) {
         workletNodeRef.current.disconnect();
         workletNodeRef.current = null;
     }
     if (inputAudioContextRef.current) {
         inputAudioContextRef.current.close();
         inputAudioContextRef.current = null;
     }
     if (outputAudioContextRef.current) {
         outputAudioContextRef.current.close();
         outputAudioContextRef.current = null;
     }
     if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(track => track.stop());
         videoRef.current.srcObject = null;
     }

     setActive(false);
     setAiSpeaking(false);
     setUserSpeaking(false);
     isSpeakingRef.current = false;
     setStatus("DESCONECTADO");
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="h-full flex flex-col relative bg-black overflow-hidden font-sans">
       {/* FULL SCREEN VIDEO */}
       <video 
            ref={videoRef} 
            className="absolute inset-0 w-full h-full object-cover z-0" 
            muted 
            playsInline 
       />
       <canvas ref={canvasRef} className="hidden" />

       {/* MINIMALIST UI OVERLAY */}
       <div className="absolute inset-0 z-10 pointer-events-none p-4 flex flex-col justify-between">
          
          {/* TOP HEADER: STATUS & INDICATORS */}
          <div className="flex justify-between items-start pt-2">
             
             {/* LEFT: STATUS */}
             <div className="bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10 flex items-center gap-2">
                 <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-red-500'}`}></div>
                 <span className="text-[9px] font-mono tracking-widest text-white/80 font-bold">{status}</span>
             </div>

             {/* RIGHT: AI ACTIVITY */}
             {active && (
                 <div className={`transition-all duration-300 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md ${aiSpeaking ? 'opacity-100 border border-om-gold/50' : 'opacity-40 border border-transparent'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${aiSpeaking ? 'bg-om-gold animate-pulse' : 'bg-gray-500'}`}></div>
                    <span className={`text-[9px] font-bold tracking-widest ${aiSpeaking ? 'text-om-gold' : 'text-gray-400'}`}>FENRIR</span>
                 </div>
             )}
          </div>

          {/* BOTTOM CONTROLS (CORNERS) */}
          <div className="flex justify-between items-end w-full pb-2">
              
              {/* LEFT CORNER: USER ACTIVITY */}
               <div className="pointer-events-none">
                 {active && (
                     <div className={`transition-all duration-300 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md ${userSpeaking ? 'opacity-100 border border-green-500/50' : 'opacity-0'}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[9px] font-bold text-green-400 tracking-widest">TRANSMITIENDO</span>
                     </div>
                 )}
               </div>

              {/* RIGHT CORNER: ACTION BUTTON */}
              <div className="pointer-events-auto">
                  {!active ? (
                      <button 
                        onClick={startSession} 
                        className="w-16 h-16 rounded-full bg-om-gold text-om-navy shadow-2xl flex items-center justify-center hover:scale-105 transition-transform active:scale-95 border-2 border-white/20"
                      >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </button>
                  ) : (
                      <button 
                        onClick={stopSession} 
                        className="w-16 h-16 rounded-full bg-red-600 text-white shadow-2xl flex items-center justify-center hover:scale-105 transition-transform active:scale-95 border-2 border-red-400 animate-pulse"
                      >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                  )}
              </div>
          </div>
       </div>
    </div>
  );
};
