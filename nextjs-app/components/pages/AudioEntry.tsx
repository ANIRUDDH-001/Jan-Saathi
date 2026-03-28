'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp } from 'lucide-react';
import { ShubhAvatar } from '@/components/ShubhAvatar';
import { VoiceWaveform } from '@/components/VoiceWaveform';
import { synthesizeSpeech, detectLocation } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { useLang } from '@/context/LanguageContext';

const GREETING_TEXT =
  "Namaste! Main Shubh hoon, Jan Saathi. Aapki madad karne ke liye hoon. Aap kisan hain, majdoor hain, ya kuch aur? Bataaiye — apni baat.";

export function AudioEntry() {
  const router = useRouter();
  const { sessionId, updateLastInputTime } = useApp();
  const { lang } = useLang();
  const [isTalking, setIsTalking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showScreenPrompt, setShowScreenPrompt] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let savedSessionHas = false;
    let savedSessionAction: string | null = null;

    const savedSession = localStorage.getItem('js_last_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        savedSessionHas = true;
        savedSessionAction = parsed.action || null;
        setHasSession(true);
        setLastAction(savedSessionAction);
      } catch {}
    }

    const init = async () => {
      // Pre-fill detected state
      try {
        const loc = await detectLocation();
        if (loc.detected && loc.state) {
          localStorage.setItem('js_detected_state', loc.state);
        }
      } catch {}

      // TTS greeting
      const greetText =
        savedSessionHas && savedSessionAction
          ? `Namaste! Pichli baar aapko ${savedSessionAction} karna tha. Kya ho gaya?`
          : GREETING_TEXT;

      try {
        setIsTalking(true);
        const audio_b64 = await synthesizeSpeech(greetText, 'hi');
        if (audio_b64) {
          await playAudioB64(audio_b64);
        }
      } catch {}

      setIsTalking(false);
      setShowScreenPrompt(true);

      // Auto-start listening after greeting
      setTimeout(() => startListening(), 300);
    };

    const t = setTimeout(init, 500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];

      rec.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        source.disconnect();
        audioCtx.close();
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        // Next.js doesn't support navigation state; store blob reference in sessionStorage
        if (typeof window !== 'undefined') {
          (window as any).__audioBlob = blob;
          sessionStorage.setItem('fromAudioEntry', 'true');
        }
        router.push('/chat');
      };

      rec.start();
      mediaRef.current = rec;
      setIsListening(true);
      updateLastInputTime();
    } catch {
      // No mic permission — navigate to chat in text mode
      router.push('/chat');
    }
  };

  const stopAndNavigate = () => {
    if (mediaRef.current?.state === 'recording') {
      mediaRef.current.stop();
    } else {
      router.push('/chat');
    }
  };

  const showFullUI = () => {
    if (mediaRef.current?.state === 'recording') {
      mediaRef.current.stop();
    } else {
      router.push('/chat');
    }
  };

  const handleReturnAction = (completed: boolean) => {
    if (completed) {
      localStorage.removeItem('js_last_session');
      setHasSession(false);
    }
    stopAndNavigate();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#000020' }}
    >
      {!isOnline && (
        <div className="absolute top-0 inset-x-0 z-[200] bg-red-500 text-white text-center py-2 text-sm w-full font-medium shadow-md">
          Offline mode — Awaaz features unavailable. Text mode use karein.
        </div>
      )}
      {/* Grain texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Shubh avatar */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'backOut' }}
        >
          <ShubhAvatar
            size={200}
            isTalking={isTalking}
            isListening={isListening && !isTalking}
            showLabel
            showPlatform
          />
        </motion.div>

        {/* Return user card */}
        <AnimatePresence>
          {hasSession && lastAction && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 1, type: 'spring', stiffness: 200, damping: 25 }}
              className="rounded-2xl p-4 max-w-xs w-full"
              style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <p style={{ fontSize: '11px', color: '#FF9933', fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>
                {lang === 'hi' ? 'पिछली बार:' : 'Last time:'}
              </p>
              <p style={{ fontSize: '14px', color: 'white', fontFamily: 'Manrope, sans-serif', marginTop: 4 }}>
                {lastAction}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleReturnAction(true)}
                  className="px-3 py-1.5 rounded-full text-white"
                  style={{ fontSize: '12px', fontWeight: 600, backgroundColor: '#138808' }}
                >
                  {lang === 'hi' ? 'हो गया ✓' : 'Done ✓'}
                </button>
                <button
                  onClick={() => handleReturnAction(false)}
                  className="px-3 py-1.5 rounded-full"
                  style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  {lang === 'hi' ? 'नहीं हुआ' : 'Not yet'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Greeting in progress indicator */}
        {isTalking && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-white/60 text-sm"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Shubh bol raha hai...
          </motion.p>
        )}

        {/* Voice waveform + controls while listening */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center gap-3"
            >
              <VoiceWaveform
                analyserNode={analyserRef.current}
                isActive={isListening}
                barCount={16}
              />
              <p
                className="text-white/70 text-sm animate-pulse"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Bol raha hoon...
              </p>
              <button
                onClick={stopAndNavigate}
                className="mt-2 px-6 py-2 rounded-full border border-white/30 text-white/70 text-sm
                          hover:border-[#FF9933] hover:text-[#FF9933] transition-all"
              >
                Baat khatam hua
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* "Screen dekhna chahte hain?" prompt at bottom */}
      <AnimatePresence>
        {showScreenPrompt && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={showFullUI}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2
                       text-white/60 hover:text-white/90 transition-all group"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            <ChevronUp className="w-5 h-5 animate-bounce group-hover:text-[#FF9933]" />
            <span className="text-sm">Screen dekhna chahte hain?</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper: play base64 audio, returns when playback ends
async function playAudioB64(b64: string): Promise<void> {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === 'suspended') await ctx.resume();
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Promise(resolve => {
    ctx.decodeAudioData(bytes.buffer).then(buffer => {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      src.onended = () => { ctx.close(); resolve(); };
      src.start();
    }).catch(() => { ctx.close(); resolve(); });
  });
}
