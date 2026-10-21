import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DcfDemo from '@/components/DcfDemo';

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
        'id, slug, title, summary, level, access, duration_min, pillars(name, slug),' +
          'lesson_prerequisites!lesson_prerequisites_lesson_id_fkey(' +
          'lessons!lesson_prerequisites_prerequisite_id_fkey(slug, title))'
      )
      .eq('slug', params.slug)
      .eq('published', true)
      .single(),
    supabase.auth.getUser(),
  ]);

  if (!lesson) notFound();

  // Pendant le lancement, un compte suffit pour tout voir.
  // Le jour du payant, c'est ici et dans la fonction has_access() que ça change.
  const ouvert = lesson.access === 'public' || Boolean(user);
  const prerequisites = (lesson.lesson_prerequisites ?? [])
    .map((p) => p.lessons)
    .filter(Boolean);

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
          {lesson.access === 'public' && <span className="tag pub">Lecture libre</span>}
        </div>

        {prerequisites.length > 0 && (
          <p className="sub" style={{ marginTop: 22 }}>
            À lire avant :{' '}
            {prerequisites.map((p, i) => (
              <span key={p.slug}>
                {i > 0 && ', '}
                <Link href={`/modeles/${p.slug}`} style={{ textDecoration: 'underline' }}>
                  {p.title}
                </Link>
              </span>
            ))}
          </p>
        )}

        {ouvert ? (
          <article className="body">
            <h2>À quoi ça sert</h2>
            <p>
              Le contenu de cette leçon sera rédigé selon le gabarit en huit blocs :
              intuition, prérequis, construction ligne par ligne, calculateur, template
              Excel, cas pratique et quiz.
            </p>

            {lesson.slug === 'dcf' && (
              <>
                <h2>Le calculateur</h2>
                <p>
                  Bougez les hypothèses et regardez la valorisation suivre. Les flux sont
                  en millions d&apos;euros.
                </p>
                <DcfDemo />
              </>
            )}

            <h2>La suite</h2>
            <p>
              Cette page est prête à recevoir le texte de la leçon. Le contenu arrivera
              par le fichier MDX correspondant.
            </p>
          </article>
        ) : (
          <div className="gate">
            <h3>Cette leçon est réservée aux inscrits</h3>
            <p>
              L&apos;inscription est gratuite pendant le lancement, et vous donne accès à
              l&apos;ensemble du catalogue ainsi qu&apos;aux templates Excel.
            </p>
            <Link className="btn btn-w" href={`/inscription?suite=/modeles/${lesson.slug}`}>
              Créer un compte gratuit
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
