import React, { useState, useEffect } from 'react';
import { useLang } from '../../context/LanguageContext';
import { listSchemes } from '../../services/api';
import type { SchemeResult } from '../../services/api';
import { Search, Download, Eye, Edit2, Trash2 } from 'lucide-react';

const exportCsv = (data: any[], filename: string) => {
  if (!data.length) return;
  const csv = [
    Object.keys(data[0]).join(','),
    ...data.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export function AdminSchemes() {
  const { lang, t } = useLang();
  const [allSchemes, setAllSchemes] = useState<SchemeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    listSchemes()
      .then(d => {
        const list: SchemeResult[] = Array.isArray(d) ? d : (d?.schemes || []);
        setAllSchemes(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = allSchemes.filter(s =>
    s.name_english.toLowerCase().includes(search.toLowerCase()) ||
    (s.ministry || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-[#000080] mb-6" style={{ fontWeight: 700 }}>{t('admin.schemes')}</h1>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-white">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('admin.search_schemes')}
            className="flex-1 bg-transparent outline-none" style={{ fontSize: '0.85rem' }}
          />
        </div>
        <button
          onClick={() => exportCsv(filtered.map(s => ({
            id: s.scheme_id,
            name: s.name_english,
            ministry: s.ministry || '',
            level: s.level,
            benefit_inr: s.benefit_annual_inr,
            has_monetary: s.has_monetary_benefit,
          })), 'jan_saathi_schemes.csv')}
          className="px-4 py-2 rounded-lg border border-border flex items-center gap-2 hover:bg-muted"
          style={{ fontSize: '0.85rem' }}
        >
          <Download className="w-4 h-4" /> {t('admin.export_csv')}
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">
          {lang === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-x-auto">
          <table className="w-full" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground bg-muted/30">
                <th className="p-3">Name</th>
                <th className="p-3">Ministry</th>
                <th className="p-3">Level</th>
                <th className="p-3">Benefit</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    {lang === 'hi' ? 'कोई योजना नहीं मिली' : 'No schemes found'}
                  </td>
                </tr>
              ) : filtered.map(s => (
                <tr key={s.scheme_id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="p-3" style={{ fontWeight: 500 }}>
                    {lang === 'hi' ? (s.name_hindi || s.name_english) : s.name_english}
                    {s.acronym && (
                      <span className="ml-1.5 text-muted-foreground" style={{ fontSize: '0.7rem' }}>({s.acronym})</span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{s.ministry || '—'}</td>
                  <td className="p-3">
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        fontSize: '0.7rem',
                        backgroundColor: s.level === 'central' ? 'rgba(0,0,128,0.1)' : 'rgba(19,136,8,0.1)',
                        color: s.level === 'central' ? '#000080' : '#138808',
                      }}
                    >
                      {s.level}
                    </span>
                  </td>
                  <td className="p-3 text-[#138808]" style={{ fontWeight: 600 }}>
                    {s.has_monetary_benefit && s.benefit_annual_inr > 0
                      ? `₹${s.benefit_annual_inr.toLocaleString('en-IN')}`
                      : '—'}
                  </td>
                  <td className="p-3">
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        fontSize: '0.7rem',
                        backgroundColor: s.demo_ready ? 'rgba(19,136,8,0.1)' : 'rgba(255,153,51,0.1)',
                        color: s.demo_ready ? '#138808' : '#FF9933',
                      }}
                    >
                      {s.demo_ready ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded hover:bg-muted"><Eye className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 rounded hover:bg-muted"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 rounded hover:bg-muted text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
