import React, { useState, useEffect } from 'react';
import { useLang } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

const schemeColors: Record<string, string> = {
  'PM-KISAN': '#FF9933',
  'Ayushman': '#000080',
  'MGNREGA': '#138808',
  'PM-KMY': '#138808',
  'KCC': '#000080',
  'Ujjwala': '#FF9933',
};

const benefits = [
  { state: 'Rajasthan', amount: 2000, scheme: 'PM-KISAN' },
  { state: 'Bihar', amount: 5000, scheme: 'Ayushman' },
  { state: 'Uttar Pradesh', amount: 12000, scheme: 'KCC' },
  { state: 'Maharashtra', amount: 8000, scheme: 'MGNREGA' },
  { state: 'West Bengal', amount: 3500, scheme: 'PM-KMY' },
  { state: 'Madhya Pradesh', amount: 6000, scheme: 'Ujjwala' },
];

const stateNames: Record<string, Record<string, string>> = {
  'Rajasthan': { hi: 'राजस्थान', bn: 'রাজস্থান', ta: 'ராஜஸ்தான்', te: 'రాజస్థాన్' },
  'Bihar': { hi: 'बिहार', bn: 'বিহার', ta: 'பீகார்', te: 'బీహార్' },
  'Uttar Pradesh': { hi: 'उत्तर प्रदेश', bn: 'উত্তর প্রদেশ', ta: 'உத்தரப் பிரதேசம்', te: 'ఉత్తర ప్రదేశ్' },
  'Maharashtra': { hi: 'महाराष्ट्र', bn: 'মহারাষ্ট্র', ta: 'மகாராஷ்டிரா', te: 'మహారాష్ట్ర' },
  'West Bengal': { hi: 'पश्चिम बंगाल', bn: 'পশ্চিমবঙ্গ', ta: 'மேற்கு வங்கம்', te: 'పశ్చిమ బెంగాల్' },
  'Madhya Pradesh': { hi: 'मध्य प्रदेश', bn: 'মধ্যপ্রদেশ', ta: 'மத்தியப் பிரதேசம்', te: 'మధ్య ప్రదేశ్' },
};

export function LiveBenefitTicker() {
  const { lang } = useLang();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % benefits.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const item = benefits[index];
  const stateName = (lang === 'en' ? item.state : stateNames[item.state]?.[lang]) || item.state;
  const dotColor = schemeColors[item.scheme] || '#138808';

  const tickerText = lang === 'hi'
    ? `${stateName} में किसी ने ₹${item.amount.toLocaleString()}/माह प्राप्त किया`
    : `Someone in ${stateName} just found ₹${item.amount.toLocaleString()}/month`;

  return (
    <div className="h-12 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2 text-white/90"
          style={{ fontSize: '0.9rem' }}
        >
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: dotColor }} />
          <span>{tickerText}</span>
          <span className="px-2 py-0.5 rounded-full text-white/70" style={{ fontSize: '0.7rem', backgroundColor: `${dotColor}40` }}>
            {item.scheme}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}