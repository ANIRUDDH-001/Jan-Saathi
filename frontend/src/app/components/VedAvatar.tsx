import React, { useEffect, useState } from 'react';
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

const AVATAR_IMAGE_SRC = '/assets/ved_avatar_cutout.png';

// Feature coordinates in a fixed 380x422 canvas.
const F = {
  width: 380,
  height: 422,
  lex: 162,
  ley: 115,
  rex: 214,
  rey: 113,
  mx: 190,
  my: 155,
  eyePatchRx: 9.6,
  eyePatchRy: 5.8,
  mouthPatchRx: 13,
  mouthPatchRy: 7,
  eyeRx: 6.6,
  eyeRy: 4.8,
  pupilRx: 2.8,
  pupilRy: 3.0,
  blinkHalfWidth: 5,
  lipStroke: '#7B3A23',
  mouthFill: '#6F2B19',
  skinEye: '#d79b78',
  skinMouth: '#d08f6a',
};

export function VedAvatar({
  size = 300,
  speaking = false,
  listening = false,
  processing = false,
  showLabel = false,
  showPlatform = false,
  variant = 'hero',
}: VedAvatarProps) {
  const [blinking, setBlinking] = useState(false);

  const actualSize = variant === 'chat' ? 32 : variant === 'profile' ? 64 : size;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const responsiveSize = variant === 'hero' && isMobile ? 120 : actualSize;

  useEffect(() => {
    const blink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
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
              width: responsiveSize * 1.3,
              height: responsiveSize * 1.3,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(255,153,51,0.08) 0%, transparent 70%)',
            } as any}
            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {speaking && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: responsiveSize + effectPadding,
              height: responsiveSize + effectPadding,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              border: `2px solid ${ringColor}`,
              boxShadow: `0 0 20px ${ringColor}`,
            } as any}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: ringSpeed, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {listening && !speaking && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: responsiveSize + effectPadding,
              height: responsiveSize + effectPadding,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              border: `2px solid ${ringColor}`,
            } as any}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: ringSpeed, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {processing && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: responsiveSize + effectPadding - 10,
              height: responsiveSize + effectPadding - 10,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              border: '3px solid transparent',
              borderTopColor: '#FF9933',
              borderRightColor: '#FF9933',
            } as any}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {showPlatform && (
          <div
            className="absolute rounded-full"
            style={{
              width: responsiveSize + effectPadding - 20,
              height: responsiveSize + effectPadding - 20,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
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
          <image href={AVATAR_IMAGE_SRC} x="0" y="0" width={F.width} height={F.height} preserveAspectRatio="xMidYMid slice" />

          <ellipse cx={F.lex} cy={F.ley} rx={F.eyePatchRx} ry={F.eyePatchRy} fill={F.skinEye} />
          <ellipse cx={F.rex} cy={F.rey} rx={F.eyePatchRx} ry={F.eyePatchRy} fill={F.skinEye} />
          <ellipse cx={F.mx} cy={F.my} rx={F.mouthPatchRx} ry={F.mouthPatchRy} fill={F.skinMouth} />

          {blinking ? (
            <>
              <line
                x1={F.lex - F.blinkHalfWidth}
                y1={F.ley}
                x2={F.lex + F.blinkHalfWidth}
                y2={F.ley}
                stroke="#33261a"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1={F.rex - F.blinkHalfWidth}
                y1={F.rey}
                x2={F.rex + F.blinkHalfWidth}
                y2={F.rey}
                stroke="#33261a"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </>
          ) : (
            <>
              <ellipse cx={F.lex} cy={F.ley} rx={F.eyeRx} ry={F.eyeRy} fill="white" />
              <ellipse cx={F.lex + 0.6} cy={F.ley + 0.5} rx={F.pupilRx} ry={F.pupilRy} fill="#2f2218" />
              <circle cx={F.lex + 1.3} cy={F.ley - 1.1} r="0.72" fill="white" opacity="0.95" />
              <path
                d={`M ${F.lex - 5.8} ${F.ley - 0.9} Q ${F.lex} ${F.ley - 5.3} ${F.lex + 5.8} ${F.ley - 0.9}`}
                stroke="#4d372a"
                strokeWidth="1"
                strokeLinecap="round"
                fill="none"
                opacity="0.66"
              />

              <ellipse cx={F.rex} cy={F.rey} rx={F.eyeRx} ry={F.eyeRy} fill="white" />
              <ellipse cx={F.rex + 0.7} cy={F.rey + 0.5} rx={F.pupilRx} ry={F.pupilRy} fill="#2f2218" />
              <circle cx={F.rex + 1.5} cy={F.rey - 1.1} r="0.72" fill="white" opacity="0.95" />
              <path
                d={`M ${F.rex - 5.6} ${F.rey - 0.9} Q ${F.rex} ${F.rey - 5.3} ${F.rex + 5.6} ${F.rey - 0.9}`}
                stroke="#4d372a"
                strokeWidth="1"
                strokeLinecap="round"
                fill="none"
                opacity="0.66"
              />
            </>
          )}

          {lipMotionState && (
            <>
              <motion.g
                style={{ transformOrigin: `${F.mx}px ${F.my + 2}px` }}
                animate={{
                  scaleY:
                    lipMotionState === 'speaking'
                      ? [1.0, 1.0, 1.3, 0.9, 1.2, 0.95, 1.0]
                      : lipMotionState === 'active'
                        ? [1.0, 1.0, 1.08, 0.98, 1.05, 1.0]
                        : [1.0, 1.0, 1.02, 0.99, 1.02, 1.0],
                  y:
                    lipMotionState === 'speaking'
                      ? [0, 0, 0.6, -0.1, 0.7, -0.15, 0]
                      : lipMotionState === 'active'
                        ? [0, 0, 0.25, 0, 0.28, 0]
                        : [0, 0, 0.1, 0, 0.12, 0],
                }}
                transition={{
                  duration: lipMotionState === 'speaking' ? 0.85 : lipMotionState === 'active' ? 1.4 : 2.0,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <path
                  d={`M ${F.mx - 8.4} ${F.my - 0.2} Q ${F.mx} ${F.my + 2.8} ${F.mx + 8.4} ${F.my - 0.2}`}
                  stroke={F.lipStroke}
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.92"
                />
                <ellipse cx={F.mx} cy={F.my + 1.25} rx="5.6" ry="3.6" fill={F.mouthFill} />
                <path
                  d={`M ${F.mx - 8.1} ${F.my + 1.9} Q ${F.mx} ${F.my + 6.2} ${F.mx + 8.1} ${F.my + 1.9}`}
                  stroke={F.lipStroke}
                  strokeWidth="1.35"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.82"
                />
              </motion.g>
              <motion.ellipse
                cx={F.mx}
                cy={F.my + 0.5}
                rx={F.mouthPatchRx}
                ry={F.mouthPatchRy}
                fill={F.skinMouth}
                animate={{
                  opacity:
                    lipMotionState === 'speaking'
                      ? [0, 0, 0, 0.75, 0, 0.8, 0]
                      : lipMotionState === 'active'
                        ? [0, 0, 0, 0.6, 0, 0.65, 0]
                        : [0, 0, 0, 0.35, 0, 0.4, 0],
                }}
                transition={{
                  duration: lipMotionState === 'speaking' ? 0.85 : lipMotionState === 'active' ? 1.4 : 2.0,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </>
          )}
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
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    const blink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
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
          <ellipse cx={F.lex} cy={F.ley} rx={F.eyePatchRx} ry={F.eyePatchRy} fill={F.skinEye} />
          <ellipse cx={F.rex} cy={F.rey} rx={F.eyePatchRx} ry={F.eyePatchRy} fill={F.skinEye} />
          <ellipse cx={F.mx} cy={F.my} rx={F.mouthPatchRx} ry={F.mouthPatchRy} fill={F.skinMouth} />

          {blinking ? (
            <>
              <line
                x1={F.lex - F.blinkHalfWidth}
                y1={F.ley}
                x2={F.lex + F.blinkHalfWidth}
                y2={F.ley}
                stroke="#33261a"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1={F.rex - F.blinkHalfWidth}
                y1={F.rey}
                x2={F.rex + F.blinkHalfWidth}
                y2={F.rey}
                stroke="#33261a"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </>
          ) : null}

          {lipMotionState && (
            <>
              <motion.g
                style={{ transformOrigin: `${F.mx}px ${F.my + 2}px` }}
                animate={{
                  scaleY:
                    lipMotionState === 'speaking'
                      ? [1.0, 1.0, 1.3, 0.9, 1.2, 0.95, 1.0]
                      : lipMotionState === 'active'
                        ? [1.0, 1.0, 1.08, 0.98, 1.05, 1.0]
                        : [1.0],
                  y:
                    lipMotionState === 'speaking'
                      ? [0, 0, 0.6, -0.1, 0.7, -0.15, 0]
                      : lipMotionState === 'active'
                        ? [0, 0, 0.25, 0, 0.28, 0]
                        : [0],
                }}
                transition={{
                  duration: lipMotionState === 'speaking' ? 0.85 : lipMotionState === 'active' ? 1.4 : 0,
                  repeat: lipMotionState !== 'idle' ? Infinity : 0,
                  ease: 'easeInOut',
                }}
              >
                <path
                  d={`M ${F.mx - 8.4} ${F.my - 0.2} Q ${F.mx} ${F.my + 2.8} ${F.mx + 8.4} ${F.my - 0.2}`}
                  stroke={F.lipStroke}
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.92"
                />
                <ellipse cx={F.mx} cy={F.my + 1.25} rx="5.6" ry="3.6" fill={F.mouthFill} />
                <path
                  d={`M ${F.mx - 8.1} ${F.my + 1.9} Q ${F.mx} ${F.my + 6.2} ${F.mx + 8.1} ${F.my + 1.9}`}
                  stroke={F.lipStroke}
                  strokeWidth="1.35"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.82"
                />
              </motion.g>
              <motion.ellipse
                cx={F.mx}
                cy={F.my + 0.5}
                rx={F.mouthPatchRx}
                ry={F.mouthPatchRy}
                fill={F.skinMouth}
                animate={{
                  opacity:
                    lipMotionState === 'speaking'
                      ? [0, 0, 0, 0.75, 0, 0.8, 0]
                      : lipMotionState === 'active'
                        ? [0, 0, 0, 0.6, 0, 0.65, 0]
                        : [0],
                }}
                transition={{
                  duration: lipMotionState === 'speaking' ? 0.85 : lipMotionState === 'active' ? 1.4 : 0,
                  repeat: lipMotionState !== 'idle' ? Infinity : 0,
                  ease: 'easeInOut',
                }}
              />
            </>
          )}
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
