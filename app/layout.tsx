import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Castaway Council',
  description: 'Real-time social survival RPG',
  manifest: '/manifest.webmanifest',
  themeColor: '#1a202c',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Castaway Council',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
