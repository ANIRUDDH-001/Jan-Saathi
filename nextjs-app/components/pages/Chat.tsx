'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLang } from '@/context/LanguageContext';
import { useApp } from '@/context/AppContext';
import { Send, Volume2 } from 'lucide-react';
import { v4Fallback } from '@/utils/uuid';
import { ProfileCard } from '@/components/ProfileCard';
import { GapCard } from '@/components/GapCard';
import { VoiceWaveform } from '@/components/VoiceWaveform';
import { VoiceButton } from '@/components/VoiceButton';
import { ChatProgressBar } from '@/components/ChatProgressBar';
import { OccupationCards } from '@/components/OccupationCards';
import { LanguageDetectionBanner } from '@/components/LanguageDetectionBanner';
import { GoodbyeSummary } from '@/components/GoodbyeSummary';
import { ShubhAvatarSmall } from '@/components/ShubhAvatar';
import { motion, AnimatePresence } from 'motion/react';
import { sendChatMessage, transcribeAudio } from '@/lib/api';

// Maps short language codes to Sarvam BCP-47 codes
const LANG_TO_SARVAM: Record<string, string> = {
  hi: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN',
  gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN', mr: 'mr-IN',
  pa: 'pa-IN', od: 'or-IN', en: 'en-IN',
};

async function playAudioB64(
  b64: string,
  onStart?: () => void,
  onEnd?: () => void,
): Promise<void> {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  try {
    const buffer = await ctx.decodeAudioData(bytes.buffer);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);

    return new Promise(resolve => {
      src.onended = () => {
        ctx.close();
        onEnd?.();
        resolve();
      };
      onStart?.();
      src.start();
    });
  } catch (err) {
    console.error('Audio decode failed:', err);
    ctx.close();
    onEnd?.();
    // Non-fatal — swallow the error
  }
}

export function Chat() {
  const { lang, t } = useLang();
  const {
    profile, mergeProfile, chatState, setChatState, messages, addMessage,
    setSchemes, setGapValue, gapValue, isLoggedIn, sessionId,
    currentLanguage, setLanguage, setVoicePlaying, updateLastInputTime,
    lastInputTime, setActiveScheme, schemes,
  } = useApp();
  const router = useRouter();
  // Next.js uses sessionStorage instead of react-router location.state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [voiceState, setVoiceState] = useState<'default' | 'listening' | 'processing'>('default');
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOccupationCards, setShowOccupationCards] = useState(false);
  const [showLangBanner, setShowLangBanner] = useState(false);
  const [showGoodbye, setShowGoodbye] = useState(false);
  const [silenceProgress, setSilenceProgress] = useState(0);
  const [showSilenceBar, setShowSilenceBar] = useState(false);
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [silenceWarningFired, setSilenceWarningFired] = useState(false);
  const [userHasSpoken, setUserHasSpoken] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);

  // Audio graph refs for real waveform visualisation
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Ref always pointing to latest handleSend — fixes stale-closure in run-once useEffect (F7)
  const handleSendRef = useRef<((text?: string) => Promise<void>) | null>(null);
  // Ref to processVoice — allows run-once useEffect to call it without stale closure
  const processVoiceRef = useRef<((blob: Blob) => Promise<void>) | null>(null);

  // Progress bar step
  const progressStep = chatState === 'intake' ? 0 : chatState === 'match' ? 1 : 2;
  const profileProgress = [profile.state, profile.occupation, profile.age].filter(Boolean).length;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  // Silence timer
  useEffect(() => {
    if (!userHasSpoken) return;
    const THRESHOLD = 30000;
    const WARNING_START = 20000;

    const timer = setInterval(() => {
      const elapsed = Date.now() - lastInputTime;
      if (elapsed > WARNING_START && chatState !== 'goodbye') {
        setShowSilenceBar(true);
        setSilenceProgress(Math.min(1, (elapsed - WARNING_START) / (THRESHOLD - WARNING_START)));
      } else {
        setShowSilenceBar(false);
        setSilenceProgress(0);
      }
      if (elapsed > THRESHOLD && chatState !== 'goodbye' && !silenceWarningFired) {
        setSilenceWarningFired(true);
        setShowGoodbye(true);
        handleSendRef.current?.('bas');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [userHasSpoken, lastInputTime, chatState, silenceWarningFired]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      // Set up AudioContext + AnalyserNode for real waveform data
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      sourceRef.current = source;

      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];

      rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      rec.onstop = async () => {
        // Tear down audio graph
        source.disconnect();
        audioCtx.close();
        audioContextRef.current = null;
        analyserRef.current = null;
        sourceRef.current = null;

        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await processVoice(blob);
      };

      rec.start(100); // Collect data every 100 ms
      mediaRef.current = rec;
      setVoiceState('listening');
      updateLastInputTime();
    } catch (err) {
      console.error('Recording failed:', err);
      setVoiceState('default');
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setVoiceState('processing');
  };

  const handleVoice = () => {
    if (voiceState === 'listening') { stopRecording(); return; }
    startRecording();
  };

  const processVoice = async (blob: Blob) => {
    try {
      const langHint = LANG_TO_SARVAM[currentLanguage] || 'hi-IN';
      const { transcript, language_short, error } = await transcribeAudio(blob, sessionId, langHint);

      if (error === 'audio_too_short' || !transcript?.trim()) {
        setVoiceState('default');
        return;
      }

      // Auto language switch when Saaras detects a different language
      if (language_short && language_short !== currentLanguage) {
        setLanguage(language_short);
        setDetectedLang(language_short);
        setTimeout(() => setDetectedLang(null), 4000);
      }

      updateLastInputTime();
      await handleSendRef.current?.(transcript);
    } catch (err) {
      console.error('Voice processing failed:', err);
      addMessage({
        id: v4Fallback(),
        role: 'bot',
        text: 'Awaaz sunne mein dikkat aayi. Phir try karein ya type karein.',
      });
      setVoiceState('default');
    }
  };

  const handleSend = useCallback(async (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setInput('');
    if (!userHasSpoken) setUserHasSpoken(true);
    addMessage({ id: v4Fallback(), role: 'user', text: msg });
    setTyping(true);
    updateLastInputTime();
    setSilenceWarningFired(false);

    // Show language detection banner on first user message
    if (messages.filter(m => m.role === 'user').length === 0) {
      setTimeout(() => setShowLangBanner(true), 500);
    }

    try {
      const resp = await sendChatMessage(msg, sessionId, currentLanguage);

      setChatState(resp.state);
      mergeProfile(resp.profile);
      if (resp.schemes?.length) setSchemes(resp.schemes);
      if (resp.gap_value) setGapValue(resp.gap_value);

      addMessage({ id: v4Fallback(), role: 'bot', text: resp.reply, audioB64: resp.audio_b64 });

      if (resp.state === 'match' && chatState !== 'match') {
        setShowSavePrompt(!isLoggedIn);
      }

      if (resp.state === 'intake' && (msg.toLowerCase().includes('farmer') || msg.toLowerCase().includes('किसान'))) {
        setTimeout(() => setShowOccupationCards(true), 1000);
      }

      // Play TTS — mouth opens on start, closes on end
      if (resp.audio_b64) {
        await playAudioB64(
          resp.audio_b64,
          () => setVoicePlaying(true),
          () => setVoicePlaying(false),
        );
      }

      if (resp.state === 'goodbye') {
        localStorage.setItem('js_last_session', JSON.stringify({
          action: resp.reply.slice(0, 80),
          timestamp: Date.now(),
        }));
      }
    } catch (err) {
      addMessage({ id: v4Fallback(), role: 'bot', text: 'Kuch gadbad ho gayi. Thodi der mein phir try karein.' });
    } finally {
      setTyping(false);
      setVoiceState('default');
    }
  }, [
    input, userHasSpoken, messages, sessionId, currentLanguage, chatState, isLoggedIn,
    addMessage, setChatState, mergeProfile, setSchemes, setGapValue, setVoicePlaying,
    updateLastInputTime,
  ]);

  // Keep ref in sync with the latest handleSend (fixes F7 stale closure)
  handleSendRef.current = handleSend;
  processVoiceRef.current = processVoice;

  // Seed the welcome message whenever the chat is empty (initial load + after session reset).
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({ id: v4Fallback(), role: 'bot', text: t('chat.first') });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // Run-once: handle navigation state (audio entry, initial message) via sessionStorage
  useEffect(() => {
    const fromAudioEntry = sessionStorage.getItem('fromAudioEntry');
    if (fromAudioEntry && (window as any).__audioBlob) {
      setVoiceState('processing');
      processVoiceRef.current?.((window as any).__audioBlob as Blob);
      sessionStorage.removeItem('fromAudioEntry');
      delete (window as any).__audioBlob;
    } else {
      const initialMessage = sessionStorage.getItem('initialMessage');
      if (initialMessage) {
        sessionStorage.removeItem('initialMessage');
        setTimeout(() => handleSendRef.current?.(initialMessage), 500);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOccupationSelect = (value: string) => {
    setShowOccupationCards(false);
    handleSend(value);
  };

  const profileFields = [
    { key: 'state', label: t('profile.state'), value: String(profile.state || '') },
    { key: 'occupation', label: t('profile.occupation'), value: String(profile.occupation || '') },
    { key: 'age', label: t('profile.age'), value: String(profile.age || '') },
    { key: 'income', label: t('profile.income'), value: String(profile.income || '') },
    { key: 'category', label: t('profile.category'), value: String(profile.category || '') },
    { key: 'bpl', label: t('profile.bpl'), value: String(profile.bpl || '') },
    { key: 'gender', label: t('profile.gender'), value: String(profile.gender || '') },
  ];

  return (
    <div className="max-w-7xl mx-auto flex h-[calc(100vh-5rem)] relative">
      {/* Aurora Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute inset-0 opacity-[0.12]"
          animate={{
            background: [
              `radial-gradient(circle at 20% 30%, rgba(255, 153, 51, 0.4) 0%, transparent 50%),
               radial-gradient(circle at 80% 60%, rgba(19, 136, 8, 0.4) 0%, transparent 50%),
               radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.8) 0%, transparent 70%)`,
              `radial-gradient(circle at 80% 40%, rgba(255, 153, 51, 0.4) 0%, transparent 50%),
               radial-gradient(circle at 20% 70%, rgba(19, 136, 8, 0.4) 0%, transparent 50%),
               radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.8) 0%, transparent 70%)`,
              `radial-gradient(circle at 20% 30%, rgba(255, 153, 51, 0.4) 0%, transparent 50%),
               radial-gradient(circle at 80% 60%, rgba(19, 136, 8, 0.4) 0%, transparent 50%),
               radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.8) 0%, transparent 70%)`,
            ],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Progress Bar */}
        <ChatProgressBar activeStep={progressStep as 0 | 1 | 2} profileProgress={profileProgress} />

        {/* Language Detection Banner */}
        <LanguageDetectionBanner
          detectedLang={lang}
          visible={showLangBanner}
          onClose={() => setShowLangBanner(false)}
        />

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3.5 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-[#FF9933] to-[#e8882d] text-white rounded-br-md shadow-lg'
                    : 'bg-white/80 backdrop-blur-sm border border-border rounded-bl-md shadow-md'
                }`}>
                  {msg.role === 'bot' && (
                    <div className="flex items-center gap-2 mb-2">
                      <ShubhAvatarSmall />
                      <button
                        className="text-muted-foreground hover:text-[#FF9933] transition-colors"
                        title={lang === 'hi' ? 'फिर सुनें' : 'Replay'}
                        onClick={async () => {
                          if (msg.audioB64) {
                            await playAudioB64(
                              msg.audioB64,
                              () => setVoicePlaying(true),
                              () => setVoicePlaying(false),
                            );
                          }
                        }}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>{msg.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Occupation Cards */}
          <OccupationCards visible={showOccupationCards} onSelect={handleOccupationSelect} />

          {typing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/80 backdrop-blur-sm border border-border rounded-2xl rounded-bl-md px-5 py-4 shadow-md flex items-center gap-3">
                <ShubhAvatarSmall processing={true} />
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF9933] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF9933] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF9933] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {showSavePrompt && chatState === 'match' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mx-4 mb-2 p-4 rounded-xl bg-gradient-to-r from-[#138808]/10 to-[#138808]/5 border border-[#138808]/30 backdrop-blur-sm flex items-center justify-between flex-wrap gap-3"
            >
              <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{t('save.prompt')}</p>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-[#138808] to-[#0f6d06] text-white shadow-md hover:shadow-lg transition-all"
                  style={{ fontSize: '0.85rem', fontWeight: 600 }}
                >
                  {t('save.google')}
                </button>
                <button
                  onClick={() => setShowSavePrompt(false)}
                  className="px-4 py-2 rounded-full border border-border bg-white hover:bg-muted transition-all"
                  style={{ fontSize: '0.85rem' }}
                >
                  {t('save.notnow')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Fill CTA */}
        <AnimatePresence>
          {chatState === 'guide' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mx-4 mb-2"
            >
              <button
                onClick={() => {
                  setActiveScheme(schemes[0]?.scheme_id || null);
                  router.push('/form-fill');
                }}
                className="w-full py-3 rounded-xl text-white flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(90deg, #FF9933, #e8882d)',
                  fontWeight: 600,
                  fontSize: '15px',
                  fontFamily: 'Manrope, sans-serif',
                }}
              >
                {lang === 'hi' ? 'Form भरें →' : 'Fill Form →'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 border-t border-border bg-white/80 backdrop-blur-sm relative">
          {/* Silence timer bar */}
          {showSilenceBar && (
            <div className="absolute -top-6 left-0 right-0 px-4">
              <p className="text-center text-muted-foreground mb-1" style={{ fontSize: '11px', fontFamily: 'Manrope, sans-serif' }}>
                {lang === 'hi'
                  ? `${Math.floor(10 * (1 - silenceProgress))} सेकेंड में सारांश देंगे...`
                  : `Summary in ${Math.floor(10 * (1 - silenceProgress))}s...`}
              </p>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#FF9933] rounded-full"
                  initial={{ width: '100%' }}
                  animate={{ width: `${(1 - silenceProgress) * 100}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </div>
            </div>
          )}

          {/* Voice Waveform — shows real AnalyserNode data when listening */}
          <AnimatePresence>
            {voiceState === 'listening' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 flex flex-col items-center gap-2"
              >
                <VoiceWaveform
                  analyserNode={analyserRef.current}
                  isActive={voiceState === 'listening'}
                  barCount={20}
                />
                <p className="text-[#FF9933]" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {t('voice.listening')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2">
            <VoiceButton onClick={handleVoice} state={voiceState} size="sm" />
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={t('chat.placeholder')}
              className="flex-1 px-5 py-3 rounded-full border border-border bg-white focus:border-[#FF9933] outline-none transition-all"
              style={{ fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif' }}
            />
            <button
              onClick={() => handleSend()}
              className="w-11 h-11 rounded-full bg-gradient-to-br from-[#138808] to-[#0f6d06] text-white flex items-center justify-center shrink-0 hover:scale-105 transition-all shadow-md hover:shadow-lg"
              aria-label={lang === 'hi' ? 'भेजें' : 'Send'}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed bottom-24 right-4 z-40 px-5 py-3 rounded-full bg-gradient-to-br from-[#000080] to-[#000060] text-white shadow-xl"
        style={{ fontSize: '0.85rem', fontWeight: 600 }}
      >
        {t('profile.header')}
      </button>

      <div className={`${sidebarOpen ? 'fixed inset-0 z-50 bg-black/40 md:relative md:bg-transparent' : 'hidden md:block'} md:w-80 lg:w-96`}>
        <div
          className={`${sidebarOpen ? 'absolute right-0 top-0 h-full w-80 lg:w-96' : ''} bg-gradient-to-b from-background to-white border-l border-border p-5 overflow-y-auto h-full`}
          style={{ backdropFilter: 'blur(10px)' }}
        >
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden mb-3 text-muted-foreground hover:text-foreground text-2xl"
            >
              ✕
            </button>
          )}

          <div className="space-y-5">
            <ProfileCard fields={profileFields} />

            {chatState === 'match' && (
              <GapCard
                gapValue={gapValue}
                schemeCount={schemes.length}
                schemes={schemes}
                onViewSchemes={() => router.push('/schemes')}
              />
            )}
          </div>
        </div>
      </div>

      {/* Goodbye Summary */}
      <GoodbyeSummary
        visible={showGoodbye}
        schemesFound={schemes.length}
        totalBenefit={gapValue}
        onClose={() => { setShowGoodbye(false); router.push('/'); }}
      />
    </div>
  );
}
