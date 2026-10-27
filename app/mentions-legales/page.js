import Link from 'next/link';

export const metadata = {
  title: 'Mentions légales',
  description: 'Éditeur, hébergement, données personnelles et propriété intellectuelle du site modelefinancier.com.',
};

export default function MentionsPage() {
  return (
    <section className="page">
      <div className="wrap">
        <div className="center">
          <h1 style={{ fontSize: 'clamp(32px,4.6vw,50px)' }}>Mentions légales</h1>
        </div>
        <div className="prose">
          <h2>Éditeur du site</h2>
          <p>
            modelefinancier.com est édité par Guillaume Le Merour. Pour toute question
            relative au site ou à son contenu : <a href="mailto:contact@modelefinancier.com">
            contact@modelefinancier.com</a>.
          </p>

          <h2>Hébergement</h2>
          <p>
            Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina,
            CA 91723, États-Unis. Les données applicatives sont hébergées dans
            l&apos;Union européenne (région Paris) par Supabase.
          </p>

          <h2>Données personnelles</h2>
          <p>
            La création d&apos;un compte nécessite une adresse email et un mot de passe.
            Sont également enregistrées les données de progression pédagogique : leçons
            ouvertes, réponses aux contrôles, exercices soumis. Ces données servent
            uniquement à afficher votre progression et ne sont ni revendues ni
            transmises à des tiers à des fins commerciales.
          </p>
          <p>
            Conformément au règlement général sur la protection des données, vous
            disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement et de
            portabilité de vos données. La demande se fait par email à l&apos;adresse
            ci-dessus ; la suppression d&apos;un compte entraîne celle de la progression
            associée.
          </p>

          <h2>Cookies</h2>
          <p>
            Le site dépose uniquement les cookies nécessaires au maintien de votre
            session une fois connecté. Aucun cookie publicitaire ni traceur tiers
            n&apos;est utilisé.
          </p>

          <h2>Propriété intellectuelle</h2>
          <p>
            Les leçons, exercices, énoncés d&apos;examen et le moteur de correction sont
            protégés par le droit d&apos;auteur. La reproduction ou la diffusion du
            contenu, notamment des items d&apos;examen, est interdite sans autorisation
            écrite.
          </p>

          <h2>Nature du contenu</h2>
          <p>
            Le contenu du site est pédagogique. Les modèles, valorisations et ordres de
            grandeur présentés servent à l&apos;apprentissage et ne constituent en aucun
            cas un conseil en investissement, une recommandation d&apos;achat ou de vente,
            ni une prestation de conseil financier au sens réglementaire.
          </p>

          <h2>Certification</h2>
          <p>
            La certification délivrée par modelefinancier.com atteste de la réussite à
            un examen propre au site. Elle ne constitue pas un diplôme d&apos;État ni une
            certification professionnelle enregistrée. Chaque certificat délivré porte
            une référence vérifiable publiquement sur la page{' '}
            <Link href="/verification">vérification</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}
