import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { createClient } from '@/utils/supabase/server';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  // 1. Titolo e Descrizione Principale
  title: {
    default: 'Kyuubi Engine | L\'Intelligenza che muove il tuo Business',
    template: '%s | Kyuubi Engine',
  },
  description:
    'Ecosistema modulare per soluzioni gestionali su misura: automazione processi, magazzino QR Code, agenda prenotazioni e e-commerce integrato.',
  metadataBase: new URL('https://kyuubi.eazyhubs.com'), // Sostituisci con il dominio effettivo se diverso (es. kyuubi.it)

  // 2. WebApp Manifest per Android / PWA
  manifest: '/manifest.json',

  // 3. SEO e Indicizzazione
  keywords: [
    'Kyuubi Engine',
    'Kyuubi',
    'Gestionale Su Misura',
    'Automazione Processi',
    'Gestione Magazzino QR Code',
    'Agenda Prenotazioni',
    'E-commerce Integrato',
    'EazyHubs',
  ],
  authors: [{ name: 'EazyHubs Team' }],
  creator: 'EazyHubs',
  publisher: 'EazyHubs',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // 4. Gestione Icone e Favicon
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/logo.png', type: 'image/png', sizes: '32x32' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/logo.png', sizes: '180x180', type: 'image/png' }],
  },

  // 5. iOS / Safari WebApp
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kyuubi',
  },

  // 6. Open Graph (Social Preview / WhatsApp / LinkedIn)
  openGraph: {
    title: 'Kyuubi Engine | L\'Intelligenza che muove il tuo Business',
    description:
      'Soluzioni gestionali su misura che si adattano al tuo modo di lavorare. Moduli di Gestione, Magazzino, Prenotazioni ed E-commerce.',
    url: 'https://kyuubi.eazyhubs.com', // Sostituisci con il dominio effettivo
    siteName: 'Kyuubi Engine',
    images: [
      {
        url: '/logo.png', // O inserisci qui l'URL dell'immagine di anteprima Open Graph
        width: 1200,
        height: 630,
        alt: 'Kyuubi Engine - Ecosistema Modulare Gestionale',
      },
    ],
    locale: 'it_IT',
    type: 'website',
  },

  // 7. Twitter / X Card
  twitter: {
    card: 'summary_large_image',
    title: 'Kyuubi Engine | L\'Intelligenza che muove il tuo Business',
    description:
      'Soluzioni gestionali su misura che si adattano al tuo modo di lavorare.',
    images: ['/logo.png'],
  },
};

// JSON-LD per la strutturazione dei dati Google e i Sitelinks
const jsonLdData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Kyuubi Engine',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
  },
  description:
    'Ecosistema modulare di soluzioni gestionali su misura per automazione processi, magazzino, prenotazioni ed e-commerce.',
  publisher: {
    '@type': 'Organization',
    name: 'EazyHubs',
    url: 'https://eazyhubs.com',
  },
  hasPart: [
    {
      '@type': 'WebPage',
      name: 'Demo Pubblica',
      url: 'https://kyuubi.eazyhubs.com/demo',
    },
    {
      '@type': 'WebPage',
      name: 'Gestionale',
      url: 'https://kyuubi.eazyhubs.com/gestionale',
    },
    {
      '@type': 'WebPage',
      name: 'Magazzino',
      url: 'https://kyuubi.eazyhubs.com/magazzino',
    },
    {
      '@type': 'WebPage',
      name: 'Prenotazioni',
      url: 'https://kyuubi.eazyhubs.com/prenotazioni',
    },
    {
      '@type': 'WebPage',
      name: 'Consulenza Dedicata',
      url: 'https://kyuubi.eazyhubs.com/consulenza',
    },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      {/* Applichiamo le classi Tailwind al body per pulizia e coerenza */}
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <ThemeProvider
          attribute="class" /* <--- Importante: Usa la classe .dark per il tema scuro */
          defaultTheme="light" /* <--- Importante: Tema Chiaro di default */
          enableSystem={false} /* <--- Opzionale: Ignora il tema di sistema per forzare il default */
          disableTransitionOnChange
        >
          <Header user={user} />
          <main className="flex-grow">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}