'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

/** Les messages d'erreur de Supabase sont en anglais : on les traduit. */
function traduire(message = '') {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (m.includes('email not confirmed')) return "Confirmez d'abord votre email : le lien est dans votre boîte de réception.";
  if (m.includes('already registered') || m.includes('already been registered')) return 'Un compte existe déjà avec cette adresse. Connectez-vous.';
  if (m.includes('password should be at least')) return 'Le mot de passe doit faire au moins 8 caractères.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Trop de tentatives. Réessayez dans quelques minutes.';
  if (m.includes('unable to validate email')) return "Cette adresse email n'est pas valide.";
  return "Une erreur est survenue. Réessayez dans un instant.";
}

export async function signUp(_prevState, formData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('full_name') ?? '').trim();

  if (!EMAIL.test(email)) {
    return { error: 'Entrez une adresse email valide.' };
  }
  if (password.length < 8) {
    return { error: 'Choisissez un mot de passe d’au moins 8 caractères.' };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName || null } },
  });

  if (error) return { error: traduire(error.message) };

  return {
    success:
      'Compte créé. Vérifiez votre boîte de réception : un email de confirmation vous attend.',
  };
}

export async function signIn(_prevState, formData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const suite = String(formData.get('suite') ?? '/tableau-de-bord');

  if (!EMAIL.test(email) || !password) {
    return { error: 'Entrez votre email et votre mot de passe.' };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: traduire(error.message) };

  revalidatePath('/', 'layout');
  redirect(suite.startsWith('/') ? suite : '/tableau-de-bord');
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

/** Inscription à la liste d'attente depuis la page d'accueil. */
export async function joinWaitlist(_prevState, formData) {
  const email = String(formData.get('email') ?? '').trim();
  if (!EMAIL.test(email)) {
    return { error: 'Entrez une adresse email valide pour continuer.' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('waitlist')
    .insert({ email, source: 'landing' });

  // 23505 = doublon : l'adresse est déjà enregistrée, ce n'est pas un échec.
  if (error && error.code !== '23505') {
    return { error: "L'enregistrement a échoué. Réessayez dans un instant." };
  }

  return { success: 'Merci. Vous serez prévenu dès l’ouverture des inscriptions.' };
}

/** Marque une leçon comme terminée et enregistre le score du quiz. */
export async function completeLesson(lessonId, score) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Connectez-vous pour enregistrer votre progression.' };

  const { error } = await supabase.from('progress').upsert({
    user_id: user.id,
    lesson_id: lessonId,
    completed_at: new Date().toISOString(),
    quiz_score: score ?? null,
  });

  if (error) return { error: "La progression n'a pas pu être enregistrée." };

  revalidatePath('/tableau-de-bord');
  return { success: true };
}
