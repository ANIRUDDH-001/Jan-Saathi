import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { languageInfo, type Lang } from '../context/LanguageContext';

interface LanguageDetectionBannerProps {
  detectedLang: Lang;
  visible: boolean;
}

export function LanguageDetectionBanner({ detectedLang, visible }: LanguageDetectionBannerProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const info = languageInfo[detectedLang];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -36, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -36, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="flex items-center justify-center gap-2 mx-2 rounded-lg"
          style={{
            height: 36,
            backgroundColor: 'rgba(0,0,128,0.9)',
            color: 'white',
            fontSize: '12px',
            fontFamily: 'Manrope, sans-serif',
          }}
        >
          <span>🇮🇳</span>
          <span>{info.name} detected — वेद अब {info.nativeName} में बोलेगा</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
