import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Jan Saathi — Your Government Schemes Companion',
  description:
    'Talk to Shubh in your language. Discover government schemes, check eligibility, and apply — all through voice.',
  icons: { icon: '/assets/ved_avatar.jpg' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" suppressHydrationWarning>
      <body
        className="font-sans antialiased min-h-screen bg-background text-foreground"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        <Providers>
          {children}
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
