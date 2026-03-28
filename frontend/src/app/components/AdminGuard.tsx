import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { AdminLayout } from '../pages/admin/AdminLayout';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoggedIn } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      navigate('/', { replace: true });
    }
  }, [isAdmin, isLoggedIn, navigate]);

  if (!isAdmin) return null;
  return <>{children}</>;
}

export function AdminLayoutGuard() {
  return (
    <AdminGuard>
      <AdminLayout />
    </AdminGuard>
  );
}