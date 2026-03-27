import React from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { useLang } from '../../context/LanguageContext';
import { LayoutDashboard, Database, FileText, Users, Activity, ExternalLink } from 'lucide-react';

export function AdminLayout() {
  const { t } = useLang();
  const location = useLocation();

  const navItems = [
    { label: t('admin.dashboard'), path: '/admin/dashboard', icon: LayoutDashboard },
    { label: t('admin.pipeline'), path: '/admin/pipeline', icon: Database },
    { label: t('admin.schemes'), path: '/admin/schemes', icon: FileText },
    { label: t('admin.sessions'), path: '/admin/sessions', icon: Activity },
    { label: t('admin.users'), path: '/admin/users', icon: Users },
  ];

  return (
    <div className="flex min-h-[calc(100vh-5rem)]">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1a1a2e] text-white shrink-0 hidden md:block">
        <div className="p-4 border-b border-white/10">
          <span style={{ fontWeight: 700 }} className="text-[#FF9933]">{t('admin.title')}</span>
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition ${location.pathname === item.path ? 'bg-white/10 text-[#FF9933]' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <item.icon className="w-4 h-4" /> {item.label}
            </Link>
          ))}
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition" style={{ fontSize: '0.85rem' }}>
            <ExternalLink className="w-4 h-4" /> {t('admin.view_site')}
          </a>
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 bg-background p-6 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
