import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { TenantProvider } from '@/lib/tenant-context';
import { CurrencyProvider } from '@/lib/currency-context';
import { I18nProvider } from '@/lib/i18n-context';
import { BrandingStyles } from '@/components/BrandingStyles';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import { AlertProvider } from '@/lib/alert-context';

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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LedgerHive',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1e293b',
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
              <BrandingStyles />
              <CurrencyProvider>
                <AlertProvider>
                  {children}
                  <PwaInstallPrompt />
                  <Analytics />
                </AlertProvider>
              </CurrencyProvider>
            </TenantProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
