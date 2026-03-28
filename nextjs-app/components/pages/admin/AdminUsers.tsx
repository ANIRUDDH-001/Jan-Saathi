/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useLang } from '@/context/LanguageContext';
import { getAdminUsers } from '@/lib/api';
import { Shield } from 'lucide-react';

export function AdminUsers() {
  const { t } = useLang();
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminUsers(50)
      .then(d => setAllUsers(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const admins = allUsers.filter(u => u.role === 'admin');
  const citizens = allUsers.filter(u => u.role !== 'admin');

  return (
    <div>
      <h1 className="text-[#000080] mb-6" style={{ fontWeight: 700 }}>{t('admin.users')}</h1>

      {/* Admin Table */}
      <div className="bg-white rounded-xl border border-border p-5 mb-6">
        <h3 className="mb-4" style={{ fontWeight: 600 }}>{t('admin.admin_accounts')}</h3>
        {loading ? (
          <p className="text-muted-foreground p-3" style={{ fontSize: '0.8rem' }}>Loading…</p>
        ) : admins.length === 0 ? (
          <p className="text-muted-foreground p-3" style={{ fontSize: '0.8rem' }}>No admin accounts found</p>
        ) : (
          <table className="w-full" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-3">Email</th><th className="py-2 pr-3">Name</th><th className="py-2 pr-3">Role</th><th className="py-2 pr-3">Created</th><th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(a => (
                <tr key={a.email || a.id} className="border-b border-border/50">
                  <td className="py-2 pr-3">{a.email}</td>
                  <td className="py-2 pr-3">{a.name || a.display_name || '—'}</td>
                  <td className="py-2 pr-3"><span className="px-2 py-0.5 rounded-full bg-[#000080]/10 text-[#000080]" style={{ fontSize: '0.7rem' }}>admin</span></td>
                  <td className="py-2 pr-3 text-muted-foreground">{a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}</td>
                  <td className="py-2 text-muted-foreground" style={{ fontSize: '0.75rem' }}>Default (seeded)</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Citizen Table */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="mb-4" style={{ fontWeight: 600 }}>{t('admin.citizen_accounts')}</h3>
        {loading ? (
          <p className="text-muted-foreground p-3" style={{ fontSize: '0.8rem' }}>Loading…</p>
        ) : citizens.length === 0 ? (
          <p className="text-muted-foreground p-3" style={{ fontSize: '0.8rem' }}>No citizen accounts yet</p>
        ) : (
          <table className="w-full" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-3">Email</th><th className="py-2 pr-3">Sessions</th><th className="py-2 pr-3">Last Active</th><th className="py-2 pr-3">Profile</th><th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {citizens.map(c => (
                <tr key={c.email || c.id} className="border-b border-border/50">
                  <td className="py-2 pr-3">{c.email}</td>
                  <td className="py-2 pr-3">{c.session_count ?? c.sessions ?? '—'}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{c.last_active ? new Date(c.last_active).toLocaleDateString() : c.lastActive || '—'}</td>
                  <td className="py-2 pr-3">{c.profile_complete ?? c.profileComplete ?? '—'}</td>
                  <td className="py-2">
                    <button className="px-2 py-1 rounded text-[#000080] hover:bg-muted flex items-center gap-1" style={{ fontSize: '0.75rem' }}>
                      <Shield className="w-3.5 h-3.5" /> Promote
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
