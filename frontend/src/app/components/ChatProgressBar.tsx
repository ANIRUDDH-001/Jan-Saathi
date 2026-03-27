import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

interface ChatProgressBarProps {
  activeStep: 0 | 1 | 2;
  profileProgress?: number; // 0-3 sub-fills for step 0
}

export function ChatProgressBar({ activeStep, profileProgress = 0 }: ChatProgressBarProps) {
  const { lang } = useLang();

  const steps = [
    { label: lang === 'hi' ? 'प्रोफाइल' : 'Profile', labelEn: 'Profile' },
    { label: lang === 'hi' ? 'योजनाएं' : 'Schemes', labelEn: 'Schemes' },
    { label: lang === 'hi' ? 'फॉर्म तैयार' : 'Form Ready', labelEn: 'Form Ready' },
  ];

  return (
    <div
      className="sticky top-0 z-20 mx-2 mt-2 rounded-full flex items-center px-2 overflow-hidden"
      style={{
        height: 44,
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {steps.map((step, i) => {
        const isActive = i <= activeStep;
        const isCurrent = i === activeStep;
        const justCompleted = i < activeStep;

        return (
          <React.Fragment key={i}>
            <motion.div
              className="flex-1 flex items-center justify-center rounded-full relative overflow-hidden"
              style={{
                height: 36,
                background: isActive
                  ? `linear-gradient(90deg, #FF9933 0%, #138808 100%)`
                  : 'rgba(255,255,255,0.15)',
              }}
              animate={justCompleted ? { opacity: 1 } : {}}
            >
              {/* Shimmer sweep on completion */}
              {justCompleted && (
                <motion.div
                  className="absolute inset-0"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                    width: '50%',
                  }}
                />
              )}

              {/* Partial fill for profile step */}
              {i === 0 && activeStep === 0 && profileProgress > 0 && (
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(profileProgress / 3) * 100}%` }}
                  style={{
                    background: 'linear-gradient(90deg, #FF9933 0%, #138808 100%)',
                    opacity: 0.6,
                  }}
                />
              )}

              <span
                className="relative z-10"
                style={{
                  fontSize: '13px',
                  fontWeight: isCurrent ? 700 : 500,
                  fontFamily: 'Manrope, sans-serif',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                }}
              >
                {step.label}
              </span>
            </motion.div>

            {i < steps.length - 1 && (
              <ChevronRight
                className="w-4 h-4 mx-1 shrink-0"
                style={{ color: 'rgba(0,0,0,0.2)' }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
