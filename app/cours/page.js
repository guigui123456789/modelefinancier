import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { writtenLessonIds } from '@/lib/content';

export const metadata = {
  title: 'Les cours',
  description:
    'Modélisation financière, Excel et Python pour la finance : trois cursus complets, du débutant à l’expert.',
};

const LEVEL_NAMES = {
  1: 'Fondations', 2: 'Fonctions', 3: 'Modélisation', 4: 'Données', 5: 'Expert',
};

export default async function CoursPage() {
  const supabase = createClient();
  const written = await writtenLessonIds();
  const { data: domains } = await supabase
    .from('domains')
    .select('id, slug, name, tagline, summary, position, pillars(id, slug, name, summary, level, position, lessons(id))')
    .order('position');

  const lessonsOf = (p) => p.lessons ?? [];
  const readyOf = (p) => lessonsOf(p).filter((l) => written.has(l.id)).length;

  const stats = (d) => {
    const mods = d.pillars ?? [];
    const lessons = mods.reduce((s, p) => s + lessonsOf(p).length, 0);
    const ready = mods.reduce((s, p) => s + readyOf(p), 0);
    return { modules: mods.length, lessons, ready };
  };

  return (
    <section className="page">
      <div className="wrap">
        <div className="center">
          <h1 className="page-title">Les cours</h1>
          <p className="sub">
            Trois cursus, du premier raccourci clavier au modèle que personne d&apos;autre
            ne sait construire. Chaque leçon est une suite d&apos;écrans courts, avec un
            contrôle toutes les trois notions.
          </p>
        </div>

        <div className="domains">
          {(domains ?? []).map((d) => {
            const s = stats(d);
            const byLevel = {};
            (d.pillars ?? []).forEach((p) => {
              (byLevel[p.level] ??= []).push(p);
            });
            return (
              <article className="domain" key={d.slug}>
                <header className="domain-head">
                  <div>
                    <h2>{d.name}</h2>
                    <p className="sub" style={{ margin: '10px 0 0' }}>{d.summary}</p>
                  </div>
                  <span className="domain-stat">
                    <b className="num">{s.lessons}</b>
                    <span>
                      leçon{s.lessons > 1 ? 's' : ''}
                      {s.ready > 0 ? ` · ${s.ready} en ligne` : ' · à venir'}
                    </span>
                  </span>
                </header>

                {Object.keys(byLevel).sort().map((lvl) => (
                  <div className="level" key={lvl}>
                    <h3 className="level-title">
                      <span className="level-no num">N{lvl}</span>
                      {LEVEL_NAMES[lvl] ?? `Niveau ${lvl}`}
                    </h3>
                    <div className="modules">
                      {byLevel[lvl]
                        .sort((a, b) => a.position - b.position)
                        .map((p) => (
                          <Link className="module" key={p.slug} href={`/modeles?pilier=${p.slug}`}>
                            <span className="mod-name">{p.name}</span>
                            <span className="mod-sum">{p.summary}</span>
                            <span className="mod-count num">
                              {lessonsOf(p).length} leçon{lessonsOf(p).length > 1 ? 's' : ''}
                              {readyOf(p) > 0 ? ` · ${readyOf(p)} en ligne` : ''}
                            </span>
                          </Link>
                        ))}
                    </div>
                  </div>
                ))}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
