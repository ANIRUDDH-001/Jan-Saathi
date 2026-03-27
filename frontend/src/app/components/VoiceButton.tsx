import React from 'react';
import { Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceButtonProps {
  state?: 'default' | 'listening' | 'processing';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function VoiceButton({ state = 'default', size = 'md', onClick }: VoiceButtonProps) {
  const sizeMap = {
    sm: { button: 'w-11 h-11', icon: 'w-5 h-5', ripple1: 'w-16 h-16', ripple2: 'w-24 h-24', ripple3: 'w-32 h-32' },
    md: { button: 'w-16 h-16', icon: 'w-7 h-7', ripple1: 'w-24 h-24', ripple2: 'w-36 h-36', ripple3: 'w-48 h-48' },
    lg: { button: 'w-24 h-24', icon: 'w-10 h-10', ripple1: 'w-36 h-36', ripple2: 'w-52 h-52', ripple3: 'w-64 h-64' },
  };

  const { button, icon, ripple1, ripple2, ripple3 } = sizeMap[size];

  return (
    <div className="relative inline-block">
      {/* Concentric Ripple Rings - Active when listening or processing */}
      <AnimatePresence>
        {(state === 'listening' || state === 'processing') && (
          <>
            {/* Ring 1 - Innermost */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [0.8, 1.2, 0.8],
                opacity: [0.6, 0.3, 0.6]
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`absolute inset-0 ${ripple1} -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full pointer-events-none`}
              style={{
                background: 'radial-gradient(circle, rgba(255, 153, 51, 0.3) 0%, transparent 70%)',
                border: '2px solid rgba(255, 153, 51, 0.4)'
              }}
            />

            {/* Ring 2 - Middle */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [0.8, 1.3, 0.8],
                opacity: [0.5, 0.2, 0.5]
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                duration: 2,
                delay: 0.3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`absolute inset-0 ${ripple2} -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full pointer-events-none`}
              style={{
                background: 'radial-gradient(circle, rgba(19, 136, 8, 0.2) 0%, transparent 70%)',
                border: '2px solid rgba(19, 136, 8, 0.3)'
              }}
            />

            {/* Ring 3 - Outermost */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [0.8, 1.4, 0.8],
                opacity: [0.4, 0.1, 0.4]
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                duration: 2,
                delay: 0.6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`absolute inset-0 ${ripple3} -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full pointer-events-none`}
              style={{
                background: 'radial-gradient(circle, rgba(255, 153, 51, 0.15) 0%, transparent 70%)',
                border: '1px solid rgba(255, 153, 51, 0.2)'
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.button
        onClick={onClick}
        className={`relative ${button} rounded-full flex items-center justify-center transition-all shadow-2xl`}
        style={{
          background: state === 'listening' 
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            : state === 'processing'
            ? 'linear-gradient(135deg, #FF9933 0%, #e8882d 100%)'
            : 'linear-gradient(135deg, #FF9933 0%, #e8882d 100%)',
          boxShadow: state !== 'default'
            ? '0 20px 60px rgba(255, 153, 51, 0.5)'
            : '0 10px 40px rgba(255, 153, 51, 0.3)'
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={state === 'processing' ? { rotate: 360 } : {}}
        transition={state === 'processing' ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
      >
        <Mic className={`${icon} text-white`} />
      </motion.button>

      {/* Pulse effect for listening state */}
      {state === 'listening' && (
        <motion.div
          className={`absolute inset-0 ${button} rounded-full pointer-events-none`}
          style={{
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)'
          }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.6, 0, 0.6]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      )}
    </div>
  );
}
