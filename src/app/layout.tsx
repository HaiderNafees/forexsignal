import type {Metadata} from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-provider';
import { Header } from '@/components/layout/header';
import { Toaster } from '@/components/ui/toaster';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: 'ForexEdge | Premium Forex Signals & Analytics',
  description: 'Gain your edge with professional-grade forex signals, live data, and powerful analytics.',
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
        <AuthProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
