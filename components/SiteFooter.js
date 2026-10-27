import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer>
      <div className="wrap">
        <div className="fgrid">
          <div>
            <p className="logo" style={{ color: '#fff' }}>Modèle<i>Financier</i></p>
            <p style={{ marginTop: 14, maxWidth: '32ch' }}>
              La finance technique apprise en français, avec la terminologie du métier —
              et une certification pour en faire la preuve.
            </p>
          </div>
          <div>
            <h4>Apprendre</h4>
            <ul>
              <li><Link href="/cours">Le programme</Link></li>
              <li><Link href="/modeles">Le catalogue</Link></li>
              <li><Link href="/parcours">Les parcours</Link></li>
              <li><Link href="/modeles/dcf">Exemple de leçon</Link></li>
            </ul>
          </div>
          <div>
            <h4>S&apos;entraîner</h4>
            <ul>
              <li><Link href="/entrainement">Exercices corrigés</Link></li>
              <li><Link href="/certification">La certification</Link></li>
              <li><Link href="/verification">Vérifier un certificat</Link></li>
              <li><Link href="/tableau-de-bord">Ma progression</Link></li>
            </ul>
          </div>
          <div>
            <h4>Le site</h4>
            <ul>
              <li><Link href="/#methode">La méthode</Link></li>
              <li><Link href="/#tarifs">Accès</Link></li>
              <li><Link href="/inscription">Créer un compte</Link></li>
              <li><Link href="/mentions-legales">Mentions légales</Link></li>
            </ul>
          </div>
        </div>
        <div className="legal">
          <span>© 2026 modelefinancier.com</span>
          <span>Contenu pédagogique — ne constitue pas un conseil en investissement</span>
        </div>
      </div>
    </footer>
  );
}
