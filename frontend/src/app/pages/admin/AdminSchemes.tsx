import React, { useState } from 'react';
import { useLang } from '../../context/LanguageContext';
import { mockSchemes } from '../../utils/mockData';
import { Search, Download, Eye, Edit2, Trash2 } from 'lucide-react';

export function AdminSchemes() {
  const { lang, t } = useLang();
  const [search, setSearch] = useState('');
  const filtered = mockSchemes.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.ministry.toLowerCase().includes(search.toLowerCase()));

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
        <button className="px-4 py-2 rounded-lg border border-border flex items-center gap-2 hover:bg-muted" style={{ fontSize: '0.85rem' }}>
          <Download className="w-4 h-4" /> {t('admin.export_csv')}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-x-auto">
        <table className="w-full" style={{ fontSize: '0.8rem' }}>
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground bg-muted/30">
              <th className="p-3">Name</th><th className="p-3">Ministry</th><th className="p-3">Domain</th><th className="p-3">Benefit</th><th className="p-3">Status</th><th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20">
                <td className="p-3" style={{ fontWeight: 500 }}>{lang === 'hi' ? s.nameHi : s.name}</td>
                <td className="p-3 text-muted-foreground">{lang === 'hi' ? s.ministryHi : s.ministry}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-[#000080]/10 text-[#000080]" style={{ fontSize: '0.7rem' }}>{s.domain}</span></td>
                <td className="p-3 text-[#138808]" style={{ fontWeight: 600 }}>₹{s.benefit.toLocaleString('en-IN')}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700" style={{ fontSize: '0.7rem' }}>Approved</span></td>
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
    </div>
  );
}
