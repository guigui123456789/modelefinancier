import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Mon espace' };


const PLAN_LABEL = {
  free: 'lancement — tout le contenu publié est ouvert',
  student: 'étudiant',
  pro: 'pro',
  team: 'équipe',
};

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // Filet de sécurité si le middleware n'a pas pu rafraîchir la session.
  if (!user) redirect('/connexion?suite=/tableau-de-bord');

  const [{ data: profile }, { data: progress }, { count: total }, { data: tracks }] =
    await Promise.all([
      supabase.from('profiles').select('full_name, email, plan').eq('id', user.id).single(),
      supabase
        .from('progress')
        .select('completed_at, quiz_score, lessons(slug, title, duration_min)')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false }),
      supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('published', true),
      supabase
        .from('tracks')
        .select('slug, name, track_lessons(lessons(slug))')
        .eq('published', true)
        .order('position'),
    ]);

  const done = (progress ?? []).filter((p) => p.completed_at);
  const doneSlugs = new Set(done.map((p) => p.lessons?.slug).filter(Boolean));
  const minutes = done.reduce((s, p) => s + (p.lessons?.duration_min || 0), 0);
  const prenom = (profile?.full_name || '').split(' ')[0];

  return (
    <section className="page">
      <div className="wrap">
        <h1 style={{ fontSize: 'clamp(30px,4.6vw,48px)' }}>
          {prenom ? `Bonjour ${prenom}` : 'Mon espace'}
        </h1>
        <p className="sub" style={{ margin: '18px 0 40px' }}>
          Accès {PLAN_LABEL[profile?.plan] ?? profile?.plan ?? 'lancement'}.
        </p>

        <div className="dash">
          <div className="stat-card">
            <b>{done.length}</b>
            <span>leçons terminées sur {total ?? 0}</span>
            <div className="bar">
              <i style={{ width: `${total ? (done.length / total) * 100 : 0}%` }} />
            </div>
          </div>
          <div className="stat-card">
            <b>{Math.round(minutes / 60)} h</b>
            <span>de travail enregistré</span>
          </div>
          <div className="stat-card">
            <b>
              {done.length
                ? Math.round(
                    done.reduce((s, p) => s + (p.quiz_score ?? 0), 0) / done.length
                  )
                : 0}
              %
            </b>
            <span>score moyen aux quiz</span>
          </div>
        </div>

        <h2 style={{ fontSize: '1.7rem', marginBottom: 20 }}>Vos parcours</h2>
        <div className="catalogue" style={{ marginBottom: 46 }}>
          {(tracks ?? []).map((t) => {
            const slugs = (t.track_lessons ?? []).map((tl) => tl.lessons?.slug).filter(Boolean);
            const n = slugs.filter((s) => doneSlugs.has(s)).length;
            return (
              <Link className="row" key={t.slug} href="/parcours">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p className="t">{t.name}</p>
                  <div className="bar">
                    <i style={{ width: `${slugs.length ? (n / slugs.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="tags">
                  <span className="tag">{n} / {slugs.length}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <h2 style={{ fontSize: '1.7rem', marginBottom: 20 }}>Dernières leçons terminées</h2>
        {done.length ? (
          <div className="catalogue">
            {done.slice(0, 8).map((p) => (
              <Link className="row" key={p.lessons?.slug} href={`/modeles/${p.lessons?.slug}`}>
                <p className="t">{p.lessons?.title}</p>
                <div className="tags">
                  {p.quiz_score != null && <span className="tag done">{p.quiz_score} %</span>}
                  <span className="tag">
                    {new Date(p.completed_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="gate">
            <h3>Vous n&apos;avez pas encore commencé</h3>
            <p>
              La leçon Discounted Cash Flow est complète et montre le format : seize
              écrans, des contrôles, et une feuille de calcul à chaque fois qu&apos;on
              nomme une cellule.
            </p>
            <Link className="btn btn-w" href="/modeles/dcf">Commencer la première leçon</Link>
          </div>
        )}
      </div>
    </section>
  );
}
