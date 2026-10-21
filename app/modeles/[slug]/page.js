import Link from 'next/link';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import { createClient } from '@/lib/supabase/server';
import LessonPlayer from '@/components/LessonPlayer';

marked.setOptions({ gfm: true, breaks: false });

const md = (s) => (s ? marked.parse(s) : null);

const LEVEL_LABEL = {
  fundamentals: 'Fundamentals',
  practitioner: 'Practitioner',
  advanced: 'Advanced',
};

export async function generateMetadata({ params }) {
  const supabase = createClient();
  const { data } = await supabase
    .from('lessons')
    .select('title, summary')
    .eq('slug', params.slug)
    .single();
  if (!data) return { title: 'Leçon introuvable' };
  return { title: data.title, description: data.summary };
}

export default async function LessonPage({ params }) {
  const supabase = createClient();

  const [{ data: lesson }, { data: { user } }] = await Promise.all([
    supabase
      .from('lessons')
      .select(
        'id, slug, title, summary, level, access, duration_min, position, pillar_id,' +
          'pillars(name, slug, domain_id, domains(name, slug)),' +
          'lesson_prerequisites!lesson_prerequisites_lesson_id_fkey(' +
          'lessons!lesson_prerequisites_prerequisite_id_fkey(slug, title))'
      )
      .eq('slug', params.slug)
      .eq('published', true)
      .single(),
    supabase.auth.getUser(),
  ]);

  if (!lesson) notFound();

  const open = lesson.access === 'public' || Boolean(user);

  const [{ data: rawSteps }, { data: siblings }] = await Promise.all([
    open
      ? supabase
          .from('lesson_steps')
          .select('*')
          .eq('lesson_id', lesson.id)
          .order('position')
      : Promise.resolve({ data: [] }),
    supabase
      .from('lessons')
      .select('slug, title, position')
      .eq('pillar_id', lesson.pillar_id)
      .eq('published', true)
      .order('position'),
  ]);

  const nextLesson =
    (siblings ?? []).find((s) => s.position > lesson.position) ?? null;

  // Le markdown est rendu côté serveur : le navigateur reçoit du HTML prêt.
  // La solution d'un exercice ne descend jamais dans la page.
  const steps = (rawSteps ?? []).map((s) => ({
    id: s.id,
    kind: s.kind,
    title: s.title,
    bodyHtml: md(s.body),
    asideHtml: md(s.aside),
    explanationHtml: md(s.explanation),
    options: s.options ?? null,
    correct: s.kind === 'check' ? s.correct : null,
    tolerance: s.tolerance,
    unit: s.unit,
    formula: s.formula,
    hint: s.hint,
    sheet: s.sheet ?? null,
    ribbon: s.kind === 'ribbon' ? s.exercise : null,
    shortcut: s.kind === 'shortcut' ? s.exercise : null,
    exercise: s.exercise
      ? {
          display: s.exercise.display ?? {},
          cells: s.exercise.cells ?? {},
          target: s.exercise.target ?? null,
        }
      : null,
  }));

  const prerequisites = (lesson.lesson_prerequisites ?? [])
    .map((p) => p.lessons)
    .filter(Boolean);

  if (!open) {
    return (
      <section className="page">
        <div className="wrap lesson">
          <p className="eyebrow">{lesson.pillars?.name}</p>
          <h1>{lesson.title}</h1>
          <p className="sub" style={{ margin: '20px 0 0' }}>{lesson.summary}</p>
          <div className="gate">
            <h3>Cette leçon est réservée aux inscrits</h3>
            <p>
              L&apos;inscription est gratuite pendant le lancement et ouvre l&apos;ensemble
              du catalogue, les exercices corrigés et le suivi de progression.
            </p>
            <Link className="btn btn-w" href={`/inscription?suite=/modeles/${lesson.slug}`}>
              Créer un compte gratuit
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!steps.length) {
    return (
      <section className="page">
        <div className="wrap lesson">
          <p className="eyebrow">
            <Link href={`/modeles?pilier=${lesson.pillars?.slug}`}>{lesson.pillars?.name}</Link>
          </p>
          <h1>{lesson.title}</h1>
          <p className="sub" style={{ margin: '20px 0 0' }}>{lesson.summary}</p>
          <div className="meta-row">
            <span className="tag">{LEVEL_LABEL[lesson.level] ?? lesson.level}</span>
            <span className="tag">{lesson.duration_min} min</span>
          </div>
          {prerequisites.length > 0 && (
            <p className="sub" style={{ marginTop: 22 }}>
              À suivre avant :{' '}
              {prerequisites.map((p, k) => (
                <span key={p.slug}>
                  {k > 0 && ', '}
                  <Link href={`/modeles/${p.slug}`} style={{ textDecoration: 'underline' }}>
                    {p.title}
                  </Link>
                </span>
              ))}
            </p>
          )}
          <div className="gate" style={{ marginTop: 40 }}>
            <h3>Leçon en cours d&apos;écriture</h3>
            <p>
              Le programme est arrêté, le contenu de cette leçon arrive. En attendant,
              la leçon <Link href="/modeles/dcf" style={{ textDecoration: 'underline' }}>Discounted Cash Flow</Link> est
              complète et montre le format.
            </p>
            {nextLesson && (
              <Link className="btn btn-o" href={`/modeles/${nextLesson.slug}`}>
                Leçon suivante du module
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page player-page">
      <div className="wrap">
        <p className="player-crumb">
          {lesson.pillars?.domains?.name} · {lesson.pillars?.name}
        </p>
        <h1 className="player-title">{lesson.title}</h1>
        <LessonPlayer
          lessonId={lesson.id}
          lessonTitle={lesson.title}
          steps={steps}
          nextLesson={nextLesson}
          signedIn={Boolean(user)}
        />
      </div>
    </section>
  );
}
