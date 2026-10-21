import Link from 'next/link';

export const metadata = {
  title: 'La certification',
  description:
    'Un examen difficile, à paramètres tirés au hasard, dont la réussite se vérifie publiquement.',
};

const SPECS = [
  ['Durée', '3 heures, chronométrées'],
  ['Format', '60 items : QCM, calculs, et construction de modèle'],
  ['Seuil de réussite', '70 %'],
  ['Préparation estimée', '250 à 300 heures'],
  ['Taux de réussite visé', 'moins de 40 %'],
  ['Validité', 'à vie, vérifiable en ligne'],
];

export default function CertificationPage() {
  return (
    <section className="page">
      <div className="wrap">
        <div className="center">
          <span className="eyebrow">En préparation</span>
          <h1 style={{ fontSize: 'clamp(34px,5.4vw,58px)' }}>La certification</h1>
          <p className="sub">
            Un certificat ne vaut que par la difficulté de l&apos;examen qui le délivre.
            Celui-ci est conçu pour être dur, et pour qu&apos;une réussite veuille dire
            quelque chose.
          </p>
        </div>

        <div className="split" style={{ marginBottom: 'clamp(44px,6vw,72px)' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(26px,3.6vw,38px)' }}>
              Pourquoi les réponses ne circuleront pas
            </h2>
            <p style={{ marginTop: 18, color: 'var(--dim)' }}>
              Chaque candidat reçoit les mêmes exercices, mais avec des chiffres tirés
              au hasard. Un EBIT de 1 240 et un WACC de 8,75 % pour l&apos;un, 1 380 et
              9,25 % pour l&apos;autre. La réponse attendue est recalculée à partir de ses
              paramètres : partager un résultat ne sert à personne.
            </p>
            <p style={{ marginTop: 14, color: 'var(--dim)' }}>
              Les items sont tirés d&apos;une banque bien plus large que l&apos;examen, et
              les épreuves de construction demandent un modèle, pas une réponse : le
              correcteur vérifie les formules autant que les valeurs.
            </p>
          </div>
          <div className="specs">
            {SPECS.map(([k, v]) => (
              <div className="spec" key={k}>
                <span className="spec-k">{k}</span>
                <span className="spec-v">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="center">
          <h2 style={{ fontSize: 'clamp(24px,3.4vw,36px)' }}>Les trois certifications prévues</h2>
        </div>
        <div className="cards">
          <article className="card">
            <h3>Excel pour la finance</h3>
            <p>
              Du raccourci clavier au modèle circulaire. Construction notée sur fichier,
              pas sur QCM.
            </p>
            <div className="meta"><span className="cnt">133 leçons au programme</span></div>
          </article>
          <article className="card">
            <h3>Modélisation financière</h3>
            <p>
              Three-Statement, DCF, LBO, merger model. Un modèle complet à livrer en
              temps limité.
            </p>
            <div className="meta"><span className="cnt">48 modèles au programme</span></div>
          </article>
          <article className="card">
            <h3>Python pour la finance</h3>
            <p>
              Code exécuté contre une suite de tests cachés. On ne note pas le style,
              on note ce qui tourne.
            </p>
            <div className="meta"><span className="cnt">programme en cours</span></div>
          </article>
        </div>

        <div className="gate" style={{ marginTop: 'clamp(40px,6vw,64px)' }}>
          <h3>L&apos;examen n&apos;est pas encore ouvert</h3>
          <p>
            Il le sera quand le programme sera complet : ouvrir une certification sur un
            contenu partiel détruirait sa crédibilité avant même qu&apos;elle existe.
            Les inscrits seront prévenus en premier.
          </p>
          <Link className="btn btn-w" href="/inscription">Être prévenu de l&apos;ouverture</Link>
        </div>
      </div>
    </section>
  );
}
