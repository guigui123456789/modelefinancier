// Correction d'une formule saisie par l'apprenant.
//
// Deux niveaux de contrôle :
//   1. la valeur — la formule produit-elle le bon résultat sur la grille,
//      et sur des grilles de contrôle qui piègent les réponses en dur ;
//   2. la structure — la formule respecte-t-elle les contraintes de l'exercice
//      (référence absolue exigée, fonction imposée, valeur en dur interdite).

import { evaluate, Grid, colToIndex, indexToCol, parseRef } from './evaluate.js';
import { parse } from './parse.js';
import { tokenize, T } from './tokenize.js';

const EPS = 1e-9;

function sameValue(a, b, tolerance) {
  if (typeof a === 'number' && typeof b === 'number') {
    const tol = tolerance ?? Math.max(Math.abs(b) * 1e-6, EPS);
    return Math.abs(a - b) <= tol;
  }
  if (typeof a === 'boolean' || typeof b === 'boolean') {
    return Boolean(a) === Boolean(b);
  }
  return String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();
}

/** Inventaire de ce que contient la formule, pour les contrôles structurels. */
export function inspect(formula) {
  const out = {
    functions: [],
    refs: [],
    absoluteRefs: [],
    relativeRefs: [],
    ranges: [],
    numbers: [],
    valid: true,
    error: null,
  };
  let tokens;
  try {
    tokens = tokenize(formula);
    parse(formula);
  } catch (e) {
    out.valid = false;
    out.error = e.message;
    return out;
  }
  for (const t of tokens) {
    if (t.type === T.FUNC) out.functions.push(t.value);
    else if (t.type === T.REF) {
      out.refs.push(t.value);
      if (t.absCol || t.absRow) out.absoluteRefs.push(t.value);
      else out.relativeRefs.push(t.value);
    } else if (t.type === T.RANGE) out.ranges.push(t.value);
    else if (t.type === T.NUM) out.numbers.push(t.value);
  }
  return out;
}

/**
 * @param {string} submitted   la formule de l'apprenant
 * @param {object} exercise
 *   cells            grille de travail
 *   expected         valeur attendue, ou
 *   expectedFormula  formule de référence (on en calcule la valeur)
 *   tolerance        marge numérique
 *   variants         grilles de contrôle : [{ cells, expected }]
 *   require          { functions: [], anyFunction: [], absolute: true, minRefs: n }
 *   forbid           { functions: [], literals: true }
 *   hints            messages sur mesure, par code de contrôle
 */
export function grade(submitted, exercise = {}) {
  const raw = String(submitted ?? '').trim();

  if (!raw) {
    return { correct: false, code: 'empty', message: 'Entrez une formule pour valider.' };
  }
  if (!raw.startsWith('=')) {
    return {
      correct: false,
      code: 'no-equals',
      message: 'Une formule Excel commence par le signe égal. Essayez avec « = » devant.',
    };
  }

  const info = inspect(raw);
  if (!info.valid) {
    return {
      correct: false,
      code: 'syntax',
      message: `Excel ne pourrait pas lire cette formule : ${info.error}.`,
    };
  }

  const cells = exercise.cells ?? {};

  // Valeur attendue : soit donnée, soit calculée depuis la formule de référence.
  let expected = exercise.expected;
  if (expected === undefined && exercise.expectedFormula) {
    const ref = evaluate(exercise.expectedFormula, cells);
    if (!ref.ok) {
      return { correct: false, code: 'internal', message: "L'exercice est mal configuré." };
    }
    expected = ref.value;
  }

  const got = evaluate(raw, cells);
  if (!got.ok) {
    const msg = got.excelError
      ? `Votre formule renvoie ${got.error}.`
      : `Votre formule ne peut pas être calculée : ${got.error}.`;
    return { correct: false, code: 'error', message: msg, value: got.error };
  }

  if (expected !== undefined && !sameValue(got.value, expected, exercise.tolerance)) {
    return {
      correct: false,
      code: 'wrong-value',
      message: `Votre formule renvoie ${format(got.value)}, or on attend ${format(expected)}.`,
      value: got.value,
      expected,
    };
  }

  const req = exercise.require ?? {};
  const forbid = exercise.forbid ?? {};
  const hint = (code, fallback) => exercise.hints?.[code] ?? fallback;

  // Grilles de contrôle d'abord : une formule qui ne tient pas sur d'autres
  // données est fausse sur le fond, pas seulement mal écrite.
  for (const v of exercise.variants ?? []) {
    const alt = evaluate(raw, v.cells);
    if (!alt.ok || !sameValue(alt.value, v.expected, exercise.tolerance)) {
      return {
        correct: false,
        code: 'fails-variant',
        message: hint('fails-variant',
          "Votre formule donne le bon résultat sur ces chiffres, mais pas si les données changent. Elle doit calculer, pas constater."),
      };
    }
  }

  // ---- contrôles structurels ----
  // L'interdit avant l'exigé : le message est plus précis.
  if (forbid.functions) {
    const used = forbid.functions.filter((f) => info.functions.includes(f.toUpperCase()));
    if (used.length) {
      return {
        correct: false,
        code: 'forbidden-function',
        message: hint('forbidden-function',
          `${used.join(', ')} est interdit dans cet exercice.`),
      };
    }
  }

  if (req.functions) {
    const missing = req.functions.filter(
      (f) => !info.functions.includes(f.toUpperCase())
    );
    if (missing.length) {
      return {
        correct: false,
        code: 'missing-function',
        message: hint('missing-function',
          `Le résultat est bon, mais cet exercice demande d'utiliser ${missing.join(', ')}.`),
      };
    }
  }

  if (req.anyFunction) {
    const ok = req.anyFunction.some((f) => info.functions.includes(f.toUpperCase()));
    if (!ok) {
      return {
        correct: false,
        code: 'missing-function',
        message: hint('missing-function',
          `Utilisez l'une de ces fonctions : ${req.anyFunction.join(', ')}.`),
      };
    }
  }

  // Valeur en dur : un nombre écrit dans la formule alors qu'il existe en cellule.
  // Ce contrôle passe avant celui des dollars : c'est la faute principale.
  if (forbid.literals) {
    const allowed = new Set([0, 1, -1, 2, ...(forbid.allowNumbers ?? [])]);
    const offenders = info.numbers.filter((n) => !allowed.has(n));
    if (offenders.length) {
      return {
        correct: false,
        code: 'hardcoded',
        message: hint('hardcoded',
          `La valeur ${format(offenders[0])} est écrite en dur dans la formule. Pointez vers la cellule qui la contient : le jour où elle change, le modèle doit suivre tout seul.`),
      };
    }
  }

  // Épreuve de la recopie : la formule est réécrite comme Excel le ferait si on
  // la tirait vers d'autres cellules, puis réévaluée. C'est le seul contrôle qui
  // distingue une référence mixte juste d'une formule qui marche par hasard.
  if (exercise.recopy?.length && exercise.target) {
    for (const r of exercise.recopy) {
      const moved = translate(raw, exercise.target, r.to);
      const alt = evaluate(moved, r.cells ?? cells);
      if (!alt.ok || !sameValue(alt.value, r.expected, exercise.tolerance)) {
        return {
          correct: false,
          code: 'fails-recopy',
          message: hint('fails-recopy',
            `Juste en ${exercise.target}, mais faux une fois recopiée en ${r.to} : la formule y devient ${moved}, qui renvoie ${alt.ok ? format(alt.value) : alt.error} au lieu de ${format(r.expected)}. Verrouillez avec des dollars ce qui ne doit pas bouger.`),
          value: alt.ok ? alt.value : alt.error,
          expected: r.expected,
        };
      }
    }
  }

  if (req.absolute && info.absoluteRefs.length === 0) {
    return {
      correct: false,
      code: 'needs-absolute',
      message: hint('needs-absolute',
        "Le résultat est bon ici, mais la formule ne survivra pas à une recopie : verrouillez la référence d'hypothèse avec des dollars (touche F4)."),
    };
  }

  if (req.minRefs && info.refs.length + info.ranges.length < req.minRefs) {
    return {
      correct: false,
      code: 'too-few-refs',
      message: hint('too-few-refs',
        'La formule doit pointer vers les cellules de la feuille, pas recopier leurs valeurs.'),
    };
  }

  return {
    correct: true,
    code: 'ok',
    value: got.value,
    message: exercise.success ?? 'Exact.',
  };
}

function format(v) {
  if (typeof v === 'number') {
    const rounded = Math.round(v * 1e6) / 1e6;
    return rounded.toLocaleString('fr-FR', { maximumFractionDigits: 6 });
  }
  if (typeof v === 'boolean') return v ? 'VRAI' : 'FAUX';
  if (v === '' || v === null || v === undefined) return '(vide)';
  return `« ${v} »`;
}

export { evaluate, Grid };

// ---------------------------------------------------------------------------
// Recopie d'une formule, comme Excel la réécrit quand on la tire.
// Les parties précédées d'un $ ne bougent pas ; les autres se décalent.
// C'est ce qui permet de corriger une référence mixte : une formule peut être
// juste dans sa cellule d'origine et fausse une colonne plus loin.
// ---------------------------------------------------------------------------
const REF_PARTS = /^(\$?)([A-Za-z]{1,3})(\$?)(\d{1,7})$/;

function shiftRef(ref, dRow, dCol) {
  const m = REF_PARTS.exec(ref);
  if (!m) return ref;
  const [, dc, letters, dr, digits] = m;
  const col = dc === '$' ? colToIndex(letters) : colToIndex(letters) + dCol;
  const row = dr === '$' ? parseInt(digits, 10) - 1 : parseInt(digits, 10) - 1 + dRow;
  if (col < 0 || row < 0) return '#REF!';
  return `${dc}${indexToCol(col)}${dr}${row + 1}`;
}

/** Réécrit `formula` comme si on la recopiait de `from` vers `to`. */
export function translate(formula, from, to) {
  const a = parseRef(String(from).replace(/\$/g, ''));
  const b = parseRef(String(to).replace(/\$/g, ''));
  const dRow = b.row - a.row;
  const dCol = b.col - a.col;
  if (dRow === 0 && dCol === 0) return String(formula);

  let tokens;
  try { tokens = tokenize(String(formula)); } catch { return String(formula); }

  let out = '=';
  for (const t of tokens) {
    if (t.type === T.REF && !t.named) out += shiftRef(t.value, dRow, dCol);
    else if (t.type === T.RANGE) {
      out += t.value.split(':').map((p) => shiftRef(p, dRow, dCol)).join(':');
    } else if (t.type === T.FUNC) out += t.value;
    else if (t.type === T.LPAREN) out += '(';
    else if (t.type === T.RPAREN) out += ')';
    else if (t.type === T.SEP) out += ';';
    else if (t.type === T.STR) out += `"${t.value}"`;
    else if (t.type === T.BOOL) out += t.value ? 'VRAI' : 'FAUX';
    else if (t.type === T.NUM) out += String(t.value);
    else if (t.type === T.ERROR) out += t.value;
    else if (t.type === T.OP) out += t.value;
  }
  return out;
}
