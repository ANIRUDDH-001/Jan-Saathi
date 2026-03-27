import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useLang } from '../context/LanguageContext';
import { VedAvatar } from '../components/VedAvatar';

export function VedEntry() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [showPill, setShowPill] = useState(false);
  const [vedState, setVedState] = useState<'idle' | 'speaking' | 'listening'>('idle');
  const [hasSession, setHasSession] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  useEffect(() => {
    // Check for returning user
    const savedSession = localStorage.getItem('js_last_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setHasSession(true);
        setLastAction(parsed.action || null);
      } catch {}
    }

    // Simulate greeting TTS
    setVedState('speaking');
    const pillTimer = setTimeout(() => setShowPill(true), 2500);
    const speakTimer = setTimeout(() => setVedState('idle'), 4000);

    return () => {
      clearTimeout(pillTimer);
      clearTimeout(speakTimer);
    };
  }, []);

  const handleEnterChat = () => {
    navigate('/chat');
  };

  const handleReturnAction = (completed: boolean) => {
    if (completed) {
      localStorage.removeItem('js_last_session');
      setHasSession(false);
    }
    navigate('/chat');
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#0A0A0A' }}
    >
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

      {/* Ved Avatar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <VedAvatar
          size={180}
          speaking={vedState === 'speaking'}
          listening={vedState === 'listening'}
          showLabel
          showPlatform
        />
      </motion.div>

      {/* Return user card */}
      <AnimatePresence>
        {hasSession && lastAction && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ delay: 1, type: 'spring', stiffness: 200, damping: 25 }}
            className="mt-6 rounded-2xl p-4 max-w-xs w-full"
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

      {/* Enter pill button */}
      <AnimatePresence>
        {showPill && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={handleEnterChat}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full"
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '14px',
              fontFamily: 'Manrope, sans-serif',
              height: 48,
            }}
          >
            {lang === 'hi' ? '📱 Screen dekhna chahte hain?' : '📱 Want to see the screen?'}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}