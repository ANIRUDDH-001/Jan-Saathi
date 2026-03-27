import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useLang } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { Edit2, Save, Trash2 } from 'lucide-react';
import { VedAvatarProfile } from '../components/VedAvatar';

export function Profile() {
  const { t } = useLang();
  const { isLoggedIn, user, profile, setProfile } = useApp();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);

  if (!isLoggedIn) {
    navigate('/');
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
  const handleClear = () => { setProfile({ state: '', occupation: '', age: '', income: '', category: '', bpl: '', gender: '' }); setDraft({ state: '', occupation: '', age: '', income: '', category: '', bpl: '', gender: '' }); };

  const mockSavedSchemes = [
    { name: 'PM-KISAN Samman Nidhi', slug: 'pm-kisan' },
    { name: 'Ayushman Bharat - PMJAY', slug: 'ayushman-bharat' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {/* Use VedAvatarProfile for a professional look */}
        <VedAvatarProfile />
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
                  value={draft[f.key]}
                  onChange={e => setDraft({ ...draft, [f.key]: e.target.value })}
                  className="px-3 py-1 rounded border border-border w-40 text-right"
                  style={{ fontSize: '0.85rem' }}
                />
              ) : (
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{profile[f.key] || '—'}</span>
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
        {mockSavedSchemes.length > 0 ? (
          <div className="space-y-2">
            {mockSavedSchemes.map(s => (
              <button key={s.slug} onClick={() => navigate(`/schemes/${s.slug}`)} className="w-full text-left px-4 py-3 rounded-lg border border-border hover:bg-muted transition" style={{ fontSize: '0.9rem' }}>
                {s.name}
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