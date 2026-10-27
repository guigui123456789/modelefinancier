import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { writtenLessonIds } from '@/lib/content';

export const metadata = {
  title: 'Les leçons',
  description:
    'Les leçons disponibles et le programme complet, par matière : modélisation financière, Excel et Python pour la finance.',
};

const NIVEAU = { fundamentals: 'Fondations', practitioner: 'Praticien', advanced: 'Avancé' };

const lien = (p) => {
  const q = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => { if (v) q.set(k, v); });
  const s = q.toString();
  return s ? `/modeles?${s}` : '/modeles';
};

export default async function CataloguePage({ searchParams }) {
  const supabase = createClient();
  const txt = (v) => (typeof v === 'string' && v ? v : null);
  const matiere = txt(searchParams?.matiere);
  const pilier = txt(searchParams?.pilier);
  // Par défaut on montre ce qui est lisible. Le programme complet est un choix.
  const tout = txt(searchParams?.tout) === '1' || Boolean(pilier);

  const [{ data: domains }, { data: { user } }, written] = await Promise.all([
    supabase.from('domains').select('id, slug, name').order('position'),
    supabase.auth.getUser(),
    writtenLessonIds(),
  ]);

  const domaine = (domains ?? []).find((d) => d.slug === matiere) ?? null;

  let q = supabase
    .from('lessons')
    .select('id, slug, title, summary, level, duration_min, position, pillars!inner(slug, name, domain_id, position)')
    .eq('published', true);

  if (pilier) q = q.eq('pillars.slug', pilier);
  else if (domaine) q = q.eq('pillars.domain_id', domaine.id);

  const { data: rows } = await q
    .order('position', { referencedTable: 'pillars' })
    .order('position');

  const all = rows ?? [];
  const dispo = all.filter((l) => written.has(l.id));
  const visibles = tout ? all : dispo;

  let faites = new Set();
  if (user) {
    const { data: progress } = await supabase
      .from('progress')
      .select('completed_at, lessons(slug)')
      .not('completed_at', 'is', null);
    faites = new Set((progress ?? []).map((p) => p.lessons?.slug).filter(Boolean));
  }

  // Regroupement par module : une liste de 154 lignes à plat ne se lit pas.
  const groupes = [];
  visibles.forEach((l) => {
    const nom = l.pillars?.name ?? 'Autres';
    const dernier = groupes[groupes.length - 1];
    if (dernier && dernier.nom === nom) dernier.lecons.push(l);
    else groupes.push({ nom, slug: l.pillars?.slug, lecons: [l] });
  });

  const titre = pilier ? (all[0]?.pillars?.name ?? 'Module') : 'Les leçons';

  return (
    <section className="page">
      <div className="wrap">
        <div className="center">
          <h1 className="page-title">{titre}</h1>
          <p className="sub">
            {pilier
              ? `${all.length} leçon${all.length > 1 ? 's' : ''} dans ce module, dont ${dispo.length} déjà en ligne.`
              : 'Les leçons déjà écrites sont lisibles tout de suite. Le programme complet montre où va le cursus.'}
          </p>
        </div>

        {pilier ? (
          <p className="back-row">
            <Link className="back-link" href="/cours">Retour au programme</Link>
          </p>
        ) : (
          <>
            <div className="filters">
              <Link className="tab" aria-selected={!matiere} href={lien({ tout: tout ? '1' : null })}>
                Toutes les matières
              </Link>
              {(domains ?? []).map((d) => (
                <Link
                  key={d.slug}
                  className="tab"
                  aria-selected={matiere === d.slug}
                  href={lien({ matiere: d.slug, tout: tout ? '1' : null })}
                >
                  {d.name}
                </Link>
              ))}
            </div>

            <div className="switch-row">
              <Link className="switch-btn" aria-selected={!tout} href={lien({ matiere })}>
                En ligne <span className="num">{dispo.length}</span>
              </Link>
              <Link className="switch-btn" aria-selected={tout} href={lien({ matiere, tout: '1' })}>
                Tout le programme <span className="num">{all.length}</span>
              </Link>
            </div>
          </>
        )}

        {groupes.map((g) => (
          <div className="group" key={g.slug + g.nom}>
            <h2 className="group-title">{g.nom}</h2>
            <div className="catalogue">
              {g.lecons.map((l) => {
                const prete = written.has(l.id);
                return (
                  <Link className={prete ? 'row' : 'row soon'} key={l.slug} href={`/modeles/${l.slug}`}>
                    <div style={{ minWidth: 0 }}>
                      <p className="t">{l.title}</p>
                      <p className="s">{l.summary}</p>
                    </div>
                    <div className="tags">
                      {faites.has(l.slug) && <span className="tag done">Terminée</span>}
                      {prete ? (
                        <span className="tag pub">En ligne</span>
                      ) : (
                        <span className="tag soon-tag">À venir</span>
                      )}
                      <span className="tag">{NIVEAU[l.level] ?? l.level}</span>
                      <span className="tag">{l.duration_min} min</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {!visibles.length && (
          <div className="gate">
            <h3>Rien de publié dans cette sélection</h3>
            <p>
              Les leçons de cette matière sont encore en écriture. Le programme complet
              reste consultable, et la leçon Discounted Cash Flow montre le format.
            </p>
            <div className="cta-row">
              <Link className="btn btn-w" href="/modeles/dcf">Ouvrir la leçon DCF</Link>
              <Link className="btn btn-o" href={lien({ matiere, tout: '1' })}>Voir le programme</Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
