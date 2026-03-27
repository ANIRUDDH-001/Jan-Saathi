import { motion, HTMLMotionProps } from 'motion/react';
import { inputFocus, errorFlash } from '../utils/animations';
import { forwardRef, useState, useEffect } from 'react';

interface AnimatedInputProps extends Omit<HTMLMotionProps<'input'>, 'onFocus' | 'onBlur'> {
  error?: boolean;
  errorMessage?: string;
  label?: string;
}

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ error, errorMessage, label, className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showError, setShowError] = useState(false);

    useEffect(() => {
      if (error) {
        setShowError(true);
        const timer = setTimeout(() => setShowError(false), 400);
        return () => clearTimeout(timer);
      }
    }, [error]);

    return (
      <div className="w-full">
        {label && (
          <label 
            className="block mb-2 text-sm font-medium text-foreground"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {label}
          </label>
        )}
        <motion.input
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          animate={
            showError
              ? errorFlash
              : isFocused
              ? inputFocus
              : { borderColor: 'var(--border)' }
          }
          className={`w-full px-4 py-3 rounded-xl border-2 bg-white outline-none transition-all ${className}`}
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '1rem'
          }}
          {...props}
        />
        {error && errorMessage && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-destructive"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {errorMessage}
          </motion.p>
        )}
      </div>
    );
  }
);

AnimatedInput.displayName = 'AnimatedInput';
