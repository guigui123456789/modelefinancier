import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Entraînement',
  description:
    'Questions d’entretien, exercices corrigés automatiquement et examens blancs, en modélisation financière, Excel et Python.',
};

export default async function EntrainementPage() {
  const supabase = createClient();
  const [{ data: questions }, { data: exams }, { count: drills }] = await Promise.all([
    supabase.from('questions').select('id, prompt, domain_id, difficulty, tags').eq('published', true).limit(6),
    supabase.from('exams').select('slug, name, description, duration_min, item_count, is_mock').eq('published', true).order('position'),
    supabase.from('lesson_steps').select('*', { count: 'exact', head: true }).not('exercise', 'is', null),
  ]);

  return (
    <section className="page">
      <div className="wrap">
        <div className="center">
          <h1 style={{ fontSize: 'clamp(34px,5.4vw,58px)' }}>Entraînement</h1>
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
              Vous écrivez une vraie formule dans une vraie grille. Le correcteur l&apos;exécute,
              vérifie le résultat, et refuse une valeur écrite en dur ou une référence qui
              ne survivrait pas à une recopie.
            </p>
            <div className="meta">
              <span className="cnt">{drills ?? 0} exercices en ligne</span>
            </div>
          </article>
          <article className="card">
            <h3>Questions d&apos;entretien</h3>
            <p>
              Les questions réellement posées en banque d&apos;affaires et en private equity,
              avec la réponse attendue, le piège classique et la relance du recruteur.
            </p>
            <div className="meta">
              <span className="cnt">{(questions ?? []).length} publiées</span>
            </div>
          </article>
          <article className="card">
            <h3>Examens blancs</h3>
            <p>
              Même format, même durée et même difficulté que l&apos;examen réel. Les paramètres
              sont tirés au hasard : deux candidats ne voient jamais les mêmes chiffres.
            </p>
            <div className="meta">
              <span className="cnt">{(exams ?? []).filter((e) => e.is_mock).length} disponibles</span>
            </div>
          </article>
        </div>

        <div className="center" style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 'clamp(24px,3.4vw,36px)' }}>Essayez un exercice</h2>
          <p className="sub">
            La leçon sur les références absolues contient trois exercices corrigés
            automatiquement. Elle est en accès libre.
          </p>
        </div>
        <div className="center" style={{ marginBottom: 0 }}>
          <Link className="btn btn-w" href="/modeles/xl-ref-absolue">
            Ouvrir la leçon
          </Link>
        </div>
      </div>
    </section>
  );
}
