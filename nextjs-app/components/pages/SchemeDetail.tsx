'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLang } from '@/context/LanguageContext';
import { useApp } from '@/context/AppContext';
import { getScheme, submitApplication } from '@/lib/api';
import type { SchemeResult } from '@/lib/api';
import { Check, Circle, Play, Pause, ArrowLeft, ExternalLink } from 'lucide-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

export function SchemeDetail() {
  const params = useParams();
  const schemeSlug = typeof params.slug === 'string' ? params.slug : params.slug?.[0];
  const { lang, t } = useLang();
  const { addApplication, sessionId } = useApp();
  const router = useRouter();
  const [scheme, setScheme] = useState<SchemeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [submitState, setSubmitState] = useState<'default' | 'submitting' | 'submitted'>('default');
  const [refNumber, setRefNumber] = useState('');
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!schemeSlug) return;
    getScheme(schemeSlug)
      .then(data => {
        setScheme(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [schemeSlug]);

  if (loading) return <LoadingSkeleton />;
  if (!scheme) return <div className="p-8 text-center">{t('404.body')}</div>;

  const tabs = [t('detail.overview'), t('detail.eligibility'), t('detail.documents'), t('detail.howto')];
  const nameDisplay = lang === 'hi' ? (scheme.name_hindi || scheme.name_english) : scheme.name_english;

  const handleSubmit = async () => {
    setSubmitState('submitting');
    try {
      const resp = await submitApplication({
        session_id: sessionId,
        scheme_id: scheme.scheme_id,
        form_data: {},
        confirmed: true,
      });
      addApplication(resp.reference_number, resp);
      setRefNumber(resp.reference_number);
      setSubmitState('submitted');
    } catch {
      setSubmitState('default');
    }
  };

  if (submitState === 'submitted') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-[#138808]/10 flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-[#138808]" />
        </div>
        <h2 className="text-[#000080] mb-2" style={{ fontWeight: 700 }}>{t('detail.success', { ref_number: refNumber })}</h2>
        <p className="text-muted-foreground mb-6">{t('detail.expected')}</p>
        <button onClick={() => router.push('/track')} className="px-6 py-3 rounded-full bg-[#FF9933] text-white" style={{ fontWeight: 500 }}>
          {t('detail.track_cta')}
        </button>
      </div>
    );
  }

  // Extract spoken content for current language
  const spokenLang = lang === 'hi' ? 'hi' : 'en';
  const overview = scheme.spoken_content?.overview?.[spokenLang]
    || scheme.spoken_content?.intro?.[spokenLang]
    || scheme.eligibility_summary
    || '';
  const eligibilityText = scheme.spoken_content?.eligibility?.[spokenLang]
    || scheme.eligibility_summary
    || '';
  const documentsText = scheme.spoken_content?.documents?.[spokenLang]
    || scheme.spoken_content?.docs?.[spokenLang]
    || '';
  const stepsText = scheme.spoken_content?.steps?.[spokenLang]
    || scheme.spoken_content?.how_to_apply?.[spokenLang]
    || '';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-muted-foreground mb-4" style={{ fontSize: '0.8rem' }}>
        <Link href="/schemes" className="hover:text-foreground">{t('admin.schemes')}</Link>
        <span>&gt;</span>
        <span className="text-foreground">{nameDisplay}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-[#000080]" style={{ fontWeight: 700, fontSize: '1.5rem' }}>{nameDisplay}</h1>
            <p className="text-muted-foreground">{scheme.ministry}</p>
            {scheme.helpline_number && (
              <p className="text-muted-foreground mt-1" style={{ fontSize: '0.8rem' }}>
                Helpline: {scheme.helpline_number}
              </p>
            )}
          </div>
          <div className="text-right">
            {scheme.has_monetary_benefit && scheme.benefit_annual_inr > 0 && (
              <span className="text-[#138808]" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {t('detail.benefit', { value: scheme.benefit_annual_inr.toLocaleString('en-IN') })}
              </span>
            )}
            <div className="mt-1">
              <span
                className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: scheme.level === 'central' ? 'rgba(0,0,128,0.1)' : 'rgba(19,136,8,0.1)',
                  color: scheme.level === 'central' ? '#000080' : '#138808',
                }}
              >
                {scheme.level === 'central' ? (lang === 'hi' ? 'केंद्रीय' : 'Central') : (lang === 'hi' ? 'राज्य' : 'State')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6 overflow-x-auto">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-3 border-b-2 transition whitespace-nowrap ${activeTab === i ? 'border-[#FF9933] text-[#000080]' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            style={{ fontSize: '0.9rem', fontWeight: activeTab === i ? 600 : 400 }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        {activeTab === 0 && (
          <div>
            <h3 className="text-[#000080] mb-3" style={{ fontWeight: 600 }}>{t('detail.what')}</h3>
            {overview ? (
              <p style={{ lineHeight: 1.8 }}>{overview}</p>
            ) : (
              <p className="text-muted-foreground" style={{ lineHeight: 1.8 }}>
                {lang === 'hi' ? 'विवरण उपलब्ध नहीं है।' : 'Description not available.'}
              </p>
            )}
          </div>
        )}
        {activeTab === 1 && (
          <div>
            <h3 className="text-[#000080] mb-3" style={{ fontWeight: 600 }}>{t('detail.qualify')}</h3>
            {eligibilityText ? (
              <p style={{ lineHeight: 1.8 }}>{eligibilityText}</p>
            ) : (
              <p className="text-muted-foreground" style={{ lineHeight: 1.8 }}>
                {lang === 'hi'
                  ? 'पात्रता विवरण के लिए आधिकारिक पोर्टल देखें।'
                  : 'See official portal for eligibility details.'}
              </p>
            )}
          </div>
        )}
        {activeTab === 2 && (
          <div>
            <h3 className="text-[#000080] mb-3" style={{ fontWeight: 600 }}>{t('detail.need')}</h3>
            {documentsText ? (
              <p style={{ lineHeight: 1.8 }}>{documentsText}</p>
            ) : (
              <p className="text-muted-foreground" style={{ lineHeight: 1.8 }}>
                {lang === 'hi'
                  ? 'आवश्यक दस्तावेज़ों की सूची के लिए आधिकारिक पोर्टल देखें।'
                  : 'Visit the official portal for the list of required documents.'}
              </p>
            )}
            <p className="mt-4 p-3 rounded-lg bg-[#FF9933]/10 text-[#FF9933]" style={{ fontSize: '0.85rem' }}>
              {t('detail.note')}
            </p>
          </div>
        )}
        {activeTab === 3 && (
          <div>
            <h3 className="text-[#000080] mb-3" style={{ fontWeight: 600 }}>{t('detail.steps')}</h3>
            {stepsText ? (
              <p style={{ lineHeight: 1.8 }}>{stepsText}</p>
            ) : (
              <p className="text-muted-foreground" style={{ lineHeight: 1.8 }}>
                {lang === 'hi'
                  ? 'आवेदन के चरणों के लिए आधिकारिक पोर्टल देखें।'
                  : 'Visit the official portal for step-by-step application instructions.'}
              </p>
            )}
            {(scheme.portal_url || scheme.form_pdf_url) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {scheme.portal_url && (
                  <a
                    href={scheme.portal_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#000080] hover:underline"
                    style={{ fontSize: '0.9rem' }}
                  >
                    <ExternalLink className="w-4 h-4" /> {t('detail.official')}
                  </a>
                )}
                {scheme.form_pdf_url && (
                  <a
                    href={scheme.form_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#138808] hover:underline ml-4"
                    style={{ fontSize: '0.9rem' }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    {lang === 'hi' ? 'फॉर्म PDF' : 'Form PDF'}
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Panel */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setPlaying(!playing)}
          className="px-5 py-2.5 rounded-full border border-[#000080] text-[#000080] flex items-center gap-2"
          style={{ fontSize: '0.9rem' }}
        >
          {playing ? <><Pause className="w-4 h-4" /> {t('detail.pause')}</> : <><Play className="w-4 h-4" /> {t('detail.listen')}</>}
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitState === 'submitting'}
          className="px-6 py-2.5 rounded-full bg-[#138808] text-white flex items-center gap-2 hover:bg-[#0f6d06] transition disabled:opacity-50"
          style={{ fontSize: '0.9rem', fontWeight: 500 }}
        >
          {submitState === 'submitting' ? t('detail.submitting') : t('detail.submit')}
        </button>
        <button onClick={() => router.back()} className="px-5 py-2.5 rounded-full border border-border flex items-center gap-1" style={{ fontSize: '0.9rem' }}>
          <ArrowLeft className="w-4 h-4" /> {t('scheme.back')}
        </button>
      </div>
    </div>
  );
}
