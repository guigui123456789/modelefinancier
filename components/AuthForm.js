'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { signIn, signUp } from '@/app/actions';

function SubmitButton({ label }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-w" type="submit" disabled={pending} style={{ width: '100%' }}>
      {pending ? 'Un instant…' : label}
    </button>
  );
}

export default function AuthForm({ mode, suite = '/tableau-de-bord' }) {
  const isSignup = mode === 'signup';
  const [state, action] = useFormState(isSignup ? signUp : signIn, {});

  return (
    <div className="narrow">
      <h1 style={{ fontSize: 'clamp(30px,4.6vw,44px)', textAlign: 'center' }}>
        {isSignup ? 'Créer un compte' : 'Me connecter'}
      </h1>
      <p className="sub" style={{ textAlign: 'center' }}>
        {isSignup
          ? 'Accès complet pendant le lancement. Pas de carte bancaire.'
          : 'Retrouvez votre progression et vos templates.'}
      </p>

      <form className="form" action={action}>
        {!isSignup && <input type="hidden" name="suite" value={suite} />}

        {state.error && <p className="alert err" role="alert">{state.error}</p>}
        {state.success && <p className="alert ok" role="status">{state.success}</p>}

        {isSignup && (
          <div className="field">
            <label htmlFor="full_name">Nom (facultatif)</label>
            <input id="full_name" name="full_name" type="text" autoComplete="name" />
          </div>
        )}

        <div className="field">
          <label htmlFor="email">Adresse email</label>
          <input id="email" name="email" type="email" autoComplete="email"
            placeholder="vous@exemple.com" required />
        </div>

        <div className="field">
          <label htmlFor="password">Mot de passe</label>
          <input id="password" name="password" type="password" required
            autoComplete={isSignup ? 'new-password' : 'current-password'} />
          {isSignup && <p className="help">Au moins 8 caractères.</p>}
        </div>

        <SubmitButton label={isSignup ? 'Créer mon compte' : 'Me connecter'} />
      </form>

      <p className="switch">
        {isSignup ? (
          <>Vous avez déjà un compte ? <Link href="/connexion">Me connecter</Link></>
        ) : (
          <>Pas encore de compte ? <Link href="/inscription">En créer un</Link></>
        )}
      </p>
    </div>
  );
}
