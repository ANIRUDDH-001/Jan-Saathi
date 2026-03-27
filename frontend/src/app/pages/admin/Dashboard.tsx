import React, { useState } from 'react';
import { useLang } from '../../context/LanguageContext';
import { mockAdminStats, mockTopSchemes, mockRecentSessions, mockGapData } from '../../utils/mockData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, IndianRupee, Database, Clock, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'motion/react';

const apiIntegrations = [
  {
    name: 'PM-KISAN API',
    description: 'Direct benefit transfer verification & form submission',
    status: 'pending' as const,
    docsUrl: 'https://apisetu.gov.in/api/pmkisan',
  },
  {
    name: 'MyScheme API',
    description: 'Scheme eligibility matching & discovery',
    status: 'pending' as const,
    docsUrl: 'https://apisetu.gov.in/api/myscheme',
  },
  {
    name: 'DigiLocker API',
    description: 'Document verification & digital certificate access',
    status: 'live' as const,
    docsUrl: 'https://apisetu.gov.in/api/digilocker',
  },
];

const mockApiResponse = `{
  "status": "success",
  "scheme_id": "PM-KISAN-2026",
  "beneficiary": {
    "aadhaar_verified": true,
    "land_record_verified": true,
    "bank_account_status": "active"
  },
  "next_installment": "2026-04-15",
  "amount": 2000
}`;

export function Dashboard() {
  const { t, lang } = useLang();
  const [showFullResponse, setShowFullResponse] = useState(false);

  const stats = [
    { label: t('admin.sessions_today'), value: mockAdminStats.sessionsToday.toLocaleString(), icon: Users, color: '#FF9933' },
    { label: t('admin.total_gap'), value: `₹${(mockAdminStats.totalGap / 100000).toFixed(1)}L`, icon: IndianRupee, color: '#138808' },
    { label: t('admin.schemes_db'), value: mockAdminStats.schemesInDb, icon: Database, color: '#000080' },
    { label: t('admin.pending'), value: mockAdminStats.pendingReview, icon: Clock, color: '#dc2626' },
  ];

  return (
    <div>
      <h1 className="text-[#000080] mb-6" style={{ fontWeight: 700, fontFamily: 'Lora, serif' }}>{t('admin.dashboard')}</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <motion.div
            key={s.label}
            whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
            className="bg-white rounded-xl border border-border p-5 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>{s.label}</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{s.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* APISetu Integration Panel */}
      <div className="bg-white rounded-xl border border-border overflow-hidden mb-8">
        {/* Banner */}
        <div className="bg-[#FF9933] px-5 py-3">
          <p style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Manrope, sans-serif', color: '#000080' }}>
            {lang === 'hi'
              ? 'एक बार GSTIN से register करो → सब APIs live हो जाएंगे'
              : 'Register once with GSTIN → All APIs go live'}
          </p>
        </div>

        <div className="p-5">
          <h3 className="text-[#000080] mb-4" style={{ fontWeight: 700, fontSize: '18px' }}>
            Government API Integrations
          </h3>

          <div className="space-y-3 mb-6">
            {apiIntegrations.map(api => (
              <div key={api.name} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/30 transition-all">
                <div className="flex-1">
                  <p style={{ fontWeight: 600, fontSize: '14px' }}>{api.name}</p>
                  <p className="text-muted-foreground" style={{ fontSize: '12px' }}>{api.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="px-3 py-1 rounded-full flex items-center gap-1.5"
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: api.status === 'live' ? 'rgba(19,136,8,0.1)' : 'rgba(255,153,51,0.1)',
                      color: api.status === 'live' ? '#138808' : '#FF9933',
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: api.status === 'live' ? '#138808' : '#FF9933' }}
                    />
                    {api.status === 'live' ? 'Live' : 'Pending Registration'}
                  </span>
                  <a
                    href={api.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#000080] hover:underline flex items-center gap-1"
                    style={{ fontSize: '12px' }}
                  >
                    View Docs <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* API Contract Code Block */}
          <div>
            <button
              onClick={() => setShowFullResponse(!showFullResponse)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2"
              style={{ fontSize: '12px', fontWeight: 500 }}
            >
              {showFullResponse ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showFullResponse ? 'Hide response' : 'Show full API response'}
            </button>
            {showFullResponse && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="bg-[#1a1a2e] rounded-lg p-4 overflow-x-auto"
              >
                <pre className="text-white/80 font-mono" style={{ fontSize: '12px' }}>
                  {mockApiResponse}
                </pre>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Gap Chart */}
      <div className="bg-white rounded-xl border border-border p-5 mb-8">
        <h3 className="mb-4" style={{ fontWeight: 600 }}>{t('admin.gap_chart')}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={mockGapData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="day" style={{ fontSize: '0.75rem' }} />
            <YAxis tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} style={{ fontSize: '0.75rem' }} />
            <Tooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
            <Line 
              key="gap-line"
              type="monotone" 
              dataKey="value" 
              stroke="#FF9933" 
              strokeWidth={2} 
              dot={{ fill: '#FF9933', r: 3 }} 
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Schemes */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="mb-4" style={{ fontWeight: 600 }}>{t('admin.top_schemes')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-2">#</th><th className="py-2 pr-2">Scheme</th><th className="py-2 pr-2">Ministry</th><th className="py-2 pr-2">Matches</th><th className="py-2">Avg ₹</th>
                </tr>
              </thead>
              <tbody>
                {mockTopSchemes.map(s => (
                  <tr key={s.rank} className="border-b border-border/50">
                    <td className="py-2 pr-2" style={{ fontWeight: 600 }}>{s.rank}</td>
                    <td className="py-2 pr-2">{s.name}</td>
                    <td className="py-2 pr-2 text-muted-foreground">{s.ministry}</td>
                    <td className="py-2 pr-2">{s.matchCount}</td>
                    <td className="py-2">₹{s.avgBenefit.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="mb-4" style={{ fontWeight: 600 }}>{t('admin.recent')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-2">ID</th><th className="py-2 pr-2">State</th><th className="py-2 pr-2">Fields</th><th className="py-2 pr-2">Matched</th><th className="py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {mockRecentSessions.map(s => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/50 cursor-pointer">
                    <td className="py-2 pr-2 text-muted-foreground">{s.id}</td>
                    <td className="py-2 pr-2">{s.state}</td>
                    <td className="py-2 pr-2">{s.fieldsCount}/7</td>
                    <td className="py-2 pr-2">{s.schemesMatched}</td>
                    <td className="py-2 text-muted-foreground">{s.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
