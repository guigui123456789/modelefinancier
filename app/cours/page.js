import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

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
  const { data: domains } = await supabase
    .from('domains')
    .select('id, slug, name, tagline, summary, position, pillars(id, slug, name, summary, level, position, lessons(count))')
    .order('position');

  const stats = (d) => {
    const mods = d.pillars ?? [];
    const lessons = mods.reduce((s, p) => s + (p.lessons?.[0]?.count ?? 0), 0);
    return { modules: mods.length, lessons };
  };

  return (
    <section className="page">
      <div className="wrap">
        <div className="center">
          <h1 style={{ fontSize: 'clamp(34px,5.4vw,58px)' }}>Les cours</h1>
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
                    <span>leçons</span>
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
                            <span className="mod-count num">{p.lessons?.[0]?.count ?? 0} leçons</span>
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
