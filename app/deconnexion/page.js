import { signOut } from '@/app/actions';

export const metadata = { title: 'Se déconnecter' };

export default function DeconnexionPage() {
  return (
    <section className="page">
      <div className="wrap narrow" style={{ textAlign: 'center' }}>
        <h1 className="page-title">Se déconnecter</h1>
        <p className="sub">Votre progression est conservée, vous la retrouverez à la prochaine connexion.</p>
        <form action={signOut} style={{ marginTop: 30 }}>
          <button className="btn btn-w" type="submit">Confirmer la déconnexion</button>
        </form>
      </div>
    </section>
  );
}
