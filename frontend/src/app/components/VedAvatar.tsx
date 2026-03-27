import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface VedAvatarProps {
  size?: number;
  speaking?: boolean;
  listening?: boolean;
  processing?: boolean;
  showLabel?: boolean;
  showPlatform?: boolean;
  variant?: 'hero' | 'chat' | 'profile'; // New variant prop for different contexts
}

export function VedAvatar({ 
  size = 220, 
  speaking = false, 
  listening = false, 
  processing = false,
  showLabel = false,
  showPlatform = false,
  variant = 'hero'
}: VedAvatarProps) {
  const [blinking, setBlinking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);

  // Responsive size adjustments based on variant
  const actualSize = variant === 'chat' ? 32 : variant === 'profile' ? 64 : size;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const responsiveSize = variant === 'hero' && isMobile ? 120 : actualSize;

  // Eye blink every 3-5 seconds
  useEffect(() => {
    const blink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    };
    const interval = setInterval(blink, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // Mouth animation when speaking
  useEffect(() => {
    if (!speaking) { setMouthOpen(false); return; }
    const interval = setInterval(() => {
      setMouthOpen(prev => !prev);
    }, 200);
    return () => clearInterval(interval);
  }, [speaking]);

  const ringColor = speaking ? 'rgba(255,153,51,1)' : listening ? 'rgba(255,153,51,0.5)' : 'transparent';
  const ringSpeed = speaking ? 0.8 : 1.5;

  // Processing state: desaturate and add opacity
  const containerOpacity = processing ? 0.8 : 1;

  return (
    <div className="flex flex-col items-center">
      <motion.div 
        className="relative" 
        style={{ 
          width: responsiveSize + 40, 
          height: responsiveSize + 40,
          opacity: containerOpacity,
          filter: processing ? 'saturate(0.7)' : 'saturate(1)',
          transition: 'filter 0.3s ease, opacity 0.3s ease'
        }}
      >
        {/* Breathing saffron glow - only show in hero variant */}
        {variant === 'hero' && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: responsiveSize * 1.3,
              height: responsiveSize * 1.3,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(255,153,51,0.08) 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Speaking pulse ring with enhanced animation */}
        {speaking && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: responsiveSize + 40,
              height: responsiveSize + 40,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              border: `2px solid ${ringColor}`,
              boxShadow: `0 0 20px ${ringColor}`,
            }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: ringSpeed, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Listening ring */}
        {listening && !speaking && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: responsiveSize + 40,
              height: responsiveSize + 40,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              border: `2px solid ${ringColor}`,
            }}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: ringSpeed, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Processing spinner */}
        {processing && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: responsiveSize + 30,
              height: responsiveSize + 30,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              border: '3px solid transparent',
              borderTopColor: '#FF9933',
              borderRightColor: '#FF9933',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Platform glow */}
        {showPlatform && (
          <div
            className="absolute rounded-full"
            style={{
              width: responsiveSize + 20,
              height: responsiveSize + 20,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
            }}
          />
        )}

        {/* Avatar SVG */}
        <svg
          width={responsiveSize}
          height={responsiveSize}
          viewBox="0 0 220 220"
          fill="none"
          style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        >
          {/* Body - white kurta */}
          <ellipse cx="110" cy="185" rx="55" ry="30" fill="#F5F5F5" />
          <rect x="80" y="120" width="60" height="70" rx="20" fill="#F5F5F5" />
          
          {/* Kurta collar detail */}
          <path d="M95 120 L110 135 L125 120" stroke="#FF9933" strokeWidth="2" fill="none" />

          {/* Neck */}
          <rect x="100" y="105" width="20" height="20" rx="8" fill="#C68642" />

          {/* Head */}
          <ellipse cx="110" cy="80" rx="40" ry="45" fill="#C68642" />

          {/* Hair */}
          <ellipse cx="110" cy="50" rx="38" ry="22" fill="#2C1810" />
          <path d="M72 60 Q72 40, 110 35 Q148 40, 148 60" fill="#2C1810" />

          {/* Eyes */}
          {blinking ? (
            <>
              <line x1="90" y1="78" x2="100" y2="78" stroke="#2C1810" strokeWidth="2" strokeLinecap="round" />
              <line x1="120" y1="78" x2="130" y2="78" stroke="#2C1810" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Left eye */}
              <ellipse cx="95" cy="78" rx="7" ry="8" fill="white" />
              <ellipse cx="96" cy="79" rx="4" ry="5" fill="#2C1810" />
              <circle cx="97" cy="77" r="1.5" fill="white" opacity="0.9" />
              {/* Right eye */}
              <ellipse cx="125" cy="78" rx="7" ry="8" fill="white" />
              <ellipse cx="126" cy="79" rx="4" ry="5" fill="#2C1810" />
              <circle cx="127" cy="77" r="1.5" fill="white" opacity="0.9" />
            </>
          )}

          {/* Eyebrows */}
          <path d="M85 68 Q95 63, 103 68" stroke="#2C1810" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M117 68 Q125 63, 135 68" stroke="#2C1810" strokeWidth="2" fill="none" strokeLinecap="round" />

          {/* Nose */}
          <path d="M108 85 Q110 92, 112 85" stroke="#A0522D" strokeWidth="1.5" fill="none" />

          {/* Mouth */}
          {mouthOpen ? (
            <ellipse cx="110" cy="98" rx="8" ry="5" fill="#8B4513" />
          ) : (
            <path d="M100 96 Q110 104, 120 96" stroke="#8B4513" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}
        </svg>
      </motion.div>

      {/* Label */}
      {showLabel && (
        <div className="text-center mt-2">
          <p style={{ fontFamily: 'Lora, serif', fontSize: '18px', color: 'white', opacity: 0.8 }}>वेद</p>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '12px', color: 'white', opacity: 0.5 }}>Jan Saathi</p>
        </div>
      )}
    </div>
  );
}

// Enhanced small version for chat bubbles
export function VedAvatarSmall({ speaking = false, processing = false }: { speaking?: boolean; processing?: boolean }) {
  return (
    <div className="relative w-8 h-8 flex-shrink-0">
      {/* Speaking pulse animation */}
      {speaking && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ 
            border: '2px solid rgba(255,153,51,0.8)',
            boxShadow: '0 0 10px rgba(255,153,51,0.5)'
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      
      {/* Processing spinner */}
      {processing && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ 
            border: '2px solid transparent',
            borderTopColor: '#FF9933',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}
      
      <svg 
        width="32" 
        height="32" 
        viewBox="0 0 220 220" 
        fill="none"
        style={{
          opacity: processing ? 0.8 : 1,
          filter: processing ? 'saturate(0.7)' : 'saturate(1)',
          transition: 'filter 0.3s ease, opacity 0.3s ease'
        }}
      >
        <circle cx="110" cy="110" r="108" fill="#000080" />
        <ellipse cx="110" cy="80" rx="35" ry="38" fill="#C68642" />
        <ellipse cx="110" cy="50" rx="33" ry="18" fill="#2C1810" />
        <path d="M77 55 Q77 40, 110 35 Q143 40, 143 55" fill="#2C1810" />
        <ellipse cx="97" cy="78" rx="5" ry="6" fill="white" />
        <ellipse cx="98" cy="79" rx="3" ry="3.5" fill="#2C1810" />
        <ellipse cx="123" cy="78" rx="5" ry="6" fill="white" />
        <ellipse cx="124" cy="79" rx="3" ry="3.5" fill="#2C1810" />
        <path d="M102 94 Q110 100, 118 94" stroke="#8B4513" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <rect x="85" y="115" width="50" height="55" rx="16" fill="#F5F5F5" />
        <path d="M98 115 L110 126 L122 115" stroke="#FF9933" strokeWidth="2" fill="none" />
      </svg>
    </div>
  );
}

// Profile size version (64px)
export function VedAvatarProfile({ speaking = false, processing = false }: { speaking?: boolean; processing?: boolean }) {
  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      {speaking && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ 
            border: '2px solid rgba(255,153,51,0.8)',
            boxShadow: '0 0 15px rgba(255,153,51,0.5)'
          }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      
      {processing && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ 
            border: '2px solid transparent',
            borderTopColor: '#FF9933',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}
      
      <VedAvatar size={64} speaking={speaking} processing={processing} variant="profile" />
    </div>
  );
}