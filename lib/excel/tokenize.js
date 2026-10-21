// Découpe une formule Excel en jetons.
// Accepte la syntaxe française (point-virgule, noms de fonctions FR)
// comme l'anglaise : les deux sont valides pour l'apprenant.

export const T = {
  NUM: 'num',
  STR: 'str',
  BOOL: 'bool',
  REF: 'ref',
  RANGE: 'range',
  FUNC: 'func',
  OP: 'op',
  LPAREN: '(',
  RPAREN: ')',
  SEP: 'sep',
  ERROR: 'error',
};

const ERRORS = ['#DIV/0!', '#N/A', '#VALUE!', '#REF!', '#NAME?', '#NUM!', '#NULL!'];

// A1, $A$1, AB12, $AB12…
const REF_RE = /^(\$?)([A-Za-z]{1,3})(\$?)(\d{1,7})/;

export class FormulaError extends Error {
  constructor(message, position) {
    super(message);
    this.name = 'FormulaError';
    this.position = position;
  }
}

export function tokenize(input) {
  let src = String(input ?? '').trim();
  if (src.startsWith('=')) src = src.slice(1);

  const tokens = [];
  let i = 0;
  let depth = 0;                       // profondeur de parenthèses
  const hasSemicolon = src.includes(';');

  const peekBack = () => tokens[tokens.length - 1];

  // La virgule est décimale en Excel français, séparateur en anglais.
  // Règle : si la formule emploie des point-virgules, la virgule est décimale ;
  // sinon elle ne sépare des arguments qu'à l'intérieur d'un appel de fonction.
  const commaIsDecimal = (pos) => {
    if (!/[0-9]/.test(src[pos + 1] ?? '')) return false;
    return hasSemicolon || depth === 0;
  };

  while (i < src.length) {
    const c = src[i];

    // espaces
    if (/\s/.test(c)) { i++; continue; }

    // erreurs littérales (#N/A écrit à la main)
    const err = ERRORS.find((e) => src.slice(i).toUpperCase().startsWith(e));
    if (err) { tokens.push({ type: T.ERROR, value: err }); i += err.length; continue; }

    // nombre
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      const m = /^[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?/.exec(src.slice(i));
      let text = m[0];
      i += text.length;
      // partie décimale écrite avec une virgule
      if (src[i] === ',' && commaIsDecimal(i) && !text.includes('.')) {
        const frac = /^,([0-9]+)/.exec(src.slice(i));
        if (frac) { text += '.' + frac[1]; i += frac[0].length; }
      }
      let value = parseFloat(text);
      if (src[i] === '%') { value /= 100; i++; }
      tokens.push({ type: T.NUM, value });
      continue;
    }

    // chaîne entre guillemets, "" pour échapper un guillemet
    if (c === '"') {
      let j = i + 1;
      let out = '';
      while (j < src.length) {
        if (src[j] === '"') {
          if (src[j + 1] === '"') { out += '"'; j += 2; continue; }
          break;
        }
        out += src[j];
        j++;
      }
      if (j >= src.length) throw new FormulaError('Guillemet fermant manquant', i);
      tokens.push({ type: T.STR, value: out });
      i = j + 1;
      continue;
    }

    // référence, plage, fonction, booléen
    if (/[A-Za-z_$]/.test(c)) {
      const rest = src.slice(i);

      // plage : A1:B10
      const rangeMatch = /^(\$?[A-Za-z]{1,3}\$?\d{1,7})\s*:\s*(\$?[A-Za-z]{1,3}\$?\d{1,7})/.exec(rest);
      if (rangeMatch) {
        tokens.push({
          type: T.RANGE,
          value: rangeMatch[0].replace(/\s+/g, '').toUpperCase(),
          raw: rangeMatch[0],
        });
        i += rangeMatch[0].length;
        continue;
      }

      // nom suivi d'une parenthèse → fonction
      const nameMatch = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(rest);
      if (nameMatch) {
        const name = nameMatch[0];
        let j = i + name.length;
        while (/\s/.test(src[j] ?? '')) j++;
        if (src[j] === '(') {
          tokens.push({ type: T.FUNC, value: name.toUpperCase() });
          tokens.push({ type: T.LPAREN });
          depth++;
          i = j + 1;
          continue;
        }
        const upper = name.toUpperCase();
        if (upper === 'TRUE' || upper === 'VRAI') { tokens.push({ type: T.BOOL, value: true }); i += name.length; continue; }
        if (upper === 'FALSE' || upper === 'FAUX') { tokens.push({ type: T.BOOL, value: false }); i += name.length; continue; }
      }

      // référence simple
      const refMatch = REF_RE.exec(rest);
      if (refMatch) {
        tokens.push({
          type: T.REF,
          value: refMatch[0].toUpperCase(),
          absCol: refMatch[1] === '$',
          absRow: refMatch[3] === '$',
        });
        i += refMatch[0].length;
        continue;
      }

      // nom défini non reconnu
      if (nameMatch) {
        tokens.push({ type: T.REF, value: nameMatch[0].toUpperCase(), named: true });
        i += nameMatch[0].length;
        continue;
      }

      throw new FormulaError(`Caractère inattendu « ${c} »`, i);
    }

    // opérateurs à deux caractères
    const two = src.slice(i, i + 2);
    if (two === '<=' || two === '>=' || two === '<>') {
      tokens.push({ type: T.OP, value: two });
      i += 2;
      continue;
    }

    if ('+-*/^&=<>'.includes(c)) {
      // moins unaire : en début, après un opérateur ou après une parenthèse ouvrante
      const prev = peekBack();
      const unary =
        (c === '-' || c === '+') &&
        (!prev || prev.type === T.OP || prev.type === T.LPAREN || prev.type === T.SEP);
      tokens.push({ type: T.OP, value: c, unary });
      i++;
      continue;
    }

    if (c === '(') { tokens.push({ type: T.LPAREN }); depth++; i++; continue; }
    if (c === ')') { tokens.push({ type: T.RPAREN }); depth = Math.max(0, depth - 1); i++; continue; }

    // séparateur d'arguments : virgule (EN) ou point-virgule (FR)
    if (c === ';') { tokens.push({ type: T.SEP }); i++; continue; }
    if (c === ',') {
      if (commaIsDecimal(i)) throw new FormulaError('Virgule décimale mal placée', i);
      tokens.push({ type: T.SEP }); i++; continue;
    }

    throw new FormulaError(`Caractère inattendu « ${c} »`, i);
  }

  return tokens;
}
