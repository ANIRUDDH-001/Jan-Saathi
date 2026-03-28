import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useApp } from '../context/AppContext';
import { handleGoogleCallback } from '../services/api';

export function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useApp();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = params.get('code');
    if (!code) { navigate('/'); return; }
    handleGoogleCallback(code)
      .then(d => {
        if (!d.token) throw new Error('No token');
        login({
          name: d.user.name,
          email: d.user.email,
          token: d.token,
        });
        const returnTo = sessionStorage.getItem('auth_return_to') || '';
        sessionStorage.removeItem('auth_return_to');
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'aniruddhvijay2k7@gmail.com';
        navigate(returnTo || (d.user.email === adminEmail ? '/admin/dashboard' : '/chat'));
      })
      .catch(e => { setError(e.message); setTimeout(() => navigate('/'), 2000); });
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      {error
        ? <p style={{ color: '#dc2626', fontFamily: 'Manrope, sans-serif' }}>{error}</p>
        : (
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-[#FF9933] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p style={{ color: '#6b7280', fontFamily: 'Manrope, sans-serif' }}>Logging in…</p>
          </div>
        )}
    </div>
  );
}
