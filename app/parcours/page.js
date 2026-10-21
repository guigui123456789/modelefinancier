import { createClient } from '@/lib/supabase/server';
import TrackTabs from '@/components/TrackTabs';

export const metadata = {
  title: 'Les parcours',
  description:
    'Des suites ordonnées de leçons avec un objectif métier : Valuation Analyst, M&A, Private Equity, CFO.',
};

export default async function ParcoursPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('tracks')
    .select('slug, name, description, position, track_lessons(position, lessons(slug, title, level, duration_min))')
    .eq('published', true)
    .order('position');

  const tracks = (data ?? []).map((t) => ({
    ...t,
    lessons: (t.track_lessons ?? [])
      .sort((a, b) => a.position - b.position)
      .map((tl) => tl.lessons)
      .filter(Boolean),
  }));

  return (
    <section className="page">
      <div className="wrap">
        <div className="center">
          <h1 style={{ fontSize: 'clamp(34px,5.4vw,58px)' }}>Les parcours</h1>
          <p className="sub">
            Une suite ordonnée de leçons avec un objectif métier au bout, plutôt qu&apos;un
            catalogue dans lequel se perdre.
          </p>
        </div>
        <TrackTabs tracks={tracks} />
      </div>
    </section>
  );
}
