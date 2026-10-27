import { createClient } from '@/lib/supabase/server';

/**
 * Les leçons réellement rédigées : celles qui ont au moins un écran.
 * Sert partout où le site annonce un chiffre, pour qu'aucune page ne
 * promette un contenu qui n'existe pas encore.
 */
export async function writtenLessonIds() {
  const supabase = createClient();
  const { data } = await supabase.from('lesson_steps').select('lesson_id');
  return new Set((data ?? []).map((s) => s.lesson_id));
}

/** Les compteurs affichés sur l'accueil et dans les pages de catalogue. */
export async function siteCounts() {
  const supabase = createClient();
  const [
    { count: subjects }, { count: modules }, { count: lessons },
    { count: tracks }, written, { count: exercises },
  ] = await Promise.all([
    supabase.from('domains').select('*', { count: 'exact', head: true }),
    supabase.from('pillars').select('*', { count: 'exact', head: true }),
    supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('published', true),
    supabase.from('tracks').select('*', { count: 'exact', head: true }).eq('published', true),
    writtenLessonIds(),
    supabase.from('lesson_steps').select('*', { count: 'exact', head: true }).not('exercise', 'is', null),
  ]);

  return {
    subjects: subjects ?? 0,
    modules: modules ?? 0,
    lessons: lessons ?? 0,
    tracks: tracks ?? 0,
    written: written.size,
    exercises: exercises ?? 0,
  };
}

/** Les matières, avec leur volume réel et ce qui est déjà lisible. */
export async function subjects() {
  const supabase = createClient();
  const written = await writtenLessonIds();
  const { data } = await supabase
    .from('domains')
    .select('slug, name, tagline, summary, position, pillars(slug, lessons(id))')
    .order('position');

  return (data ?? []).map((d) => {
    const all = (d.pillars ?? []).flatMap((p) => p.lessons ?? []);
    return {
      slug: d.slug,
      name: d.name,
      tagline: d.tagline,
      summary: d.summary,
      modules: (d.pillars ?? []).length,
      lessons: all.length,
      ready: all.filter((l) => written.has(l.id)).length,
    };
  });
}
