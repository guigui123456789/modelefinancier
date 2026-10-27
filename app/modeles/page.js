import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { writtenLessonIds } from '@/lib/content';

export const metadata = {
  title: 'Le catalogue',
  description:
    'Toutes les leçons de modélisation financière, Excel et Python pour la finance, classées par module et par niveau.',
};

const LEVEL_LABEL = {
  fundamentals: 'Fundamentals',
  practitioner: 'Practitioner',
  advanced: 'Advanced',
};

const qs = (params) => {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) s.set(k, v); });
  const q = s.toString();
  return q ? `/modeles?${q}` : '/modeles';
};

export default async function CataloguePage({ searchParams }) {
  const supabase = createClient();
  const str = (v) => (typeof v === 'string' && v ? v : null);
  const pilier = str(searchParams?.pilier);
  const dispo = str(searchParams?.dispo) === '1';

  const [{ data: domains }, { data: pillars }, { data: { user } }, written] = await Promise.all([
    supabase.from('domains').select('id, slug, name').order('position'),
    supabase.from('pillars').select('slug, name, domain_id, position').order('position'),
    supabase.auth.getUser(),
    writtenLessonIds(),
  ]);

  // Le domaine affiché découle du module choisi : on ne montre jamais 35 onglets
  // à la fois, seulement ceux du domaine en cours.
  const current = (pillars ?? []).find((p) => p.slug === pilier) ?? null;
  const domaine = str(searchParams?.domaine) ?? (current ? String(current.domain_id) : null);
  const visiblePillars = domaine
    ? (pillars ?? []).filter((p) => String(p.domain_id) === String(domaine))
    : [];

  let query = supabase
    .from('lessons')
    .select('id, slug, title, summary, level, access, duration_min, position, pillars!inner(slug, name, domain_id, position)')
    .eq('published', true);

  if (pilier) query = query.eq('pillars.slug', pilier);
  else if (domaine) query = query.eq('pillars.domain_id', domaine);

  const { data: all } = await query
    .order('position', { referencedTable: 'pillars' })
    .order('position');

  const lessons = (all ?? []).filter((l) => (dispo ? written.has(l.id) : true));
  const availableCount = (all ?? []).filter((l) => written.has(l.id)).length;

  let done = new Set();
  if (user) {
    const { data: progress } = await supabase
      .from('progress')
      .select('completed_at, lessons(slug)')
      .not('completed_at', 'is', null);
    done = new Set((progress ?? []).map((p) => p.lessons?.slug).filter(Boolean));
  }

  return (
    <section className="page">
      <div className="wrap">
        <div className="center">
          <h1 className="page-title">Le catalogue</h1>
          <p className="sub">
            Le programme complet est arrêté ; les leçons se publient au fil de leur
            écriture. Celles marquées <b>Disponible</b> sont lisibles maintenant.
          </p>
        </div>

        <div className="filters">
          <Link className="tab" aria-selected={!domaine} href={qs({ dispo: dispo ? '1' : null })}>
            Tous les domaines
          </Link>
          {(domains ?? []).map((d) => (
            <Link
              key={d.slug}
              className="tab"
              aria-selected={String(d.id) === String(domaine)}
              href={qs({ domaine: String(d.id), dispo: dispo ? '1' : null })}
            >
              {d.name}
            </Link>
          ))}
        </div>

        {visiblePillars.length > 0 && (
          <div className="filters filters-sub">
            <Link
              className="tab"
              aria-selected={!pilier}
              href={qs({ domaine, dispo: dispo ? '1' : null })}
            >
              Tous les modules
            </Link>
            {visiblePillars.map((p) => (
              <Link
                key={p.slug}
                className="tab"
                aria-selected={pilier === p.slug}
                href={qs({ pilier: p.slug, dispo: dispo ? '1' : null })}
              >
                {p.name}
              </Link>
            ))}
          </div>
        )}

        <div className="filters filters-sub">
          <Link
            className="tab"
            aria-selected={!dispo}
            href={qs({ domaine, pilier })}
          >
            Tout le programme ({(all ?? []).length})
          </Link>
          <Link
            className="tab"
            aria-selected={dispo}
            href={qs({ domaine, pilier, dispo: '1' })}
          >
            Disponibles maintenant ({availableCount})
          </Link>
        </div>

        <div className="catalogue">
          {lessons.map((l) => {
            const ready = written.has(l.id);
            return (
              <Link
                className={ready ? 'row' : 'row soon'}
                key={l.slug}
                href={`/modeles/${l.slug}`}
              >
                <div style={{ minWidth: 0 }}>
                  <p className="t">{l.title}</p>
                  <p className="s">{l.summary}</p>
                </div>
                <div className="tags">
                  {done.has(l.slug) && <span className="tag done">Terminée</span>}
                  {ready ? (
                    <span className="tag pub">Disponible</span>
                  ) : (
                    <span className="tag soon-tag">À venir</span>
                  )}
                  <span className="tag">{LEVEL_LABEL[l.level] ?? l.level}</span>
                  <span className="tag">{l.duration_min} min</span>
                </div>
              </Link>
            );
          })}
        </div>

        {!lessons.length && (
          <div className="gate" style={{ marginTop: 32 }}>
            <h3>Rien à afficher ici pour le moment</h3>
            <p>
              Aucune leçon rédigée dans cette sélection. Le reste du programme est
              consultable, et la leçon Discounted Cash Flow montre le format complet.
            </p>
            <Link className="btn btn-w" href="/modeles/dcf">Ouvrir la leçon DCF</Link>
          </div>
        )}
      </div>
    </section>
  );
}
