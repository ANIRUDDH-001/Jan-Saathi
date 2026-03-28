import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface VedAvatarProps {
  size?: number;
  speaking?: boolean;
  listening?: boolean;
  processing?: boolean;
  // Phase 4 aliases
  isTalking?: boolean;
  isListening?: boolean;
  isProcessing?: boolean;
  showLabel?: boolean;
  showPlatform?: boolean;
  variant?: 'hero' | 'chat' | 'profile';
}

const AVATAR_IMAGE_SRC = '/assets/shubh_avatar_cutout.png';

// Feature coordinates in a fixed 380x422 canvas.
const F = {
  width: 380,
  height: 422,
  lex: 169.7,
  ley: 114.1,
  rex: 206.7,
  rey: 113.1,
  mx: 187,
  my: 148,
  eyePatchRx: 9.6,
  eyePatchRy: 5.8,
  mouthPatchRx: 13,
  mouthPatchRy: 7,
  eyeRx: 6.6,
  eyeRy: 4.8,
  pupilRx: 2.8,
  pupilRy: 3,
  blinkHalfWidth: 5,
  lipStroke: '#7B3A23',
  mouthFill: '#6F2B19',
  skinEye: '#d79b78',
  skinMouth: '#d08f6a',
};

export function VedAvatar({
  size = 300,
  speaking: speakingProp = false,
  listening: listeningProp = false,
  processing: processingProp = false,
  isTalking = false,
  isListening = false,
  isProcessing = false,
  showLabel = false,
  showPlatform = false,
  variant = 'hero',
}: VedAvatarProps) {
  const speaking = speakingProp || isTalking;
  const listening = listeningProp || isListening;
  const processing = processingProp || isProcessing;
  const [isBlinking, setIsBlinking] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  const actualSize = variant === 'chat' ? 32 : variant === 'profile' ? 64 : size;
  const responsiveSize = variant === 'hero' && isMobile ? 120 : actualSize;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };

    const interval = setInterval(blink, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  const ringColor = speaking ? 'rgba(255,153,51,1)' : listening ? 'rgba(255,153,51,0.5)' : 'transparent';
  const ringSpeed = speaking ? 0.8 : 1.5;
  const containerOpacity = processing ? 0.8 : 1;
  const effectPadding = variant === 'hero' ? 60 : 24;
  const plateSize = responsiveSize * (variant === 'hero' ? 0.88 : 0.92);
  const plateTop = variant === 'hero' ? '58%' : '56%';
  const lipMotionState = speaking ? 'speaking' : listening || processing ? 'active' : 'idle';

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="relative"
        style={{
          width: responsiveSize + effectPadding,
          height: responsiveSize + effectPadding,
          opacity: containerOpacity,
          filter: processing ? 'saturate(0.7)' : 'saturate(1)',
          transition: 'filter 0.3s ease, opacity 0.3s ease',
        } as any}
      >
        {variant === 'hero' && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: plateSize,
              height: plateSize,
              left: '50%',
              top: plateTop,
              x: '-50%',
              y: '-50%',
              background: 'radial-gradient(circle, rgba(255,153,51,0.08) 0%, transparent 70%)',
            } as any}
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {speaking && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: plateSize + 10,
              height: plateSize + 10,
              left: '50%',
              top: plateTop,
              x: '-50%',
              y: '-50%',
              border: `2px solid ${ringColor}`,
              boxShadow: `0 0 20px ${ringColor}`,
              zIndex: 0,
            } as any}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: ringSpeed, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {listening && !speaking && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: plateSize + 10,
              height: plateSize + 10,
              left: '50%',
              top: plateTop,
              x: '-50%',
              y: '-50%',
              border: `2px solid ${ringColor}`,
              zIndex: 0,
            } as any}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: ringSpeed, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {processing && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: plateSize + 6,
              height: plateSize + 6,
              left: '50%',
              top: plateTop,
              x: '-50%',
              y: '-50%',
              border: '3px solid transparent',
              borderTopColor: '#FF9933',
              borderRightColor: '#FF9933',
              zIndex: 0,
            } as any}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {showPlatform && (
          <div
            className="absolute rounded-full"
            style={{
              width: plateSize + 24,
              height: plateSize + 24,
              left: '50%',
              top: plateTop,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
              zIndex: 0,
            }}
          />
        )}

        <div
          className="absolute rounded-full"
          style={{
            width: plateSize,
            height: plateSize,
            left: '50%',
            top: plateTop,
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f6f6f6 100%)',
            boxShadow: '0 16px 34px rgba(0,0,0,0.24), 0 4px 10px rgba(0,0,0,0.14)',
            zIndex: 0,
          }}
        />

        <div
          className="absolute rounded-full"
          style={{
            width: plateSize * 0.85,
            height: plateSize * 0.18,
            left: '50%',
            top: `calc(${plateTop} + ${plateSize * 0.38}px)`,
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.15)',
            filter: 'blur(14px)',
            zIndex: 0,
          }}
        />

        <svg
          width={responsiveSize}
          height={responsiveSize}
          viewBox={`0 0 ${F.width} ${F.height}`}
          fill="none"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.2))',
            zIndex: 1,
          }}
        >
          {/* SVG Definitions — feathered patches & blur */}
          <defs>
            <radialGradient id="mouthPatchGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={F.skinMouth} stopOpacity="1" />
              <stop offset="55%" stopColor={F.skinMouth} stopOpacity="0.95" />
              <stop offset="80%" stopColor={F.skinMouth} stopOpacity="0.5" />
              <stop offset="100%" stopColor={F.skinMouth} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="eyePatchGradL" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={F.skinEye} stopOpacity="1" />
              <stop offset="60%" stopColor={F.skinEye} stopOpacity="0.95" />
              <stop offset="85%" stopColor={F.skinEye} stopOpacity="0.4" />
              <stop offset="100%" stopColor={F.skinEye} stopOpacity="0" />
            </radialGradient>
            <filter id="softEdge" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" />
            </filter>
          </defs>

          <image href={AVATAR_IMAGE_SRC} x="0" y="0" width={F.width} height={F.height} preserveAspectRatio="xMidYMid slice" />

          {isBlinking && (
            <>
              <ellipse cx={F.lex} cy={F.ley} rx={F.eyePatchRx * 1.4} ry={F.eyePatchRy * 1.5} fill="url(#eyePatchGradL)" filter="url(#softEdge)" />
              <ellipse cx={F.rex} cy={F.rey} rx={F.eyePatchRx * 1.4} ry={F.eyePatchRy * 1.5} fill="url(#eyePatchGradL)" filter="url(#softEdge)" />

              <path
                d={`M ${F.lex - F.blinkHalfWidth} ${F.ley - 0.5} Q ${F.lex} ${F.ley + 2} ${F.lex + F.blinkHalfWidth} ${F.ley - 0.5}`}
                stroke="#4d372a"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
                opacity="0.85"
              />
              <path
                d={`M ${F.rex - F.blinkHalfWidth} ${F.rey - 0.5} Q ${F.rex} ${F.rey + 2} ${F.rex + F.blinkHalfWidth} ${F.rey - 0.5}`}
                stroke="#4d372a"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
                opacity="0.85"
              />
            </>
          )}

          {/* Mouth cover patch — hides the original open smile when idle */}
          <motion.ellipse
            cx={F.mx}
            cy={F.my + 1}
            rx={F.mouthPatchRx * 1.5}
            ry={F.mouthPatchRy * 1.6}
            fill="url(#mouthPatchGrad)"
            filter="url(#softEdge)"
            animate={{
              opacity:
                lipMotionState === 'speaking'
                  ? [1, 0.3, 0.8, 0.2, 0.7, 0.25, 1]
                  : lipMotionState === 'active'
                    ? [1, 0.6, 0.9, 0.5, 1]
                    : [1],
            }}
            transition={{
              duration: lipMotionState === 'speaking' ? 0.55 : lipMotionState === 'active' ? 1.2 : 0,
              repeat: lipMotionState !== 'idle' ? Infinity : 0,
              ease: [0.45, 0.05, 0.55, 0.95],
            }}
          />

          {/* Closed mouth line */}
          <motion.g
            animate={{
              opacity:
                lipMotionState === 'speaking'
                  ? [1, 0.2, 0.85, 0.15, 0.8, 0.2, 1]
                  : lipMotionState === 'active'
                    ? [1, 0.5, 0.9, 0.45, 1]
                    : [1],
            }}
            transition={{
              duration: lipMotionState === 'speaking' ? 0.55 : lipMotionState === 'active' ? 1.2 : 0,
              repeat: lipMotionState !== 'idle' ? Infinity : 0,
              ease: [0.45, 0.05, 0.55, 0.95],
            }}
          >
            <path
              d={`M ${F.mx - 9} ${F.my + 0.5}
                  C ${F.mx - 5} ${F.my - 1}, ${F.mx - 1.5} ${F.my - 1.8}, ${F.mx} ${F.my - 0.6}
                  C ${F.mx + 1.5} ${F.my - 1.8}, ${F.mx + 5} ${F.my - 1}, ${F.mx + 9} ${F.my + 0.5}`}
              stroke="#8B5E3C"
              strokeWidth="1.4"
              fill="none"
              strokeLinecap="round"
              opacity="0.85"
            />
            <path
              d={`M ${F.mx - 7} ${F.my + 1}
                  Q ${F.mx} ${F.my + 3.5} ${F.mx + 7} ${F.my + 1}`}
              stroke="#8B5E3C"
              strokeWidth="0.9"
              fill="none"
              strokeLinecap="round"
              opacity="0.45"
            />
          </motion.g>
        </svg>
      </motion.div>

      {showLabel && (
        <div className="text-center mt-2">
          <p style={{ fontFamily: 'Lora, serif', fontSize: '18px', color: 'white', opacity: 0.8 }}>वेद</p>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '12px', color: 'white', opacity: 0.5 }}>Jan Saathi</p>
        </div>
      )}
    </div>
  );
}

export function VedAvatarSmall({ speaking = false, processing = false }: { speaking?: boolean; processing?: boolean }) {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };

    const interval = setInterval(blink, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  const lipMotionState = speaking ? 'speaking' : processing ? 'active' : 'idle';

  return (
    <div className="relative w-8 h-8 flex-shrink-0 rounded-full overflow-hidden">
      {speaking && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: '2px solid rgba(255,153,51,0.8)',
            boxShadow: '0 0 10px rgba(255,153,51,0.5)',
            zIndex: 2,
          } as any}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {processing && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: '2px solid transparent',
            borderTopColor: '#FF9933',
            zIndex: 2,
          } as any}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}

      <div className="relative w-full h-full">
        <img
          src={AVATAR_IMAGE_SRC}
          alt="Ved avatar"
          className="w-full h-full object-cover"
          style={{
            opacity: processing ? 0.8 : 1,
            filter: processing ? 'saturate(0.7)' : 'saturate(1)',
            objectPosition: '50% 24%',
            transform: 'scale(1.65)',
            transition: 'filter 0.3s ease, opacity 0.3s ease',
          }}
        />
        <svg
          width={32}
          height={32}
          viewBox="0 0 380 422"
          fill="none"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <defs>
            <radialGradient id="mouthPatchGradSm" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={F.skinMouth} stopOpacity="1" />
              <stop offset="55%" stopColor={F.skinMouth} stopOpacity="0.95" />
              <stop offset="80%" stopColor={F.skinMouth} stopOpacity="0.5" />
              <stop offset="100%" stopColor={F.skinMouth} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="eyePatchGradSm" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={F.skinEye} stopOpacity="1" />
              <stop offset="60%" stopColor={F.skinEye} stopOpacity="0.95" />
              <stop offset="85%" stopColor={F.skinEye} stopOpacity="0.4" />
              <stop offset="100%" stopColor={F.skinEye} stopOpacity="0" />
            </radialGradient>
            <filter id="softEdgeSm" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" />
            </filter>
          </defs>

          {isBlinking && (
            <>
              <ellipse cx={F.lex} cy={F.ley} rx={F.eyePatchRx * 1.4} ry={F.eyePatchRy * 1.5} fill="url(#eyePatchGradSm)" filter="url(#softEdgeSm)" />
              <ellipse cx={F.rex} cy={F.rey} rx={F.eyePatchRx * 1.4} ry={F.eyePatchRy * 1.5} fill="url(#eyePatchGradSm)" filter="url(#softEdgeSm)" />
              <path
                d={`M ${F.lex - F.blinkHalfWidth} ${F.ley - 0.5} Q ${F.lex} ${F.ley + 2} ${F.lex + F.blinkHalfWidth} ${F.ley - 0.5}`}
                stroke="#4d372a" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.85"
              />
              <path
                d={`M ${F.rex - F.blinkHalfWidth} ${F.rey - 0.5} Q ${F.rex} ${F.rey + 2} ${F.rex + F.blinkHalfWidth} ${F.rey - 0.5}`}
                stroke="#4d372a" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.85"
              />
            </>
          )}

          {/* Mouth cover patch — hides original open smile when idle */}
          <motion.ellipse
            cx={F.mx} cy={F.my + 1}
            rx={F.mouthPatchRx * 1.5} ry={F.mouthPatchRy * 1.6}
            fill="url(#mouthPatchGradSm)" filter="url(#softEdgeSm)"
            animate={{
              opacity: lipMotionState === 'speaking' ? [1, 0.3, 0.8, 0.2, 0.7, 0.25, 1]
                : lipMotionState === 'active' ? [1, 0.6, 0.9, 0.5, 1] : [1],
            }}
            transition={{
              duration: lipMotionState === 'speaking' ? 0.55 : lipMotionState === 'active' ? 1.2 : 0,
              repeat: lipMotionState !== 'idle' ? Infinity : 0,
              ease: [0.45, 0.05, 0.55, 0.95],
            }}
          />
          {/* Closed mouth line */}
          <motion.g
            animate={{
              opacity: lipMotionState === 'speaking' ? [1, 0.2, 0.85, 0.15, 0.8, 0.2, 1]
                : lipMotionState === 'active' ? [1, 0.5, 0.9, 0.45, 1] : [1],
            }}
            transition={{
              duration: lipMotionState === 'speaking' ? 0.55 : lipMotionState === 'active' ? 1.2 : 0,
              repeat: lipMotionState !== 'idle' ? Infinity : 0,
              ease: [0.45, 0.05, 0.55, 0.95],
            }}
          >
            <path
              d={`M ${F.mx - 9} ${F.my + 0.5} C ${F.mx - 5} ${F.my - 1}, ${F.mx - 1.5} ${F.my - 1.8}, ${F.mx} ${F.my - 0.6} C ${F.mx + 1.5} ${F.my - 1.8}, ${F.mx + 5} ${F.my - 1}, ${F.mx + 9} ${F.my + 0.5}`}
              stroke="#8B5E3C" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.85"
            />
            <path
              d={`M ${F.mx - 7} ${F.my + 1} Q ${F.mx} ${F.my + 3.5} ${F.mx + 7} ${F.my + 1}`}
              stroke="#8B5E3C" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.45"
            />
          </motion.g>
        </svg>
      </div>
    </div>
  );
}

export function VedAvatarProfile({ speaking = false, processing = false }: { speaking?: boolean; processing?: boolean }) {
  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      {speaking && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: '2px solid rgba(255,153,51,0.8)',
            boxShadow: '0 0 15px rgba(255,153,51,0.5)',
          } as any}
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
          } as any}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}

      <VedAvatar size={64} speaking={speaking} processing={processing} variant="profile" />
    </div>
  );
}
