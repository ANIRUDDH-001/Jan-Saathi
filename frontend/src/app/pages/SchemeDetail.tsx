import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useLang } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { mockSchemes } from '../utils/mockData';
import { Check, Circle, Play, Pause, ArrowLeft, ExternalLink } from 'lucide-react';

export function SchemeDetail() {
  const { schemeSlug } = useParams();
  const { lang, t } = useLang();
  const { submitApplication } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [submitState, setSubmitState] = useState<'default' | 'submitting' | 'submitted'>('default');
  const [refNumber, setRefNumber] = useState('');
  const [playing, setPlaying] = useState(false);

  const scheme = mockSchemes.find(s => s.slug === schemeSlug);
  if (!scheme) return <div className="p-8 text-center">{t('404.body')}</div>;

  const tabs = [t('detail.overview'), t('detail.eligibility'), t('detail.documents'), t('detail.howto')];

  const handleSubmit = () => {
    setSubmitState('submitting');
    setTimeout(() => {
      const ref = submitApplication(scheme.id, scheme.name);
      setRefNumber(ref);
      setSubmitState('submitted');
    }, 2000);
  };

  if (submitState === 'submitted') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-[#138808]/10 flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-[#138808]" />
        </div>
        <h2 className="text-[#000080] mb-2" style={{ fontWeight: 700 }}>{t('detail.success', { ref_number: refNumber })}</h2>
        <p className="text-muted-foreground mb-6">{t('detail.expected')}</p>
        <button onClick={() => navigate('/track')} className="px-6 py-3 rounded-full bg-[#FF9933] text-white" style={{ fontWeight: 500 }}>
          {t('detail.track_cta')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-muted-foreground mb-4" style={{ fontSize: '0.8rem' }}>
        <Link to="/schemes" className="hover:text-foreground">{t('admin.schemes')}</Link>
        <span>&gt;</span>
        <span className="text-foreground">{lang === 'hi' ? scheme.nameHi : scheme.name}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-[#000080]" style={{ fontWeight: 700, fontSize: '1.5rem' }}>{lang === 'hi' ? scheme.nameHi : scheme.name}</h1>
            <p className="text-muted-foreground">{lang === 'hi' ? scheme.ministryHi : scheme.ministry}</p>
          </div>
          <div className="text-right">
            <span className="text-[#138808]" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {t('detail.benefit', { value: scheme.benefit.toLocaleString('en-IN') })}
            </span>
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
            <p style={{ lineHeight: 1.8 }}>{lang === 'hi' ? scheme.descriptionHi : scheme.description}</p>
          </div>
        )}
        {activeTab === 1 && (
          <div>
            <h3 className="text-[#000080] mb-3" style={{ fontWeight: 600 }}>{t('detail.qualify')}</h3>
            <div className="space-y-3">
              {scheme.eligibility.map((e, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  {e.matched ? <Check className="w-5 h-5 text-[#138808]" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                  <span style={{ fontSize: '0.9rem' }}>{lang === 'hi' ? e.criterionHi : e.criterion}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 2 && (
          <div>
            <h3 className="text-[#000080] mb-3" style={{ fontWeight: 600 }}>{t('detail.need')}</h3>
            <ol className="list-decimal list-inside space-y-3">
              {scheme.documents.map((d, i) => (
                <li key={i}>
                  <span style={{ fontWeight: 500 }}>{lang === 'hi' ? d.nameHi : d.name}</span>
                  <span className="text-muted-foreground"> — {lang === 'hi' ? d.sourceHi : d.source}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 p-3 rounded-lg bg-[#FF9933]/10 text-[#FF9933]" style={{ fontSize: '0.85rem' }}>
              {t('detail.note')}
            </p>
          </div>
        )}
        {activeTab === 3 && (
          <div>
            <h3 className="text-[#000080] mb-3" style={{ fontWeight: 600 }}>{t('detail.steps')}</h3>
            <ol className="space-y-3">
              {scheme.steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#000080] text-white flex items-center justify-center shrink-0" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{i + 1}</span>
                  <span style={{ fontSize: '0.9rem' }}>{lang === 'hi' ? s.stepHi : s.step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-muted-foreground" style={{ fontSize: '0.85rem' }}>
              {t('detail.office', { office_type: lang === 'hi' ? scheme.officeTypeHi : scheme.officeType })}
            </p>
            {scheme.applyUrl && (
              <a href={scheme.applyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-[#000080] hover:underline" style={{ fontSize: '0.9rem' }}>
                <ExternalLink className="w-4 h-4" /> {t('detail.official')}
              </a>
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
        <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-full border border-border flex items-center gap-1" style={{ fontSize: '0.9rem' }}>
          <ArrowLeft className="w-4 h-4" /> {t('scheme.back')}
        </button>
      </div>
    </div>
  );
}
