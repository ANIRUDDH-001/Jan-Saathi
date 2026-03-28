'use client';

import { AdminLayout as AdminLayoutComponent } from '@/components/pages/admin/AdminLayout';

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutComponent>{children}</AdminLayoutComponent>;
}
