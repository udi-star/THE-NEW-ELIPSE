import React, { useState, useEffect, useMemo, useRef } from 'https://esm.sh/react@19.0.0';
import { createRoot } from 'https://esm.sh/react-dom@19.0.0/client';
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@1.40.0";

// --- Cosmic Constants ---
const PHASES = ['before', 'first_contact', 'during_peak', 'totality', 'return_of_light', 'afterglow'] as const;
type Phase = typeof PHASES[number];

const PHASE_LABELS: Record<Phase, string> = {
  before: 'Anticipation',
  first_contact: 'Transformation',
  during_peak: 'Silver Veil',
  totality: 'Totality',
  return_of_light: 'Renewal',
  afterglow: 'Resonance'
};

const DEFAULT_STORY: Record<Phase, { sentence: string, feeling: string, reflection: string }> = {
  before: { sentence: "Ibiza pulses with a warm, expectant glow.", feeling: "Quiet, Solar", reflection: "What intentions are you carrying into the shadow?" },
  first_contact: { sentence: "A cosmic bite begins the silent transformation.", feeling: "Shift, Breath", reflection: "Can you feel the air cooling on your skin?" },
  during_peak: { sentence: "Surreal silver light washes over the Mediterranean.", feeling: "Ethereal, Gold", reflection: "Who is sharing this half-lit world with you?" },
  totality: { sentence: "The universe holds its breath in a ring of fire.", feeling: "Infinite, Absolute", reflection: "When the sun vanishes, what truth remains?" },
  return_of_light: { sentence: "A diamond spark heralds the second dawn.", feeling: "Birth, Clarity", reflection: "What will you build with this restored light?" },
  afterglow: { sentence: "The shadow leaves a golden mark upon the soul.", feeling: "Presence, Awake", reflection: "How will you speak of this to the future?" }
};

// --- Ease Out Quint for high-end feel ---
const PREMIUM_EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';

const EclipseVisual = ({ progress }: { progress: number }) => {
  const moonOffset = (0.5 - progress) * 125;
  const isTotality = progress > 0.4994 && progress < 0.5006;
  const isNear = progress > 0.35 && progress < 0.65;
  
  // Calculate a "proximity" factor for smoother opacity transitions
  // 0 at edge of 'near', 1 at totality
  const proximityFactor = Math.max(0, 1 - (Math.abs(0.5 - progress) / 0.15));
  
  return (
    <div 
      className="relative w-32 h-32 md:w-56 md:h-56 flex items-center justify-center pointer-events-none transition-transform"
      style={{ transitionDuration: '2500ms', transitionTimingFunction: PREMIUM_EASE }}
    >
      {/* Atmosphere / Corona - Soft, ethereal, and layered */}
      <div 
        className={`absolute w-full h-full rounded-full transition-all ${isTotality ? 'corona-pulse' : ''}`}
        style={{ 
          background: isNear 
            ? 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,225,100,0.2) 40%, transparent 80%)' 
            : 'transparent',
          filter: `blur(${isTotality ? '45px' : '20px'})`,
          opacity: isNear ? (isTotality ? 0.85 : 0.2 * proximityFactor) : 0,
          transform: `scale(${isTotality ? 2.6 : 0.9})`,
          transitionDuration: isTotality ? '4000ms' : '2500ms',
          transitionTimingFunction: PREMIUM_EASE
        }}
      />

      {/* Inner Soft Glow - Adds depth to the corona */}
      <div 
        className="absolute w-full h-full rounded-full transition-all"
        style={{ 
          background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 60%)',
          opacity: isTotality ? 0.6 : 0,
          transform: `scale(${isTotality ? 1.8 : 0.5})`,
          transitionDuration: '5000ms',
          transitionTimingFunction: PREMIUM_EASE
        }}
      />
      
      {/* The Sun Core - Subtle glow */}
      <div 
        className={`absolute w-20 h-20 md:w-36 md:h-36 rounded-full bg-white transition-all ${isTotality ? 'totality-glow shadow-[0_0_40px_rgba(255,255,255,0.4)]' : 'shadow-[0_0_15px_rgba(255,255,255,0.1)]'}`} 
        style={{ transitionDuration: '3000ms', transitionTimingFunction: PREMIUM_EASE }}
      />
      
      {/* The Moon Shadow - Weighty, deliberate motion */}
      <div 
        className="absolute w-20 h-20 md:w-36 md:h-36 rounded-full bg-black border border-white/5 transition-transform" 
        style={{ 
          transform: `translateX(${moonOffset}%)`, 
          transitionDuration: '1400ms', 
          transitionTimingFunction: PREMIUM_EASE 
        }} 
      />
    </div>
  );
};

const App = () => {
  const [story, setStory] = useState(DEFAULT_STORY);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);
  const lastTimeRef = useRef<number>(performance.now());
  
  const stars = useMemo(() => Array.from({ length: 80 }).map(() => ({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 1.2 + 0.3}px`,
    delay: `${Math.random() * 5}s`,
    duration: `${6 + Math.random() * 8}s`
  })), []);

  const currentIdx = Math.min(Math.floor(progress * PHASES.length), PHASES.length - 1);
  const currentPhase = PHASES[currentIdx];
  const activeData = story[currentPhase] || DEFAULT_STORY[currentPhase];

  useEffect(() => {
    let frame: number;
    const loop = (t: number) => {
      const dt = t - lastTimeRef.current;
      lastTimeRef.current = t;

      if (playing) {
        const proximity = Math.abs(0.5 - progress);
        const speedMultiplier = proximity < 0.01 ? 0.12 : (proximity < 0.1 ? 0.4 : 1.0);
        const baseSpeed = 0.000032; 
        setProgress(p => (p + dt * baseSpeed * speedMultiplier) % 1);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [playing, progress]);

  useEffect(() => {
    const fetchNarrative = async () => {
      const apiKey = (window as any).process?.env?.API_KEY;
      if (!apiKey) return;
      try {
        const ai = new GoogleGenAI({ apiKey });
        const schema = {
          type: Type.OBJECT,
          properties: {
            sentence: { type: Type.STRING },
            feeling: { type: Type.STRING },
            reflection: { type: Type.STRING }
          },
          required: ["sentence", "feeling", "reflection"]
        };
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: "Poetic 6-phase solar journey JSON.",
          config: {
            systemInstruction: "Evocative minimalist text for solar widget.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                before: schema, first_contact: schema, during_peak: schema, totality: schema, return_of_light: schema, afterglow: schema
              },
              required: PHASES as any
            }
          }
        });
        if (response.text) setStory(JSON.parse(response.text));
      } catch (e) { console.warn("Poetic defaults enabled."); }
    };
    fetchNarrative();
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none font-light text-white tracking-widest flex flex-col justify-center">
      
      {/* Background Stars */}
      <div className="absolute inset-0 z-0 opacity-20">
        {stars.map((s, i) => (
          <div 
            key={i} 
            className="star animate-pulse" 
            style={{ 
              top: s.top, left: s.left, width: s.size, height: s.size, 
              animationDelay: s.delay, animationDuration: s.duration
            }} 
          />
        ))}
      </div>

      {/* Control Overlay */}
      <div className="absolute top-6 right-6 z-20">
        <button 
          onClick={() => setPlaying(!playing)} 
          className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10 bg-white/[0.05] backdrop-blur-xl flex items-center justify-center hover:bg-white/[0.15] transition-all duration-700"
        >
          {playing ? (
            <div className="flex gap-1">
              <div className="w-1 h-3 bg-white/60" />
              <div className="w-1 h-3 bg-white/60" />
            </div>
          ) : (
            <div className="ml-0.5 border-y-[6px] border-y-transparent border-l-[12px] border-l-white/60" />
          )}
        </button>
      </div>

      {/* Main Content Cluster */}
      <div className="relative z-10 px-6 md:px-12 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
        <div className="shrink-0 scale-90 md:scale-110 lg:scale-125">
          <EclipseVisual progress={progress} />
        </div>

        <div key={currentPhase} className="max-w-md md:text-left text-center animate-content">
          <h2 className="serif text-2xl md:text-3xl lg:text-5xl mb-4 md:mb-6 leading-tight font-light text-white/95">
            {activeData?.sentence}
          </h2>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-2.5 mb-6 md:mb-8">
            {(activeData?.feeling || "").split(',').map((f, i) => (
              <span key={i} className="text-[9px] uppercase tracking-[.3em] text-yellow-500/70 px-4 py-1.5 border border-yellow-500/10 rounded-full bg-white/[0.03] backdrop-blur-sm">
                {f.trim()}
              </span>
            ))}
          </div>
          
          <p className="text-white/30 italic text-sm md:text-base max-w-sm border-t border-white/5 pt-4 md:pt-6 font-light leading-relaxed">
            {activeData?.reflection}
          </p>
        </div>
      </div>

      {/* Compact Timeline Footer */}
      <div className="absolute bottom-8 left-8 right-8 z-20 max-w-4xl mx-auto w-[calc(100%-4rem)]">
        <div className="flex justify-between mb-4 overflow-x-auto no-scrollbar gap-6 px-1">
          {PHASES.map((k, i) => (
            <button 
              key={k} 
              onClick={() => {setProgress(i / (PHASES.length - 1)); setPlaying(false);}} 
              className={`text-[9px] uppercase tracking-[.25em] transition-all duration-[1200ms] ${i === currentIdx ? 'text-white font-bold opacity-100' : 'text-white/20 hover:text-white/50'}`}
              style={{ transitionTimingFunction: PREMIUM_EASE }}
            >
              {PHASE_LABELS[k]}
            </button>
          ))}
        </div>
        
        <div className="relative h-[1px] w-full bg-white/[0.1] group cursor-pointer transition-colors duration-[1000ms]">
          <input 
            type="range" min="0" max="1" step="0.000001" value={progress} 
            onInput={e => {setProgress(parseFloat(e.currentTarget.value)); setPlaying(false);}} 
            className="absolute -top-4 left-0 w-full h-10 opacity-0 z-20" 
          />
          <div 
            className="absolute h-full bg-yellow-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all" 
            style={{ width: `${progress * 100}%`, transitionDuration: '1500ms', transitionTimingFunction: PREMIUM_EASE }} 
          />
          <div 
            className="absolute w-3 h-3 bg-white/80 rounded-full top-1/2 -translate-y-1/2 -translate-x-1/2 shadow-lg transition-all" 
            style={{ left: `${progress * 100}%`, transitionDuration: '1500ms', transitionTimingFunction: PREMIUM_EASE }} 
          />
        </div>
      </div>
    </div>
  );
};

const root = document.getElementById('root');
if (root) createRoot(root).render(<App />);