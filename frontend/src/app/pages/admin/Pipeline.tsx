import React, { useState } from 'react';
import { useLang } from '../../context/LanguageContext';
import { mockPipelineQueue } from '../../utils/mockData';
import { Play, Check, X, AlertTriangle } from 'lucide-react';

const failLabels: Record<string, { en: string; hi: string }> = {
  missing_ministry: { en: 'Missing ministry', hi: 'मंत्रालय नहीं' },
  missing_eligibility: { en: 'No eligibility criteria', hi: 'पात्रता मानदंड नहीं' },
  zero_benefit: { en: 'Benefit value is zero', hi: 'लाभ राशि शून्य' },
  no_steps: { en: 'Fewer than 2 application steps', hi: '2 से कम कदम' },
  low_confidence: { en: 'Groq extraction confidence < 0.8', hi: 'कम विश्वसनीयता' },
};

export function Pipeline() {
  const { lang, t } = useLang();
  const [queue, setQueue] = useState(mockPipelineQueue);
  const [running, setRunning] = useState(false);

  const handleRun = () => { setRunning(true); setTimeout(() => setRunning(false), 3000); };
  const handleApprove = (id: string) => setQueue(q => q.filter(i => i.id !== id));
  const handleReject = (id: string) => setQueue(q => q.filter(i => i.id !== id));

  return (
    <div>
      <h1 className="text-[#000080] mb-6" style={{ fontWeight: 700 }}>{t('admin.pipeline')}</h1>

      {/* Status Bar */}
      <div className="bg-white rounded-xl border border-border p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-6" style={{ fontSize: '0.85rem' }}>
            <div><span className="text-muted-foreground">Last run:</span> <span style={{ fontWeight: 500 }}>22 Mar 2026, 14:30</span></div>
            <div><span className="text-muted-foreground">PDFs:</span> <span style={{ fontWeight: 500 }}>127</span></div>
            <div><span className="text-[#138808]" style={{ fontWeight: 500 }}>Passed: 115</span></div>
            <div><span className="text-destructive" style={{ fontWeight: 500 }}>Failed: {queue.length}</span></div>
          </div>
          <button
            onClick={handleRun}
            disabled={running}
            className="px-4 py-2 rounded-full bg-[#000080] text-white flex items-center gap-2 disabled:opacity-50"
            style={{ fontSize: '0.85rem' }}
          >
            <Play className="w-4 h-4" /> {running ? 'Running...' : t('admin.run_pipeline')}
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
                  <p style={{ fontWeight: 600 }}>{item.schemeName}</p>
                  <p className="text-muted-foreground" style={{ fontSize: '0.8rem' }}>{item.ministry} | {item.pdf}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.failReasons.map(r => (
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
          {queue.length === 0 && <p className="text-muted-foreground text-center py-4" style={{ fontSize: '0.85rem' }}>No items pending review</p>}
        </div>
      </div>

      {/* Ingest Log */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="mb-4" style={{ fontWeight: 600 }}>Ingest Log</h3>
        <div className="bg-[#1a1a2e] rounded-lg p-4 font-mono overflow-x-auto max-h-60 overflow-y-auto" style={{ fontSize: '0.75rem' }}>
          {[
            { time: '14:30:12', type: 'INGEST', name: 'PM-KISAN', status: 'ingested', color: '#138808' },
            { time: '14:30:09', type: 'INGEST', name: 'Ayushman Bharat', status: 'ingested', color: '#138808' },
            { time: '14:30:05', type: 'QUEUE', name: 'Indira Gandhi Pension', status: 'queued', color: '#FF9933' },
            { time: '14:29:58', type: 'REJECT', name: 'Unknown Scheme', status: 'rejected', color: '#dc2626' },
            { time: '14:29:50', type: 'INGEST', name: 'MGNREGA', status: 'ingested', color: '#138808' },
          ].map((log, i) => (
            <div key={i} className="text-white/70">
              <span className="text-white/40">{log.time}</span> <span style={{ color: log.color }}>[{log.status.toUpperCase()}]</span> {log.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
