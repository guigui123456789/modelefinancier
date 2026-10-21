import './globals.css';
import { createClient } from '@/lib/supabase/server';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const metadata = {
  metadataBase: new URL('https://modelefinancier.com'),
  title: {
    default: 'Modèle Financier — tous les modèles financiers expliqués pas à pas',
    template: '%s · Modèle Financier',
  },
  description:
    "Tous les modèles financiers du métier, construits ligne par ligne, avec le template Excel qui va avec. DCF, LBO, merger model, Three-Statement Model.",
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
