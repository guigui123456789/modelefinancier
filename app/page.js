import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Reveal from '@/components/Reveal';
import DcfDemo from '@/components/DcfDemo';
import TrackTabs from '@/components/TrackTabs';
import WaitlistForm from '@/components/WaitlistForm';
import { siteCounts, subjects } from '@/lib/content';

export const revalidate = 300;

const EXAMEN = [
  ['Durée', '3 heures chronométrées'],
  ['Format', '60 items : QCM, calculs, construction de modèle'],
  ['Seuil de réussite', '70 %'],
  ['Paramètres', 'tirés au hasard pour chaque candidat'],
  ['Vérification', 'publique, par référence'],
];

async function getTracks() {
  const supabase = createClient();
  const { data } = await supabase
    .from('tracks')
    .select('slug, name, description, position, track_lessons(position, lessons(slug, title, level, duration_min))')
    .eq('published', true)
    .order('position');

  return (data ?? []).map((t) => ({
    ...t,
    lessons: (t.track_lessons ?? [])
      .sort((a, b) => a.position - b.position)
      .map((tl) => tl.lessons)
      .filter(Boolean),
  }));
}

export default async function HomePage() {
  const [tracks, matieres, counts] = await Promise.all([getTracks(), subjects(), siteCounts()]);

  return (
    <>
      {/* 1. Ce que c'est, et pour qui. */}
      <section className="hero">
        <div className="wrap">
          <Reveal as="h1">La certification technique que la finance attend</Reveal>
          <Reveal as="p" className="sub" delay={90}>
            Pour l&apos;étudiant qui vise un premier poste et le professionnel qui vise le
            suivant. Des leçons courtes, des exercices corrigés formule par formule, et un
            examen difficile dont la réussite se vérifie publiquement.
          </Reveal>
          <Reveal className="cta-row" delay={180}>
            <Link className="btn btn-w" href="/inscription">Créer un compte gratuit</Link>
            <Link className="btn btn-o" href="/modeles/dcf">Ouvrir une leçon</Link>
          </Reveal>

          <Reveal className="facts" delay={270}>
            <div><b className="num">{counts.subjects}</b><span>matières</span></div>
            <div><b className="num">{counts.modules}</b><span>modules</span></div>
            <div><b className="num">{counts.lessons}</b><span>leçons au programme</span></div>
            <div><b className="num">{counts.written}</b><span>leçons en ligne</span></div>
          </Reveal>
        </div>
      </section>

      {/* 2. Ce qu'on apprend. */}
      <section className="dark2" id="matieres">
        <div className="wrap">
          <div className="center">
            <Reveal as="h2">Les matières</Reveal>
            <Reveal as="p" className="sub" delay={90}>
              Le programme est arrêté matière par matière. Les leçons se publient au fil de
              leur écriture : le compteur ci-dessous est le nombre réel de leçons lisibles
              aujourd&apos;hui.
            </Reveal>
          </div>

          <div className="subjects">
            {matieres.map((m, i) => (
              <Reveal as="article" className="subject" key={m.slug} delay={(i % 3) * 80}>
                <h3>{m.name}</h3>
                <p>{m.summary ?? m.tagline}</p>
                <dl className="subject-stat">
                  <div><dt>Modules</dt><dd className="num">{m.modules}</dd></div>
                  <div><dt>Leçons</dt><dd className="num">{m.lessons}</dd></div>
                  <div>
                    <dt>En ligne</dt>
                    <dd className={m.ready ? 'num live' : 'num'}>{m.ready}</dd>
                  </div>
                </dl>
                <Link className="subject-link" href="/cours">
                  Voir le détail du programme
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Comment ça marche : trois faits, aucune illustration. */}
      <section id="methode">
        <div className="wrap">
          <div className="center">
            <Reveal as="h2">Comment une leçon se passe</Reveal>
          </div>
          <div className="steps3">
            <Reveal as="article" className="stepc">
              <span className="n">01</span>
              <h3>Des écrans courts</h3>
              <p>
                Une idée par écran, pas une page de 2 000 mots. Une feuille de calcul
                apparaît dès qu&apos;on nomme une cellule, et un contrôle tombe toutes les
                trois notions.
              </p>
            </Reveal>
            <Reveal as="article" className="stepc" delay={80}>
              <span className="n">02</span>
              <h3>Une correction qui exécute vos formules</h3>
              <p>
                Vous écrivez une vraie formule dans une vraie grille. Elle est exécutée,
                pas comparée à un texte : toute écriture juste passe, une valeur saisie en
                dur est refusée. {counts.exercises} exercices fonctionnent ainsi.
              </p>
            </Reveal>
            <Reveal as="article" className="stepc" delay={160}>
              <span className="n">03</span>
              <h3>Rien ne s&apos;ouvre avant son prérequis</h3>
              <p>
                Chaque leçon occupe une case unique : une matière, un module, un niveau.
                L&apos;ordre est imposé, ce qui évite d&apos;arriver sur un LBO sans savoir
                lire un tableau de flux.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 4. La preuve, interactive. */}
      <section className="dark2" id="demo">
        <div className="wrap">
          <div className="center">
            <Reveal as="span" className="eyebrow">Extrait — Discounted Cash Flow</Reveal>
            <Reveal as="h2" delay={90}>Bougez une hypothèse, la valorisation suit</Reveal>
            <Reveal as="p" className="sub" delay={180}>
              Free cash flow de départ 806 M€, projeté sur cinq ans, valeur terminale par
              multiple de sortie. C&apos;est le modèle de la leçon, en miniature.
            </Reveal>
          </div>
          <Reveal><DcfDemo /></Reveal>
        </div>
      </section>

      {/* 5. La certification. */}
      <section id="certification">
        <div className="wrap">
          <div className="split">
            <div>
              <Reveal as="span" className="eyebrow">En préparation</Reveal>
              <Reveal as="h2" delay={90}>Un examen qu&apos;on peut rater</Reveal>
              <Reveal as="p" delay={180}>
                Un certificat ne vaut que par la difficulté de l&apos;examen qui le délivre.
                Chaque candidat reçoit les mêmes exercices avec des chiffres différents :
                partager un résultat ne sert à personne. Les épreuves de construction
                demandent un modèle, pas une réponse.
              </Reveal>
              <Reveal className="cta-row" delay={270} style={{ justifyContent: 'flex-start' }}>
                <Link className="btn btn-o" href="/certification">Le format complet</Link>
                <Link className="btn btn-o" href="/verification">Vérifier un certificat</Link>
              </Reveal>
            </div>
            <Reveal className="specs" delay={90}>
              {EXAMEN.map(([k, v]) => (
                <div className="spec" key={k}>
                  <span className="spec-k">{k}</span>
                  <span className="spec-v">{v}</span>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* 6. Les parcours. */}
      {tracks.length > 0 && (
        <section className="dark2" id="parcours">
          <div className="wrap">
            <div className="center">
              <Reveal as="h2">Un ordre, pas un catalogue</Reveal>
              <Reveal as="p" className="sub" delay={90}>
                Personne ne finit une liste de {counts.lessons} leçons. Un parcours est une
                suite courte avec un objectif métier au bout.
              </Reveal>
            </div>
            <Reveal><TrackTabs tracks={tracks} /></Reveal>
          </div>
        </section>
      )}

      {/* 7. Accès. */}
      <section id="tarifs">
        <div className="wrap">
          <div className="center">
            <Reveal as="h2">L&apos;accès</Reveal>
            <Reveal as="p" className="sub" delay={90}>
              Tout est ouvert pendant la phase de lancement. Les comptes créés maintenant
              gardent cet accès quand les formules payantes arriveront.
            </Reveal>
          </div>
          <div className="plans">
            <Reveal as="article" className="plan now">
              <span className="badge">Disponible</span>
              <h3>Lancement</h3>
              <p className="price">Gratuit</p>
              <p>Tout le contenu publié, sans carte bancaire. Une adresse email suffit.</p>
              <ul>
                <li>Toutes les leçons en ligne</li>
                <li>Les exercices corrigés</li>
                <li>Suivi de progression</li>
              </ul>
            </Reveal>
            <Reveal as="article" className="plan" delay={80}>
              <h3>Étudiant et Pro</h3>
              <p className="price">À l&apos;ouverture de l&apos;examen</p>
              <p>
                Deux formules payantes, l&apos;une sur justificatif de scolarité, l&apos;autre
                pour les praticiens. Elles donneront accès au passage de la certification.
              </p>
              <ul>
                <li>Examens blancs</li>
                <li>Passage de la certification</li>
              </ul>
            </Reveal>
            <Reveal as="article" className="plan" delay={160}>
              <h3>Équipe et École</h3>
              <p className="price">Sur devis</p>
              <p>
                Pour un desk, un cabinet ou une promotion : comptes gérés, progression
                visible par l&apos;administrateur, parcours assignables.
              </p>
              <ul>
                <li>Facturation unique</li>
                <li>Tableau de bord de progression</li>
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 8. Inscription. */}
      <section className="light" id="inscription">
        <div className="wrap center" style={{ marginBottom: 0 }}>
          <Reveal as="h2">Créer un compte</Reveal>
          <Reveal as="p" className="sub" delay={90}>
            Accès complet pendant le lancement. Pas de carte bancaire, pas d&apos;engagement.
          </Reveal>
          <Reveal delay={180}><WaitlistForm /></Reveal>
          <Reveal as="p" className="fine" delay={270}>
            Contenu pédagogique. Les modèles présentés servent à l&apos;apprentissage et ne
            constituent pas un conseil en investissement.
          </Reveal>
        </div>
      </section>
    </>
  );
}
