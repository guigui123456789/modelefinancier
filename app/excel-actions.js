'use server';

import { grade } from '@/lib/excel/grade.js';
import { createClient } from '@/lib/supabase/server';

/**
 * Corrige la formule d'un apprenant.
 * La correction se fait sur le serveur : la solution et les règles
 * ne descendent jamais dans le navigateur, où elles seraient lisibles.
 */
export async function gradeFormula(stepId, submitted) {
  const supabase = createClient();

  const { data: step, error } = await supabase
    .from('lesson_steps')
    .select('id, exercise')
    .eq('id', stepId)
    .single();

  if (error || !step?.exercise) {
    return { correct: false, message: "Cet exercice n'a pas pu être chargé." };
  }

  const result = grade(submitted, step.exercise);

  // On enregistre la tentative pour la progression, sans bloquer la réponse.
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('step_progress').upsert({
      user_id: user.id,
      step_id: stepId,
      answered: true,
      was_correct: result.correct,
      completed_at: new Date().toISOString(),
    });
  }

  return {
    correct: result.correct,
    code: result.code,
    message: result.message,
    value: typeof result.value === 'number' ? result.value : undefined,
  };
}

/** Enregistre la réponse à un QCM ou à une question numérique. */
export async function recordAnswer(stepId, wasCorrect) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { saved: false };

  await supabase.from('step_progress').upsert({
    user_id: user.id,
    step_id: stepId,
    answered: true,
    was_correct: wasCorrect,
    completed_at: new Date().toISOString(),
  });
  return { saved: true };
}

/** Marque la leçon entière comme terminée. */
export async function completeLesson(lessonId) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { saved: false };

  await supabase.from('progress').upsert({
    user_id: user.id,
    lesson_id: lessonId,
    completed_at: new Date().toISOString(),
  });
  return { saved: true };
}
