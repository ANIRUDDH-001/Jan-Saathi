import React from 'react';
import { motion } from 'motion/react';

interface JanSaathiLogoProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function JanSaathiLogo({ size = 'md', animated = false }: JanSaathiLogoProps) {
  const dimensions = {
    sm: { width: 36, height: 36, stroke: 2.5 },
    md: { width: 48, height: 48, stroke: 3 },
    lg: { width: 64, height: 64, stroke: 3.5 },
  };

  const { width, height, stroke } = dimensions[size];

  const LogoSVG = animated ? motion.svg : 'svg';
  const LogoPath = animated ? motion.path : 'path';

  return (
    <div className="relative inline-block">
      {/* Gradient glow effect */}
      <div 
        className="absolute inset-0 rounded-full blur-md opacity-60"
        style={{ 
          background: 'linear-gradient(135deg, rgba(255, 153, 51, 0.6) 0%, rgba(19, 136, 8, 0.6) 100%)'
        }}
      />
      
      {/* Main logo */}
      <LogoSVG
        width={width}
        height={height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative"
        style={{
          filter: 'drop-shadow(0 2px 8px rgba(0, 0, 128, 0.3))'
        }}
      >
        {/* Background circle - Navy Blue gradient */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="url(#navyGradient)"
        />

        {/* Intertwined J and S forming a human figure */}
        
        {/* Letter J - forms the left arm and body */}
        <LogoPath
          d="M 35 25 Q 35 20, 40 20 Q 45 20, 45 25 L 45 60 Q 45 70, 35 70 Q 25 70, 25 60"
          stroke="#FF9933"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          {...(animated && {
            initial: { pathLength: 0, opacity: 0 },
            animate: { pathLength: 1, opacity: 1 },
            transition: { duration: 1.2, ease: "easeInOut" }
          })}
        />

        {/* Letter S - forms the right arm and creates the companion figure */}
        <LogoPath
          d="M 65 30 Q 70 25, 75 30 Q 80 35, 75 40 Q 70 45, 65 45 Q 60 45, 55 50 Q 50 55, 55 60 Q 60 65, 65 65 Q 70 65, 75 70"
          stroke="#138808"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          {...(animated && {
            initial: { pathLength: 0, opacity: 0 },
            animate: { pathLength: 1, opacity: 1 },
            transition: { duration: 1.2, delay: 0.3, ease: "easeInOut" }
          })}
        />

        {/* Head - connecting element (white dot) */}
        <circle
          cx="50"
          cy="18"
          r="6"
          fill="white"
          {...(animated && {
            initial: { scale: 0 },
            animate: { scale: 1 },
            transition: { duration: 0.4, delay: 0.6, type: "spring", stiffness: 200 }
          })}
        />

        {/* Heart center - symbolizing care */}
        <circle
          cx="50"
          cy="50"
          r="4"
          fill="url(#tricolorGradient)"
          {...(animated && {
            initial: { scale: 0 },
            animate: { scale: 1 },
            transition: { duration: 0.4, delay: 0.8, type: "spring", stiffness: 300 }
          })}
        />

        {/* Gradients */}
        <defs>
          <linearGradient id="navyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000080" />
            <stop offset="100%" stopColor="#00006b" />
          </linearGradient>
          <linearGradient id="tricolorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF9933" />
            <stop offset="50%" stopColor="#FFFDF7" />
            <stop offset="100%" stopColor="#138808" />
          </linearGradient>
        </defs>
      </LogoSVG>
    </div>
  );
}
