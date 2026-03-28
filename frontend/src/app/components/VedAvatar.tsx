import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface VedAvatarProps {
  size?: number;
  speaking?: boolean;
  listening?: boolean;
  processing?: boolean;
  showLabel?: boolean;
  showPlatform?: boolean;
  variant?: 'hero' | 'chat' | 'profile';
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
  const actualSize = variant === 'chat' ? 36 : variant === 'profile' ? 72 : size;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const responsiveSize = variant === 'hero' && isMobile ? 140 : actualSize;

  // Eye blink logic
  useEffect(() => {
    const blink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    };
    const interval = setInterval(blink, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // Mouth animation logic
  useEffect(() => {
    if (!speaking) { setMouthOpen(false); return; }
    const interval = setInterval(() => {
      setMouthOpen(prev => !prev);
    }, 180);
    return () => clearInterval(interval);
  }, [speaking]);

  const activeColor = '#FF9933'; // Saffron for active state

  return (
    <div className="flex flex-col items-center">
      <motion.div 
        className="relative" 
        style={{ 
          width: responsiveSize + 22, 
          height: responsiveSize + 22,
          opacity: processing ? 0.8 : 1,
          filter: processing ? 'saturate(0.5)' : 'saturate(1)',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Animated Saffron Glow (Hero only) */}
        {variant === 'hero' && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,153,51,0.15) 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Pulse Ring for Speaking/Listening */}
        {(speaking || listening) && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: `3px solid ${activeColor}`,
              boxShadow: speaking ? `0 0 20px ${activeColor}` : 'none',
              opacity: listening && !speaking ? 0.4 : 1
            }}
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: speaking ? 0.8 : 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Processing Spinner */}
        {processing && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: '4px solid transparent',
              borderTopColor: activeColor,
              borderRightColor: activeColor,
              zIndex: 10
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Main Avatar Container with Tricolor Frame & White Background */}
        <div 
          className="absolute inset-0 rounded-full flex items-center justify-center p-[4px] shadow-lg"
          style={{ 
            background: 'white',
            border: '4px solid transparent',
            backgroundImage: 'linear-gradient(white, white), linear-gradient(to bottom, #FF9933 33%, #FFFFFF 33%, #FFFFFF 66%, #138808 66%)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'content-box, border-box',
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 220 220"
            fill="none"
            className="drop-shadow-sm"
          >
            {/* --- Character: Ved (Stitch Replica) --- */}
            
            {/* Body: White Kurta */}
            <path d="M50 200 Q110 180 170 200 L190 240 L30 240 Z" fill="#F8FAFC" />
            
            {/* Nehru Jacket: Dark Green (Stitch style) */}
            <path d="M65 195 Q110 185 155 195 L170 240 L50 240 Z" fill="#064E3B" />
            <path d="M110 185 L110 240" stroke="#047857" strokeWidth="1.5" />
            
            {/* Lanyard & ID Badge */}
            <path d="M90 195 L110 215 L130 195" stroke="#334155" strokeWidth="2" fill="none" />
            <rect x="100" y="210" width="20" height="25" rx="2" fill="white" stroke="#CBD5E1" strokeWidth="0.5" />
            <rect x="104" y="214" width="12" height="2" fill="#94A3B8" />
            
            {/* Props: Golden Wheat Bundle (Handheld) */}
            <g transform="translate(15, 175) rotate(-15)">
               <path d="M10 0 Q15 -40 25 -10M5 -5 Q10 -45 20 -15" stroke="#D97706" strokeWidth="2.5" fill="none" />
               <circle cx="25" cy="-10" r="3.5" fill="#FBBF24" />
               <circle cx="20" cy="-15" r="3.5" fill="#FBBF24" />
               <path d="M10 10 Q15 30 25 10" stroke="#D97706" strokeWidth="2" fill="none" />
            </g>
            
            {/* Props: Modern Digital Tablet (Handheld) */}
            <g transform="translate(170, 180) rotate(15)">
               <rect x="0" y="0" width="35" height="48" rx="4" fill="#1E293B" />
               <rect x="3" y="3" width="29" height="42" rx="1.5" fill="#0F172A" />
               <circle cx="17.5" cy="45" r="1" fill="#475569" />
            </g>
            
            {/* Neck */}
            <path d="M98 175 L122 175 L118 190 L102 190 Z" fill="#C68642" />
            
            {/* Head/Face Base */}
            <ellipse cx="110" cy="130" rx="48" ry="55" fill="#C68642" />
            
            {/* Beard: Detailed Mixed Grey/White (Stitch style) */}
            <path d="M62 140 Q60 185 110 195 Q160 185 158 140 Z" fill="#F1F5F9" opacity="0.95" />
            <path d="M70 155 Q110 190 150 155" stroke="#E2E8F0" strokeWidth="2.5" fill="none" />
            <path d="M80 165 Q110 185 140 165" stroke="#CBD5E1" strokeWidth="1.5" fill="none" />

            {/* Saffron Saafa (Turban) - Rural Indian Cotton Style */}
            <path d="M60 105 Q55 50 110 45 Q165 50 160 105" fill="#FF9933" />
            <path d="M60 105 Q110 85 160 105" stroke="#FB923C" strokeWidth="5" fill="none" />
            <path d="M65 90 Q110 75 155 90" stroke="#FFEDD5" strokeWidth="2.5" fill="none" opacity="0.5" />
            <path d="M75 75 Q110 65 145 75" stroke="#FB923C" strokeWidth="4" fill="none" />
            <path d="M155 95 Q170 110 155 125" stroke="#FF9933" strokeWidth="8" fill="none" strokeLinecap="round" /> {/* Loose end wrap */}

            {/* Eyes Section with Blinking */}
            {blinking ? (
              <g>
                <line x1="88" y1="128" x2="104" y2="128" stroke="#2C1810" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="116" y1="128" x2="132" y2="128" stroke="#2C1810" strokeWidth="3.5" strokeLinecap="round" />
              </g>
            ) : (
              <g>
                {/* Left Eye */}
                <ellipse cx="96" cy="126" rx="9" ry="10" fill="white" />
                <circle cx="97" cy="126" r="6" fill="#2C1810" />
                <circle cx="99" cy="124" r="2.5" fill="white" opacity="0.9" />
                {/* Right Eye */}
                <ellipse cx="124" cy="126" rx="9" ry="10" fill="white" />
                <circle cx="125" cy="126" r="6" fill="#2C1810" />
                <circle cx="127" cy="124" r="2.5" fill="white" opacity="0.9" />
              </g>
            )}

            {/* Eyebrows: Greyish */}
            <path d="M83 112 Q96 105 106 115" stroke="#475569" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M114 115 Q124 105 137 112" stroke="#475569" strokeWidth="3" fill="none" strokeLinecap="round" />

            {/* Nose Profile */}
            <path d="M106 135 Q110 148 114 135" stroke="#8B4513" strokeWidth="2.5" fill="none" opacity="0.6" />

            {/* Interactive Mouth (Lip Movement) */}
            {mouthOpen ? (
              <ellipse cx="110" cy="162" rx="12" ry="8" fill="#78350F" />
            ) : (
              <path d="M95 158 Q110 172 125 158" stroke="#78350F" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            )}
            
            {/* Character detail: Friendly smile lines */}
            <path d="M88 152 Q84 158 88 164M132 152 Q136 158 132 164" stroke="#8B4513" strokeWidth="1" fill="none" opacity="0.4" />

          </svg>
        </div>
      </motion.div>

      {/* Label (Ved / Jan Saathi Assistant) */}
      {showLabel && (
        <motion.div 
          className="text-center mt-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <p className="font-serif text-2xl font-bold bg-gradient-to-r from-orange-600 to-green-700 bg-clip-text text-transparent">वेद (Ved)</p>
          <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-slate-500 font-extrabold mt-1">Jan Saathi Assistant</p>
        </motion.div>
      )}
    </div>
  );
}

export function VedAvatarSmall({ speaking = false, processing = false }: { speaking?: boolean; processing?: boolean }) {
  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      <VedAvatar size={40} speaking={speaking} processing={processing} variant="chat" />
    </div>
  );
}

export function VedAvatarProfile({ speaking = false, processing = false }: { speaking?: boolean; processing?: boolean }) {
  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <VedAvatar size={80} speaking={speaking} processing={processing} variant="profile" />
    </div>
  );
}