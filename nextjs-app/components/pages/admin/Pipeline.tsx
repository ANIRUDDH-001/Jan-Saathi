'use client';

import React, { useState, useEffect } from 'react';
import { useLang } from '@/context/LanguageContext';
import { getAdminIntegrations } from '@/lib/api';
import { Play, Check, X, AlertTriangle, RefreshCw } from 'lucide-react';

const failLabels: Record<string, { en: string; hi: string }> = {
  missing_ministry: { en: 'Missing ministry', hi: 'मंत्रालय नहीं' },
  missing_eligibility: { en: 'No eligibility criteria', hi: 'पात्रता मानदंड नहीं' },
  zero_benefit: { en: 'Benefit value is zero', hi: 'लाभ राशि शून्य' },
  no_steps: { en: 'Fewer than 2 application steps', hi: '2 से कम कदम' },
  low_confidence: { en: 'Groq extraction confidence < 0.8', hi: 'कम विश्वसनीयता' },
};

export function Pipeline() {
  const { lang, t } = useLang();
  const [queue, setQueue] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);

  const fetchIntegrations = () => {
    setLoadingIntegrations(true);
    getAdminIntegrations()
      .then(d => {
        const list = Array.isArray(d) ? d : (d?.apis || d?.services || []);
        setIntegrations(list);
      })
      .catch(() => {})
      .finally(() => setLoadingIntegrations(false));
  };

  useEffect(() => {
    fetchIntegrations();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchIntegrations, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRun = () => { setRunning(true); setTimeout(() => setRunning(false), 3000); };
  const handleApprove = (id: string) => setQueue(q => q.filter(i => i.id !== id));
  const handleReject = (id: string) => setQueue(q => q.filter(i => i.id !== id));

  return (
    <div>
      <h1 className="text-[#000080] mb-6" style={{ fontWeight: 700 }}>{t('admin.pipeline')}</h1>

      {/* Service Health Cards */}
      <div className="bg-white rounded-xl border border-border p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontWeight: 600 }}>
            {lang === 'hi' ? 'सेवा स्वास्थ्य' : 'Service Health'}
          </h3>
          <button
            onClick={fetchIntegrations}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            style={{ fontSize: '0.8rem' }}
          >
            <RefreshCw className={`w-4 h-4 ${loadingIntegrations ? 'animate-spin' : ''}`} />
            {lang === 'hi' ? 'ताज़ा करें' : 'Refresh'}
          </button>
        </div>

        {loadingIntegrations ? (
          <div className="py-4 text-center text-muted-foreground" style={{ fontSize: '0.85rem' }}>
            {lang === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}
          </div>
        ) : integrations.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground" style={{ fontSize: '0.85rem' }}>
            {lang === 'hi' ? 'कोई सेवा डेटा नहीं' : 'No service data available'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((svc: any, i: number) => {
              const isUp = svc.status === 'ok' || svc.status === 'healthy' || svc.status === 'live';
              return (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-border"
                  style={{ backgroundColor: isUp ? 'rgba(19,136,8,0.03)' : 'rgba(220,38,38,0.03)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: isUp ? '#138808' : '#dc2626' }}
                    />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {svc.name || svc.service || `Service ${i + 1}`}
                    </span>
                  </div>
                  {svc.latency_ms !== undefined && (
                    <p className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>
                      {lang === 'hi' ? 'विलंबता:' : 'Latency:'} {svc.latency_ms}ms
                    </p>
                  )}
                  {svc.model && (
                    <p className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>
                      {lang === 'hi' ? 'मॉडल:' : 'Model:'} {svc.model}
                    </p>
                  )}
                  {svc.description && (
                    <p className="text-muted-foreground mt-1" style={{ fontSize: '0.75rem' }}>
                      {svc.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-white rounded-xl border border-border p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-6" style={{ fontSize: '0.85rem' }}>
            <div><span className="text-muted-foreground">{lang === 'hi' ? 'अंतिम रन:' : 'Last run:'}</span> <span style={{ fontWeight: 500 }}>—</span></div>
            <div><span className="text-destructive" style={{ fontWeight: 500 }}>Failed: {queue.length}</span></div>
          </div>
          <button
            onClick={handleRun}
            disabled={running}
            className="px-4 py-2 rounded-full bg-[#000080] text-white flex items-center gap-2 disabled:opacity-50"
            style={{ fontSize: '0.85rem' }}
          >
            <Play className="w-4 h-4" /> {running ? (lang === 'hi' ? 'चल रहा है...' : 'Running...') : t('admin.run_pipeline')}
          </button>
        </div>
      </div>

      {/* Review Queue */}
      <div className="bg-white rounded-xl border border-border p-5 mb-6">
        <h3 className="mb-4" style={{ fontWeight: 600 }}>
          {t('admin.review_queue', { count: queue.length })}
        </h3>
        <div className="space-y-3">
          {queue.map(item => (
            <div key={item.id} className="p-4 rounded-lg border border-border">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <p style={{ fontWeight: 600 }}>{item.schemeName || item.scheme_name}</p>
                  <p className="text-muted-foreground" style={{ fontSize: '0.8rem' }}>
                    {item.ministry} | {item.pdf}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(item.failReasons || item.fail_reasons || []).map((r: string) => (
                      <span key={r} className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1" style={{ fontSize: '0.7rem' }}>
                        <AlertTriangle className="w-3 h-3" />
                        {lang === 'hi' ? failLabels[r]?.hi : failLabels[r]?.en}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(item.id)} className="px-3 py-1.5 rounded-full bg-[#138808] text-white flex items-center gap-1" style={{ fontSize: '0.8rem' }}>
                    <Check className="w-3.5 h-3.5" /> {t('admin.approve')}
                  </button>
                  <button onClick={() => handleReject(item.id)} className="px-3 py-1.5 rounded-full bg-destructive text-white flex items-center gap-1" style={{ fontSize: '0.8rem' }}>
                    <X className="w-3.5 h-3.5" /> {t('admin.reject')}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {queue.length === 0 && (
            <p className="text-muted-foreground text-center py-4" style={{ fontSize: '0.85rem' }}>
              {lang === 'hi' ? 'समीक्षा के लिए कोई आइटम नहीं' : 'No items pending review'}
            </p>
          )}
        </div>
      </div>

      {/* Ingest Log */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="mb-4" style={{ fontWeight: 600 }}>
          {lang === 'hi' ? 'इनजेस्ट लॉग' : 'Ingest Log'}
        </h3>
        <div className="bg-[#1a1a2e] rounded-lg p-4 font-mono overflow-x-auto max-h-60 overflow-y-auto" style={{ fontSize: '0.75rem' }}>
          <div className="text-white/50 text-center py-2">
            {lang === 'hi' ? 'पाइपलाइन चलाने पर लॉग यहाँ दिखेंगे।' : 'Logs will appear here after running the pipeline.'}
          </div>
        </div>
      </div>
    </div>
  );
}
