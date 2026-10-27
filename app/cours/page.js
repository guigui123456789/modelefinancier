import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { writtenLessonIds } from '@/lib/content';

export const metadata = {
  title: 'Le programme',
  description:
    'Le programme complet, matière par matière : modélisation financière, Excel et Python pour la finance.',
};

const NIVEAUX = { 1: 'Fondations', 2: 'Fonctions', 3: 'Modélisation', 4: 'Données', 5: 'Expert' };

export default async function CoursPage() {
  const supabase = createClient();
  const written = await writtenLessonIds();
  const { data: domains } = await supabase
    .from('domains')
    .select('slug, name, summary, position, pillars(slug, name, summary, level, position, lessons(id))')
    .order('position');

  const matieres = (domains ?? []).map((d) => {
    const modules = (d.pillars ?? [])
      .map((p) => {
        const lessons = p.lessons ?? [];
        return { ...p, total: lessons.length, ready: lessons.filter((l) => written.has(l.id)).length };
      })
      .sort((a, b) => a.position - b.position);
    return {
      ...d,
      modules,
      total: modules.reduce((s, m) => s + m.total, 0),
      ready: modules.reduce((s, m) => s + m.ready, 0),
    };
  });

  return (
    <section className="page">
      <div className="wrap">
        <div className="center">
          <h1 className="page-title">Le programme</h1>
          <p className="sub">
            Chaque matière se découpe en modules, chaque module en leçons. L&apos;ordre
            est imposé : une leçon ne s&apos;ouvre qu&apos;une fois son prérequis acquis.
          </p>
        </div>

        {/* Sommaire : savoir en un coup d'œil ce qui existe. */}
        <nav className="toc">
          {matieres.map((m) => (
            <a className="toc-item" key={m.slug} href={`#${m.slug}`}>
              <span className="toc-name">{m.name}</span>
              <span className="toc-count num">
                {m.ready} / {m.total}
              </span>
            </a>
          ))}
        </nav>

        <div className="domains">
          {matieres.map((m) => (
            <article className="domain" id={m.slug} key={m.slug}>
              <header className="domain-head">
                <div>
                  <h2>{m.name}</h2>
                  <p className="sub" style={{ margin: '8px 0 0', textAlign: 'left' }}>{m.summary}</p>
                </div>
                <span className="domain-stat">
                  <b className="num">{m.ready}</b>
                  <span>
                    leçon{m.ready > 1 ? 's' : ''} en ligne sur {m.total}
                  </span>
                </span>
              </header>

              {m.modules.length === 0 && (
                <p className="empty-note">Le découpage de cette matière est en cours.</p>
              )}

              {m.modules.map((p) => (
                <Link className="module-row" key={p.slug} href={`/modeles?pilier=${p.slug}`}>
                  <span className="module-level num" title={NIVEAUX[p.level] ?? `Niveau ${p.level}`}>
                    N{p.level}
                  </span>
                  <span className="module-main">
                    <span className="module-name">{p.name}</span>
                    <span className="module-sum">{p.summary}</span>
                  </span>
                  <span className="module-tags">
                    {p.ready > 0 ? (
                      <span className="tag pub">{p.ready} en ligne</span>
                    ) : (
                      <span className="tag soon-tag">à venir</span>
                    )}
                    <span className="tag">
                      {p.total} leçon{p.total > 1 ? 's' : ''}
                    </span>
                  </span>
                </Link>
              ))}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
