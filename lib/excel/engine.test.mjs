// Banc d'essai du moteur. Lancer : node lib/excel/engine.test.mjs
import { evaluate } from './evaluate.js';
import { grade, translate } from './grade.js';

let pass = 0, fail = 0;
const failures = [];

function eq(label, got, want, tol = 1e-6) {
  const ok =
    typeof want === 'number' && typeof got === 'number'
      ? Math.abs(got - want) <= Math.max(Math.abs(want) * tol, 1e-9)
      : String(got) === String(want);
  if (ok) pass++;
  else { fail++; failures.push(`${label}\n    obtenu ${JSON.stringify(got)} / attendu ${JSON.stringify(want)}`); }
}

function val(formula, cells) {
  const r = evaluate(formula, cells);
  return r.ok ? r.value : r.error;
}

// ---- grille de travail ----
const G = {
  A1: 'Produit', B1: 'Region', C1: 'CA', D1: 'Marge',
  A2: 'Alpha', B2: 'Nord', C2: 1200, D2: 0.32,
  A3: 'Beta',  B3: 'Sud',  C3: 850,  D3: 0.21,
  A4: 'Gamma', B4: 'Nord', C4: 2400, D4: 0.45,
  A5: 'Delta', B5: 'Est',  C5: 300,  D5: 0.18,
  F1: 0.25, F2: 10, F3: 'Gamma',
};

// arithmétique et priorité
eq('priorité', val('=1+2*3', {}), 7);
eq('parenthèses', val('=(1+2)*3', {}), 9);
eq('puissance droite', val('=2^3^2', {}), 512);
eq('unaire', val('=-3^2', {}), -9);
eq('pourcentage', val('=50%', {}), 0.5);
eq('concaténation', val('="a"&"b"', {}), 'ab');
eq('comparaison', val('=3>2', {}), 'true');

// références
eq('référence simple', val('=C2', G), 1200);
eq('absolue équivalente', val('=$C$2', G), 1200);
eq('somme de plage', val('=SOMME(C2:C5)', G), 4750);
eq('SUM anglais', val('=SUM(C2:C5)', G), 4750);
eq('moyenne', val('=MOYENNE(C2:C5)', G), 1187.5);
eq('max', val('=MAX(C2:C5)', G), 2400);
eq('NB sur mixte', val('=NB(A1:C5)', G), 4);
eq('NBVAL', val('=NBVAL(A1:A5)', G), 5);

// séparateur français et anglais
eq('point-virgule', val('=SI(C2>1000;"grand";"petit")', G), 'grand');
eq('virgule', val('=IF(C2>1000,"grand","petit")', G), 'grand');

// logique
eq('SI faux', val('=SI(C3>1000;1;0)', G), 0);
eq('SI imbriqué', val('=SI(C5>1000;"A";SI(C5>500;"B";"C"))', G), 'C');
eq('ET', val('=ET(C2>1000;D2>0.3)', G), 'true');
eq('OU', val('=OU(C3>1000;D3>0.3)', G), 'false');
eq('SIERREUR capte', val('=SIERREUR(1/0;"ko")', {}), 'ko');
eq('division zéro', val('=1/0', {}), '#DIV/0!');
eq('SIERREUR laisse passer', val('=SIERREUR(2+2;"ko")', {}), 4);

// recherche
eq('RECHERCHEV exacte', val('=RECHERCHEV("Gamma";A2:D5;3;FAUX)', G), 2400);
eq('RECHERCHEV absente', val('=RECHERCHEV("Zeta";A2:D5;3;FAUX)', G), '#N/A');
eq('INDEX EQUIV', val('=INDEX(C2:C5;EQUIV("Beta";A2:A5;0))', G), 850);
eq('INDEX EQUIV via cellule', val('=INDEX(C2:C5;EQUIV(F3;A2:A5;0))', G), 2400);
eq('RECHERCHEX', val('=RECHERCHEX("Delta";A2:A5;C2:C5)', G), 300);
eq('EQUIV position', val('=EQUIV("Gamma";A2:A5;0)', G), 3);
eq('INDEX 2D', val('=INDEX(A2:D5;3;3)', G), 2400);

// agrégats conditionnels
eq('SOMME.SI', val('=SOMME.SI(B2:B5;"Nord";C2:C5)', G), 3600);
eq('SOMME.SI.ENS', val('=SOMME.SI.ENS(C2:C5;B2:B5;"Nord";D2:D5;">0.4")', G), 2400);
eq('NB.SI', val('=NB.SI(B2:B5;"Nord")', G), 2);
eq('NB.SI seuil', val('=NB.SI(C2:C5;">1000")', G), 2);
eq('SOMMEPROD', val('=SOMMEPROD(C2:C5;D2:D5)', G), 1200*0.32+850*0.21+2400*0.45+300*0.18);
eq('SOMMEPROD condition', val('=SOMMEPROD((B2:B5="Nord")*C2:C5)', G), 3600);
eq('MOYENNE.SI', val('=MOYENNE.SI(B2:B5;"Nord";C2:C5)', G), 1800);

// arrondis
eq('ARRONDI', val('=ARRONDI(2.345;2)', {}), 2.35);
eq('arrondi commercial', val('=ARRONDI(2.5;0)', {}), 3);
eq('ARRONDI.INF', val('=ARRONDI.INF(2.99;0)', {}), 2);
eq('MOD', val('=MOD(-3;5)', {}), 2);

// finance
eq('VAN', val('=VAN(0.1;100;100;100)', {}), 100/1.1 + 100/1.21 + 100/1.331);
eq('TRI', val('=TRI({x})'.replace('{x}','A1:A3'), { A1: -1000, A2: 600, A3: 600 }), 0.1306623, 1e-3);
eq('VPM', val('=VPM(0.05/12;360;-200000)', {}), 1073.643246, 1e-4);

// texte
eq('GAUCHE', val('=GAUCHE("Finance";3)', {}), 'Fin');
eq('STXT', val('=STXT("Finance";4;4)', {}), 'ance');
eq('NBCAR', val('=NBCAR("Finance")', {}), 7);
eq('SUPPRESPACE', val('=SUPPRESPACE("  a  b  ")', {}), 'a b');
eq('CHERCHE', val('=CHERCHE("n";"Finance")', {}), 3);

// erreurs de syntaxe
const bad = evaluate('=SOMME(A1:A5', {});
eq('parenthèse manquante détectée', bad.ok, false);
const unknown = evaluate('=BIDULE(1)', {});
eq('fonction inconnue', unknown.error, '#NAME?');

// ---------- correction ----------
const exo = {
  cells: G,
  expectedFormula: '=C2*$F$1',
  require: { absolute: true },
  forbid: { literals: true },
  variants: [{ cells: { ...G, C2: 5000 }, expected: 1250 }],
};

eq('bonne réponse', grade('=C2*$F$1', exo).correct, true);
eq('sans dollars refusée', grade('=C2*F1', exo).code, 'needs-absolute');
eq('valeur en dur refusée', grade('=C2*0.25', exo).code, 'hardcoded');
eq('résultat constaté refusé', grade('=300', exo).code, 'fails-variant');
eq('sans égal', grade('C2*$F$1', exo).code, 'no-equals');
eq('vide', grade('', exo).code, 'empty');
eq('syntaxe', grade('=C2*', exo).code, 'syntax');

const exoFn = {
  cells: G,
  expected: 2400,
  require: { anyFunction: ['INDEX', 'RECHERCHEX'] },
  forbid: { functions: ['RECHERCHEV'] },
};
eq('INDEX accepté', grade('=INDEX(C2:C5;EQUIV("Gamma";A2:A5;0))', exoFn).correct, true);
eq('RECHERCHEV interdite', grade('=RECHERCHEV("Gamma";A2:D5;3;FAUX)', exoFn).code, 'forbidden-function');
eq('valeur juste sans fonction', grade('=C4', exoFn).code, 'missing-function');

// variante : la formule doit tenir sur d'autres données
const exoVar = {
  cells: { A1: 10, A2: 20, B1: 2 },
  expected: 20,
  variants: [{ cells: { A1: 7, A2: 20, B1: 3 }, expected: 21 }],
};
eq('formule générale', grade('=A1*B1', exoVar).correct, true);
eq('coïncidence rejetée', grade('=A2', exoVar).code, 'fails-variant');

console.log(`\n${pass} tests passés, ${fail} échecs\n`);
if (failures.length) {
  failures.forEach((f) => console.log('  ✗ ' + f));
  process.exit(1);
}

// virgule décimale française
eq('virgule décimale', val('=0,5+0,25', {}), 0.75);
eq('virgule dans formule', val('=B2*0,2', { B2: 89 }), 17.8);
eq('virgule décimale avec point-virgule', val('=SI(0,5>0,2;"a";"b")', {}), 'a');
eq('virgule séparateur anglais', val('=SOMME(1,2)', {}), 3);
console.log(`vérification finale : ${pass} passés, ${fail} échecs`);

const S = { A1: 10, A2: 90, A3: 30, A4: 40 };
eq('GRANDE.VALEUR', val('=GRANDE.VALEUR(A1:A4;1)', S), 90);
eq('PETITE.VALEUR', val('=PETITE.VALEUR(A1:A4;2)', S), 30);
eq('RANG', val('=RANG(A3;A1:A4)', S), 3);
eq('CENTILE', val('=CENTILE(A1:A4;0.5)', S), 35);
console.log(`total : ${pass} passés, ${fail} échecs`);


// ---------- recopie d'une formule (référence mixte) ----------
eq('recopie : mixte en diagonale', translate('=$G$1*(1+B$1)*$A2', 'B2', 'C3'), '=$G$1*(1+C$1)*$A3');
eq('recopie : tout relatif', translate('=A1+B1', 'A2', 'B3'), '=B2+C2');
eq('recopie : plage et référence', translate('=SOMME(B2:B4;G1)', 'B6', 'C6'), '=SOMME(C2:C4;H1)');
eq('recopie : tout absolu ne bouge pas', translate('=$A$1*2', 'B2', 'D5'), '=$A$1*2');
eq('recopie : hors grille', translate('=A1', 'B2', 'A2'), '=#REF!');

const grille = { B1: 0.02, C1: 0.03, A2: 0.10, A3: 0.12, G1: 1000 };
const exoMixte = {
  cells: grille, target: 'B2', expectedFormula: '=$G$1*(1+B$1)*$A2',
  forbid: { literals: true }, tolerance: 0.01,
  recopy: [
    { to: 'C2', expected: 1000 * 1.03 * 0.10 },
    { to: 'B3', expected: 1000 * 1.02 * 0.12 },
  ],
};
eq('mixte acceptée', grade('=$G$1*(1+B$1)*$A2', exoMixte).correct, true);
eq('tout relatif refusé', grade('=G1*(1+B1)*A2', exoMixte).code, 'fails-recopy');
eq('tout absolu refusé', grade('=$G$1*(1+$B$1)*$A$2', exoMixte).code, 'fails-recopy');
eq('mauvais verrou refusé', grade('=$G$1*(1+B1)*$A2', exoMixte).code, 'fails-recopy');


// ---------- fonctions ajoutées pour Excel niveau 2 ----------
const N2 = {
  A2: 'Paris', A3: 'Lyon', A4: 'Paris',
  B2: 100, B3: 200, B4: 300,
  C2: 'ok', C3: 'ok', C4: 'ko',
  D1: '  A B  C  ',
};
eq('MOYENNE.SI.ENS un critère', val('=MOYENNE.SI.ENS(B2:B4;A2:A4;"Paris")', N2), 200);
eq('MOYENNE.SI.ENS deux critères', val('=MOYENNE.SI.ENS(B2:B4;A2:A4;"Paris";C2:C4;"ok")', N2), 100);
eq('MOYENNE.SI.ENS aucun résultat', val('=MOYENNE.SI.ENS(B2:B4;A2:A4;"Nice")', N2), '#DIV/0!');
eq('SUBSTITUE tout', val('=SUBSTITUE("FR-123-45";"-";"/")', {}), 'FR/123/45');
eq('SUBSTITUE une occurrence', val('=SUBSTITUE("FR-123-45";"-";"/";2)', {}), 'FR-123/45');
eq('SUBSTITUE suppression', val('=SUBSTITUE("1 234";" ";"")', {}), '1234');
eq('JOINDRE.TEXTE', val('=JOINDRE.TEXTE("-";VRAI;A2:A4)', N2), 'Paris-Lyon-Paris');
eq('SUPPRESPACE espaces internes', val('=NBCAR(SUPPRESPACE(D1))', N2), 5);
eq('EXACT.TEXTE casse', val('=EXACT.TEXTE("abc";"ABC")', {}), false);
eq('CNUM virgule française', val('=CNUM("12,5")', {}), 12.5);
eq('REPT.TEXTE', val('=REPT.TEXTE("ab";3)', {}), 'ababab');

console.log(`avec la recopie : ${pass} passés, ${fail} échecs`);
if (fail) { failures.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
