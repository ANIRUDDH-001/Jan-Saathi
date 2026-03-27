import React from 'react';
import { useLang } from '../../context/LanguageContext';
import { mockRecentSessions } from '../../utils/mockData';
import { Download } from 'lucide-react';

export function Sessions() {
  const { t } = useLang();
  return (
    <div>
      <h1 className="text-[#000080] mb-6" style={{ fontWeight: 700 }}>{t('admin.sessions')}</h1>

      <div className="bg-white rounded-xl border border-border overflow-x-auto mb-6">
        <table className="w-full" style={{ fontSize: '0.8rem' }}>
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground bg-muted/30">
              <th className="p-3">Session ID</th><th className="p-3">Date</th><th className="p-3">State</th><th className="p-3">Profile %</th><th className="p-3">Gap (₹)</th><th className="p-3">Schemes</th>
            </tr>
          </thead>
          <tbody>
            {mockRecentSessions.map(s => (
              <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20 cursor-pointer">
                <td className="p-3 text-muted-foreground">{s.id}</td>
                <td className="p-3">{s.timestamp}</td>
                <td className="p-3">{s.state}</td>
                <td className="p-3">{Math.round((s.fieldsCount / 7) * 100)}%</td>
                <td className="p-3 text-[#138808]">₹{(Math.random() * 500000).toFixed(0)}</td>
                <td className="p-3">{s.schemesMatched}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-border p-5 mb-6">
        <h3 className="mb-4" style={{ fontWeight: 600 }}>{t('admin.query_patterns')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ fontSize: '0.85rem' }}>
          <div>
            <p className="text-muted-foreground mb-2" style={{ fontSize: '0.75rem' }}>Top Occupation + State combos</p>
            {['Farmer × UP', 'Daily wage × Bihar', 'Homemaker × Rajasthan', 'Student × Maharashtra', 'Laborer × MP'].map((c, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/30">
                <span>{c}</span><span className="text-muted-foreground">{Math.floor(Math.random() * 200 + 50)}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-muted-foreground mb-2" style={{ fontSize: '0.75rem' }}>Most asked schemes</p>
            {['PM-KISAN', 'Ayushman Bharat', 'MGNREGA', 'PM Awas', 'Ujjwala'].map((c, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/30">
                <span>{c}</span><span className="text-muted-foreground">{Math.floor(Math.random() * 100 + 20)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="px-4 py-2 rounded-lg border border-border flex items-center gap-2 hover:bg-muted" style={{ fontSize: '0.85rem' }}>
        <Download className="w-4 h-4" /> {t('admin.export_rag')}
      </button>
    </div>
  );
}
