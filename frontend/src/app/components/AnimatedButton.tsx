import { motion, HTMLMotionProps } from 'motion/react';
import { buttonPress } from '../utils/animations';
import { forwardRef, ReactNode } from 'react';

interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, variant = 'primary', size = 'md', className = '', ...props }, ref) => {
    const variantClasses = {
      primary: 'bg-gradient-to-r from-[#FF9933] to-[#e8882d] text-white hover:from-[#e8882d] hover:to-[#d17628]',
      secondary: 'bg-gradient-to-r from-[#138808] to-[#0f6d06] text-white hover:from-[#0f6d06] hover:to-[#0a5004]',
      ghost: 'bg-transparent border-2 border-border hover:bg-muted text-foreground',
      destructive: 'bg-destructive text-destructive-foreground hover:opacity-90'
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-base',
      lg: 'px-8 py-4 text-lg'
    };

    return (
      <motion.button
        ref={ref}
        whileTap={buttonPress}
        whileHover={{ scale: 1.02 }}
        className={`rounded-full font-medium transition-all shadow-md hover:shadow-lg ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        style={{ fontFamily: 'Inter, sans-serif' }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';
