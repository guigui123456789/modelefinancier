// Évalue une formule contre une grille de cellules.

import { parse, FormulaError } from './parse.js';
import { getFunction } from './functions.js';
import { ERR, ExcelError, isError, isBlank, toNumber, toText, toBoolean, compare } from './values.js';

/** "A" → 0, "B" → 1, "AA" → 26 */
export function colToIndex(letters) {
  let n = 0;
  for (const ch of letters.toUpperCase()) {
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n - 1;
}

export function indexToCol(index) {
  let n = index + 1;
  let out = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

export function parseRef(ref) {
  const m = /^(\$?)([A-Za-z]{1,3})(\$?)(\d{1,7})$/.exec(ref);
  if (!m) return null;
  return { col: colToIndex(m[2]), row: parseInt(m[4], 10) - 1 };
}

/**
 * La grille : { "A1": 1240, "B2": "Ventes", … }
 * Les clés sont normalisées en majuscules sans dollars.
 */
export class Grid {
  constructor(cells = {}) {
    this.cells = {};
    for (const [k, v] of Object.entries(cells)) {
      this.cells[k.toUpperCase().replace(/\$/g, '')] = v;
    }
  }

  get(ref) {
    const key = ref.toUpperCase().replace(/\$/g, '');
    const v = this.cells[key];
    return v === undefined ? '' : v;
  }

  /** Renvoie un tableau 2D pour une plage A1:C5. */
  getRange(rangeRef) {
    const [a, b] = rangeRef.split(':');
    const start = parseRef(a.replace(/\$/g, ''));
    const end = parseRef(b.replace(/\$/g, ''));
    if (!start || !end) return ERR.ref();

    const r1 = Math.min(start.row, end.row), r2 = Math.max(start.row, end.row);
    const c1 = Math.min(start.col, end.col), c2 = Math.max(start.col, end.col);

    // garde-fou : une plage entière ferait exploser la mémoire
    if ((r2 - r1 + 1) * (c2 - c1 + 1) > 100000) return ERR.num();

    const out = [];
    for (let r = r1; r <= r2; r++) {
      const row = [];
      for (let c = c1; c <= c2; c++) {
        row.push(this.get(`${indexToCol(c)}${r + 1}`));
      }
      out.push(row);
    }
    // une plage sur une seule colonne reste un tableau 2D : INDEX en a besoin
    return out;
  }
}

/** Aplatit un tableau 2D en liste simple. */
function flat(v) {
  const out = [];
  const walk = (x) => (Array.isArray(x) ? x.forEach(walk) : out.push(x));
  walk(v);
  return out;
}

/**
 * Diffusion élément par élément : (A1:A5="Nord")*B1:B5 rend un tableau,
 * ce qui est le fondement de toutes les formules matricielles.
 */
function broadcast(a, b, fn) {
  const aArr = Array.isArray(a), bArr = Array.isArray(b);
  if (!aArr && !bArr) return fn(a, b);
  const xs = aArr ? flat(a) : null;
  const ys = bArr ? flat(b) : null;
  const len = Math.max(xs?.length ?? 1, ys?.length ?? 1);
  const out = [];
  for (let i = 0; i < len; i++) {
    const x = xs ? (xs.length === 1 ? xs[0] : xs[i]) : a;
    const y = ys ? (ys.length === 1 ? ys[0] : ys[i]) : b;
    out.push(fn(x, y));
  }
  return out;
}

const arith = (fn) => (a, b) =>
  broadcast(a, b, (x, y) => {
    const nx = toNumber(x), ny = toNumber(y);
    if (isError(nx)) return nx;
    if (isError(ny)) return ny;
    return fn(nx, ny);
  });

const relate = (fn) => (a, b) =>
  broadcast(a, b, (x, y) => {
    if (isError(x)) return x;
    if (isError(y)) return y;
    return fn(compare(x, y));
  });

const binaryOps = {
  '+': arith((x, y) => x + y),
  '-': arith((x, y) => x - y),
  '*': arith((x, y) => x * y),
  '/': arith((x, y) => (y === 0 ? ERR.div0() : x / y)),
  '^': arith((x, y) => {
    const r = x ** y;
    return Number.isFinite(r) ? r : ERR.num();
  }),
  '&': (a, b) =>
    broadcast(a, b, (x, y) => {
      const sx = toText(x), sy = toText(y);
      if (isError(sx)) return sx;
      if (isError(sy)) return sy;
      return sx + sy;
    }),
  '=': relate((c) => c === 0),
  '<>': relate((c) => c !== 0),
  '<': relate((c) => c < 0),
  '>': relate((c) => c > 0),
  '<=': relate((c) => c <= 0),
  '>=': relate((c) => c >= 0),
};

/** Réduit une plage à sa première valeur, comme Excel le fait dans un calcul scalaire. */
function scalar(v) {
  if (Array.isArray(v)) {
    const first = Array.isArray(v[0]) ? v[0][0] : v[0];
    return first === undefined ? '' : first;
  }
  return v;
}

export function evaluateAst(node, grid) {
  switch (node.type) {
    case 'number':
    case 'string':
    case 'boolean':
      return node.value;
    case 'error':
      return new ExcelError(node.value);
    case 'omitted':
      return '';
    case 'ref': {
      if (node.named) {
        // un nom défini non fourni dans la grille
        const v = grid.cells[node.name];
        return v === undefined ? ERR.name() : v;
      }
      return grid.get(node.name);
    }
    case 'range':
      return grid.getRange(node.name);
    case 'unary': {
      const v = toNumber(scalar(evaluateAst(node.operand, grid)));
      if (isError(v)) return v;
      return -v;
    }
    case 'binary': {
      const left = evaluateAst(node.left, grid);
      const right = evaluateAst(node.right, grid);
      if (isError(left)) return left;
      if (isError(right)) return right;
      const op = binaryOps[node.op];
      if (!op) return ERR.value();
      return op(left, right);
    }
    case 'call': {
      const fn = getFunction(node.name);
      if (!fn) return ERR.name();
      if (fn.lazy) {
        // les arguments sont passés en différé : SI n'évalue qu'une branche
        const thunks = node.args.map((a) => () => evaluateAst(a, grid));
        return fn.impl(...thunks);
      }
      const args = node.args.map((a) =>
        a.type === 'omitted' ? undefined : evaluateAst(a, grid)
      );
      return fn.impl(...args);
    }
    default:
      return ERR.value();
  }
}

/**
 * Évalue une formule. Ne lève jamais : renvoie { ok, value, error }.
 */
export function evaluate(formula, cells = {}) {
  const grid = cells instanceof Grid ? cells : new Grid(cells);
  let ast;
  try {
    ast = parse(formula);
  } catch (e) {
    return {
      ok: false,
      value: null,
      error: e instanceof FormulaError ? e.message : 'Formule illisible',
      syntax: true,
    };
  }
  try {
    const value = evaluateAst(ast, grid);
    if (isError(value)) {
      return { ok: false, value, error: value.code, excelError: true };
    }
    return { ok: true, value: scalar(value), raw: value, error: null };
  } catch {
    return { ok: false, value: null, error: 'Calcul impossible' };
  }
}

export { Grid as ExcelGrid, FormulaError };
