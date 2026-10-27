import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Reveal from '@/components/Reveal';
import DcfDemo from '@/components/DcfDemo';
import TrackTabs from '@/components/TrackTabs';
import WaitlistForm from '@/components/WaitlistForm';
import { siteCounts } from '@/lib/content';

export const revalidate = 300;

const ARROW = (
  <span className="arrow">
    <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  </span>
);

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

async function getDomains() {
  const supabase = createClient();
  const { data } = await supabase
    .from('domains')
    .select('slug, name, tagline, summary, position, pillars(slug, lessons(count))')
    .order('position');

  return (data ?? []).map((d) => ({
    ...d,
    modules: (d.pillars ?? []).length,
    lessons: (d.pillars ?? []).reduce((s, p) => s + (p.lessons?.[0]?.count ?? 0), 0),
  }));
}

export default async function HomePage() {
  const [tracks, domains, counts] = await Promise.all([getTracks(), getDomains(), siteCounts()]);

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <Reveal as="h1">Apprendre la finance technique. Et le prouver.</Reveal>
          <Reveal as="p" className="sub" delay={90}>
            Modélisation financière, Excel et Python pour la finance : des leçons courtes,
            des exercices corrigés formule par formule, et une certification exigeante au
            bout. En français, avec la terminologie du métier.
          </Reveal>
          <Reveal className="cta-row" delay={180}>
            <Link className="btn btn-w" href="/inscription">Commencer gratuitement</Link>
            <Link className="btn btn-o" href="#demo">Essayer un DCF</Link>
          </Reveal>

          <div className="tiles">
            <Reveal as="article" className="tile">
              <img src="/img/hero1.jpg" alt="Écrans de suivi d'indicateurs financiers" />
              <div className="top">
                <p className="cap">Valuation · DCF</p>
                <p className="big num">14 820 M€</p>
              </div>
              <div className="chip">
                <span className="ic" style={{ background: '#3A5BFF' }}>EV</span>
                <span>Enterprise value<small>Terminal value : 60 %</small></span>
                <span className="v">+4,2 %</span>
              </div>
            </Reveal>
            <Reveal as="article" className="tile" delay={90}>
              <img src="/img/hero2.jpg" alt="Analyste travaillant sur des états financiers" />
              <div className="top">
                <p className="cap">Foundations · Three-Statement</p>
                <p className="big num">806 M€</p>
              </div>
              <div className="chip">
                <span className="ic" style={{ background: '#0F6B47' }}>FCF</span>
                <span>Unlevered free cash flow<small>EBIT − impôts + D&amp;A − capex</small></span>
                <span className="v">2026</span>
              </div>
            </Reveal>
            <Reveal as="article" className="tile" delay={180}>
              <img src="/img/hero3.jpg" alt="Graphique de marché affiché sur une tablette" />
              <div className="top">
                <p className="cap">Transactions · LBO</p>
                <p className="big num">2,8×</p>
              </div>
              <div className="chip">
                <span className="ic" style={{ background: '#5B35C9' }}>IRR</span>
                <span>Multiple sur 5 ans<small>TRI de 23 % pour le sponsor</small></span>
                <span className="v">23 %</span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="dark2" style={{ paddingBlock: 'clamp(44px,6vw,70px)' }}>
        <div className="wrap center" style={{ marginBottom: 0 }}>
          <Reveal as="p" className="eyebrow">
            Le vocabulaire et les attentes des entretiens en
          </Reveal>
          <Reveal className="logos" delay={90}>
            <span>Investment Banking</span><span>Private Equity</span>
            <span>Transaction Services</span><span>Equity Research</span>
            <span>Corporate Finance</span>
          </Reveal>
        </div>
      </section>

      <section className="light">
        <div className="wrap split">
          <Reveal className="shot">
            <img src="/img/press.jpg" alt="Tableau de cours imprimé dans un quotidien financier" />
          </Reveal>
          <div>
            <Reveal as="h2">Un modèle n&apos;est pas une formule, c&apos;est un raisonnement</Reveal>
            <Reveal as="p" delay={90}>
              La plupart des cours vous donnent la formule du DCF en trois lignes et vous
              laissent devant une feuille vide. Ici, chaque ligne du modèle a sa
              justification, son ordre de grandeur, et l&apos;erreur que tout le monde
              commet à cet endroit.
            </Reveal>
            <Reveal className="kpis" delay={180}>
              <div><b>{counts.modules}</b><span>modules</span></div>
              <div><b>{counts.lessons}</b><span>leçons au programme</span></div>
              <div><b>{counts.tracks}</b><span>parcours métiers</span></div>
            </Reveal>
            <Reveal delay={270}>
              <Link className="btn btn-k" href="/cours">Voir le programme</Link>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="piliers">
        <div className="wrap">
          <div className="center">
            <Reveal as="h2">Trois domaines, {counts.modules} modules</Reveal>
            <Reveal as="p" className="sub" delay={90}>
              Chaque leçon occupe une case unique : un module, un niveau. Aucune leçon
              avancée ne s&apos;ouvre avant son prérequis.
            </Reveal>
          </div>
          <div className="cards">
            {domains.map((d, i) => (
              <Reveal as="article" className="card" key={d.slug} delay={(i % 3) * 90}>
                <h3>{d.name}</h3>
                <p>{d.summary ?? d.tagline}</p>
                <div className="meta">
                  <Link className="cnt" href="/cours">
                    {d.lessons > 0
                      ? `${d.modules} modules · ${d.lessons} leçons`
                      : `${d.modules} modules · programme en préparation`}
                  </Link>
                  {ARROW}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="light" id="methode">
        <div className="wrap split rev" style={{ marginBottom: 'clamp(44px,6vw,80px)' }}>
          <Reveal className="shot">
            <img src="/img/study.jpg" alt="Poste de travail avec ordinateur portable et notes" />
          </Reveal>
          <div>
            <Reveal as="span" className="eyebrow">La méthode</Reveal>
            <Reveal as="h2" delay={90}>Des écrans courts, un contrôle toutes les trois notions</Reveal>
            <Reveal as="p" delay={180}>
              Pas de page de 2 000 mots qu&apos;on survole. Une idée par écran, une feuille
              de calcul dès qu&apos;on nomme une cellule, et un contrôle qui ne laisse pas
              passer une notion mal comprise.
            </Reveal>
            <Reveal delay={270}>
              <Link className="btn btn-k" href="/modeles/dcf">Voir une leçon</Link>
            </Reveal>
          </div>
        </div>
        <div className="wrap steps3">
          <Reveal as="article" className="stepc">
            <span className="n">01</span>
            <h3>L&apos;intuition avant les maths</h3>
            <p>Une analogie, un schéma, zéro formule. Si vous ne pouvez pas expliquer le
              modèle dans un ascenseur, vous ne le comprenez pas encore.</p>
          </Reveal>
          <Reveal as="article" className="stepc" delay={90}>
            <span className="n">02</span>
            <h3>La construction, ligne par ligne</h3>
            <p>Une étape par ligne du modèle : ce qu&apos;on écrit, la formule sous son nom
              français et anglais, pourquoi, et l&apos;erreur fréquente à cet endroit.</p>
          </Reveal>
          <Reveal as="article" className="stepc" delay={180}>
            <span className="n">03</span>
            <h3>Une correction qui exécute vos formules</h3>
            <p>Vous écrivez votre formule dans une vraie grille. Elle est exécutée, pas
              comparée à un texte : toute écriture juste est acceptée, une valeur constatée
              est refusée.</p>
          </Reveal>
        </div>
      </section>

      <section id="demo">
        <div className="wrap">
          <div className="center">
            <Reveal as="span" className="eyebrow">Leçon — Discounted Cash Flow</Reveal>
            <Reveal as="h2" delay={90}>Bougez une hypothèse, la valorisation suit</Reveal>
            <Reveal as="p" className="sub" delay={180}>
              Free cash flow de départ : 806 M€, projeté sur cinq ans, terminal value par
              multiple de sortie. Le modèle complet, en miniature.
            </Reveal>
          </div>
          <Reveal><DcfDemo /></Reveal>
        </div>
      </section>

      <section className="dark2" id="certification">
        <div className="wrap split">
          <div>
            <Reveal as="span" className="eyebrow">En préparation</Reveal>
            <Reveal as="h2" delay={90}>Un examen difficile, dont la réussite se vérifie</Reveal>
            <Reveal as="p" className="sub" delay={180}>
              Les cours s&apos;apprennent partout. Ce qui manque, c&apos;est la preuve.
              La certification vise moins de 40 % de réussite, tire les paramètres de
              chaque candidat au hasard, et délivre une référence que n&apos;importe qui
              peut vérifier en ligne.
            </Reveal>
            <Reveal className="cta-row" delay={270}>
              <Link className="btn btn-w" href="/certification">Le format de l&apos;examen</Link>
              <Link className="btn btn-o" href="/verification">Vérifier un certificat</Link>
            </Reveal>
          </div>
          <Reveal className="shot" delay={90}>
            <img src="/img/team.jpg" alt="Session de travail autour d'un modèle financier" />
          </Reveal>
        </div>
      </section>

      <section id="parcours">
        <div className="wrap">
          <div className="center">
            <Reveal as="h2">Suivez un ordre, pas un catalogue</Reveal>
            <Reveal as="p" className="sub" delay={90}>
              Personne ne finit une liste de {counts.lessons} leçons. Tout le monde finit
              un parcours, avec un objectif métier au bout.
            </Reveal>
          </div>
          <Reveal><TrackTabs tracks={tracks} /></Reveal>
        </div>
      </section>

      <section id="tarifs">
        <div className="wrap">
          <div className="center">
            <Reveal as="h2">Choisissez votre accès</Reveal>
            <Reveal as="p" className="sub" delay={90}>
              Tout est ouvert pendant le lancement. Les comptes créés maintenant gardent
              cet accès quand les formules payantes arriveront.
            </Reveal>
          </div>
          <div className="plans">
            <Reveal as="article" className="plan now">
              <span className="badge">Disponible</span>
              <h3>Lancement</h3>
              <p className="price">Gratuit</p>
              <p>L&apos;intégralité du contenu publié, sans carte bancaire. Une adresse email suffit.</p>
              <ul>
                <li>Toutes les leçons publiées, tous niveaux</li>
                <li>Les exercices corrigés automatiquement</li>
                <li>Suivi de progression</li>
              </ul>
              <div className="meta">{ARROW}</div>
            </Reveal>
            <Reveal as="article" className="plan" delay={90}>
              <h3>Étudiant</h3>
              <p className="price">Bientôt — tarif réduit</p>
              <p>Sur justificatif de scolarité, pour les écoles et les universités.</p>
              <ul><li>Tout le contenu</li><li>Cas pratiques corrigés</li></ul>
              <div className="meta">{ARROW}</div>
            </Reveal>
            <Reveal as="article" className="plan" delay={180}>
              <h3>Pro</h3>
              <p className="price">Bientôt</p>
              <p>Pour celles et ceux qui modélisent au quotidien et veulent les cas réels.</p>
              <ul>
                <li>Leçons avancées</li><li>Examens blancs</li>
                <li>Passage de la certification</li>
              </ul>
              <div className="meta">{ARROW}</div>
            </Reveal>
            <Reveal as="article" className="plan photo p4">
              <div className="ph">
                <img src="/img/board.jpg" alt="Réunion d'équipe autour d'une table de travail" />
              </div>
              <div className="bd">
                <h3>Équipe</h3>
                <p className="price">Bientôt — par siège</p>
                <p>Pour un desk, un cabinet ou une promotion entière : comptes gérés,
                  progression visible par l&apos;administrateur, parcours assignables.</p>
                <ul><li>Facturation unique</li><li>Tableau de bord de progression</li></ul>
                <div className="meta">{ARROW}</div>
              </div>
            </Reveal>
            <Reveal as="article" className="plan p5" delay={90}>
              <h3>École</h3>
              <p className="price">Sur devis</p>
              <p>Licence annuelle pour un établissement, avec accès enseignant.</p>
              <ul><li>Accès illimité</li><li>Support dédié</li></ul>
              <div className="meta">{ARROW}</div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="light" id="inscription">
        <div className="wrap center" style={{ marginBottom: 0 }}>
          <Reveal as="h2">Rejoignez les premiers inscrits</Reveal>
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
