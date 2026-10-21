// Valeurs, erreurs et conversions, au plus près du comportement d'Excel.

export class ExcelError {
  constructor(code) { this.code = code; }
  toString() { return this.code; }
}

export const ERR = {
  div0: () => new ExcelError('#DIV/0!'),
  na: () => new ExcelError('#N/A'),
  value: () => new ExcelError('#VALUE!'),
  ref: () => new ExcelError('#REF!'),
  name: () => new ExcelError('#NAME?'),
  num: () => new ExcelError('#NUM!'),
};

export const isError = (v) => v instanceof ExcelError;
export const isBlank = (v) => v === null || v === undefined || v === '';

/** Aplatit les plages imbriquées en une seule liste de valeurs. */
export function flatten(args) {
  const out = [];
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else out.push(v);
  };
  args.forEach(walk);
  return out;
}

/** Première erreur rencontrée dans les arguments, s'il y en a une. */
export function firstError(args) {
  return flatten(args).find(isError) ?? null;
}

/** Conversion en nombre, selon les règles d'Excel. */
export function toNumber(v) {
  if (isError(v)) return v;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (isBlank(v)) return 0;
  if (typeof v === 'string') {
    const cleaned = v.trim().replace(/\s/g, '').replace(',', '.');
    if (cleaned === '') return 0;
    const n = Number(cleaned);
    return Number.isNaN(n) ? ERR.value() : n;
  }
  if (Array.isArray(v)) return toNumber(v[0]);
  return ERR.value();
}

export function toText(v) {
  if (isError(v)) return v;
  if (isBlank(v)) return '';
  if (typeof v === 'boolean') return v ? 'VRAI' : 'FAUX';
  if (typeof v === 'number') {
    // Excel n'affiche pas les flottants avec toute leur traîne binaire.
    return String(Math.round(v * 1e10) / 1e10);
  }
  if (Array.isArray(v)) return toText(v[0]);
  return String(v);
}

export function toBoolean(v) {
  if (isError(v)) return v;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (isBlank(v)) return false;
  if (typeof v === 'string') {
    const u = v.trim().toUpperCase();
    if (u === 'TRUE' || u === 'VRAI') return true;
    if (u === 'FALSE' || u === 'FAUX') return false;
    return ERR.value();
  }
  if (Array.isArray(v)) return toBoolean(v[0]);
  return ERR.value();
}

/** Ne garde que les nombres : c'est ce que fait SOMME sur une plage mixte. */
export function numbersOnly(args) {
  return flatten(args).filter((v) => typeof v === 'number');
}

/** Comparaison façon Excel : nombres < textes < booléens. */
export function compare(a, b) {
  const rank = (v) =>
    typeof v === 'number' || isBlank(v) ? 0 : typeof v === 'string' ? 1 : 2;
  const ra = rank(a), rb = rank(b);
  if (ra !== rb) return ra < rb ? -1 : 1;
  if (ra === 0) {
    const na = isBlank(a) ? 0 : a, nb = isBlank(b) ? 0 : b;
    return na === nb ? 0 : na < nb ? -1 : 1;
  }
  if (ra === 1) {
    const sa = String(a).toUpperCase(), sb = String(b).toUpperCase();
    return sa === sb ? 0 : sa < sb ? -1 : 1;
  }
  return a === b ? 0 : a === false ? -1 : 1;
}

/**
 * Critère de SOMME.SI / NB.SI : ">100", "<>Paris", "Ventes", 42, "A*".
 * Rend un prédicat.
 */
export function criterion(spec) {
  if (typeof spec === 'number' || typeof spec === 'boolean') {
    return (v) => compare(v, spec) === 0;
  }
  const raw = String(spec ?? '').trim();
  const m = /^(<=|>=|<>|=|<|>)(.*)$/.exec(raw);

  if (m) {
    const op = m[1];
    const rest = m[2].trim();
    const asNum = rest === '' ? null : Number(rest.replace(',', '.'));
    const target = rest !== '' && !Number.isNaN(asNum) ? asNum : rest;
    return (v) => {
      const c = compare(isBlank(v) && typeof target === 'number' ? 0 : v, target);
      switch (op) {
        case '=': return c === 0;
        case '<>': return c !== 0;
        case '<': return c < 0;
        case '>': return c > 0;
        case '<=': return c <= 0;
        case '>=': return c >= 0;
        default: return false;
      }
    };
  }

  // jokers * et ?
  if (/[*?]/.test(raw)) {
    const re = new RegExp(
      '^' + raw.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$',
      'i'
    );
    return (v) => re.test(String(v ?? ''));
  }

  const asNum = Number(raw.replace(',', '.'));
  const target = raw !== '' && !Number.isNaN(asNum) ? asNum : raw;
  return (v) => compare(v, target) === 0;
}
