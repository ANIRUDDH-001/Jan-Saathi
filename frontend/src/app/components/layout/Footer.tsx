import React from 'react';
import { useLang } from '../../context/LanguageContext';
import { Github } from 'lucide-react';

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-[#1a1a2e] text-white/80 mt-auto">
      <div className="flex h-1">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p style={{ fontSize: '0.875rem' }} className="text-center md:text-left max-w-lg italic">
          "{t('footer.tagline')}"
        </p>
        <div className="flex items-center gap-4">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
            <Github className="w-5 h-5" />
          </a>
          <span style={{ fontSize: '0.75rem' }} className="text-white/60">{t('footer.credit')}</span>
        </div>
      </div>
    </footer>
  );
}
