import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Cible du lien de confirmation envoyé par email à l'inscription.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const suite = searchParams.get('next') ?? '/tableau-de-bord';

  if (token_hash && type) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${suite.startsWith('/') ? suite : '/tableau-de-bord'}`);
    }
  }

  return NextResponse.redirect(`${origin}/connexion?erreur=lien`);
}
