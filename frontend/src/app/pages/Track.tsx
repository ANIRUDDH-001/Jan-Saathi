import React, { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { Search, Check, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { VedAvatarSmall } from '../components/VedAvatar';

export function Track() {
  const { t, lang } = useLang();
  const { applications } = useApp();
  const [refInput, setRefInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  const handleTrack = () => {
    setSearched(true);
    if (applications[refInput]) {
      setResult({ ref: refInput, ...applications[refInput] });
    } else {
      setResult({
        ref: refInput || 'JAN-2026-00341',
        schemeName: 'PM-KISAN Samman Nidhi',
        status: 'state_verified',
        date: '20 Mar 2026',
        expected: '4 Apr 2026',
      });
    }
  };

  const stages = [
    {
      key: 'submitted',
      label: lang === 'hi' ? 'जमा किया' : 'Submitted',
      date: '20 Mar 2026',
      icon: Check,
    },
    {
      key: 'state_verified',
      label: lang === 'hi' ? 'राज्य सत्यापित' : 'State Verified',
      date: '24 Mar 2026',
      icon: Check,
    },
    {
      key: 'central_processed',
      label: lang === 'hi' ? 'केंद्र प्रक्रिया' : 'Central Processed',
      date: null,
      icon: Clock,
    },
    {
      key: 'benefit_released',
      label: lang === 'hi' ? 'लाभ जारी' : 'Benefit Released',
      date: null,
      icon: ArrowRight,
    },
  ];

  const statusOrder = ['submitted', 'state_verified', 'central_processed', 'benefit_released'];
  const stageIndex = result ? statusOrder.indexOf(result.status) : -1;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-[#000080] mb-2" style={{ fontWeight: 700, fontSize: '1.75rem', fontFamily: 'Lora, serif' }}>
          {t('track.header')}
        </h1>
        <p className="text-muted-foreground">{t('track.sub')}</p>
      </div>

      <div className="flex rounded-full border-2 border-border bg-white shadow-sm overflow-hidden focus-within:border-[#FF9933] transition mb-8">
        <input
          value={refInput}
          onChange={e => setRefInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleTrack()}
          placeholder={t('track.placeholder')}
          className="flex-1 px-5 py-3 bg-transparent outline-none"
          style={{ fontFamily: 'Manrope, sans-serif' }}
        />
        <button
          onClick={handleTrack}
          className="px-6 py-3 bg-[#FF9933] text-white hover:bg-[#e8882d] transition flex items-center gap-2"
          style={{ fontWeight: 500 }}
        >
          <Search className="w-4 h-4" /> {t('track.btn')}
        </button>
      </div>

      {searched && !result && (
        <div className="text-center p-6 rounded-xl bg-white border border-border">
          <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t('track.notfound')}</p>
        </div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border-2 border-border p-6 shadow-lg"
        >
          <h3 className="text-center mb-1 text-[#000080]" style={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: 'Lora, serif' }}>
            {result.schemeName}
          </h3>
          <p className="text-center text-muted-foreground mb-8" style={{ fontSize: '0.85rem' }}>
            Ref: {result.ref}
          </p>

          {/* 4-Node Application Journey Timeline */}
          <div className="relative mb-8">
            {/* Connection line */}
            <div className="absolute top-6 left-[12.5%] right-[12.5%] h-1 bg-muted rounded-full">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(stageIndex / (stages.length - 1), 1) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{
                  backgroundColor: result.status === 'rejected' ? '#dc2626' : '#138808',
                }}
              />
            </div>

            <div className="flex items-start justify-between relative">
              {stages.map((stage, i) => {
                const isDone = i <= stageIndex;
                const isCurrent = i === stageIndex;
                const isPending = i > stageIndex;

                return (
                  <div key={stage.key} className="relative z-10 flex flex-col items-center" style={{ width: `${100 / stages.length}%` }}>
                    {/* Ved avatar marker at current node */}
                    {isCurrent && (
                      <motion.div
                        initial={{ scale: 0, y: -10 }}
                        animate={{ scale: 1, y: -8 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className="absolute -top-5"
                      >
                        <VedAvatarSmall />
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.15 }}
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        isDone
                          ? 'bg-[#138808] border-[#138808] text-white shadow-md'
                          : isCurrent
                          ? 'bg-[#FF9933] border-[#FF9933] text-white shadow-lg'
                          : 'bg-white border-border text-muted-foreground'
                      }`}
                      style={{ marginTop: isCurrent ? 16 : 0 }}
                    >
                      <stage.icon className="w-5 h-5" />
                    </motion.div>

                    <span
                      className={`mt-2 text-center ${isDone || isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: isDone || isCurrent ? 600 : 400,
                        fontFamily: 'Manrope, sans-serif',
                      }}
                    >
                      {stage.label}
                    </span>

                    {stage.date && (
                      <span className="text-muted-foreground mt-1" style={{ fontSize: '0.65rem' }}>
                        {stage.date}
                      </span>
                    )}
                    {isPending && (
                      <span className="text-muted-foreground mt-1" style={{ fontSize: '0.65rem' }}>
                        {lang === 'hi' ? 'बाकी' : 'Pending'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center space-y-1 text-muted-foreground" style={{ fontSize: '0.85rem' }}>
            <p>
              {lang === 'hi' ? 'जमा:' : 'Submitted:'} {result.date}
            </p>
            <p>
              {lang === 'hi' ? 'अपेक्षित:' : 'Expected:'} {result.expected}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
