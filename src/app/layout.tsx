import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ClientProviders } from '@/contexts/client-providers';
import { MainLayout } from '@/components/layout/main-layout';

export const metadata: Metadata = {
  title: 'Trader Choice | Premium Forex Signals & Analytics',
  description: 'Gain your edge with professional-grade forex signals, live data, and powerful analytics.',
  icons: {
    icon: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='15' fill='%2329ABE2' /><text x='50' y='55' font-size='50' fill='white' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif' font-weight='bold'>TC</text></svg>`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ClientProviders>
          <MainLayout>
            {children}
          </MainLayout>
          <Toaster />
        </ClientProviders>
      </body>
    </html>
  );
}
