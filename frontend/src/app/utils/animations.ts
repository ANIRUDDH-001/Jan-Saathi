import { Variants } from 'motion/react';

// Standard micro-interactions
export const buttonPress = {
  scale: 0.97,
  transition: { type: 'spring', duration: 0.08, bounce: 0.5 }
};

export const cardHover = {
  y: -2,
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
  transition: { duration: 0.2 }
};

// Input focus states
export const inputFocus = {
  borderColor: '#FF9933',
  transition: { duration: 0.15 }
};

// Modal animations
export const modalVariants: Variants = {
  hidden: {
    y: 50,
    opacity: 0,
    transition: { duration: 0.25 }
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' }
  }
};

export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.25 } }
};

// Error flash animation
export const errorFlash = {
  borderColor: ['#FF0000', '#FF0000', 'var(--border)'],
  transition: { duration: 0.4, times: [0, 0.5, 1] }
};

// Loading shimmer keyframes
export const shimmerAnimation = `
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }
`;

export const shimmerStyle = {
  background: 'linear-gradient(90deg, #FFF3E0 0%, #FFE0B2 50%, #FFF3E0 100%)',
  backgroundSize: '1000px 100%',
  animation: 'shimmer 2s infinite linear'
};

// Language switch fade
export const languageFade: Variants = {
  initial: { opacity: 1 },
  fade: { 
    opacity: 0.7, 
    transition: { duration: 0.1 } 
  },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.1 } 
  }
};

// Spring configurations
export const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25
};

export const slowSpring = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 20
};
