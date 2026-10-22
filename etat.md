# modelefinancier.com — état du projet et reprise

Document de passation. Écrit le 22 octobre 2026. À lire en entier avant de toucher au projet.

---

## 1. La vision

Une plateforme de formation et de **certification** en finance technique, en français.

Trois domaines : **modélisation financière**, **Excel**, **Python pour la finance**. Le site
couvre aussi la finance complexe et opaque — titrisation, hors-bilan, comptabilité créative,
détection de fraude — abordée du point de vue de la compréhension et de la détection, jamais
comme mode d'emploi.

Le modèle économique repose sur la certification, pas sur les cours. Un cours se compare à
YouTube et se vend 30 € ; une certification ne se compare à rien et se vend 300 €, parce que
ce que les gens achètent est **la preuve** du savoir, pas le savoir.

Trois exigences posées par Guillaume :

1. **Un examen très difficile**, visant moins de 40 % de réussite, demandant 250 à 300 heures
   de préparation. Un certificat que tout le monde obtient ne vaut rien.
2. **Des réponses incirculables.** Résolu par des paramètres tirés au hasard par candidat :
   même exercice, chiffres différents, réponse recalculée côté serveur. Partager un résultat
   ne sert à personne. S'y ajoutent une banque d'items bien plus large que l'examen, et des
   épreuves de construction où l'on rend un modèle, pas une réponse.
3. **Des leçons courtes.** Pas de page de 2 000 caractères : une suite d'écrans de 100 à 500
   caractères, une idée par écran, un contrôle toutes les trois notions.

### Décisions stratégiques déjà prises

- **Les questions avant les cours.** Les questions d'entretien définissent ce que l'apprenant
  doit savoir faire, donc le programme des cours, puis deviennent des items d'examen. On écrit
  la matière une fois, elle sert trois fois. (Principe de conception pédagogique inversée.)
- **Certification en dernier.** Ouvrir une certification sur un contenu partiel détruirait sa
  crédibilité avant qu'elle existe. Elle s'ouvre quand le programme est complet.
- **Ne pas survendre.** Au jour 1 le certificat n'est reconnu par personne. Il se vend comme
  ce qu'il est : la preuve d'un examen difficile réussi. Pas comme « reconnu par les recruteurs ».
- **Pas de surveillance par webcam.** Cher, lourd juridiquement en Europe, contournable. La
  difficulté et la randomisation font le travail au démarrage.
- **Français, terminologie anglaise.** Un analyste dit « un DCF », « le free cash flow »,
  « les comps ». Traduire décrédibilise et handicape en entretien. Traduction donnée une fois
  entre parenthèses à la première occurrence.

---

## 2. Accès et infrastructure

| Élément | Valeur |
| --- | --- |
| Domaine | `modelefinancier.com`, acheté chez OVH |
| Dépôt | `github.com/guigui123456789/modelefinancier`, branche `main` |
| Hébergement | Vercel, projet `prj_YXn2jfk0gCvWnBcqlfK1p9t0rW2P` |
| Équipe Vercel | `team_PtXp2ustBw0Dg0CRy21CID4J` (compte personnel, plan Hobby) |
| Base | Supabase, ref `hixfkahqkdjlsibesdhs`, région `eu-west-3` (Paris) |
| Organisation Supabase | `lrlccwhlvncklvjdfsnv` (« dript ») |
| URL Supabase | `https://hixfkahqkdjlsibesdhs.supabase.co` |
| Clé publishable | `sb_publishable_3-t2Pw8lnEWH-R4_Hl7Imw_k3-PXwVy` |
| Email du compte | lemerourguillaume@gmail.com |

Ces deux clés sont publiques par conception : la sécurité repose sur les politiques RLS en
base, pas sur leur secret.

### DNS chez OVH (déjà configuré, ne pas y toucher)

- `@` A → `76.76.21.21`
- `www` CNAME → `cname.vercel-dns.com.`
- Les MX, SPF et les deux CNAME `_domainkey` sont les emails de Guillaume : **ne jamais y toucher**.
- Vercel recommande de migrer le CNAME `www` vers `ac1f257c84756b18.vercel-dns-017.com.`
  Non fait, non urgent : Vercel confirme que les anciennes valeurs continuent de fonctionner.

### Déploiement

Chaque `git push` sur `main` déclenche un déploiement Vercel automatique. Build ≈ 40 s.
`vercel.json` force la région `cdg1` (Paris) pour que les fonctions soient près de la base.

**Important :** le contenu des leçons vit **dans Supabase**, pas dans le code. Ajouter une
leçon ne demande aucun déploiement : elle est en ligne dès l'INSERT.

### Points d'accès des outils

- GitHub : accès en écriture confirmé.
- Supabase : accès complet via MCP.
- Vercel : accès complet via MCP, obtenu après reconnexion du connecteur. Si un appel renvoie
  403 sur le scope `lemerourguillaume-4613s-projects`, c'est que le jeton est périmé —
  reconnecter le connecteur et **ouvrir une nouvelle conversation** (le jeton est chargé au
  démarrage du fil et ne se rafraîchit pas en cours de route).

---

## 3. Le schéma de la base

Toutes les tables ont RLS activé. Aucune alerte de sécurité Supabase.

### Structure du contenu

```
domains (3)  →  pillars (35, = modules)  →  lessons (154)  →  lesson_steps (76 écrans)
```

**`domains`** — `id, slug, name, tagline, summary, position`
1 = modelisation · 2 = excel · 3 = python

**`pillars`** — modules. `id, slug, name, summary, position, domain_id, level (1-5), hours`
IDs 1-6 = modélisation financière. IDs 10-19 et 23-38 = Excel (26 modules).
IDs 20-22 = Python (3 modules, programme non détaillé).

**`lessons`** — `id, slug, title, pillar_id, level, access, summary, duration_min, position, published`
- `level` : enum `lesson_level` = fundamentals | practitioner | advanced
- `access` : enum `access_tier` = public | account | pro

**`lesson_prerequisites`** — `lesson_id, prerequisite_id`
⚠️ Deux clés étrangères vers `lessons`. Toute requête PostgREST doit désambiguïser :
`lesson_prerequisites!lesson_prerequisites_lesson_id_fkey(lessons!lesson_prerequisites_prerequisite_id_fkey(...))`

**`tracks`** / **`track_lessons`** — les 4 parcours métiers et leur composition ordonnée.

### Le contenu d'une leçon

**`lesson_steps`** — le cœur. Un écran = une ligne.

| Colonne | Rôle |
| --- | --- |
| `lesson_id, position` | clé unique |
| `kind` | enum `step_kind` : concept, example, check, build, recap, **ribbon**, **shortcut** |
| `title` | titre de l'écran |
| `body` | markdown court, 150 mots maximum |
| `aside` | encart « le piège », « en entretien » |
| `options` | jsonb `[{id, text}]` pour un QCM |
| `correct` | id de l'option, ou valeur numérique attendue |
| `tolerance`, `unit` | pour une réponse numérique |
| `explanation` | affiché après la réponse, juste **ou** fausse |
| `hint` | indice, proposé après un premier essai raté |
| `formula` | formule à montrer (écran build sans grille) |
| `exercise` | jsonb — spec de correction Excel, ou spec ruban, ou spec clavier |
| `sheet` | jsonb — grille illustrative, affichable sur **n'importe quel** écran |
| `solution` | non utilisé pour l'instant |

**`step_progress`** — `user_id, step_id, answered, was_correct, completed_at`

### Comptes et accès

**`profiles`** — `id (= auth.users.id), email, full_name, plan, is_admin`
`plan` : enum `user_plan` = free | student | pro | team. Créé automatiquement par le trigger
`on_auth_user_created` → `handle_new_user()`.

**`progress`** — `user_id, lesson_id, started_at, completed_at, quiz_score`

**`subscriptions`** — vide, prête pour Stripe.

**`waitlist`** — `email, source`. Insertion ouverte à tous, lecture par personne.

### Examen

**`questions`** — banque. `domain_id, pillar_id, lesson_id, kind (interview|drill|exam),
format (open|mcq|numeric|file), difficulty, prompt, answer, pitfall, follow_up, tags, asked_at, published`
⚠️ La politique RLS filtre `kind <> 'exam'` : **les items d'examen ne sortent jamais par
l'API publique**. C'est la protection de la banque. Ne pas l'affaiblir.

**`exams`** — `slug, domain_id, name, duration_min, pass_score, item_count, is_mock, published`
**`exam_attempts`** — `user_id, exam_id, state, seed, expires_at, score, passed`
Le champ `seed` fixe les paramètres tirés pour ce candidat : c'est le mécanisme anti-triche.
**`certificates`** — `reference` (publique, vérifiable par n'importe qui), `holder`, `score`

### Le point de bascule vers le payant

Un seul endroit : la fonction `public.has_access(tier)` en base, et la variable `ouvert` dans
`app/modeles/[slug]/page.js`.

Aujourd'hui tout utilisateur connecté voit tout. Pour basculer :

```sql
-- dans has_access(), remplacer la dernière ligne par :
return plan in ('pro', 'student', 'team');
```

`handle_new_user()` et `has_access()` ont vu leur EXECUTE révoqué pour `anon` et
`authenticated` : elles sont SECURITY DEFINER et ne doivent pas être appelables par l'API.

---

## 4. Le moteur Excel — la pièce maîtresse

Dans `lib/excel/`. C'est ce qui différencie le site de toute la concurrence, et c'est la
partie à ne pas casser.

### Le principe

La correction **n'est pas** une comparaison de texte. Le moteur analyse la formule de
l'élève, l'exécute contre une grille de cellules, et compare le **résultat**. Toute formule
qui donne la bonne valeur est acceptée, quelle que soit son écriture.

Vérifié en production : `=C2/B2-1` est accepté comme équivalent de `=(C2-B2)/B2`, et
`=B2*(1+B4)^-B3` comme équivalent de `=B2/(1+B4)^B3`. Un correcteur textuel aurait tout refusé.

### Les fichiers

| Fichier | Rôle |
| --- | --- |
| `tokenize.js` | découpe en jetons. Gère la virgule décimale française |
| `parse.js` | arbre syntaxique par précédence grimpante |
| `values.js` | types, erreurs Excel, coercitions, critères de SOMME.SI |
| `functions.js` | ~85 fonctions, chacune sous son nom **français et anglais** |
| `evaluate.js` | évaluation contre une `Grid`, avec diffusion matricielle |
| `grade.js` | la correction : valeur, structure, grilles de contrôle |
| `engine.test.mjs` | 72 tests. `node lib/excel/engine.test.mjs` |

⚠️ Les imports portent l'extension `.js` : c'est nécessaire pour que les tests tournent sous
Node en ESM. Ne pas les retirer.

### La règle de la virgule

En Excel français la virgule est décimale et le point-virgule sépare les arguments ; en
anglais la virgule sépare. Le tokeniseur tranche ainsi : **si la formule contient un `;`,
la virgule est décimale ; sinon elle ne sépare qu'à l'intérieur d'un appel de fonction.**
Donc `=B2*0,2` fonctionne, `=SUM(A1,B1)` aussi, `=SI(0,5>0,2;"a";"b")` aussi.

### L'ordre des contrôles dans `grade()`

Cet ordre a été réglé après essais, il produit les messages les plus utiles. Ne pas le
changer sans raison :

1. formule vide → `empty`
2. pas de `=` → `no-equals`
3. syntaxe illisible → `syntax`
4. erreur Excel renvoyée (#DIV/0! …) → `error`
5. **valeur fausse** → `wrong-value`
6. **grilles de contrôle** → `fails-variant` — rejoue la formule sur d'autres chiffres.
   C'est ce qui attrape `=17,8`, une réponse constatée et non calculée.
7. fonction interdite → `forbidden-function`
8. fonction exigée absente → `missing-function`
9. **valeur en dur** → `hardcoded`
10. référence absolue exigée absente → `needs-absolute`
11. trop peu de références → `too-few-refs`

L'interdit passe avant l'exigé, et la valeur en dur avant les dollars : les messages sont
plus précis ainsi.

### La forme d'un exercice

```json
{
  "cells": { "A1": "Produit", "B2": 89, "G1": 0.2 },
  "target": "C2",
  "expectedFormula": "=B2*$G$1",
  "require": { "absolute": true, "minRefs": 3,
               "functions": ["MAX"], "anyFunction": ["INDEX","RECHERCHEX"] },
  "forbid":  { "literals": true, "functions": ["RECHERCHEV"],
               "allowNumbers": [12] },
  "variants": [{ "cells": {...}, "expected": 4.895 }],
  "tolerance": 0.01,
  "display": { "cols": 7, "rows": 5 },
  "success": "Exact. …",
  "hints": { "needs-absolute": "…", "hardcoded": "…" }
}
```

`forbid.literals` tolère par défaut 0, 1, -1 et 2 (pour écrire `(1+taux)`), plus ce que
liste `allowNumbers`.

**Toujours mettre au moins une `variants`** : sans elle, une réponse constatée passe.

### La correction tourne côté serveur

`app/excel-actions.js` → `gradeFormula(stepId, formule)`. La spec de l'exercice et la
solution ne descendent **jamais** dans le navigateur. La page cliente ne reçoit que
`display`, `cells` et `target`.

---

## 5. Le code du site

Next.js 14.2.35 (App Router), Supabase SSR, aucun framework CSS. Un seul fichier
`app/globals.css`.

### Pages

| Route | Rôle |
| --- | --- |
| `/` | accueil, lit parcours et piliers en base |
| `/cours` | les 3 domaines, leurs niveaux et leurs 35 modules |
| `/entrainement` | exercices, questions d'entretien, examens blancs |
| `/certification` | le format de l'examen, l'anti-triche, les 3 certifications |
| `/modeles` | catalogue filtrable par pilier |
| `/modeles/[slug]` | une leçon — le lecteur, ou le mur d'accès, ou « en écriture » |
| `/parcours` | les 4 parcours métiers, par onglets |
| `/inscription`, `/connexion`, `/deconnexion` | authentification email + mot de passe |
| `/tableau-de-bord` | progression — protégé par le middleware |
| `/auth/confirm` | cible du lien de confirmation par email |

### Composants

| Composant | Rôle |
| --- | --- |
| `LessonPlayer` | le lecteur : un écran à la fois, barre de progression, navigation clavier, contrôles bloquants |
| `Sheet` | **grille de tableur en lecture seule**, affichable sur n'importe quel écran |
| `ExcelExercise` | grille + champ de formule + correction serveur |
| `RibbonExercise` | ruban schématique : onglet puis commande |
| `ShortcutExercise` | capte les vraies touches ; accepte Cmd là où Ctrl est attendu |
| `DcfDemo` | calculateur DCF de la page d'accueil |
| `TrackTabs`, `Reveal`, `AuthForm`, `WaitlistForm`, `SiteHeader`, `SiteFooter` | |

### La spec d'une feuille (`sheet`)

```json
{
  "cols": 7, "rows": 5,
  "cells": { "A1": "Produit", "B2": 89 },
  "notes": { "C2": { "show": "=B2*G1", "state": "ok" },
             "C3": { "show": "=B3*G2", "state": "bad" } },
  "focus": ["G1"],
  "caption": "Ce qu'il faut regarder sur cette feuille."
}
```

`state` : `ok` (vert) · `bad` (rouge) · `note` (gris italique) · `input` (bleu).
`show` remplace la valeur affichée — c'est ainsi qu'on montre une formule plutôt qu'un résultat.

**Règle posée par Guillaume : dès qu'une leçon nomme une cellule, elle montre la feuille.**

### Design

Palette : noir `#000`, gris sombre `#0B0C0E`, blanc, bleu accent `#3A5BFF`, violet `#8B5CF6`,
vert signal `#15C27A`. Police Plus Jakarta Sans, IBM Plex Mono pour tous les chiffres.

Direction visuelle validée après deux itérations : bandes pleine largeur alternant noir et
blanc, titres blancs très grands et centrés, boutons pilule, cartes arrondies 20 px, beaucoup
d'air. Inspirée de Revolut dans ses **mécaniques** (rythme, alternance de fonds, animations),
jamais copiée dans son design.

Animations : apparition au scroll (opacité + 28 px + flou 4 px, 650 ms, cascade 90 ms),
jamais d'horizontal, jamais de rebond, `prefers-reduced-motion` respecté.

Photos : sept images Unsplash dans `public/img/`. **À remplacer par de vrais visuels** —
captures de templates Excel, de leçons — avant une vraie mise en production. Une mention le
rappelle en pied de page.

---

## 6. Ce qui existe, ce qui manque

### Fait

- Site en ligne sur `modelefinancier.com`, HTTPS, toutes les pages à 200
- Inscription et connexion fonctionnelles, profil créé automatiquement, 3 comptes existants
- Moteur Excel : ~85 fonctions, 72 tests au vert
- 35 modules, **154 leçons déclarées** (titre, résumé, durée, niveau, prérequis), 173 h
- **8 leçons rédigées en entier, 76 écrans** :

| Leçon | Écrans | Module |
| --- | ---: | --- |
| `dcf` | 16 | Corporate Finance & Valuation |
| `xl-ruban` | 8 | Interface |
| `xl-navigation` | 9 | Interface |
| `xl-types` | 8 | Types de données |
| `xl-ref-relative` | 8 | Références |
| `xl-ref-absolue` | 10 | Références |
| `xl-operateurs` | 8 | Premières formules |
| `xl-somme` | 9 | Premières formules |

Toutes en accès `public`. 9 exercices Excel notés, 7 exercices clavier, 2 exercices ruban,
17 feuilles illustratives.

### Pas fait

- **146 leçons sans contenu.** Elles affichent « leçon en cours d'écriture » avec un lien
  vers le DCF comme exemple de format.
- **Banque de questions d'entretien vide.** C'était pourtant la priorité convenue.
- **Moteur d'examen non construit** : tirage des paramètres par `seed`, chronométrage,
  notation, émission du certificat, page de vérification publique.
- **Templates Excel absents.** Aucun fichier à télécharger — or c'est l'argument de vente
  principal de l'abonnement.
- **Python : programme non détaillé** (3 modules sans leçons).
- Stripe non branché.
- Pas de page de vérification de certificat.
- Pas de visuels propres.

---

## 7. Pièges rencontrés, à ne pas refaire

1. **`apply_migration` est annulé** quand le SQL contient un `DELETE` ou un `ALTER TABLE`
   qui demande confirmation. Découper : le DDL seul d'abord, les données ensuite.
2. **`VALUES` dans un INSERT** : toutes les lignes doivent avoir exactement le même nombre
   de colonnes. Une ligne à 9 au lieu de 10 fait échouer tout le lot. Compter avant d'envoyer.
3. **Transtyper explicitement** : `v.kind::public.step_kind`, jamais `v.*` — l'enum ne se
   déduit pas du texte. Et typer les premiers `null` de la première ligne (`null::jsonb`).
4. **Les apostrophes dans `$t$…$t$`** : à l'intérieur d'un bloc dollar-quoted, écrire `'`,
   jamais `''` — sinon les deux apostrophes apparaissent littéralement à l'écran.
5. **`position` est ambigu** dans un UPDATE avec jointure : écrire `s.position`.
6. **Node ESM exige les extensions** dans les imports : `./parse.js`, pas `./parse`.
7. **`.env.local` est dans `.gitignore`** : après un clone, le recréer depuis `.env.example`,
   sinon tout renvoie 500.
8. **Next 14.2.15 est vulnérable**, utiliser 14.2.35 ou plus.

---

## 8. La suite — par ordre de valeur

1. **La banque de questions d'entretien.** Décidé ensemble, jamais fait. Rapide à produire,
   amène du trafic immédiatement, et chaque question devient un item d'examen. Commencer par
   40 questions de modélisation financière, puis 40 d'Excel.
2. **Finir le niveau 1 d'Excel** : 20 leçons restantes sur 28. Le moule est rodé, chaque
   leçon prend maintenant une fraction du temps de la première.
3. **Les templates Excel.** C'est l'actif qui justifiera l'abonnement, et il n'existe pas.
4. **Le moteur d'examen** : tirage par `seed`, chronomètre, notation, certificat, page de
   vérification publique.
5. **Les leçons à fort volume de recherche** si on veut du trafic avant d'avoir tout écrit :
   RECHERCHEV, INDEX/EQUIV, les tableaux croisés dynamiques, Power Query.

### Réglages en attente

- Vérifier que les URL de redirection Supabase pointent bien sur `https://modelefinancier.com`
  (Authentication → URL Configuration). Si elles pointent encore sur `.vercel.app`, les emails
  de confirmation envoient les inscrits au mauvais endroit.
- Un compte de test `verif-…@modelefinancier.com` traîne peut-être dans Authentication.
- Migrer le CNAME `www` vers la nouvelle valeur Vercel, sans urgence.

---

## 9. Comment écrire une leçon

Le gabarit, validé sur les huit leçons existantes :

- **8 à 16 écrans**, chacun de 100 à 500 caractères de corps
- une idée par écran, un **contrôle toutes les trois notions**
- alterner : `concept` → `example` → `check` → `concept` → `build` → `shortcut` → `recap`
- **une feuille dès qu'on nomme une cellule**, avec une légende qui dit quoi regarder
- l'`explanation` d'un contrôle explique aussi **pourquoi les mauvaises réponses sont
  fausses** — c'est là que se trouve la valeur pédagogique
- l'`aside` porte le piège de terrain ou la remarque d'entretien
- chaque exercice a ses `variants` et ses `hints` sur mesure
- le `recap` liste 5 ou 6 points et annonce la leçon suivante

**Toujours tester la correction avant de considérer une leçon finie** : charger les exercices
depuis la base et les passer à `grade()` avec une bonne réponse, deux variantes légitimes et
deux erreurs typiques. Plusieurs défauts du moteur ont été trouvés ainsi.

Ton : direct, sans flatterie, sans promesse de salaire. On dit quand un modèle est le mauvais
outil. Les erreurs classiques sont nommées explicitement — c'est ce qui distingue ce cours
d'un tutoriel gratuit.
