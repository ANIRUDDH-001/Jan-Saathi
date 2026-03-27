import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useLang } from '../context/LanguageContext';
import { Mic, Send, MessageCircle, Search, HandHelping, Sparkles, User, MapPin, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VoiceWaveform } from '../components/VoiceWaveform';
import { LiveBenefitTicker } from '../components/LiveBenefitTicker';
import { VoiceButton } from '../components/VoiceButton';
import { AnimatedButton } from '../components/AnimatedButton';
import { AnimatedCard } from '../components/AnimatedCard';
import { inputFocus, buttonPress } from '../utils/animations';

export function Landing() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [voiceState, setVoiceState] = useState<'default' | 'listening' | 'processing'>('default');
  const [ghostProfile, setGhostProfile] = useState<{ state?: string; occupation?: string; age?: string } | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (text?: string, profileData?: any) => {
    const msg = text || input;
    if (!msg.trim()) return;
    
    // "Data-Fly" transition - Animate ghost profile if profile data exists
    if (profileData) {
      setGhostProfile(profileData);
      setTimeout(() => {
        navigate('/chat', { state: { initialMessage: msg } });
      }, 1200); // Give time for the animation to complete
    } else {
      navigate('/chat', { state: { initialMessage: msg } });
    }
  };

  const handleVoice = () => {
    setVoiceState('listening');
    setTimeout(() => {
      setVoiceState('processing');
      setTimeout(() => {
        setVoiceState('default');
        navigate('/chat', { state: { initialMessage: t('example.1') } });
      }, 1200);
    }, 2000);
  };

  const examples = [
    { text: t('example.1'), profile: { state: 'Bihar', occupation: lang === 'hi' ? 'किसान' : 'Farmer', age: '35' } },
    { text: t('example.2'), profile: { state: 'Maharashtra', occupation: lang === 'hi' ? 'व्यापारी' : 'Business', age: '42' } },
    { text: t('example.3'), profile: { state: 'Karnataka', occupation: lang === 'hi' ? 'छात्र' : 'Student', age: '22' } }
  ];

  return (
    <div>
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: `
                radial-gradient(circle at 20% 30%, rgba(255, 153, 51, 0.4) 0%, transparent 50%),
                radial-gradient(circle at 80% 60%, rgba(19, 136, 8, 0.4) 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.8) 0%, transparent 70%)
              `
            }}
          />
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #FF9933 25%, transparent 25%),
                linear-gradient(-45deg, #FF9933 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #138808 75%),
                linear-gradient(-45deg, transparent 75%, #138808 75%)
              `,
              backgroundSize: '60px 60px',
              backgroundPosition: '0 0, 0 30px, 30px -30px, -30px 0px'
            }}
          />
        </div>

        <div className="max-w-5xl mx-auto px-4 py-20 text-center relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 
              className="text-[#000080] mb-4"
              style={{ 
                fontSize: 'clamp(2rem, 6vw, 3.5rem)', 
                fontWeight: 700, 
                lineHeight: 1.1,
                fontFamily: 'Lora, serif'
              }}
            >
              {t('hero.headline')}
            </h1>
            <p
              className="text-muted-foreground max-w-2xl mx-auto"
              style={{ fontSize: '1.15rem', lineHeight: 1.7 }}
            >
              {t('hero.subtext')}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-12 mt-12"
          >
            <VoiceButton state={voiceState} size="lg" onClick={handleVoice} />

            <div className="mt-6">
              {voiceState === 'listening' ? (
                <div className="space-y-2">
                  <VoiceWaveform />
                  <p className="text-[#FF9933]" style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: 'Manrope, sans-serif' }}>
                    {t('voice.listening')}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground" style={{ fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif' }}>
                  {voiceState === 'default' ? t('voice.tap') : t('voice.processing')}
                </p>
              )}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }} 
            className="max-w-2xl mx-auto mb-6"
          >
            <motion.div 
              className="flex rounded-2xl border-2 overflow-hidden shadow-lg bg-white/80 backdrop-blur-sm"
              animate={isFocused ? inputFocus : { borderColor: 'var(--border)' }}
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder={t('input.placeholder')}
                className="flex-1 px-6 py-4 bg-transparent outline-none"
                style={{ fontSize: '1rem' }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
              <motion.button
                whileTap={buttonPress}
                onClick={() => handleSubmit()}
                className="px-8 py-4 bg-gradient-to-r from-[#138808] to-[#0f6d06] text-white hover:from-[#0f6d06] hover:to-[#0a5004] transition-all flex items-center gap-2"
                style={{ fontWeight: 600, fontSize: '1rem' }}
              >
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">{t('input.submit')}</span>
              </motion.button>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.4 }} 
            className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto mb-8"
          >
            {examples.map((ex, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                onClick={() => handleSubmit(ex.text, ex.profile)}
                className="px-5 py-2.5 rounded-full border border-border bg-white/60 backdrop-blur-sm hover:bg-white hover:border-[#FF9933] text-muted-foreground hover:text-foreground transition-all shadow-sm hover:shadow-md"
                style={{ fontSize: '0.875rem', fontFamily: 'Manrope, sans-serif' }}
              >
                {ex.text}
              </motion.button>
            ))}
          </motion.div>

          {/* Ghost Profile Card */}
          <AnimatePresence>
            {ghostProfile && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="max-w-md mx-auto"
              >
                <div 
                  className="bg-white/40 backdrop-blur-md border-2 border-white/60 rounded-2xl p-5 shadow-2xl"
                  style={{ backdropFilter: 'blur(16px)' }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-[#FF9933]" />
                    <h3 
                      className="text-[#000080]" 
                      style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'Lora, serif' }}
                    >
                      {lang === 'hi' ? 'प्रोफाइल निकाली जा रही है...' : 'Extracting Profile...'}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {ghostProfile.state && (
                      <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-[#138808]/10 to-transparent border border-[#138808]/30"
                      >
                        <MapPin className="w-5 h-5 text-[#138808]" />
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: 'Manrope, sans-serif' }}>
                          {ghostProfile.state}
                        </span>
                      </motion.div>
                    )}

                    {ghostProfile.occupation && (
                      <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-[#FF9933]/10 to-transparent border border-[#FF9933]/30"
                      >
                        <Briefcase className="w-5 h-5 text-[#FF9933]" />
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: 'Manrope, sans-serif' }}>
                          {ghostProfile.occupation}
                        </span>
                      </motion.div>
                    )}

                    {ghostProfile.age && (
                      <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-[#000080]/10 to-transparent border border-[#000080]/30"
                      >
                        <User className="w-5 h-5 text-[#000080]" />
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: 'Manrope, sans-serif' }}>
                          {lang === 'hi' ? `${ghostProfile.age} साल` : `${ghostProfile.age} years`}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#000080] via-[#000060] to-[#000080] text-white py-6">
        <LiveBenefitTicker />
      </section>

      {/* Ved Entry CTA */}
      <section className="py-8 text-center">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/ved')}
          className="px-8 py-4 rounded-full text-white shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #0A0A0A 0%, #1a1a2e 100%)',
            fontWeight: 600,
            fontSize: '1rem',
            fontFamily: 'Manrope, sans-serif',
            border: '1px solid rgba(255,153,51,0.3)',
          }}
        >
          🎙️ {lang === 'hi' ? 'वेद से बात करें (Voice Mode)' : 'Talk to Ved (Voice Mode)'}
        </motion.button>
      </section>

      <section className="py-20 bg-gradient-to-b from-white to-background">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-[#000080] mb-16" 
            style={{ 
              fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', 
              fontWeight: 700,
              fontFamily: 'Lora, serif'
            }}
          >
            {t('how.heading')}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: <MessageCircle className="w-10 h-10" />, title: t('how.1.title'), body: t('how.1.body'), color: '#FF9933' },
              { icon: <Search className="w-10 h-10" />, title: t('how.2.title'), body: t('how.2.body'), color: '#000080' },
              { icon: <HandHelping className="w-10 h-10" />, title: t('how.3.title'), body: t('how.3.body'), color: '#138808' },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, type: 'spring', stiffness: 100 }}
                className="relative text-center p-8 rounded-2xl border border-border bg-white/60 backdrop-blur-sm hover:bg-white hover:shadow-lg transition-all"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg rotate-45"
                    style={{ backgroundColor: step.color }}
                  >
                    <div className="-rotate-45">
                      {step.icon}
                    </div>
                  </div>
                </div>
                
                <div 
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted text-foreground mb-4 mt-8" 
                  style={{ fontSize: '1rem', fontWeight: 700 }}
                >
                  {i + 1}
                </div>
                <h3 
                  style={{ fontWeight: 700, fontSize: '1.25rem', fontFamily: 'Lora, serif' }} 
                  className="mb-3 text-[#000080]"
                >
                  {step.title}
                </h3>
                <p 
                  className="text-muted-foreground leading-relaxed" 
                  style={{ fontSize: '0.95rem' }}
                >
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}