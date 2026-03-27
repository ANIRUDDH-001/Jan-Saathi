import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useLang } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { VedAvatar } from '../components/VedAvatar';
import { Check, Download, Eye, ExternalLink, X, Mic } from 'lucide-react';

type FormStep = 'summary' | 'correction' | 'confirm' | 'generating' | 'success';

const generatingTexts = {
  hi: ['नाम लिख रहा हूं...', 'Bank details डाल रहा हूं...', 'Form तैयार हो रहा है...'],
  en: ['Writing name...', 'Adding bank details...', 'Preparing form...'],
};

export function AgriFormFill() {
  const { lang } = useLang();
  const { profile } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState<FormStep>('summary');
  const [visibleFields, setVisibleFields] = useState(0);
  const [genTextIdx, setGenTextIdx] = useState(0);
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [correctionField, setCorrectionField] = useState<string | null>(null);

  const fields = [
    { key: 'name', label: lang === 'hi' ? 'पूरा नाम' : 'Full Name', value: 'Ramesh Kumar' },
    { key: 'state', label: lang === 'hi' ? 'राज्य' : 'State', value: profile.state || 'Uttar Pradesh' },
    { key: 'district', label: lang === 'hi' ? 'ज़िला' : 'District', value: 'Varanasi' },
    { key: 'aadhaar', label: lang === 'hi' ? 'आधार' : 'Aadhaar', value: 'XXXX-XXXX-1234' },
    { key: 'bank', label: lang === 'hi' ? 'बैंक खाता' : 'Bank Account', value: 'XXXX-XXXX-5678' },
    { key: 'ifsc', label: 'IFSC', value: 'SBIN0001234' },
    { key: 'mobile', label: lang === 'hi' ? 'मोबाइल' : 'Mobile', value: '+91 98765 43210' },
  ];

  // Staggered field reveal in summary
  useEffect(() => {
    if (step === 'summary' && visibleFields < fields.length) {
      const timer = setTimeout(() => setVisibleFields(v => v + 1), 400);
      return () => clearTimeout(timer);
    }
  }, [step, visibleFields, fields.length]);

  // Generating text cycling
  useEffect(() => {
    if (step === 'generating') {
      const texts = lang === 'hi' ? generatingTexts.hi : generatingTexts.en;
      const interval = setInterval(() => {
        setGenTextIdx(i => (i + 1) % texts.length);
      }, 1200);
      const done = setTimeout(() => setStep('success'), 4000);
      return () => { clearInterval(interval); clearTimeout(done); };
    }
  }, [step, lang]);

  const texts = lang === 'hi' ? generatingTexts.hi : generatingTexts.en;

  return (
    <div className="max-w-7xl mx-auto flex h-[calc(100vh-5rem)]">
      {/* Left: Chat panel area */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-background to-white border-r border-border">
        <div className="text-center px-8">
          <VedAvatar size={100} speaking={step === 'summary' || step === 'generating'} />
          <p className="text-[#000080] mt-4" style={{ fontFamily: 'Lora, serif', fontSize: '18px', fontWeight: 600 }}>
            {step === 'summary' && (lang === 'hi' ? 'वेद आपकी जानकारी पढ़ रहा है...' : 'Ved is reading your details...')}
            {step === 'correction' && (lang === 'hi' ? 'बदलाव करें...' : 'Make corrections...')}
            {step === 'confirm' && (lang === 'hi' ? 'क्या मैं form भर दूं?' : 'Should I fill the form?')}
            {step === 'generating' && (lang === 'hi' ? 'फॉर्म बन रहा है...' : 'Form is being generated...')}
            {step === 'success' && (lang === 'hi' ? 'फॉर्म तैयार है!' : 'Form is ready!')}
          </p>
        </div>
      </div>

      {/* Right: Form panel */}
      <div className="flex-1 md:w-[40%] md:flex-none overflow-y-auto p-6 bg-white">
        <AnimatePresence mode="wait">
          {/* Step A: Summary Readback */}
          {step === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <h2 className="text-[#000080] mb-6" style={{ fontFamily: 'Lora, serif', fontSize: '20px', fontWeight: 700 }}>
                {lang === 'hi' ? 'आपकी जानकारी' : 'Your Information'}
              </h2>

              <div className="space-y-3">
                {fields.slice(0, visibleFields).map((f, i) => (
                  <motion.div
                    key={f.key}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0, duration: 0.3 }}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-white"
                  >
                    <span className="text-muted-foreground" style={{ fontSize: '14px', fontFamily: 'Manrope, sans-serif' }}>
                      {f.label}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'Manrope, sans-serif' }}>
                      {f.value}
                    </span>
                  </motion.div>
                ))}
              </div>

              {visibleFields >= fields.length && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 mt-8"
                >
                  <button
                    onClick={() => setStep('confirm')}
                    className="flex-1 py-3.5 rounded-xl text-white flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #138808, #0f6d06)',
                      fontWeight: 600,
                      fontSize: '15px',
                      fontFamily: 'Manrope, sans-serif',
                    }}
                  >
                    {lang === 'hi' ? 'हाँ, सब सही है' : 'Yes, all correct'} ✓
                  </button>
                  <button
                    onClick={() => setStep('correction')}
                    className="flex-1 py-3.5 rounded-xl border-2 border-[#000080] text-[#000080] flex items-center justify-center gap-2"
                    style={{ fontWeight: 600, fontSize: '15px', fontFamily: 'Manrope, sans-serif' }}
                  >
                    {lang === 'hi' ? 'कुछ बदलना है' : 'Need changes'} ✗
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step B: Correction Mode */}
          {step === 'correction' && (
            <motion.div
              key="correction"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <h2 className="text-[#000080] mb-6" style={{ fontFamily: 'Lora, serif', fontSize: '20px', fontWeight: 700 }}>
                {lang === 'hi' ? 'बदलाव करें' : 'Make Corrections'}
              </h2>

              <div className="space-y-3">
                {fields.map(f => (
                  <div
                    key={f.key}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                      correctionField === f.key ? 'border-[#FF9933] bg-[#FF9933]/5' : 'border-border'
                    }`}
                  >
                    <div className="flex-1">
                      <span className="text-muted-foreground block" style={{ fontSize: '12px', fontFamily: 'Manrope, sans-serif' }}>
                        {f.label}
                      </span>
                      <input
                        defaultValue={f.value}
                        className="w-full bg-transparent outline-none mt-1"
                        style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'Manrope, sans-serif' }}
                        onFocus={() => setCorrectionField(f.key)}
                        onBlur={() => setCorrectionField(null)}
                      />
                    </div>
                    <Mic className="w-5 h-5 text-muted-foreground hover:text-[#FF9933] cursor-pointer transition-colors" />
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep('confirm')}
                className="w-full mt-6 py-3.5 rounded-xl text-white"
                style={{
                  background: 'linear-gradient(135deg, #138808, #0f6d06)',
                  fontWeight: 600,
                  fontSize: '15px',
                  fontFamily: 'Manrope, sans-serif',
                }}
              >
                {lang === 'hi' ? 'ठीक है, आगे बढ़ें' : 'OK, proceed'} →
              </button>
            </motion.div>
          )}

          {/* Step C: Final Confirmation */}
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
              <p className="text-[#000080] mb-2" style={{ fontFamily: 'Lora, serif', fontSize: '22px' }}>
                {lang === 'hi' ? 'क्या मैं form भर दूं?' : 'Should I fill the form?'}
              </p>
              <p className="text-muted-foreground mb-8" style={{ fontSize: '14px', fontFamily: 'Manrope, sans-serif' }}>
                PM-KISAN Samman Nidhi 📄
              </p>

              <button
                onClick={() => setStep('generating')}
                className="w-full max-w-sm py-4 rounded-xl text-white mb-3"
                style={{
                  background: 'linear-gradient(90deg, #FF9933, #e8882d)',
                  fontWeight: 700,
                  fontSize: '16px',
                  fontFamily: 'Manrope, sans-serif',
                }}
              >
                {lang === 'hi' ? 'हाँ, भर दो' : 'Yes, fill it'}
              </button>
              <button
                onClick={() => navigate('/chat')}
                className="text-muted-foreground hover:text-foreground transition"
                style={{ fontSize: '14px', fontFamily: 'Manrope, sans-serif' }}
              >
                {lang === 'hi' ? 'बाद में' : 'Later'}
              </button>
            </motion.div>
          )}

          {/* Step D: PDF Generation Loading */}
          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <VedAvatar size={120} speaking />

              {/* Pencil animation */}
              <div className="mt-6 w-48 h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#FF9933] rounded-full"
                  animate={{ width: ['0%', '100%'] }}
                  transition={{ duration: 4, ease: 'linear' }}
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.p
                  key={genTextIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-muted-foreground mt-4"
                  style={{ fontSize: '14px', fontFamily: 'Manrope, sans-serif' }}
                >
                  {texts[genTextIdx]}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}

          {/* Step E: Success & Download */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-20 h-20 rounded-full bg-[#138808] flex items-center justify-center mb-4"
              >
                <Check className="w-10 h-10 text-white" />
              </motion.div>

              <p className="text-[#138808] mb-6" style={{ fontFamily: 'Lora, serif', fontSize: '24px' }}>
                {lang === 'hi' ? 'Form तैयार है!' : 'Form is ready!'}
              </p>

              <div className="w-full max-w-sm space-y-3">
                <button
                  className="w-full py-3.5 rounded-xl text-white flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(90deg, #FF9933, #e8882d)', fontWeight: 600, fontSize: '15px' }}
                >
                  <Download className="w-5 h-5" />
                  {lang === 'hi' ? 'PDF Download करें' : 'Download PDF'}
                </button>

                <button
                  onClick={() => setShowPdfPreview(true)}
                  className="w-full py-3.5 rounded-xl border-2 border-[#000080] text-[#000080] flex items-center justify-center gap-2"
                  style={{ fontWeight: 600, fontSize: '15px' }}
                >
                  <Eye className="w-5 h-5" />
                  {lang === 'hi' ? 'Screen पर देखें' : 'View on screen'}
                </button>

                <button
                  onClick={() => setShowPortalModal(true)}
                  className="w-full py-3.5 rounded-xl border-2 border-[#138808] text-[#138808] flex items-center justify-center gap-2"
                  style={{ fontWeight: 600, fontSize: '15px' }}
                >
                  <ExternalLink className="w-5 h-5" />
                  pmkisan.gov.in {lang === 'hi' ? 'पर भेजें' : 'submit'}
                </button>
                <p className="text-center text-muted-foreground" style={{ fontSize: '10px' }}>
                  APISetu se jud jaega
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Portal Submission Modal */}
      <AnimatePresence>
        {showPortalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPortalModal(false)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 mx-4 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#000080]" style={{ fontWeight: 700, fontSize: '16px' }}>Portal Submission</h3>
                <button onClick={() => setShowPortalModal(false)}><X className="w-5 h-5" /></button>
              </div>

              <p className="text-muted-foreground mb-4" style={{ fontSize: '14px' }}>
                {lang === 'hi' ? 'यह form pmkisan.gov.in पर submit होगा' : 'This form will be submitted to pmkisan.gov.in'}
              </p>

              <div
                className="border-2 border-dashed border-[#FF9933]/50 rounded-xl p-4 text-center mb-4"
              >
                <p className="text-[#000080]" style={{ fontWeight: 600, fontSize: '14px' }}>APISetu Integration</p>
                <p className="text-muted-foreground" style={{ fontSize: '12px' }}>Registration Pending</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="w-2 h-2 rounded-full bg-[#FF9933]" />
                  <span style={{ fontSize: '12px', color: '#FF9933', fontWeight: 500 }}>Pending</span>
                </div>
              </div>

              <a
                href="https://apisetu.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#000080] hover:underline block text-center mb-4"
                style={{ fontSize: '13px' }}
              >
                APISetu par register karein →
              </a>

              <div className="bg-[#138808]/10 rounded-xl p-3 text-center">
                <p className="text-[#138808]" style={{ fontSize: '13px', fontWeight: 500 }}>
                  {lang === 'hi'
                    ? 'अभी के लिए: CSC केंद्र पर यह PDF लेकर जाएं'
                    : 'For now: Take this PDF to your nearest CSC center'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Preview Modal */}
      <AnimatePresence>
        {showPdfPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPdfPreview(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-t-2xl w-full max-w-2xl shadow-2xl"
              style={{ height: '85vh' }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 style={{ fontWeight: 600, fontSize: '16px' }}>PM-KISAN Form</h3>
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer" />
                  <button onClick={() => setShowPdfPreview(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto" style={{ height: 'calc(85vh - 60px)' }}>
                {/* Mock PDF preview */}
                <div className="border-2 border-border rounded-lg p-6 bg-white">
                  <div className="text-center mb-6">
                    <p style={{ fontWeight: 700, fontSize: '18px', color: '#000080' }}>
                      PM-KISAN SAMMAN NIDHI YOJANA
                    </p>
                    <p className="text-muted-foreground" style={{ fontSize: '12px' }}>Application Form</p>
                  </div>
                  {fields.map(f => (
                    <div key={f.key} className="flex border-b border-border py-3">
                      <span className="w-1/3 text-muted-foreground" style={{ fontSize: '13px' }}>{f.label}</span>
                      <span className="w-2/3" style={{ fontSize: '13px', fontWeight: 500 }}>{f.value}</span>
                    </div>
                  ))}
                  <div className="mt-8 flex justify-between">
                    <div className="text-center">
                      <div className="w-32 border-t border-border pt-2">
                        <p className="text-muted-foreground" style={{ fontSize: '11px' }}>Applicant Signature</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="w-32 border-t border-border pt-2">
                        <p className="text-muted-foreground" style={{ fontSize: '11px' }}>Official Stamp</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
