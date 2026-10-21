'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { joinWaitlist } from '@/app/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-k" type="submit" disabled={pending}>
      {pending ? 'Envoi…' : 'Créer mon compte'}
    </button>
  );
}

export default function WaitlistForm() {
  const [state, action] = useFormState(joinWaitlist, {});

  return (
    <>
      <form className="signup" action={action}>
        <label htmlFor="waitlist-email" className="sr-only">Adresse email</label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          placeholder="vous@exemple.com"
          autoComplete="email"
          required
        />
        <SubmitButton />
      </form>
      <p id="msg" role="status">
        {state.error || state.success || 'Gratuit pendant le lancement, sans carte bancaire.'}
      </p>
    </>
  );
}
