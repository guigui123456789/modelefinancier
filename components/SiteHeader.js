'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SiteHeader({ user }) {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={stuck ? 'stuck' : ''}>
      <div className="wrap nav">
        <Link className="logo" href="/">Modèle<i>Financier</i></Link>
        <nav>
          <Link href="/cours">Cours</Link>
          <Link href="/entrainement">Entraînement</Link>
          <Link className="hide-s" href="/parcours">Parcours</Link>
          <Link href="/certification">Certification</Link>
          <Link href="/#tarifs">Accès</Link>
        </nav>
        {user ? (
          <>
            <Link className="btn btn-o btn-sm hide-s" href="/deconnexion">Se déconnecter</Link>
            <Link className="btn btn-w btn-sm" href="/tableau-de-bord">Mon espace</Link>
          </>
        ) : (
          <>
            <Link className="btn btn-o btn-sm hide-s" href="/connexion">Me connecter</Link>
            <Link className="btn btn-w btn-sm" href="/inscription">Créer un compte</Link>
          </>
        )}
      </div>
    </header>
  );
}
