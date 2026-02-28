import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { TenantProvider } from '@/lib/tenant-context';
import { CurrencyProvider } from '@/lib/currency-context';
import { I18nProvider } from '@/lib/i18n-context';

const _geist = Geist({ subsets: ['latin'] });
const _geistMono = Geist_Mono({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LedgerHive - Enterprise Collections Management',
  description: 'Intelligent collections and receivables management platform for modern finance teams',
  generator: 'v0.app',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          <I18nProvider>
            <TenantProvider>
              <CurrencyProvider>
                {children}
                <Analytics />
              </CurrencyProvider>
            </TenantProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
