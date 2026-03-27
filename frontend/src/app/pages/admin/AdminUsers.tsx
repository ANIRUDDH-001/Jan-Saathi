import React from 'react';
import { useLang } from '../../context/LanguageContext';
import { Shield, ShieldOff } from 'lucide-react';

export function AdminUsers() {
  const { t } = useLang();

  const admins = [
    { email: 'aniruddhvijay2k7@gmail.com', name: 'Aniruddh Vijay', role: 'admin', created: '1 Jan 2026' },
  ];
  const citizens = [
    { email: 'r***@gmail.com', sessions: 12, lastActive: '22 Mar 2026', profileComplete: '100%' },
    { email: 's***@yahoo.com', sessions: 3, lastActive: '21 Mar 2026', profileComplete: '57%' },
    { email: 'a***@gmail.com', sessions: 8, lastActive: '20 Mar 2026', profileComplete: '86%' },
  ];

  return (
    <div>
      <h1 className="text-[#000080] mb-6" style={{ fontWeight: 700 }}>{t('admin.users')}</h1>

      {/* Admin Table */}
      <div className="bg-white rounded-xl border border-border p-5 mb-6">
        <h3 className="mb-4" style={{ fontWeight: 600 }}>{t('admin.admin_accounts')}</h3>
        <table className="w-full" style={{ fontSize: '0.8rem' }}>
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 pr-3">Email</th><th className="py-2 pr-3">Name</th><th className="py-2 pr-3">Role</th><th className="py-2 pr-3">Created</th><th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(a => (
              <tr key={a.email} className="border-b border-border/50">
                <td className="py-2 pr-3">{a.email}</td>
                <td className="py-2 pr-3">{a.name}</td>
                <td className="py-2 pr-3"><span className="px-2 py-0.5 rounded-full bg-[#000080]/10 text-[#000080]" style={{ fontSize: '0.7rem' }}>admin</span></td>
                <td className="py-2 pr-3 text-muted-foreground">{a.created}</td>
                <td className="py-2 text-muted-foreground" style={{ fontSize: '0.75rem' }}>Default (seeded)</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Citizen Table */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="mb-4" style={{ fontWeight: 600 }}>{t('admin.citizen_accounts')}</h3>
        <table className="w-full" style={{ fontSize: '0.8rem' }}>
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 pr-3">Email</th><th className="py-2 pr-3">Sessions</th><th className="py-2 pr-3">Last Active</th><th className="py-2 pr-3">Profile</th><th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {citizens.map(c => (
              <tr key={c.email} className="border-b border-border/50">
                <td className="py-2 pr-3">{c.email}</td>
                <td className="py-2 pr-3">{c.sessions}</td>
                <td className="py-2 pr-3 text-muted-foreground">{c.lastActive}</td>
                <td className="py-2 pr-3">{c.profileComplete}</td>
                <td className="py-2">
                  <button className="px-2 py-1 rounded text-[#000080] hover:bg-muted flex items-center gap-1" style={{ fontSize: '0.75rem' }}>
                    <Shield className="w-3.5 h-3.5" /> Promote
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
