import React from 'react';
import { Link, useNavigate } from 'react-router';
import { useLang } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { LogIn, User, LogOut, Shield } from 'lucide-react';
import { JanSaathiLogo } from '../JanSaathiLogo';
import { LanguageSelector } from '../LanguageSelector';
import { motion } from 'motion/react';
import { buttonPress } from '../../utils/animations';

export function TopNav() {
  const { t } = useLang();
  const { isLoggedIn, isAdmin, user, login, logout } = useApp();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <JanSaathiLogo size="sm" />
          <div>
            <span 
              className="text-[#000080]" 
              style={{ 
                fontSize: '1.125rem', 
                fontWeight: 700,
                fontFamily: 'Inter, sans-serif',
                textShadow: '0 1px 2px rgba(255, 153, 51, 0.1)'
              }}
            >
              {t('nav.wordmark')}
            </span>
            <p 
              className="text-muted-foreground" 
              style={{ 
                fontSize: '0.7rem', 
                lineHeight: 1.2,
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {t('nav.subtext')}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <LanguageSelector />

          {!isLoggedIn ? (
            <motion.button
              whileTap={buttonPress}
              onClick={login}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition"
              style={{ fontSize: '0.875rem' }}
            >
              <LogIn className="w-4 h-4" />
              {t('nav.login')}
            </motion.button>
          ) : (
            <div className="relative">
              <motion.button
                whileTap={buttonPress}
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border hover:bg-muted"
              >
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                  {user?.name?.charAt(0) || 'U'}
                </div>
                {isAdmin && <span className="px-2 py-0.5 rounded-full bg-[#000080] text-white" style={{ fontSize: '0.65rem', fontWeight: 500 }}>{t('nav.admin')}</span>}
              </motion.button>
              {menuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-border py-1 z-50"
                >
                  <motion.button 
                    whileTap={buttonPress}
                    onClick={() => { navigate('/profile'); setMenuOpen(false); }} 
                    className="w-full text-left px-4 py-2 hover:bg-muted flex items-center gap-2" 
                    style={{ fontSize: '0.875rem' }}
                  >
                    <User className="w-4 h-4" /> {t('nav.profile')}
                  </motion.button>
                  {isAdmin && (
                    <motion.button 
                      whileTap={buttonPress}
                      onClick={() => { navigate('/admin/dashboard'); setMenuOpen(false); }} 
                      className="w-full text-left px-4 py-2 hover:bg-muted flex items-center gap-2" 
                      style={{ fontSize: '0.875rem' }}
                    >
                      <Shield className="w-4 h-4" /> {t('nav.admin')}
                    </motion.button>
                  )}
                  <hr className="my-1 border-border" />
                  <motion.button 
                    whileTap={buttonPress}
                    onClick={() => { logout(); setMenuOpen(false); }} 
                    className="w-full text-left px-4 py-2 hover:bg-muted flex items-center gap-2 text-destructive" 
                    style={{ fontSize: '0.875rem' }}
                  >
                    <LogOut className="w-4 h-4" /> {t('nav.logout')}
                  </motion.button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Tricolor stripe */}
      <div className="flex h-0.5">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>
    </nav>
  );
}