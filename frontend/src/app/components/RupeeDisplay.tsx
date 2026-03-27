import React from 'react';
import { motion } from 'motion/react';

interface RupeeDisplayProps {
  value: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  showPerYear?: boolean;
  animated?: boolean;
  lang?: string;
}

export function RupeeDisplay({ 
  value, 
  size = 'md', 
  color = '#000080',
  showPerYear = false,
  animated = false,
  lang = 'en'
}: RupeeDisplayProps) {
  const sizeMap = {
    sm: { fontSize: '1rem', symbolSize: '0.85rem' },
    md: { fontSize: '1.5rem', symbolSize: '1.25rem' },
    lg: { fontSize: '2.5rem', symbolSize: '2rem' },
    xl: { fontSize: '3.5rem', symbolSize: '2.75rem' },
  };

  const { fontSize, symbolSize } = sizeMap[size];

  const formattedValue = value.toLocaleString('en-IN');
  
  const Container = animated ? motion.div : 'div';

  return (
    <Container
      className="inline-flex items-baseline gap-1"
      {...(animated && {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: 'spring', stiffness: 200, damping: 15 }
      })}
    >
      <span 
        style={{ 
          fontSize: symbolSize, 
          fontFamily: 'Lora, serif',
          fontWeight: 700,
          color,
          opacity: 0.9
        }}
      >
        ₹
      </span>
      <span 
        style={{ 
          fontSize, 
          fontFamily: 'Lora, serif',
          fontWeight: 700,
          color,
          letterSpacing: '-0.02em'
        }}
      >
        {formattedValue}
      </span>
      {showPerYear && (
        <span 
          style={{ 
            fontSize: `calc(${fontSize} * 0.4)`,
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 500,
            color,
            opacity: 0.7,
            marginLeft: '0.25rem'
          }}
        >
          {lang === 'hi' ? '/वर्ष' : '/year'}
        </span>
      )}
    </Container>
  );
}