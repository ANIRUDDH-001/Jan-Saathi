import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface OccupationCardsProps {
  visible: boolean;
  onSelect: (value: string) => void;
}

const options = [
  { emoji: '🌾', labelHi: 'फसल', labelEn: 'Fasal' },
  { emoji: '🐄', labelHi: 'पशु-डेयरी', labelEn: 'Pashu-Dairy' },
  { emoji: '🐟', labelHi: 'मछली', labelEn: 'Machli' },
];

export function OccupationCards({ visible, onSelect }: OccupationCardsProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="flex justify-center gap-3 py-3"
        >
          {options.map((opt, i) => (
            <motion.button
              key={opt.labelEn}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 300 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelect(opt.labelHi)}
              className="flex flex-col items-center justify-center rounded-2xl bg-white border-2 border-border hover:border-[#FF9933] transition-all"
              style={{ width: 100, height: 80 }}
            >
              <span style={{ fontSize: 28 }}>{opt.emoji}</span>
              <span
                className="text-[#000080] mt-1"
                style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}
              >
                {opt.labelHi}
              </span>
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
