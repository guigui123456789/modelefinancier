import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer>
      <div className="wrap">
        <div className="fgrid">
          <div>
            <p className="logo" style={{ color: '#fff' }}>Modèle<i>Financier</i></p>
            <p style={{ marginTop: 14, maxWidth: '32ch' }}>
              Les modèles financiers du métier, expliqués étape par étape, en français.
            </p>
          </div>
          <div>
            <h4>Cours</h4>
            <ul>
              <li><Link href="/cours">Tous les cursus</Link></li>
              <li><Link href="/modeles">Modélisation financière</Link></li>
              <li><Link href="/modeles?pilier=excel-references">Excel</Link></li>
              <li><Link href="/parcours">Les parcours</Link></li>
            </ul>
          </div>
          <div>
            <h4>Entraînement</h4>
            <ul>
              <li><Link href="/entrainement">Exercices</Link></li>
              <li><Link href="/entrainement">Questions d&apos;entretien</Link></li>
              <li><Link href="/certification">Certification</Link></li>
              <li><Link href="/tableau-de-bord">Ma progression</Link></li>
            </ul>
          </div>
          <div>
            <h4>Le site</h4>
            <ul>
              <li><Link href="/#methode">La méthode</Link></li>
              <li><Link href="/#tarifs">Accès</Link></li>
              <li><Link href="/inscription">Créer un compte</Link></li>
            </ul>
          </div>
        </div>
        <div className="legal">
          <span>© 2026 modelefinancier.com</span>
          <span>Contenu pédagogique — ne constitue pas un conseil en investissement</span>
        </div>
        <p className="credit">
          Photographies : Unsplash. À remplacer par vos propres visuels avant la mise en production.
        </p>
      </div>
    </footer>
  );
}
