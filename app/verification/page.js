import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Vérifier un certificat',
  description:
    "Vérifiez publiquement l'authenticité d'un certificat modelefinancier.com à partir de sa référence.",
};

export default async function VerificationPage({ searchParams }) {
  const ref = typeof searchParams?.ref === 'string' ? searchParams.ref.trim() : '';
  let certificat = null;
  let cherche = false;

  if (ref) {
    cherche = true;
    const supabase = createClient();
    const { data } = await supabase.rpc('verify_certificate', { ref });
    certificat = Array.isArray(data) ? data[0] ?? null : data ?? null;
  }

  return (
    <section className="page">
      <div className="wrap">
        <div className="center">
          <h1 style={{ fontSize: 'clamp(34px,5.4vw,58px)' }}>Vérifier un certificat</h1>
          <p className="sub">
            Chaque certificat porte une référence unique. Saisissez-la pour confirmer
            qu&apos;elle correspond bien à un examen réussi. Aucun compte n&apos;est
            nécessaire.
          </p>
        </div>

        <div className="verif">
          <form method="get" action="/verification">
            <input
              type="text"
              name="ref"
              defaultValue={ref}
              placeholder="MF-2026-XXXXXX"
              aria-label="Référence du certificat"
              autoComplete="off"
            />
            <button className="btn btn-w" type="submit">Vérifier</button>
          </form>

          {cherche && certificat && (
            <div className="verif-result ok">
              <h3>Certificat authentique</h3>
              <div className="specs" style={{ marginTop: 18 }}>
                <div className="spec">
                  <span className="spec-k">Référence</span>
                  <span className="spec-v num">{certificat.reference}</span>
                </div>
                <div className="spec">
                  <span className="spec-k">Titulaire</span>
                  <span className="spec-v">{certificat.holder}</span>
                </div>
                {certificat.exam_name && (
                  <div className="spec">
                    <span className="spec-k">Examen</span>
                    <span className="spec-v">{certificat.exam_name}</span>
                  </div>
                )}
                {certificat.score != null && (
                  <div className="spec">
                    <span className="spec-k">Score</span>
                    <span className="spec-v num">{certificat.score} %</span>
                  </div>
                )}
                {certificat.issued_at && (
                  <div className="spec">
                    <span className="spec-k">Délivré le</span>
                    <span className="spec-v num">
                      {new Date(certificat.issued_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {cherche && !certificat && (
            <div className="verif-result ko">
              <h3>Référence inconnue</h3>
              <p>
                Aucun certificat ne porte cette référence. Vérifiez la saisie : elle est
                recopiée telle quelle depuis le document, sans espace supplémentaire.
              </p>
            </div>
          )}

          {!cherche && (
            <div className="verif-result">
              <h3>L&apos;examen n&apos;est pas encore ouvert</h3>
              <p>
                Aucun certificat n&apos;a donc encore été délivré. Cette page restera
                l&apos;adresse de vérification : un employeur pourra y contrôler une
                référence sans passer par nous.{' '}
                <Link href="/certification" style={{ color: '#fff', textDecoration: 'underline' }}>
                  Voir le format de l&apos;examen
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
