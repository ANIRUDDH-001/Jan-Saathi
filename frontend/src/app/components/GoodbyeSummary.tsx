import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLang } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { VedAvatar } from './VedAvatar';

interface GoodbyeSummaryProps {
  visible: boolean;
  onClose: () => void;
}

export function GoodbyeSummary({ visible, onClose }: GoodbyeSummaryProps) {
  const { lang } = useLang();
  const { gapValue, schemes } = useApp();

  const handleSave = () => {
    localStorage.setItem('js_last_session', JSON.stringify({
      action: lang === 'hi' ? 'CSC jaana tha PM-KISAN ke liye' : 'Visit CSC for PM-KISAN',
      date: new Date().toISOString(),
    }));
    onClose();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl overflow-hidden"
          style={{
            height: '95vh',
            background: 'linear-gradient(180deg, #000080 0%, #00004d 100%)',
          }}
        >
          <div className="flex flex-col items-center px-6 py-8 h-full overflow-y-auto">
            {/* Ved Avatar */}
            <VedAvatar size={80} showPlatform />

            {/* Heading */}
            <h2
              className="text-white mt-4 mb-6"
              style={{ fontFamily: 'Lora, serif', fontSize: '20px' }}
            >
              {lang === 'hi' ? 'आज का सारांश' : "Today's Summary"}
            </h2>

            {/* Summary Cards */}
            <div className="w-full max-w-md space-y-4">
              {/* Card 1: What was found */}
              <div
                className="rounded-xl p-5"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <p className="text-white/70 mb-2" style={{ fontSize: '13px', fontFamily: 'Manrope, sans-serif' }}>
                  {lang === 'hi' ? 'क्या मिला आज' : 'What was found today'}
                </p>
                <p
                  className="text-[#138808]"
                  style={{ fontFamily: 'Lora, serif', fontSize: '28px', fontWeight: 700 }}
                >
                  ₹{gapValue.toLocaleString('en-IN')}
                </p>
                <p className="text-white/60 mt-1" style={{ fontSize: '12px' }}>
                  {schemes.length} {lang === 'hi' ? 'योजनाएं' : 'schemes'}
                  {schemes.slice(0, 3).map(s => ` • ${lang === 'hi' ? s.nameHi : s.name}`).join('')}
                </p>
              </div>

              {/* Card 2: Next action */}
              <div
                className="rounded-xl p-5"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <p className="text-white/70 mb-2" style={{ fontSize: '13px', fontFamily: 'Manrope, sans-serif' }}>
                  {lang === 'hi' ? 'आपको करना है' : 'Your next step'}
                </p>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FF9933] mt-1.5 shrink-0" />
                  <p className="text-white" style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}>
                    {lang === 'hi'
                      ? 'अपने नज़दीकी CSC केंद्र पर PM-KISAN के लिए जाएं'
                      : 'Visit your nearest CSC center for PM-KISAN registration'}
                  </p>
                </div>
              </div>

              {/* Card 3: Come back */}
              <div
                className="rounded-xl p-5"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <p className="text-white/70 mb-2" style={{ fontSize: '13px', fontFamily: 'Manrope, sans-serif' }}>
                  {lang === 'hi' ? 'वापिस आना' : 'Come back'}
                </p>
                <p
                  className="text-white/80 italic"
                  style={{ fontFamily: 'Lora, serif', fontSize: '15px' }}
                >
                  {lang === 'hi'
                    ? 'मैं आपका इंतेज़ार करूंगा'
                    : "I'll be waiting for you"}
                </p>
              </div>
            </div>

            {/* Close button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              className="mt-8 px-8 py-3.5 rounded-full"
              style={{
                background: 'linear-gradient(90deg, #FF9933, #e8882d)',
                color: 'white',
                fontWeight: 600,
                fontSize: '16px',
                fontFamily: 'Manrope, sans-serif',
              }}
            >
              {lang === 'hi' ? 'फिर मिलेंगे' : 'See you again'}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
