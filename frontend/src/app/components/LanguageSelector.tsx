import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Languages, Check, ChevronDown } from 'lucide-react';
import { useLang, languageInfo, type Lang } from '../context/LanguageContext';
import { buttonPress, modalVariants, backdropVariants } from '../utils/animations';

export function LanguageSelector() {
  const { lang, setLang, t } = useLang();
  const [isOpen, setIsOpen] = useState(false);

  const languages: Lang[] = ['hi', 'en', 'bn', 'gu', 'kn', 'ml', 'mr', 'od', 'pa', 'ta', 'te'];

  const handleSelect = (newLang: Lang) => {
    setLang(newLang);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <motion.button
        whileTap={buttonPress}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full border border-border hover:bg-muted/50 transition-all"
        style={{ fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}
      >
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: languageInfo[lang].color }}
        />
        <span className="hidden sm:inline">{languageInfo[lang].nativeName}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* Dropdown Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Panel */}
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="absolute right-0 top-full mt-2 w-[340px] sm:w-[420px] bg-white rounded-2xl shadow-2xl border border-border overflow-hidden z-50"
              style={{
                maxHeight: '70vh',
                overflowY: 'auto'
              }}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-border px-5 py-4 z-10">
                <div className="flex items-center gap-2 mb-1">
                  <Languages className="w-5 h-5 text-[#FF9933]" />
                  <h3 
                    className="text-[#000080]" 
                    style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: 700,
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    {t('nav.language')}
                  </h3>
                </div>
                <p 
                  className="text-muted-foreground" 
                  style={{ 
                    fontSize: '0.8rem',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  {lang === 'hi' ? 'अपनी पसंदीदा भाषा चुनें' : 'Choose your preferred language'}
                </p>
              </div>

              {/* Language Grid (4x3) */}
              <div className="p-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {languages.map((langCode, index) => {
                    const isActive = langCode === lang;
                    const info = languageInfo[langCode];

                    return (
                      <motion.button
                        key={langCode}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ 
                          scale: 1.02,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        whileTap={buttonPress}
                        onClick={() => handleSelect(langCode)}
                        className="relative p-4 rounded-xl border-2 transition-all text-left"
                        style={{
                          borderColor: isActive ? info.color : 'var(--border)',
                          backgroundColor: isActive ? `${info.color}10` : 'white',
                        }}
                      >
                        {/* Color Indicator */}
                        <div 
                          className="w-3 h-3 rounded-full mb-2" 
                          style={{ backgroundColor: info.color }}
                        />

                        {/* Native Name */}
                        <div 
                          className="mb-1"
                          style={{ 
                            fontSize: '0.95rem', 
                            fontWeight: 600,
                            color: isActive ? info.color : '#000080',
                            fontFamily: 'Inter, sans-serif'
                          }}
                        >
                          {info.nativeName}
                        </div>

                        {/* English Name */}
                        <div 
                          className="text-muted-foreground"
                          style={{ 
                            fontSize: '0.7rem',
                            fontFamily: 'Inter, sans-serif'
                          }}
                        >
                          {info.name}
                        </div>

                        {/* Active Checkmark */}
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: info.color }}
                          >
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Footer Note */}
              <div className="border-t border-border px-5 py-3 bg-muted/30">
                <p 
                  className="text-muted-foreground text-center italic"
                  style={{ 
                    fontSize: '0.75rem',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  {lang === 'hi' 
                    ? 'वेद आपकी आवाज़ से भाषा पहचानता है' 
                    : 'Ved automatically detects your language from speech'}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
