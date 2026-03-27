import React from 'react';
import { Link } from 'react-router';
import { useLang } from '../context/LanguageContext';
import { Home } from 'lucide-react';

export function NotFound() {
  const { t } = useLang();
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6" style={{ fontSize: '2.5rem', fontWeight: 900 }}>
        404
      </div>
      <h1 className="text-[#000080] mb-2" style={{ fontWeight: 700 }}>{t('404.heading')}</h1>
      <p className="text-muted-foreground mb-6">{t('404.body')}</p>
      <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FF9933] text-white hover:opacity-90 transition" style={{ fontWeight: 500 }}>
        <Home className="w-4 h-4" /> {t('404.cta')}
      </Link>
    </div>
  );
}
