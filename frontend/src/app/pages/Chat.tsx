import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useLang } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { mockSchemes, botResponses } from '../utils/mockData';
import { Send, Volume2 } from 'lucide-react';
import { v4Fallback } from '../utils/uuid';
import { ProfileCard } from '../components/ProfileCard';
import { GapCard } from '../components/GapCard';
import { VoiceWaveform } from '../components/VoiceWaveform';
import { VoiceButton } from '../components/VoiceButton';
import { ChatProgressBar } from '../components/ChatProgressBar';
import { OccupationCards } from '../components/OccupationCards';
import { LanguageDetectionBanner } from '../components/LanguageDetectionBanner';
import { GoodbyeSummary } from '../components/GoodbyeSummary';
import { ShubhAvatarSmall } from '../components/ShubhAvatar';
import { motion, AnimatePresence } from 'motion/react';
import { sendChatMessage, transcribeAudio } from '../services/api';

async function playAudioB64(b64: string): Promise<void> {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const buffer = await ctx.decodeAudioData(bytes.buffer);
  const src = ctx.createBufferSource();
  src.buffer = buffer; src.connect(ctx.destination);
  return new Promise(resolve => { src.onended = () => resolve(); src.start(); });
}

export function Chat() {
  const { lang, t } = useLang();
  const { profile, mergeProfile, chatState, setChatState, messages, addMessage, setSchemes, setGapValue, gapValue, isLoggedIn, sessionId, currentLanguage, setLanguage, setVoicePlaying, updateLastInputTime, lastInputTime, setActiveScheme, schemes } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
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
  const mediaRef = useRef<MediaRecorder | null>(null);

  // Progress bar step
  const progressStep = chatState === 'intake' ? 0 : chatState === 'match' ? 1 : 2;
  const profileProgress = [profile.state, profile.occupation, profile.age].filter(Boolean).length;

  useEffect(() => {
    if (messages.length === 0) {
      addMessage({ id: v4Fallback(), role: 'bot', text: t('chat.first') });
    }
    const state = location.state as any;
    if (state?.initialMessage) {
      setTimeout(() => handleSend(state.initialMessage), 500);
      window.history.replaceState({}, '');
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  // Silence timer
  useEffect(() => {
    if (messages.length === 0) return;
    const THRESHOLD = 30000;
    const timer = setInterval(() => {
      const elapsed = Date.now() - lastInputTime;
      if (elapsed > 20000 && chatState !== 'goodbye') {
        setShowSilenceBar(true);
        setSilenceProgress(Math.min(1, (elapsed - 20000) / 10000));
      } else {
        setShowSilenceBar(false);
      }
      if (elapsed > THRESHOLD && chatState !== 'goodbye' && !silenceWarningFired) {
        setSilenceWarningFired(true);
        setShowGoodbye(true);
        handleSend('bas');  // Trigger goodbye
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [lastInputTime, chatState, messages.length, silenceWarningFired]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await processVoice(blob);
      };
      rec.start();
      mediaRef.current = rec;
      setVoiceState('listening');
      updateLastInputTime();
    } catch {
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
      const { transcript, language_short } = await transcribeAudio(
        blob, sessionId, (currentLanguage === 'hi' ? 'hi-IN' : currentLanguage + '-IN')
      );
      if (language_short !== currentLanguage) {
        setLanguage(language_short);
        setDetectedLang(language_short);
        setTimeout(() => setDetectedLang(null), 3000);
      }
      updateLastInputTime();
      await handleSend(transcript);
    } catch {
      setVoiceState('default');
    }
  };

  const handleSend = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setInput('');
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
      
      // Update app state from response
      setChatState(resp.state);
      mergeProfile(resp.profile);
      if (resp.schemes?.length) setSchemes(resp.schemes);
      if (resp.gap_value) setGapValue(resp.gap_value);

      addMessage({ id: v4Fallback(), role: 'bot', text: resp.reply, audioB64: resp.audio_b64 });

      // Show save prompt when moving to match state (approximate, since we don't have exact old/new state comparison here)
      if (resp.state === 'match' && chatState !== 'match') {
         setShowSavePrompt(!isLoggedIn);
      }

      // Show occupation cards after matching for farmer queries
      if (resp.state === 'intake' && (msg.toLowerCase().includes('farmer') || msg.toLowerCase().includes('किसान'))) {
        setTimeout(() => {
          setShowOccupationCards(true);
        }, 1000);
      }

      // Play TTS
      if (resp.audio_b64) {
        setVoicePlaying(true);
        await playAudioB64(resp.audio_b64);
        setVoicePlaying(false);
      }

      // Goodbye state — save session summary
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
  };

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

  // Render logic remains similar

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
               radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.8) 0%, transparent 70%)`
            ]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Progress Bar */}
        <ChatProgressBar activeStep={progressStep as 0 | 1 | 2} profileProgress={profileProgress} />

        {/* Language Detection Banner */}
        <LanguageDetectionBanner detectedLang={lang} visible={showLangBanner} />

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
                        title={lang === 'hi' ? 'सुनें' : 'Listen'}
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
                   navigate('/form-fill');
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
                {lang === 'hi' ? `${Math.floor(10 * (1 - silenceProgress))} सेकेंड में सारांश देंगे...` : `Summary in ${Math.floor(10 * (1 - silenceProgress))}s...`}
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

          {/* Voice Waveform */}
          <AnimatePresence>
            {voiceState === 'listening' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 flex flex-col items-center gap-2"
              >
                <VoiceWaveform />
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
                schemeCount={mockSchemes.length}
                onViewSchemes={() => navigate('/schemes')}
              />
            )}
          </div>
        </div>
      </div>

      {/* Goodbye Summary */}
      <GoodbyeSummary visible={showGoodbye} onClose={() => { setShowGoodbye(false); navigate('/'); }} />
    </div>
  );
}