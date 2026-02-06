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

// --- Sub-Components ---

const EclipseVisual = ({ progress }: { progress: number }) => {
  const moonOffset = (0.5 - progress) * 125;
  const isTotality = progress > 0.4992 && progress < 0.5008;
  const isNear = progress > 0.38 && progress < 0.62;
  
  return (
    <div className="relative w-72 h-72 md:w-[460px] md:h-[460px] flex items-center justify-center pointer-events-none transition-transform duration-[1800ms] cubic-bezier(0.2, 0.8, 0.2, 1)">
      {/* Atmosphere / Corona */}
      <div 
        className="absolute w-full h-full rounded-full transition-all duration-[2500ms] cubic-bezier(0.2, 0.8, 0.2, 1)"
        style={{ 
          background: isNear ? 'radial-gradient(circle, #fff 0%, #FFD700 25%, transparent 65%)' : 'transparent',
          filter: `blur(${isTotality ? '90px' : '25px'})`,
          opacity: isNear ? (isTotality ? 1 : 0.3) : 0,
          transform: `scale(${isTotality ? 2.8 : 0.85})`
        }}
      />
      
      {/* The Sun Core */}
      <div className={`absolute w-44 h-44 md:w-60 md:h-60 rounded-full bg-white transition-all duration-[2200ms] cubic-bezier(0.2, 0.8, 0.2, 1) ${isTotality ? 'totality-glow shadow-[0_0_100px_#fff]' : 'shadow-[0_0_40px_rgba(255,255,255,0.2)]'}`} />
      
      {/* The Moon Shadow */}
      <div 
        className="absolute w-44 h-44 md:w-60 md:h-60 rounded-full bg-black border border-white/5 transition-transform duration-[600ms] cubic-bezier(0.2, 0.8, 0.2, 1)" 
        style={{ transform: `translateX(${moonOffset}%)` }} 
      />
    </div>
  );
};

// --- Main Application ---

const App = () => {
  const [story, setStory] = useState(DEFAULT_STORY);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);
  const lastTimeRef = useRef<number>(performance.now());
  
  const stars = useMemo(() => Array.from({ length: 140 }).map(() => ({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 1.5 + 0.4}px`,
    delay: `${Math.random() * 10}s`,
    duration: `${7 + Math.random() * 8}s`
  })), []);

  const currentIdx = Math.min(Math.floor(progress * PHASES.length), PHASES.length - 1);
  const currentPhase = PHASES[currentIdx];
  const activeData = story[currentPhase] || DEFAULT_STORY[currentPhase];

  // Logic: Smooth Progression with "Time Dilation" near Totality
  useEffect(() => {
    let frame: number;
    const loop = (t: number) => {
      const dt = t - lastTimeRef.current;
      lastTimeRef.current = t;

      if (playing) {
        const proximity = Math.abs(0.5 - progress);
        // Precise celestial speed adjustment
        const speedMultiplier = proximity < 0.01 ? 0.15 : (proximity < 0.12 ? 0.45 : 1.0);
        const baseSpeed = 0.000032; 
        
        setProgress(p => (p + dt * baseSpeed * speedMultiplier) % 1);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [playing, progress]);

  // AI Narrative Fetch
  useEffect(() => {
    const fetchPoetry = async () => {
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
          contents: "Create a luxurious, poetic solar eclipse journey for Ibiza in 6 phases.",
          config: {
            systemInstruction: "You are a creative director for a high-end celestial experience. Provide minimalist, evocative text for each phase. Output valid JSON only.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                before: schema,
                first_contact: schema,
                during_peak: schema,
                totality: schema,
                return_of_light: schema,
                afterglow: schema
              },
              required: PHASES as any
            }
          }
        });

        if (response.text) {
          setStory(JSON.parse(response.text));
        }
      } catch (e) {
        console.warn("Using poetic defaults.");
      }
    };
    fetchPoetry();
  }, []);

  return (
    <div className="h-screen w-full flex flex-col justify-between overflow-hidden relative bg-black select-none font-light text-white tracking-widest">
      
      {/* Celestial Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        {stars.map((s, i) => (
          <div 
            key={i} 
            className="star animate-pulse" 
            style={{ 
              top: s.top, 
              left: s.left, 
              width: s.size, 
              height: s.size, 
              animationDelay: s.delay,
              animationDuration: s.duration
            }} 
          />
        ))}
      </div>

      {/* Header - Logo removed from left, button remains on right */}
      <header className="p-10 md:p-20 flex justify-end items-start z-10">
        <button 
          onClick={() => setPlaying(!playing)} 
          className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-white/5 bg-white/[0.03] backdrop-blur-2xl flex items-center justify-center hover:bg-white/[0.1] transition-all duration-1000 active:scale-95 group shadow-2xl"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <div className="flex gap-2">
              <div className="w-1 h-5 md:h-6 bg-white/40 group-hover:bg-white transition-all duration-500" />
              <div className="w-1 h-5 md:h-6 bg-white/40 group-hover:bg-white transition-all duration-500" />
            </div>
          ) : (
            <div className="ml-1.5 w-0 h-0 border-y-[10px] md:border-y-[12px] border-y-transparent border-l-[20px] md:border-l-[24px] border-l-white/40 group-hover:border-l-white transition-all duration-500" />
          )}
        </button>
      </header>

      {/* Experience Display */}
      <main className="flex-1 flex flex-col items-center justify-center z-10 px-10 text-center -mt-10">
        <div className="mb-10 transform scale-90 md:scale-100">
          <EclipseVisual progress={progress} />
        </div>
        
        <div key={currentPhase} className="min-h-[300px] flex flex-col items-center max-w-5xl mx-auto animate-content">
          <h2 className="serif text-3xl md:text-5xl lg:text-7xl mb-12 leading-[1.2] tracking-wide font-light text-white/95">
            {activeData?.sentence}
          </h2>
          
          <div className="flex flex-wrap justify-center gap-4 mb-14">
            {(activeData?.feeling || "").split(',').filter(Boolean).map((f: string, i: number) => (
              <span key={i} className="text-[10px] uppercase tracking-[.5em] text-yellow-500/90 px-6 py-2.5 border border-yellow-500/10 rounded-full bg-white/[0.02] backdrop-blur-md">
                {f.trim()}
              </span>
            ))}
          </div>
          
          <p className="text-white/20 italic text-lg md:text-2xl max-w-xl border-t border-white/5 pt-12 font-light leading-relaxed">
            {activeData?.reflection}
          </p>
        </div>
      </main>

      {/* Control Navigation */}
      <footer className="p-10 md:p-24 z-10 w-full max-w-7xl mx-auto">
        <div className="flex justify-between mb-12 overflow-x-auto no-scrollbar gap-10 px-4">
          {PHASES.map((k, i) => (
            <button 
              key={k} 
              onClick={() => {setProgress(i / (PHASES.length - 1)); setPlaying(false);}} 
              className={`text-[10px] uppercase tracking-[.4em] transition-all duration-[800ms] whitespace-nowrap ${i === currentIdx ? 'text-white font-bold scale-110' : 'text-white/10 hover:text-white/40'}`}
            >
              {PHASE_LABELS[k]}
            </button>
          ))}
        </div>
        
        <div className="relative h-[1px] w-full bg-white/[0.1] group cursor-pointer transition-all duration-700 hover:bg-white/[0.15]">
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.000001" 
            value={progress} 
            onInput={e => {setProgress(parseFloat(e.currentTarget.value)); setPlaying(false);}} 
            className="absolute -top-10 left-0 w-full h-20 opacity-0 z-20 cursor-pointer" 
          />
          <div 
            className="absolute h-full bg-yellow-500 transition-all duration-[1200ms] cubic-bezier(0.2, 0.8, 0.2, 1) shadow-[0_0_30px_rgba(245,158,11,0.5)]" 
            style={{ width: `${progress * 100}%` }} 
          />
          <div 
            className="absolute w-6 h-6 bg-white rounded-full top-1/2 -translate-y-1/2 -translate-x-1/2 shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-700 group-hover:scale-125 group-hover:bg-yellow-500" 
            style={{ left: `${progress * 100}%` }} 
          />
        </div>
      </footer>
    </div>
  );
};

// --- Mount ---
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
}