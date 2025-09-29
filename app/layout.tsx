import type { Metadata } from 'next';
import { Roboto, Righteous } from 'next/font/google';
import { MainLayout } from '@/components/layout';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

const roboto = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  subsets: ['latin'],
  variable: '--font-roboto',
});

const righteous = Righteous({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-righteous',
});

export const metadata: Metadata = {
  title: 'Second Turn Games - Baltic Board Game Marketplace',
  description:
    'Buy and sell board games in the Baltic region. Connect with local gamers and find your next favorite game.',
  keywords: [
    'board games',
    'marketplace',
    'baltic',
    'estonia',
    'latvia',
    'lithuania',
    'gaming',
  ],
  authors: [{ name: 'Second Turn Games' }],
  creator: 'Second Turn Games',
  publisher: 'Second Turn Games',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000'
  ),
  openGraph: {
    title: 'Second Turn Games - Baltic Board Game Marketplace',
    description:
      'Buy and sell board games in the Baltic region. Connect with local gamers and find your next favorite game.',
    url: '/',
    siteName: 'Second Turn Games',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Second Turn Games - Baltic Board Game Marketplace',
    description:
      'Buy and sell board games in the Baltic region. Connect with local gamers and find your next favorite game.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className={`${roboto.variable} ${righteous.variable}`}>
      <body className={`${roboto.className}`}>
        <AuthProvider>
          <MainLayout
            isAuthenticated={false}
            cartCount={0}
            currentLanguage='EN'
          >
            {children}
          </MainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
