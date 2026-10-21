# modelefinancier.com

Plateforme de formation aux modèles financiers. Next.js 14 (App Router) + Supabase.

## Démarrer en local

```bash
npm install
cp .env.example .env.local    # les clés sont déjà dedans
npm run dev                   # http://localhost:3000
```

## Variables d'environnement

| Clé | Rôle |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique (publishable) |

Ces deux clés sont publiques par conception : la sécurité repose sur les
politiques RLS de la base, pas sur le secret des clés.

## Structure

```
app/
  page.js                 page d'accueil
  actions.js              actions serveur (inscription, connexion, progression)
  connexion/ inscription/ deconnexion/
  auth/confirm/           cible du lien de confirmation par email
  modeles/                catalogue et page de leçon
  parcours/               les parcours
  tableau-de-bord/        espace connecté (protégé par le middleware)
components/               Reveal, DcfDemo, TrackTabs, header, footer, formulaires
lib/supabase/             clients navigateur, serveur et middleware
```

## Le passage au payant

Tout l'accès dépend d'un seul endroit : la fonction `public.has_access()` en base,
et la variable `ouvert` dans `app/modeles/[slug]/page.js`.

Aujourd'hui, tout utilisateur connecté voit tout. Pour basculer :

```sql
-- dans has_access(), remplacer la dernière ligne par :
return plan in ('pro', 'student', 'team');
```

La table `subscriptions` est déjà prête pour Stripe.

## Base de données

Tables : `profiles`, `pillars`, `lessons`, `lesson_prerequisites`, `tracks`,
`track_lessons`, `progress`, `subscriptions`, `waitlist`.

RLS activé partout. Le catalogue est lisible sans compte (pour le référencement),
la progression est strictement privée.
