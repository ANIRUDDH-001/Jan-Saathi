/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLang } from '@/context/LanguageContext';
import { useApp } from '@/context/AppContext';
import { listSchemes } from '@/lib/api';
import type { SchemeResult } from '@/lib/api';
import { ChevronDown, ChevronUp, ArrowLeft, FileText, ExternalLink, Volume2, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const levelColors: Record<string, string> = {
  central: '#000080',
  state: '#138808',
};

function getMatchReasons(scheme: SchemeResult, profile: any, lang: string) {
  const reasons = [];

  if (scheme.name_english.toLowerCase().includes('farmer') || scheme.name_english.toLowerCase().includes('kisan')) {
    reasons.push(
      lang === 'hi'
        ? `पेशा: ${profile.occupation || 'किसान'}`
        : `Occupation: ${profile.occupation || 'Farmer'}`
    );
  }
  if (profile.age && parseInt(profile.age) >= 18) {
    const age = parseInt(profile.age);
    if (age >= 60) {
      reasons.push(lang === 'hi' ? `वरिष्ठ नागरिक (${age})` : `Senior Citizen (${age})`);
    } else {
      reasons.push(lang === 'hi' ? `उम्र: ${age} वर्ष` : `Age: ${age} years`);
    }
  }
  if (profile.state) {
    reasons.push(lang === 'hi' ? `राज्य: ${profile.state}` : `State: ${profile.state}`);
  }
  if (profile.income) {
    const income = parseInt(profile.income);
    if (income < 200000) {
      reasons.push(
        lang === 'hi'
          ? `आमदनी ₹${income.toLocaleString('en-IN')} < ₹2,00,000`
          : `Income ₹${income.toLocaleString('en-IN')} < ₹2,00,000 limit`
      );
    }
  }
  if (profile.category && profile.category !== 'General') {
    reasons.push(lang === 'hi' ? `वर्ग: ${profile.category}` : `Category: ${profile.category}`);
  }
  if (profile.bpl === 'Yes' || profile.bpl === 'हाँ') {
    reasons.push(lang === 'hi' ? 'बीपीएल परिवार' : 'BPL Family');
  }

  return reasons.slice(0, 3);
}

export function Schemes() {
  const { lang, t } = useLang();
  const { schemes: contextSchemes, gapValue, profile } = useApp();
  const router = useRouter();
  const [schemes, setSchemes] = useState<SchemeResult[]>(contextSchemes);
  const [loading, setLoading] = useState(contextSchemes.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState('highest');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [listeningTo, setListeningTo] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<Record<string, number>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Use context schemes if available (they have similarity scores from the chat session)
    if (contextSchemes.length > 0) {
      setSchemes(contextSchemes);
      setLoading(false);
      return;
    }
    // Otherwise fetch all schemes from the API
    const fetchSchemes = async () => {
      try {
        const result = await listSchemes(profile.state as string || undefined);
        const list: SchemeResult[] = Array.isArray(result) ? result : (result.schemes || []);
        setSchemes(list);
      } catch {
        setError(lang === 'hi' ? 'योजनाएं लोड नहीं हो पाईं। दोबारा try करें।' : 'Could not load schemes. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchSchemes();
  }, []);

  // Keep in sync if context schemes update (e.g. user returns to this page after chat)
  useEffect(() => {
    if (contextSchemes.length > 0) setSchemes(contextSchemes);
  }, [contextSchemes]);

  const filtered = [...schemes].sort((a, b) =>
    sort === 'highest'
      ? b.benefit_annual_inr - a.benefit_annual_inr
      : sort === 'best'
      ? b.similarity - a.similarity
      : 0 // 'easiest' — no steps field; keep order
  );

  const handleListenToGuide = (schemeId: string) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (listeningTo === schemeId) {
      setListeningTo(null);
    } else {
      setListeningTo(schemeId);
      intervalRef.current = setTimeout(() => {
        setListeningTo(null);
      }, 5000);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-4 border-[#FF9933] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">{lang === 'hi' ? 'योजनाएं ढूंढ रहे हैं...' : 'Loading schemes...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <button
          onClick={() => { setError(null); setLoading(true); }}
          className="px-6 py-2 rounded-full bg-primary text-primary-foreground"
        >
          {lang === 'hi' ? 'फिर कोशिश करें' : 'Retry'}
        </button>
      </div>
    );
  }

  if (schemes.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">{t('scheme.empty')}</p>
        <button onClick={() => router.push('/chat')} className="px-6 py-2 rounded-full bg-primary text-primary-foreground">{t('scheme.update')}</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-8 rounded-3xl bg-gradient-to-br from-[#FF9933] via-[#FF9933] to-[#138808] text-white mb-8 overflow-hidden shadow-2xl"
      >
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)
              `
            }}
          />
        </div>
        <div className="relative z-10">
          <div className="flex items-start gap-3 mb-2">
            <Sparkles className="w-7 h-7 text-white" />
            <h1
              style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, fontFamily: 'Lora, serif' }}
            >
              {t('schemes.gap_banner', { gap_value: gapValue.toLocaleString('en-IN'), count: schemes.length })}
            </h1>
          </div>
          <p className="text-white/90 ml-10" style={{ fontSize: '0.95rem' }}>
            {t('schemes.gap_sub', { state: String(profile.state || ''), occupation: String(profile.occupation || ''), age: String(profile.age || ''), income: String(profile.income || '') })}
          </p>
        </div>
      </motion.div>

      <div className="flex flex-wrap items-center gap-2 mb-6 justify-end">
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="px-4 py-2 rounded-xl border-2 border-border bg-white focus:border-[#FF9933] outline-none transition-all shadow-sm"
          style={{ fontSize: '0.85rem', fontWeight: 500 }}
        >
          <option value="highest">{t('sort.highest')}</option>
          <option value="best">{t('sort.best')}</option>
          <option value="easiest">{t('sort.easiest')}</option>
        </select>
      </div>

      <div className="space-y-5">
        <AnimatePresence>
          {filtered.map((scheme, index) => {
            const expanded = expandedId === scheme.scheme_id;
            const matchReasons = getMatchReasons(scheme, profile, lang);
            const isListening = listeningTo === scheme.scheme_id;
            const nameDisplay = lang === 'hi' ? (scheme.name_hindi || scheme.name_english) : scheme.name_english;
            const spokenLang = lang === 'hi' ? 'hi' : 'en';
            const description = scheme.spoken_content?.overview?.[spokenLang]
              || scheme.spoken_content?.intro?.[spokenLang]
              || scheme.eligibility_summary
              || '';

            return (
              <motion.div
                key={scheme.scheme_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl border-2 border-border shadow-md hover:shadow-xl transition-all overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h3
                        style={{ fontWeight: 700, fontSize: '1.15rem', fontFamily: 'Lora, serif' }}
                        className="text-[#000080] mb-1"
                      >
                        {nameDisplay}
                      </h3>
                      <p className="text-muted-foreground" style={{ fontSize: '0.85rem' }}>
                        {scheme.ministry}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          fontFamily: 'Manrope, sans-serif',
                          backgroundColor: scheme.level === 'central' ? 'rgba(0,0,128,0.1)' : 'rgba(19,136,8,0.1)',
                          color: levelColors[scheme.level] || '#666',
                        }}
                      >
                        {scheme.level === 'central'
                          ? (lang === 'hi' ? 'केंद्रीय' : 'Central')
                          : (lang === 'hi' ? 'राज्य' : 'State')}
                      </span>
                    </div>
                  </div>

                  {matchReasons.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {matchReasons.map((reason, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#138808]/10 border border-[#138808]/30"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#138808]" />
                          <span
                            className="text-[#138808]"
                            style={{ fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            {reason}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-4">
                    {scheme.has_monetary_benefit && scheme.benefit_annual_inr > 0 ? (
                      <span
                        className="text-[#138808]"
                        style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Lora, serif' }}
                      >
                        {t('scheme.per_year', { value: scheme.benefit_annual_inr.toLocaleString('en-IN') })}
                      </span>
                    ) : (
                      <span className="text-[#138808]" style={{ fontSize: '1rem', fontWeight: 600 }}>
                        {lang === 'hi' ? 'गैर-मौद्रिक सुविधा' : 'Non-monetary benefit'}
                      </span>
                    )}
                    <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${scheme.similarity * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-[#FF9933] to-[#138808]"
                      />
                    </div>
                    <span
                      className="text-muted-foreground"
                      style={{ fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      {Math.round(scheme.similarity * 100)}%
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpandedId(expanded ? null : scheme.scheme_id)}
                      className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#000080] to-[#000060] text-white flex items-center gap-2 hover:shadow-lg transition-all"
                      style={{ fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      {t('scheme.how_apply')}
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => router.push('/chat')}
                      className="px-5 py-2.5 rounded-full border-2 border-[#FF9933] text-[#FF9933] hover:bg-[#FF9933] hover:text-white transition-all"
                      style={{ fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      {t('scheme.ask')}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t-2 border-border p-5 bg-gradient-to-b from-background/50 to-white space-y-5"
                    >
                      {description ? (
                        <p className="leading-relaxed text-foreground" style={{ fontSize: '0.95rem' }}>
                          {description}
                        </p>
                      ) : null}

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4
                            className="text-[#000080] flex items-center gap-2"
                            style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'Lora, serif' }}
                          >
                            {t('detail.steps')}
                          </h4>
                          {scheme.portal_url && (
                            <button
                              onClick={() => handleListenToGuide(scheme.scheme_id)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                                isListening
                                  ? 'bg-[#FF9933] text-white'
                                  : 'bg-[#FF9933]/10 text-[#FF9933] hover:bg-[#FF9933]/20'
                              }`}
                              style={{ fontSize: '0.85rem', fontWeight: 600 }}
                            >
                              <Volume2 className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
                              {isListening
                                ? (lang === 'hi' ? 'सुन रहे हैं...' : 'Listening...')
                                : (lang === 'hi' ? 'सुनें' : 'Listen to Guide')
                              }
                            </button>
                          )}
                        </div>
                        <p className="text-muted-foreground" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>
                          {scheme.spoken_content?.steps?.[spokenLang]
                            || scheme.spoken_content?.how_to_apply?.[spokenLang]
                            || (lang === 'hi' ? 'आवेदन के चरणों के लिए आधिकारिक पोर्टल देखें।' : 'Visit official portal for application steps.')}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-3">
                        <Link
                          href={`/schemes/${scheme.scheme_id}`}
                          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#138808] to-[#0f6d06] text-white flex items-center gap-2 hover:shadow-lg transition-all"
                          style={{ fontSize: '0.9rem', fontWeight: 600 }}
                        >
                          <FileText className="w-4 h-4" /> {t('scheme.start')}
                        </Link>
                        {scheme.portal_url && (
                          <a
                            href={scheme.portal_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 rounded-full border-2 border-border hover:border-[#138808] flex items-center gap-2 hover:bg-muted transition-all"
                            style={{ fontSize: '0.9rem', fontWeight: 600 }}
                          >
                            <ExternalLink className="w-4 h-4" /> {t('scheme.apply_online')}
                          </a>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <motion.button
        whileHover={{ x: -5 }}
        onClick={() => router.push('/chat')}
        className="mt-8 px-6 py-3 rounded-full border-2 border-border bg-white flex items-center gap-2 hover:bg-muted hover:border-[#FF9933] transition-all shadow-sm"
        style={{ fontSize: '0.95rem', fontWeight: 600 }}
      >
        <ArrowLeft className="w-5 h-5" /> {t('scheme.back')}
      </motion.button>
    </div>
  );
}
