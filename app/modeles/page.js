import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Le catalogue des modèles',
  description:
    'Les 48 modèles financiers du métier, classés par pilier et par niveau : DCF, LBO, merger model, Three-Statement Model, Monte Carlo.',
};

const LEVEL_LABEL = {
  fundamentals: 'Fundamentals',
  practitioner: 'Practitioner',
  advanced: 'Advanced',
};

export default async function CataloguePage({ searchParams }) {
  const supabase = createClient();
  const filtre = typeof searchParams?.pilier === 'string' ? searchParams.pilier : null;

  const [{ data: pillars }, { data: { user } }] = await Promise.all([
    supabase.from('pillars').select('slug, name').order('position'),
    supabase.auth.getUser(),
  ]);

  let query = supabase
    .from('lessons')
    .select('slug, title, summary, level, access, duration_min, position, pillars!inner(slug, name, position)')
    .eq('published', true);

  if (filtre) query = query.eq('pillars.slug', filtre);

  const { data: lessons } = await query
    .order('position', { referencedTable: 'pillars' })
    .order('position');

  // Progression de l'utilisateur connecté, pour marquer les leçons terminées.
  let done = new Set();
  if (user) {
    const { data: progress } = await supabase
      .from('progress')
      .select('lesson_id, completed_at, lessons(slug)')
      .not('completed_at', 'is', null);
    done = new Set((progress ?? []).map((p) => p.lessons?.slug).filter(Boolean));
  }

  return (
    <section className="page">
      <div className="wrap">
        <div className="center">
          <h1 style={{ fontSize: 'clamp(34px,5.4vw,58px)' }}>Le catalogue</h1>
          <p className="sub">
            Chaque modèle a son pilier et son niveau. Les leçons marquées « public » sont
            lisibles sans compte.
          </p>
        </div>

        <div className="filters">
          <Link className="tab" aria-selected={!filtre} href="/modeles">Tous</Link>
          {(pillars ?? []).map((p) => (
            <Link
              key={p.slug}
              className="tab"
              aria-selected={filtre === p.slug}
              href={`/modeles?pilier=${p.slug}`}
            >
              {p.name}
            </Link>
          ))}
        </div>

        <div className="catalogue">
          {(lessons ?? []).map((l) => (
            <Link className="row" key={l.slug} href={`/modeles/${l.slug}`}>
              <div style={{ minWidth: 0 }}>
                <p className="t">{l.title}</p>
                <p className="s">{l.summary}</p>
              </div>
              <div className="tags">
                {done.has(l.slug) && <span className="tag done">Terminée</span>}
                {l.access === 'public' && <span className="tag pub">Public</span>}
                <span className="tag">{LEVEL_LABEL[l.level] ?? l.level}</span>
                <span className="tag">{l.duration_min} min</span>
              </div>
            </Link>
          ))}
        </div>

        {!lessons?.length && (
          <p className="sub" style={{ textAlign: 'center' }}>
            Aucune leçon publiée dans ce pilier pour le moment.
          </p>
        )}
      </div>
    </section>
  );
}
