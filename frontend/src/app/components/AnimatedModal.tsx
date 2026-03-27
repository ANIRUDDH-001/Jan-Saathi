import { motion, AnimatePresence } from 'motion/react';
import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { modalVariants, backdropVariants, buttonPress } from '../utils/animations';

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AnimatedModal({ isOpen, onClose, children, title, size = 'md' }: AnimatedModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className={`${sizeClasses[size]} w-full bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {title && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <h2 
                    className="text-[#000080]"
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    {title}
                  </h2>
                  <motion.button
                    whileTap={buttonPress}
                    onClick={onClose}
                    className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </motion.button>
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
