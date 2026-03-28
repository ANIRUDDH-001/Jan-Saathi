'use client';

import React, { useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLang } from '@/context/LanguageContext';
import { useApp } from '@/context/AppContext';
import { Edit2, Save, Trash2 } from 'lucide-react';
import { ShubhAvatarProfile } from '@/components/ShubhAvatar';

export function Profile() {
  const { t } = useLang();
  const { isLoggedIn, user, profile, setProfile, logout, schemes } = useApp();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({
    state:      profile.state      || '',
    occupation: profile.occupation || '',
    age:        profile.age        || '',
    income:     profile.income     || '',
    category:   profile.category   || '',
    bpl:        profile.bpl        || '',
    gender:     profile.gender     || '',
  });

  if (!isLoggedIn) {
    router.push('/');
    return null;
  }

  const fields = [
    { key: 'state' as const, label: t('profile.state') },
    { key: 'occupation' as const, label: t('profile.occupation') },
    { key: 'age' as const, label: t('profile.age') },
    { key: 'income' as const, label: t('profile.income') },
    { key: 'category' as const, label: t('profile.category') },
    { key: 'bpl' as const, label: t('profile.bpl') },
    { key: 'gender' as const, label: t('profile.gender') },
  ];

  const handleSave = () => { setProfile(draft); setEditing(false); };
  const handleClear = () => {
    const empty = { state: '', occupation: '', age: '', income: '', category: '', bpl: '', gender: '' };
    setProfile(empty); setDraft(empty);
  };


  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {/* Use ShubhAvatarProfile for a professional look */}
        <ShubhAvatarProfile />
        <div>
          <h1 style={{ fontWeight: 700 }}>{user?.name}</h1>
          <p className="text-muted-foreground" style={{ fontSize: '0.85rem' }}>{user?.email}</p>
          <p className="text-muted-foreground" style={{ fontSize: '0.8rem' }}>{t('profile.saved')}</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#000080]" style={{ fontWeight: 600 }}>{t('profile.header')}</h2>
          <button onClick={() => { setEditing(!editing); setDraft(profile); }} className="text-muted-foreground hover:text-foreground">
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {fields.map(f => (
            <div key={f.key} className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground" style={{ fontSize: '0.85rem' }}>{f.label}</span>
              {editing ? (
                <input
                  value={String(draft[f.key] ?? '')}
                  onChange={e => setDraft({ ...draft, [f.key]: e.target.value })}
                  className="px-3 py-1 rounded border border-border w-40 text-right"
                  style={{ fontSize: '0.85rem' }}
                />
              ) : (
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{String(profile[f.key] || '') || '—'}</span>
              )}
            </div>
          ))}
        </div>
        {editing && (
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="px-4 py-2 rounded-full bg-[#138808] text-white flex items-center gap-1" style={{ fontSize: '0.85rem' }}>
              <Save className="w-4 h-4" /> {t('profile.save')}
            </button>
            <button onClick={handleClear} className="px-4 py-2 rounded-full border border-destructive text-destructive flex items-center gap-1" style={{ fontSize: '0.85rem' }}>
              <Trash2 className="w-4 h-4" /> {t('profile.clear')}
            </button>
          </div>
        )}
      </div>

      {/* Saved Schemes */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h2 className="text-[#000080] mb-4" style={{ fontWeight: 600 }}>{t('profile.schemes_header')}</h2>
        {schemes.length > 0 ? (
          <div className="space-y-2">
            {schemes.map(s => (
              <button
                key={s.scheme_id}
                onClick={() => router.push(`/schemes/${s.scheme_id}`)}
                className="w-full text-left px-4 py-3 rounded-lg border border-border hover:bg-muted transition"
                style={{ fontSize: '0.9rem' }}
              >
                {s.name_english}
                {s.has_monetary_benefit && s.benefit_annual_inr > 0 && (
                  <span className="ml-2 text-[#138808]" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    ₹{s.benefit_annual_inr.toLocaleString('en-IN')}/yr
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground" style={{ fontSize: '0.85rem' }}>{t('profile.no_schemes')}</p>
        )}
      </div>

      {/* Past Sessions */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-[#000080] mb-4" style={{ fontWeight: 600 }}>{t('profile.sessions_header')}</h2>
        <p className="text-muted-foreground" style={{ fontSize: '0.85rem' }}>{t('profile.no_sessions')}</p>
      </div>
    </div>
  );
}