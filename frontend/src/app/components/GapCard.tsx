import React from 'react';
import { ChevronRight, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useLang } from '../context/LanguageContext';
import { RupeeDisplay } from './RupeeDisplay';

interface GapCardProps {
  gapValue: number;
  schemeCount: number;
  onViewSchemes: () => void;
}

export function GapCard({ gapValue, schemeCount, onViewSchemes }: GapCardProps) {
  const { t, lang } = useLang();
  const percentage = Math.min((gapValue / 500000) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className="relative overflow-hidden rounded-2xl p-6 shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 153, 51, 0.1) 0%, rgba(19, 136, 8, 0.1) 100%)',
        backdropFilter: 'blur(20px)',
        border: '2px solid',
        borderImage: 'linear-gradient(135deg, #FF9933, #138808) 1'
      }}
    >
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, #FF9933 0%, transparent 50%),
              radial-gradient(circle at 80% 50%, #138808 0%, transparent 50%)
            `
          }}
        />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-[#138808]" />
          <h3 
            className="text-[#000080]" 
            style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'Lora, serif' }}
          >
            {t('gap.your_benefits')}
          </h3>
        </div>

        <div className="mb-6">
          <div className="flex items-baseline gap-2 mb-2">
            <RupeeDisplay 
              value={gapValue} 
              size="xl" 
              color="#138808" 
              showPerYear 
              animated 
              lang={lang}
            />
          </div>

          <div className="relative w-full h-3 bg-white/50 rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, #FF9933 0%, #138808 100%)'
              }}
            />
          </div>

          <p 
            className="text-muted-foreground" 
            style={{ fontSize: '0.8rem', fontFamily: 'Manrope, sans-serif' }}
          >
            {t('gap.across', { scheme_count: schemeCount })}
          </p>
        </div>

        {/* Scheme pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
          {[
            { name: 'PM-KISAN', amount: '₹6,000' },
            { name: 'KCC', amount: '₹3L credit' },
            { name: 'PM-KMY', amount: '₹3,000/माह' },
          ].map((pill, i) => (
            <span
              key={i}
              className="shrink-0 px-3 py-1.5 rounded-full text-white"
              style={{
                backgroundColor: '#FF9933',
                fontSize: '0.75rem',
                fontWeight: 600,
                fontFamily: 'Manrope, sans-serif',
                whiteSpace: 'nowrap',
              }}
            >
              {pill.name} {pill.amount}
            </span>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onViewSchemes}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#138808] to-[#0f6d06] text-white flex items-center justify-center gap-2 hover:shadow-lg transition-all"
          style={{ fontWeight: 600, fontSize: '1rem', fontFamily: 'Manrope, sans-serif' }}
        >
          {t('gap.cta')} 
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
}