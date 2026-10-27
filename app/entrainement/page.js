import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Entraînement',
  description:
    "Exercices corrigés formule par formule, questions d'entretien et examens blancs, en modélisation financière, Excel et Python.",
};

export default async function EntrainementPage() {
  const supabase = createClient();
  const [{ data: questions }, { data: exams }, { data: steps }] = await Promise.all([
    supabase.from('questions').select('id, prompt, difficulty, tags').eq('published', true).limit(8),
    supabase.from('exams').select('slug, name, description, duration_min, item_count, is_mock').eq('published', true).order('position'),
    supabase.from('lesson_steps').select('lesson_id, lessons(slug, title)').not('exercise', 'is', null),
  ]);

  const drills = (steps ?? []).length;
  const lessonsWithDrills = [...new Map(
    (steps ?? []).filter((s) => s.lessons).map((s) => [s.lessons.slug, s.lessons])
  ).values()];
  const mocks = (exams ?? []).filter((e) => e.is_mock);
  const nbQuestions = (questions ?? []).length;

  return (
    <section className="page">
      <div className="wrap">
        <div className="center">
          <h1 className="page-title">Entraînement</h1>
          <p className="sub">
            Les cours enseignent. L&apos;entraînement vérifie que ça tient sous pression :
            exercices corrigés à la formule près, questions d&apos;entretien réelles,
            examens blancs chronométrés.
          </p>
        </div>

        <div className="cards" style={{ marginBottom: 'clamp(40px,6vw,64px)' }}>
          <article className="card">
            <h3>Exercices corrigés</h3>
            <p>
              Vous écrivez une vraie formule dans une vraie grille. Le correcteur
              l&apos;exécute, vérifie le résultat, et refuse une valeur écrite en dur ou une
              référence qui ne survivrait pas à une recopie.
            </p>
            <div className="meta">
              <span className="cnt">{drills} exercices en ligne</span>
            </div>
          </article>
          <article className="card">
            <h3>Questions d&apos;entretien</h3>
            <p>
              Les questions réellement posées en banque d&apos;affaires et en private
              equity, avec la réponse attendue, le piège classique et la relance du
              recruteur.
            </p>
            <div className="meta">
              <span className="cnt">
                {nbQuestions > 0 ? `${nbQuestions} publiées` : 'En cours d’écriture'}
              </span>
            </div>
          </article>
          <article className="card">
            <h3>Examens blancs</h3>
            <p>
              Même format, même durée et même difficulté que l&apos;examen réel. Les
              paramètres sont tirés au hasard : deux candidats ne voient jamais les mêmes
              chiffres.
            </p>
            <div className="meta">
              <span className="cnt">
                {mocks.length > 0 ? `${mocks.length} disponibles` : 'Avec la certification'}
              </span>
            </div>
          </article>
        </div>

        {nbQuestions > 0 && (
          <>
            <div className="center" style={{ marginBottom: 24 }}>
              <h2 className="section-title">Quelques questions</h2>
            </div>
            <div className="catalogue" style={{ marginBottom: 'clamp(40px,6vw,64px)' }}>
              {questions.map((q) => (
                <div className="row" key={q.id}>
                  <p className="t">{q.prompt}</p>
                  <div className="tags">
                    <span className="tag">Difficulté {q.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {mocks.length > 0 && (
          <>
            <div className="center" style={{ marginBottom: 24 }}>
              <h2 className="section-title">Les examens blancs</h2>
            </div>
            <div className="catalogue" style={{ marginBottom: 'clamp(40px,6vw,64px)' }}>
              {mocks.map((e) => (
                <div className="row" key={e.slug}>
                  <div style={{ minWidth: 0 }}>
                    <p className="t">{e.name}</p>
                    <p className="s">{e.description}</p>
                  </div>
                  <div className="tags">
                    <span className="tag">{e.item_count} items</span>
                    <span className="tag">{e.duration_min} min</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="center" style={{ marginBottom: 24 }}>
          <h2 className="section-title">Les leçons qui contiennent des exercices</h2>
          <p className="sub">
            Toutes en accès libre. La correction tourne côté serveur : la solution ne
            descend jamais dans votre navigateur.
          </p>
        </div>
        <div className="catalogue">
          {lessonsWithDrills.map((l) => (
            <Link className="row" key={l.slug} href={`/modeles/${l.slug}`}>
              <p className="t">{l.title}</p>
              <div className="tags">
                <span className="tag pub">Public</span>
                <span className="tag">
                  {(() => {
                    const n = (steps ?? []).filter((s) => s.lessons?.slug === l.slug).length;
                    return `${n} exercice${n > 1 ? 's' : ''}`;
                  })()}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {nbQuestions === 0 && (
          <div className="gate">
            <h3>La banque de questions d&apos;entretien arrive</h3>
            <p>
              Elle est en cours d&apos;écriture : les questions réellement posées, la
              réponse attendue, et le piège sur lequel la plupart des candidats tombent.
              Les inscrits seront prévenus à l&apos;ouverture.
            </p>
            <Link className="btn btn-w" href="/inscription">Créer un compte gratuit</Link>
          </div>
        )}
      </div>
    </section>
  );
}
