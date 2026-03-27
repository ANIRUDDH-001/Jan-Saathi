import { motion, HTMLMotionProps } from 'motion/react';
import { cardHover } from '../utils/animations';
import { ReactNode, forwardRef } from 'react';

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  hoverable?: boolean;
  clickable?: boolean;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, hoverable = true, clickable = false, className = '', ...props }, ref) => {
    const hoverProps = hoverable
      ? {
          whileHover: cardHover,
          transition: { duration: 0.2 }
        }
      : {};

    const clickProps = clickable
      ? {
          whileTap: { scale: 0.98 },
          style: { cursor: 'pointer' }
        }
      : {};

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        {...hoverProps}
        {...clickProps}
        className={`bg-white rounded-2xl border border-border p-6 shadow-md ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';
