import AuthForm from '@/components/AuthForm';

export const metadata = { title: 'Me connecter' };

export default function ConnexionPage({ searchParams }) {
  const suite = typeof searchParams?.suite === 'string' ? searchParams.suite : '/tableau-de-bord';
  return (
    <section className="page">
      <div className="wrap">
        <AuthForm mode="signin" suite={suite} />
      </div>
    </section>
  );
}
