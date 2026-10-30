// Rejoue les exercices d'un fichier JSON AVANT leur insertion en base.
//
//   node scripts/verifier-avant-insert.mjs mes-lecons.json
//
// Le fichier est un objet { "slug-de-lecon": [ ...ecrans... ], ... } où chaque
// écran a la forme d'une ligne de `lesson_steps`. Seuls les écrans portant un
// `exercise.target` sont contrôlés.
//
// Pour chaque exercice, cinq contrôles :
//   1. la formule attendue est acceptée par grade()
//   2. chaque variante calcule réellement la valeur annoncée  (piège n°12 :
//      les variantes sont évaluées sur leurs SEULES cellules, sans fusion avec
//      la grille de base — une variante partielle casse l'exercice en silence)
//   3. chaque recopie calcule réellement la valeur annoncée, via translate()
//   4. une réponse vide est refusée
//   5. la valeur en dur est refusée
//
// Complète scripts/verifier-exercices.mjs, qui rejoue ce qui est DÉJÀ en base.

import fs from 'node:fs';
import { grade, translate } from '../lib/excel/grade.js';
import { evaluate } from '../lib/excel/evaluate.js';

const file = process.argv[2];
if (!file) {
  console.error('usage : node scripts/verifier-avant-insert.mjs <fichier.json>');
  process.exit(2);
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const proche = (a, b, tol) =>
  typeof a === 'number' && typeof b === 'number'
    ? Math.abs(a - b) <= (tol ?? 1e-9)
    : a === b;

let total = 0;
let defauts = 0;

for (const [slug, ecrans] of Object.entries(data)) {
  for (const ecran of ecrans) {
    const ex = ecran.exercise;
    if (!ex || !ex.target) continue;
    total += 1;
    const erreurs = [];

    const r = grade(ex.expectedFormula, ex);
    if (!r.correct) erreurs.push(`formule attendue refusée (${r.code}) : ${r.message}`);

    for (const v of ex.variants ?? []) {
      const got = evaluate(ex.expectedFormula, v.cells);
      if (!got.ok) {
        erreurs.push(`variante → erreur ${got.error} : une cellule utilisée par la formule n'est pas redéclarée`);
      } else if (!proche(got.value, v.expected, ex.tolerance)) {
        erreurs.push(`variante → ${JSON.stringify(got.value)} au lieu de ${JSON.stringify(v.expected)}`);
      }
    }

    for (const rc of ex.recopy ?? []) {
      const deplacee = translate(ex.expectedFormula, ex.target, rc.to);
      const got = evaluate(deplacee, ex.cells);
      if (!got.ok) {
        erreurs.push(`recopie en ${rc.to} (${deplacee}) → erreur ${got.error}`);
      } else if (!proche(got.value, rc.expected, ex.tolerance)) {
        erreurs.push(`recopie en ${rc.to} (${deplacee}) → ${JSON.stringify(got.value)} au lieu de ${JSON.stringify(rc.expected)}`);
      }
    }

    if (grade('', ex).correct) erreurs.push('une réponse vide est acceptée');

    const attendu = evaluate(ex.expectedFormula, ex.cells);
    if (attendu.ok && typeof attendu.value === 'number' && grade(`=${attendu.value}`, ex).correct) {
      erreurs.push('la valeur en dur est acceptée : ajoutez une variante ou forbid.literals');
    }

    if (erreurs.length) {
      defauts += 1;
      console.log(`✗ ${slug} « ${ecran.title} »`);
      erreurs.forEach((e) => console.log(`    ${e}`));
    } else {
      console.log(`✓ ${slug} « ${ecran.title} »`);
    }
  }
}

console.log(`\n${total} exercices contrôlés, ${defauts} en défaut`);
if (defauts) process.exit(1);
