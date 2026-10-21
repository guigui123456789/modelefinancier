import AuthForm from '@/components/AuthForm';

export const metadata = { title: 'Créer un compte' };

export default function InscriptionPage() {
  return (
    <section className="page">
      <div className="wrap">
        <AuthForm mode="signup" />
      </div>
    </section>
  );
}
