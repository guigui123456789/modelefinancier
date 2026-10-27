import Link from 'next/link';

export const metadata = { title: 'Page introuvable' };

export default function NotFound() {
  return (
    <section className="page">
      <div className="wrap center">
        <p className="eyebrow">Erreur 404</p>
        <h1 className="page-title">Cette page n&apos;existe pas</h1>
        <p className="sub" style={{ margin: '20px auto 34px', maxWidth: '54ch' }}>
          Le lien est peut-être ancien, ou la leçon a changé d&apos;adresse. Le catalogue
          liste tout le programme, module par module.
        </p>
        <div className="cta-row" style={{ justifyContent: 'center' }}>
          <Link className="btn btn-w" href="/modeles">Voir le catalogue</Link>
          <Link className="btn btn-o" href="/">Retour à l&apos;accueil</Link>
        </div>
      </div>
    </section>
  );
}
