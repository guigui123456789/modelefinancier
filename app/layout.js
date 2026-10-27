import './globals.css';
import { createClient } from '@/lib/supabase/server';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const metadata = {
  metadataBase: new URL('https://modelefinancier.com'),
  title: {
    default: 'Modèle Financier — modélisation financière, Excel et Python, en français',
    template: '%s · Modèle Financier',
  },
  description:
    "Apprendre la finance technique et le prouver : leçons courtes, exercices corrigés formule par formule, et une certification exigeante. DCF, LBO, merger model, Excel, Python.",
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Modèle Financier',
  },
};

export default async function RootLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="fr">
      <body>
        <div className="promo">
          Accès libre pendant la phase de lancement. <b>modelefinancier.com</b>
        </div>
        <SiteHeader user={user} />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
