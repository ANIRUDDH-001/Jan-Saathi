'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { languageInfo, type Lang } from '@/context/LanguageContext';

interface LanguageDetectionBannerProps {
  detectedLang: Lang;
  visible: boolean;
  onClose: () => void;
}

export function LanguageDetectionBanner({ detectedLang, visible, onClose }: LanguageDetectionBannerProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

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
          <span>{info.name} detected — शुभ अब {info.nativeName} में बोलेगा</span>
          <button
            onClick={() => {
              setShow(false);
              onClose();
            }}
            className="ml-1 rounded px-1 leading-none hover:bg-white/10"
            aria-label="Close language banner"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
